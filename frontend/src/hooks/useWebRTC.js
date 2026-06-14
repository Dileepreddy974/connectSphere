import { useState, useEffect, useRef, useCallback } from 'react';
import socketService from '../services/socket';

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const useWebRTC = (roomId, userId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: MediaStream }
  const [participants, setParticipants] = useState({}); // { socketId: { userId, name } }
  const peerConnections = useRef({}); // { socketId: RTCPeerConnection }
  const localStreamRef = useRef(null);
  const pendingCandidates = useRef({}); // { socketId: RTCIceCandidate[] }
  const remoteStreamsRef = useRef({}); // Mutable ref to accumulate tracks

  const createPeerConnection = useCallback((targetSocketId) => {
    if (peerConnections.current[targetSocketId]) return peerConnections.current[targetSocketId];

    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.emitIceCandidate(roomId, event.candidate, targetSocketId);
      }
    };

    // Initialize a stream for this peer
    remoteStreamsRef.current[targetSocketId] = new MediaStream();

    pc.ontrack = (event) => {
      // Add each incoming track to the peer's accumulated stream
      const stream = remoteStreamsRef.current[targetSocketId];
      if (stream) {
        event.streams[0].getTracks().forEach(track => {
          if (!stream.getTracks().find(t => t.id === track.id)) {
            stream.addTrack(track);
          }
        });
      }
      // Trigger React re-render with a new stream reference
      setRemoteStreams(prev => ({
        ...prev,
        [targetSocketId]: new MediaStream(remoteStreamsRef.current[targetSocketId]?.getTracks() || [])
      }));
    };

    // Add local tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peerConnections.current[targetSocketId] = pc;
    return pc;
  }, [roomId]);

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        localStreamRef.current = stream;

        const socket = socketService.getSocket();

        // 1. Listen for new users
        socket.on('user-connected', async ({ socketId, userId: remoteUserId }) => {
          console.log('User connected, creating offer to:', socketId);
          setParticipants(prev => ({ ...prev, [socketId]: { userId: remoteUserId, name: `Doodler ${socketId.substring(0, 4)}` } }));
          const pc = createPeerConnection(socketId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketService.emitOffer(roomId, offer, socketId);
        });

        // 2. Listen for offers
        socket.on('webrtc-offer', async ({ offer, senderSocketId }) => {
          console.log('Received offer from:', senderSocketId);
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

        // 3. Listen for answers
        socket.on('webrtc-answer', async ({ answer, senderSocketId }) => {
          console.log('Received answer from:', senderSocketId);
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

        // 4. Listen for ICE candidates
        socket.on('webrtc-ice-candidate', async ({ candidate, senderSocketId }) => {
          console.log('Received ICE candidate from:', senderSocketId);
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

        // 5. Listen for disconnections
        socket.on('user-disconnected', (socketId) => {
          console.log('User disconnected:', socketId);
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

        // Join the room after setting up listeners
        socketService.joinRoom(roomId, userId);

      } catch (err) {
        console.error('WebRTC initialization failed:', err);
      }
    };

    if (roomId && userId) {
      init();
    }

    return () => {
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      remoteStreamsRef.current = {};
    };
  }, [roomId, userId, createPeerConnection]);

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
