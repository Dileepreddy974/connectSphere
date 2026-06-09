import compression from 'compression';
import rateLimit from 'express-rate-limit';
import config from '../config.js';

const rateLimitResponse = {
  success: false,
  message: 'Too many requests. Please try again later.'
};

export const responseCompression = compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }

    return compression.filter(req, res);
  }
});

export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse
});

export const authRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.authRateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse
});

export const socketRateLimiter = (socket, next) => {
  let windowStartedAt = Date.now();
  let eventCount = 0;

  socket.use((_packet, allowEvent) => {
    const now = Date.now();

    if (now - windowStartedAt >= config.socketRateLimitWindowMs) {
      windowStartedAt = now;
      eventCount = 0;
    }

    eventCount += 1;
    if (eventCount > config.socketRateLimitMaxEvents) {
      return allowEvent(new Error('Socket event rate limit exceeded'));
    }

    return allowEvent();
  });

  next();
};
