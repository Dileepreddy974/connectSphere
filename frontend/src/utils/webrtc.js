/**
 * WebRTC configuration
 */
export const rtcConfig = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302'
      ]
    },
    // Add TURN servers if needed
    // {
    //   urls: ['turn:your-turn-server.com:3478'],
    //   username: 'username',
    //   credential: 'password'
    // }
  ]
};

/**
 * Media constraints
 */
export const mediaConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  }
};

/**
 * Screen share constraints
 */
export const screenShareConstraints = {
  video: {
    cursor: 'always'
  }
};

/**
 * Get user media
 */
export const getUserMedia = async (constraints = mediaConstraints) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    console.error('Error accessing media devices:', error);
    throw error;
  }
};

/**
 * Get screen share
 */
export const getScreenShare = async (constraints = screenShareConstraints) => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
    return stream;
  } catch (error) {
    console.error('Error accessing screen:', error);
    throw error;
  }
};

/**
 * Stop stream
 */
export const stopStream = (stream) => {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }
};

/**
 * Create peer connection
 */
export const createPeerConnection = () => {
  const peerConnection = new RTCPeerConnection(rtcConfig);
  return peerConnection;
};

export default {
  rtcConfig,
  mediaConstraints,
  screenShareConstraints,
  getUserMedia,
  getScreenShare,
  stopStream,
  createPeerConnection
};
