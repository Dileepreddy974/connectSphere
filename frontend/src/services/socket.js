import io from 'socket.io-client';

// Prefer explicit env var; fall back to same origin when not provided
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || window.location.origin;

let socket = null;

/**
 * Initialize Socket.io connection
 */
export const initializeSocket = (token) => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    auth: {
      token
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

/**
 * Get socket instance
 */
export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initializeSocket first.');
  }
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join room
 */
export const joinRoom = (roomId, userId) => {
  const s = getSocket();
  s.emit('join-room', roomId, userId);
};

/**
 * Send message via socket
 */
export const sendSocketMessage = (roomId, message) => {
  const s = getSocket();
  s.emit('send-message', {
    roomId,
    ...message,
    timestamp: new Date()
  });
};

/**
 * Listen for messages
 */
export const onReceiveMessage = (callback) => {
  const s = getSocket();
  s.on('receive-message', callback);
};

/**
 * Listen for user connections
 */
export const onUserConnected = (callback) => {
  const s = getSocket();
  s.on('user-connected', callback);
};

/**
 * Listen for user disconnections
 */
export const onUserDisconnected = (callback) => {
  const s = getSocket();
  s.on('user-disconnected', callback);
};

/**
 * Emit screen share event
 */
export const shareScreen = (roomId, screenStream) => {
  const s = getSocket();
  s.emit('screen-share', {
    roomId,
    streamId: screenStream.id,
    timestamp: new Date()
  });
};

/**
 * Emit whiteboard update
 */
export const updateWhiteboard = (roomId, drawingData) => {
  const s = getSocket();
  s.emit('whiteboard-update', {
    roomId,
    data: drawingData,
    timestamp: new Date()
  });
};

/**
 * WebRTC Signaling
 */
export const emitOffer = (roomId, offer, targetSocketId) => {
  const s = getSocket();
  s.emit('webrtc-offer', { roomId, offer, targetSocketId });
};

export const emitAnswer = (roomId, answer, targetSocketId) => {
  const s = getSocket();
  s.emit('webrtc-answer', { roomId, answer, targetSocketId });
};

export const emitIceCandidate = (roomId, candidate, targetSocketId) => {
  const s = getSocket();
  s.emit('webrtc-ice-candidate', { roomId, candidate, targetSocketId });
};

export const onOffer = (callback) => {
  const s = getSocket();
  s.on('webrtc-offer', callback);
};

export const onAnswer = (callback) => {
  const s = getSocket();
  s.on('webrtc-answer', callback);
};

export const onIceCandidate = (callback) => {
  const s = getSocket();
  s.on('webrtc-ice-candidate', callback);
};

/**
 * Listen for whiteboard updates
 */
export const onWhiteboardUpdate = (callback) => {
  const s = getSocket();
  s.on('whiteboard-update', callback);
};

const socketService = {
  initializeSocket,
  getSocket,
  disconnectSocket,
  joinRoom,
  sendSocketMessage,
  onReceiveMessage,
  onUserConnected,
  onUserDisconnected,
  shareScreen,
  updateWhiteboard,
  onWhiteboardUpdate,
  emitOffer,
  emitAnswer,
  emitIceCandidate,
  onOffer,
  onAnswer,
  onIceCandidate
};

export default socketService;
