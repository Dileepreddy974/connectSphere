import { useState, useEffect, useRef, useCallback } from 'react';
import socketService from '../services/socket';

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

/**
 * Wait for the socket to be connected (with timeout).
 */
const waitForSocketConnect = (socket, timeoutMs = 8000) => {
  return new Promise((resolve, reject) => {
    if (socket.connected) return resolve();
    const timer = setTimeout(() => reject(new Error('Socket connect timeout')), timeoutMs);
    socket.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });
  });
};

const useWebRTC = (roomId, userId, userName) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [participants, setParticipants] = useState({});
  const peerConnections = useRef({});
  const localStreamRef = useRef(null);
  const pendingCandidates = useRef({});
  const remoteStreamsRef = useRef({});
  const listenersRegistered = useRef(false);

  const createPeerConnection = useCallback((targetSocketId) => {
    if (peerConnections.current[targetSocketId]) return peerConnections.current[targetSocketId];

    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.emitIceCandidate(roomId, event.candidate, targetSocketId);
      }
    };

    remoteStreamsRef.current[targetSocketId] = new MediaStream();

    pc.ontrack = (event) => {
      const stream = remoteStreamsRef.current[targetSocketId];
      if (stream) {
        event.streams[0].getTracks().forEach(track => {
          if (!stream.getTracks().find(t => t.id === track.id)) {
            stream.addTrack(track);
          }
        });
      }
      setRemoteStreams(prev => ({
        ...prev,
        [targetSocketId]: new MediaStream(remoteStreamsRef.current[targetSocketId]?.getTracks() || [])
      }));
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peerConnections.current[targetSocketId] = pc;
    return pc;
  }, [roomId]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // 1. Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        setLocalStream(stream);
        localStreamRef.current = stream;

        // 2. Wait for socket to be connected
        const socket = socketService.getSocket();
        await waitForSocketConnect(socket);
        if (cancelled) return;

        // 3. Remove any stale listeners from previous runs
        if (listenersRegistered.current) {
          socket.off('user-connected');
          socket.off('webrtc-offer');
          socket.off('webrtc-answer');
          socket.off('webrtc-ice-candidate');
          socket.off('user-disconnected');
        }

        // 4. Register WebRTC signaling listeners
        socket.on('user-connected', async ({ socketId, userId: remoteUserId, userName: remoteName }) => {
          console.log('[WebRTC] User connected:', socketId, remoteName);
          setParticipants(prev => ({
            ...prev,
            [socketId]: { userId: remoteUserId, name: remoteName || `Doodler ${socketId.substring(0, 4)}` }
          }));
          const pc = createPeerConnection(socketId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketService.emitOffer(roomId, offer, socketId);
        });

        socket.on('webrtc-offer', async ({ offer, senderSocketId }) => {
          console.log('[WebRTC] Received offer from:', senderSocketId);
          const pc = createPeerConnection(senderSocketId);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));

          if (pendingCandidates.current[senderSocketId]) {
            for (const c of pendingCandidates.current[senderSocketId]) {
              try { await pc.addIceCandidate(c); } catch(e) {}
            }
            delete pendingCandidates.current[senderSocketId];
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketService.emitAnswer(roomId, answer, senderSocketId);
        });

        socket.on('webrtc-answer', async ({ answer, senderSocketId }) => {
          console.log('[WebRTC] Received answer from:', senderSocketId);
          const pc = peerConnections.current[senderSocketId];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            if (pendingCandidates.current[senderSocketId]) {
              for (const c of pendingCandidates.current[senderSocketId]) {
                try { await pc.addIceCandidate(c); } catch(e) {}
              }
              delete pendingCandidates.current[senderSocketId];
            }
          }
        });

        socket.on('webrtc-ice-candidate', async ({ candidate, senderSocketId }) => {
          const pc = peerConnections.current[senderSocketId];
          if (pc && pc.remoteDescription) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch(e) {}
          } else {
            if (!pendingCandidates.current[senderSocketId]) {
              pendingCandidates.current[senderSocketId] = [];
            }
            pendingCandidates.current[senderSocketId].push(new RTCIceCandidate(candidate));
          }
        });

        socket.on('user-disconnected', (socketId) => {
          console.log('[WebRTC] User disconnected:', socketId);
          if (peerConnections.current[socketId]) {
            peerConnections.current[socketId].close();
            delete peerConnections.current[socketId];
          }
          delete remoteStreamsRef.current[socketId];
          setRemoteStreams((prev) => {
            const newState = { ...prev };
            delete newState[socketId];
            return newState;
          });
          setParticipants(prev => {
            const newState = { ...prev };
            delete newState[socketId];
            return newState;
          });
        });

        listenersRegistered.current = true;

        // 5. Join the socket room (triggers online-users + user-connected on backend)
        socketService.joinRoom(roomId, userId, userName);
        console.log('[WebRTC] Joined room:', roomId);

      } catch (err) {
        console.error('WebRTC initialization failed:', err);
      }
    };

    if (roomId && userId) {
      init();
    }

    return () => {
      cancelled = true;
      // Cleanup media
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      // Cleanup peer connections
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      remoteStreamsRef.current = {};
      // Cleanup socket listeners
      try {
        const socket = socketService.getSocket();
        socket.off('user-connected');
        socket.off('webrtc-offer');
        socket.off('webrtc-answer');
        socket.off('webrtc-ice-candidate');
        socket.off('user-disconnected');
        listenersRegistered.current = false;
      } catch (e) {}
    };
  }, [roomId, userId, userName, createPeerConnection]);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef(null);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);

    // Revert to camera track
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    Object.values(peerConnections.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track.kind === 'video');
      if (sender) sender.replaceTrack(videoTrack);
    });

    setLocalStream(localStreamRef.current);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          alert('Screen sharing is not supported on this device/browser (or requires HTTPS).');
          return;
        }
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);

        const screenTrack = stream.getVideoTracks()[0];

        // Replace track in all peer connections
        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        // Toggle back when user clicks "Stop Sharing" in browser UI
        screenTrack.onended = () => {
          stopScreenShare();
        };

        // Update local stream state so local preview changes
        setLocalStream(new MediaStream([screenTrack, localStreamRef.current.getAudioTracks()[0]]));

      } catch (err) {
        console.error('Error starting screen share:', err);
      }
    } else {
      stopScreenShare();
    }
  }, [isScreenSharing, stopScreenShare]);

  // Methods to control media
  const toggleVideo = useCallback((enabled) => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }, []);

  const toggleAudio = useCallback((enabled) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }, []);

  return {
    localStream,
    remoteStreams,
    participants,
    isScreenSharing,
    toggleVideo,
    toggleAudio,
    toggleScreenShare
  };
};

export default useWebRTC;
