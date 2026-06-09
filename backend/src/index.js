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
import {
  apiRateLimiter,
  authRateLimiter,
  responseCompression,
  socketRateLimiter
} from './middleware/traffic.js';

// Initialize Express app
const app = express();
app.set('trust proxy', config.trustProxy);
let isShuttingDown = false;

const httpServer = createServer(app);
httpServer.keepAliveTimeout = 65000;
httpServer.headersTimeout = 66000;
httpServer.maxRequestsPerSocket = 1000;

const io = new Server(httpServer, {
  maxHttpBufferSize: config.socketMaxBufferSize,
  perMessageDeflate: false,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true
  },
  cors: {
    origin: process.env.NODE_ENV === 'development' ? true : (process.env.FRONTEND_URL || 'http://localhost:3000'),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? true : (process.env.FRONTEND_URL || 'http://localhost:3000'),
  credentials: true
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow local development
}));
app.use(morgan('dev'));
app.use(responseCompression);
app.use(express.json({ limit: config.httpBodyLimit }));
app.use(express.urlencoded({ limit: config.httpBodyLimit, extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running', timestamp: new Date() });
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
io.use(socketRateLimiter);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room event
  socket.on('join-room', async (roomId, userId) => {
    if (typeof roomId !== 'string' || !roomId.trim() || typeof userId !== 'string') {
      socket.emit('error', { message: 'Invalid room join request' });
      return;
    }

    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);
    
    // Update participant socket ID in DB
    try {
      await Room.findOneAndUpdate(
        { roomId, 'participants.userId': userId },
        { 
          $set: { 
            'participants.$.socketId': socket.id,
            'participants.$.isActive': true 
          } 
        }
      );
    } catch (err) {
      console.error('Error updating participant socket:', err);
    }

    // Notify others in the room
    socket.to(roomId).emit('user-connected', {
      userId,
      socketId: socket.id
    });
  });

  // WebRTC Signaling
  socket.on('webrtc-offer', (data) => {
    if (!data || !socket.rooms.has(data.roomId)) return;
    socket.to(data.roomId).emit('webrtc-offer', {
      offer: data.offer,
      senderSocketId: socket.id
    });
  });

  socket.on('webrtc-answer', (data) => {
    if (!data || !socket.rooms.has(data.roomId)) return;
    socket.to(data.roomId).emit('webrtc-answer', {
      answer: data.answer,
      senderSocketId: socket.id
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    if (!data || !socket.rooms.has(data.roomId)) return;
    socket.to(data.roomId).emit('webrtc-ice-candidate', {
      candidate: data.candidate,
      senderSocketId: socket.id
    });
  });

  // Chat message event
  socket.on('send-message', (message) => {
    if (!message || !socket.rooms.has(message.roomId)) return;
    const { roomId } = message;
    io.to(roomId).emit('receive-message', message);
  });

  // Whiteboard updates - broadcast to room (except sender)
  socket.on('whiteboard-update', (update) => {
    try {
      if (!update || !socket.rooms.has(update.roomId)) return;
      console.log('Received whiteboard update from', socket.id, 'for room', update.roomId);
      // Broadcast to others in the room
      socket.to(update.roomId).emit('whiteboard-update', update);
    } catch (err) {
      console.error('Error handling whiteboard update:', err);
    }
  });

  // Disconnect event
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    // Update participant status in DB
    try {
      await Room.updateMany(
        { 'participants.socketId': socket.id },
        { 
          $set: { 
            'participants.$.isActive': false,
            'participants.$.socketId': null 
          } 
        }
      );
    } catch (err) {
      console.error('Error updating participant on disconnect:', err);
    }

    socket.broadcast.emit('user-disconnected', socket.id);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});


// Start server
const PORT = config.port;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start HTTP server
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
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

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

  io.disconnectSockets(true);
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
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the server
startServer();

export { app, io, httpServer };
