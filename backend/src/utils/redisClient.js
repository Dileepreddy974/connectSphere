import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient = null;

export const initRedis = (opts = {}) => {
  if (redisClient) return redisClient;
  const url = process.env.REDIS_URL || opts.url;
  redisClient = url ? new Redis(url) : new Redis(opts);

  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis client connected');
  });

  return redisClient;
};

export const getRedis = () => {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};

export default getRedis;
