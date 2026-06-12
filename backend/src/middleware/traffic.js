import compression from 'compression';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import config from '../config.js';
import { initRedis } from '../utils/redisClient.js';
import client from 'prom-client';

const rateLimitResponse = (message = 'Too many requests. Please try again later.') => ({
  success: false,
  message
});

export const responseCompression = compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }

    return compression.filter(req, res);
  }
});

// Prometheus metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const httpRateLimitCounter = new client.Counter({
  name: 'connectsphere_rate_limit_http_total',
  help: 'Total number of HTTP rate limit events',
  labelNames: ['route', 'ip']
});

const socketRateLimitCounter = new client.Counter({
  name: 'connectsphere_rate_limit_socket_total',
  help: 'Total number of socket rate limit events',
  labelNames: ['socketId']
});

// NOTE: Redis-backed store is optional. To enable it set both `REDIS_URL` and
// `ENABLE_REDIS=true` in your environment. By default we use in-memory limits
// to avoid crashing when Redis is not available.
const createRedisStore = () => {
  if (process.env.ENABLE_REDIS !== 'true' || !process.env.REDIS_URL) return null;
  try {
    const redis = initRedis();
    if (!redis) return null;
    // rate-limit-redis can use a client or a sendCommand wrapper for ioredis
    return new RedisStore({ client: redis });
  } catch (err) {
    console.warn('Failed to create RedisStore for rate limiter:', err);
    return null;
  }
};

const store = createRedisStore();

const defaultHandler = (req, res) => {
  console.warn('Rate limit exceeded:', req.ip, req.originalUrl);
  try {
    httpRateLimitCounter.inc({ route: req.originalUrl || req.path, ip: req.ip }, 1);
  } catch (e) {
    // ignore metric errors
  }
  return res.status(429).json(rateLimitResponse('Too many requests. Please try again later.'));
};

// Allow disabling rate limits during development to avoid blocking workflows
// (useful when running quick smoke tests). To enable enforcement in
// development set `ENABLE_RATE_LIMITS=true` in the environment. In
// production the rate limiter is enabled by default.
const limiterEnabled = process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMITS === 'true';

let apiRateLimiter;
let authRateLimiter;
const passthrough = (req, res, next) => next();

if (!limiterEnabled) {
  apiRateLimiter = passthrough;
  authRateLimiter = passthrough;
} else {
  apiRateLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: defaultHandler,
    store: store || undefined,
    keyGenerator: (req) => req.ip
  });

  authRateLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.authRateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: defaultHandler,
    store: store || undefined,
    keyGenerator: (req) => (req.user && req.user.id) ? req.user.id : req.ip
  });
}

export { apiRateLimiter, authRateLimiter };

export const socketRateLimiter = (socket, next) => {
  // If Redis is configured, use it to enforce a distributed limit per-socket
  const redis = process.env.REDIS_URL ? initRedis() : null;

  socket.use((packet, allowEvent) => {
    try {
      if (!redis) {
        // Fallback: simple in-memory sliding window per-socket
        if (!socket._rateWindowStartedAt) {
          socket._rateWindowStartedAt = Date.now();
          socket._rateEventCount = 0;
        }

        const now = Date.now();
        if (now - socket._rateWindowStartedAt >= config.socketRateLimitWindowMs) {
          socket._rateWindowStartedAt = now;
          socket._rateEventCount = 0;
        }

        socket._rateEventCount += 1;
        if (socket._rateEventCount > config.socketRateLimitMaxEvents) {
          try { socketRateLimitCounter.inc({ socketId: socket.id }, 1); } catch (e) {}
          return allowEvent(new Error('Socket event rate limit exceeded'));
        }

        return allowEvent();
      }

      // Use Redis INCR + EXPIRE to track events
      const key = `socket:${socket.id}:events`;
      (async () => {
        try {
          const count = await redis.incr(key);
          if (count === 1) {
            await redis.expire(key, Math.ceil(config.socketRateLimitWindowMs / 1000));
          }

          if (count > config.socketRateLimitMaxEvents) {
            try { socketRateLimitCounter.inc({ socketId: socket.id }, 1); } catch (e) {}
            return allowEvent(new Error('Socket event rate limit exceeded'));
          }

          return allowEvent();
        } catch (err) {
          console.error('Socket rate limiter redis error:', err);
          // On redis error, allow events to avoid hard-failing sockets
          return allowEvent();
        }
      })();
    } catch (err) {
      console.error('Socket rate limiter unexpected error:', err);
      return allowEvent();
    }
  });

  next();
};
