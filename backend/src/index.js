import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import Room from './models/Room.js';
import fileRoutes from './routes/files.js';
import messageRoutes from './routes/messages.js';
import { errorHandler } from './middleware/auth.js';
import { connectDB } from './config/db.js';
import config from './config.js';
import { fileURLToPath } from 'url';
import path from 'path';
import {
  apiRateLimiter,
  authRateLimiter,
  responseCompression,
  socketRateLimiter
} from './middleware/traffic.js';
import { initRedis } from './utils/redisClient.js';
import client from 'prom-client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Express app
const app = express();
app.set('trust proxy', config.trustProxy);
let isShuttingDown = false;

const httpServer = createServer(app);
httpServer.keepAliveTimeout = 65000;
httpServer.headersTimeout = 66000;
httpServer.maxRequestsPerSocket = 1000;

// Allow multiple frontend origins via FRONTEND_URLS (comma-separated),
// or a single FRONTEND_URL. In development allow any origin.
const allowedOrigins = process.env.NODE_ENV === 'development'
  ? true
  : (process.env.FRONTEND_URLS
      ? process.env.FRONTEND_URLS.split(',').map(s => s.trim())
      : (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['http://localhost:3000']));

const io = process.env.VERCEL ? null : new Server(httpServer, {
  maxHttpBufferSize: config.socketMaxBufferSize,
  perMessageDeflate: false,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true
  },
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});


// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow local development
}));
app.use(morgan('dev'));
app.use(responseCompression);
app.use(express.json({ limit: config.httpBodyLimit }));
app.use(express.static(path.resolve(__dirname, '../../frontend/build')));

// Initialize Redis client early only when explicitly enabled
if (process.env.REDIS_URL && process.env.ENABLE_REDIS === 'true') {
  try {
    initRedis();
  } catch (err) {
    console.warn('Failed to init Redis on startup:', err);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running', timestamp: new Date() });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

app.get('/ready', (req, res) => {
  const ready = !isShuttingDown && mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not ready',
    database: mongoose.connection.readyState
  });
});

// API Routes
app.use('/api', apiRateLimiter);
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/messages', messageRoutes);

// Socket.io event handlers
if (io) {
  io.use(socketRateLimiter);

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    // socket event handlers remain unchanged
  });
}

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.get('*', (req, res) => {
  // If the request is for an API route we keep the JSON 404 response
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }

  // Serve React build for any other route
  const frontendBuildPath = path.resolve(__dirname, '../../frontend/build');
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});


// Start server
const PORT = config.port;

const startServer = async () => {
  try {
    await connectDB();
    // In Vercel serverless environment we do NOT start a persistent HTTP server
    if (!process.env.VERCEL) {
      httpServer.listen(PORT, () => {
        console.log(`
╔══════════════════════════════════════════╗
║        ConnectSphere Backend Server       ║
╠══════════════════════════════════════════╣
║ Server running on: http://localhost:${PORT}  ║
║ Environment: ${process.env.NODE_ENV || 'development'}
║ WebSocket: ws://localhost:${PORT}        ║
╚══════════════════════════════════════════╝
        `);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};
// Duplicate catch block removed - redundant error handling eliminated



// Handle graceful shutdown
const shutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`${signal} received: draining connections`);

  const forceShutdown = setTimeout(() => {
    console.error('Graceful shutdown timed out');
    process.exit(1);
  }, config.shutdownTimeoutMs);
  forceShutdown.unref();

  if (io) {
    io.disconnectSockets(true);
  }
  if (httpServer) {
    httpServer.close(async () => {
      try {
        await mongoose.connection.close(false);
        console.log('Server and MongoDB connections closed');
        process.exit(0);
      } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the server
startServer();

export { app, io, httpServer };
