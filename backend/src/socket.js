import { Server } from 'socket.io';
import { socketRateLimiter } from './middleware/traffic.js';
import Message from './models/Message.js';

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      credentials: true
    }
  });

  // Apply rate limiting middleware
  io.use(socketRateLimiter);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a room
    socket.on('join-room', (roomId, userId) => {
      socket.join(roomId);
      console.log(`User ${userId} joined room ${roomId} with socket ${socket.id}`);
      
      // Tell others in the room that a user connected
      socket.to(roomId).emit('user-connected', { socketId: socket.id, userId });
      
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id} from room ${roomId}`);
        socket.to(roomId).emit('user-disconnected', socket.id);
      });
    });

    // Chat Messages
    socket.on('send-message', async (data) => {
      const { roomId, content, sender, timestamp } = data;
      try {
        const newMessage = await Message.create({
          roomId,
          senderId: sender.id || sender._id,
          content
        });
        
        io.to(roomId).emit('receive-message', {
          _id: newMessage._id,
          roomId,
          content,
          sender,
          createdAt: newMessage.createdAt
        });
      } catch (err) {
        console.error('Failed to save message:', err);
      }
    });

    // Whiteboard Sync
    socket.on('whiteboard-update', (data) => {
      socket.to(data.roomId).emit('whiteboard-update', data);
    });

    // Screen Share Event (if frontend relies on it)
    socket.on('screen-share', (data) => {
      socket.to(data.roomId).emit('screen-share', data);
    });

    // WebRTC Signaling
    socket.on('webrtc-offer', ({ roomId, offer, targetSocketId }) => {
      io.to(targetSocketId).emit('webrtc-offer', {
        offer,
        senderSocketId: socket.id
      });
    });

    socket.on('webrtc-answer', ({ roomId, answer, targetSocketId }) => {
      io.to(targetSocketId).emit('webrtc-answer', {
        answer,
        senderSocketId: socket.id
      });
    });

    socket.on('webrtc-ice-candidate', ({ roomId, candidate, targetSocketId }) => {
      io.to(targetSocketId).emit('webrtc-ice-candidate', {
        candidate,
        senderSocketId: socket.id
      });
    });
  });

  return io;
};
