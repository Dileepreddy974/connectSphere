import io from 'socket.io-client';

// Require explicit env var; no fallback for production safety
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

if (!SOCKET_URL) {
  console.warn('REACT_APP_SOCKET_URL is not set. Socket connections will fail. Set REACT_APP_SOCKET_URL in your environment.');
}

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
export const joinRoom = (roomId, userId, userName) => {
  const s = getSocket();
  s.emit('join-room', roomId, userId, userName);
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
 * Raise/lower hand
 */
export const raiseHand = (roomId, userId, name, raised) => {
  const s = getSocket();
  s.emit('raise-hand', { roomId, userId, name, raised });
};

export const onHandRaised = (callback) => {
  const s = getSocket();
  s.on('hand-raised', callback);
};

/**
 * Send a reaction emoji
 */
export const sendReaction = (roomId, userId, name, emoji) => {
  const s = getSocket();
  s.emit('reaction', { roomId, userId, name, emoji });
};

export const onReactionReceived = (callback) => {
  const s = getSocket();
  s.on('reaction-received', callback);
};

/**
 * Typing indicators
 */
export const startTyping = (roomId, userId, name) => {
  const s = getSocket();
  s.emit('typing-start', { roomId, userId, name });
};

export const stopTyping = (roomId, userId) => {
  const s = getSocket();
  s.emit('typing-stop', { roomId, userId });
};

export const onUserTyping = (callback) => {
  const s = getSocket();
  s.on('user-typing', callback);
};

/**
 * Online users list
 */
export const onOnlineUsers = (callback) => {
  const s = getSocket();
  s.on('online-users', callback);
};

/**
 * Mute user (host control)
 */
export const muteUser = (roomId, targetSocketId, mutedBy) => {
  const s = getSocket();
  s.emit('mute-user', { roomId, targetSocketId, mutedBy });
};

export const onForceMute = (callback) => {
  const s = getSocket();
  s.on('force-mute', callback);
};

/**
 * Recording events
 */
export const startRecording = (roomId, userId) => {
  const s = getSocket();
  s.emit('recording-start', { roomId, userId });
};

export const stopRecording = (roomId, userId) => {
  const s = getSocket();
  s.emit('recording-stop', { roomId, userId });
};

export const onRecordingStarted = (callback) => {
  const s = getSocket();
  s.on('recording-started', callback);
};

export const onRecordingStopped = (callback) => {
  const s = getSocket();
  s.on('recording-stopped', callback);
};

/**
 * Meeting ended
 */
export const endMeeting = (roomId, endedBy) => {
  const s = getSocket();
  s.emit('meeting-ended', { roomId, endedBy });
};

export const onMeetingEnded = (callback) => {
  const s = getSocket();
  s.on('meeting-ended', callback);
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

// ─────────────────────────────────────────────
// LIVE CAPTIONS (Real-Time Transcription)
// ─────────────────────────────────────────────

/**
 * Enable captions for this socket's room
 */
export const startCaptions = (roomId, language = 'en') => {
  const s = getSocket();
  s.emit('caption-start', { roomId, language });
};

/**
 * Disable captions
 */
export const stopCaptions = (roomId) => {
  const s = getSocket();
  s.emit('caption-stop', { roomId });
};

/**
 * Send audio chunk for server-side Whisper transcription
 */
export const sendCaptionChunk = (roomId, audioBase64, language = 'en') => {
  const s = getSocket();
  s.emit('caption-chunk', { roomId, audioData: audioBase64, language });
};

/**
 * Send client-side speech recognition result (browser Web Speech API)
 */
export const sendLiveCaption = (roomId, text, isFinal, speakerId, speakerName) => {
  const s = getSocket();
  s.emit('live-caption', { roomId, text, isFinal, speakerId, speakerName });
};

/**
 * Listen for caption updates (interim + final)
 */
export const onCaptionUpdate = (callback) => {
  const s = getSocket();
  s.on('caption-update', callback);
};

/**
 * Listen for captions enabled/disabled events
 */
export const onCaptionsEnabled = (callback) => {
  const s = getSocket();
  s.on('captions-enabled', callback);
};

export const onCaptionsDisabled = (callback) => {
  const s = getSocket();
  s.on('captions-disabled', callback);
};

export const onCaptionError = (callback) => {
  const s = getSocket();
  s.on('caption-error', callback);
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
  onIceCandidate,
  raiseHand,
  onHandRaised,
  sendReaction,
  onReactionReceived,
  startTyping,
  stopTyping,
  onUserTyping,
  onOnlineUsers,
  muteUser,
  onForceMute,
  startRecording,
  stopRecording,
  onRecordingStarted,
  onRecordingStopped,
  endMeeting,
  onMeetingEnded,
  startCaptions,
  stopCaptions,
  sendCaptionChunk,
  sendLiveCaption,
  onCaptionUpdate,
  onCaptionsEnabled,
  onCaptionsDisabled,
  onCaptionError
};

export default socketService;
