import { Server } from 'socket.io';
import { socketRateLimiter } from './middleware/traffic.js';
import Message from './models/Message.js';
import Attendance from './models/Attendance.js';
import logger from './utils/winstonLogger.js';

// Track online users per room
const onlineUsers = new Map(); // roomId -> Map(userId -> socketId)

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
    logger.info(`Socket connected: ${socket.id}`);

    // ─── Join Room ───
    socket.on('join-room', async (roomId, userId) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userId = userId;

      // Track online user
      if (!onlineUsers.has(roomId)) onlineUsers.set(roomId, new Map());
      onlineUsers.get(roomId).set(userId, socket.id);

      logger.info(`User ${userId} joined room ${roomId}`, { event: 'meeting.join', socketId: socket.id });

      // Tell others in the room
      socket.to(roomId).emit('user-connected', { socketId: socket.id, userId });

      // Broadcast updated online users list
      io.to(roomId).emit('online-users', Array.from(onlineUsers.get(roomId).keys()));

      // Record attendance
      try {
        await Attendance.create({
          meetingId: null,
          roomId,
          userId,
          socketId: socket.id
        });
      } catch (err) {
        // Non-critical, don't block join
      }

      socket.on('disconnect', async () => {
        logger.info(`Socket disconnected: ${socket.id} from room ${roomId}`);

        // Remove from online tracking
        const roomMap = onlineUsers.get(roomId);
        if (roomMap) {
          roomMap.delete(userId);
          if (roomMap.size === 0) onlineUsers.delete(roomId);
        }

        socket.to(roomId).emit('user-disconnected', socket.id);
        io.to(roomId).emit('online-users', roomMap ? Array.from(roomMap.keys()) : []);

        // Update attendance leave time
        try {
          await Attendance.findOneAndUpdate(
            { roomId, userId, socketId: socket.id, leaveTime: null },
            { leaveTime: new Date() }
          );
        } catch (_) {}
      });
    });

    // ─── User Online / Offline Status ───
    socket.on('user-online', (data) => {
      const { roomId, userId, name } = data;
      socket.to(roomId).emit('user-online', { userId, name, socketId: socket.id });
    });

    socket.on('user-offline', (data) => {
      const { roomId, userId } = data;
      socket.to(roomId).emit('user-offline', { userId, socketId: socket.id });
    });

    // ─── Chat Messages ───
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
        logger.error('Failed to save message', err);
      }
    });

    // ─── Typing Indicator ───
    socket.on('typing-start', (data) => {
      const { roomId, userId, name } = data;
      socket.to(roomId).emit('user-typing', { userId, name, typing: true });
    });

    socket.on('typing-stop', (data) => {
      const { roomId, userId } = data;
      socket.to(roomId).emit('user-typing', { userId, typing: false });
    });

    // ─── Raise Hand ───
    socket.on('raise-hand', (data) => {
      const { roomId, userId, name, raised } = data;
      io.to(roomId).emit('hand-raised', { userId, name, socketId: socket.id, raised });
    });

    // ─── Reactions ───
    socket.on('reaction', (data) => {
      const { roomId, userId, name, emoji } = data;
      io.to(roomId).emit('reaction-received', {
        userId,
        name,
        socketId: socket.id,
        emoji,
        timestamp: new Date()
      });
    });

    // ─── Mute User (host control) ───
    socket.on('mute-user', (data) => {
      const { roomId, targetSocketId, mutedBy } = data;
      io.to(targetSocketId).emit('force-mute', { mutedBy, roomId });
    });

    // ─── Recording Events ───
    socket.on('recording-start', (data) => {
      const { roomId, userId } = data;
      io.to(roomId).emit('recording-started', { userId, roomId, timestamp: new Date() });
      logger.info('Recording started', { roomId, userId, event: 'recording.start' });
    });

    socket.on('recording-stop', (data) => {
      const { roomId, userId } = data;
      io.to(roomId).emit('recording-stopped', { userId, roomId, timestamp: new Date() });
      logger.info('Recording stopped', { roomId, userId, event: 'recording.stop' });
    });

    // ─── Meeting Ended ───
    socket.on('meeting-ended', (data) => {
      const { roomId, endedBy } = data;
      io.to(roomId).emit('meeting-ended', { roomId, endedBy, timestamp: new Date() });
      logger.info('Meeting ended', { roomId, endedBy, event: 'meeting.ended' });
    });

    // ─── Whiteboard Sync ───
    socket.on('whiteboard-update', (data) => {
      socket.to(data.roomId).emit('whiteboard-update', data);
    });

    // ─── Screen Share Event ───
    socket.on('screen-share', (data) => {
      socket.to(data.roomId).emit('screen-share', data);
    });

    // ─── WebRTC Signaling ───
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
