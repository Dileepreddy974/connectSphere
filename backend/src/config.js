import 'dotenv/config';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/connectsphere',
  mongoMaxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE) || 20,
  mongoMinPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE) || 2,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your_secret_key_change_in_production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  
  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // File upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600, // 100MB
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
  
  // STUN/TURN
  stunServer: process.env.STUN_SERVER || 'stun:stun.l.google.com:19302',
  turnServer: process.env.TURN_SERVER,
  turnUsername: process.env.TURN_USERNAME,
  turnPassword: process.env.TURN_PASSWORD,
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  authRateLimitMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 20,

  // Traffic handling
  trustProxy: parseInt(process.env.TRUST_PROXY_HOPS) || 0,
  httpBodyLimit: process.env.HTTP_BODY_LIMIT || '2mb',
  socketMaxBufferSize: parseInt(process.env.SOCKET_MAX_BUFFER_SIZE) || 1048576,
  socketRateLimitWindowMs: parseInt(process.env.SOCKET_RATE_LIMIT_WINDOW_MS) || 10000,
  socketRateLimitMaxEvents: parseInt(process.env.SOCKET_RATE_LIMIT_MAX_EVENTS) || 100,
  shutdownTimeoutMs: parseInt(process.env.SHUTDOWN_TIMEOUT_MS) || 10000,
  
  // Email
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  
  // App info
  appName: 'ConnectSphere',
  appVersion: '1.0.0',
  
  // System info
  cpuCount: os.cpus().length,
  totalMemory: os.totalmem(),
};

export default config;
