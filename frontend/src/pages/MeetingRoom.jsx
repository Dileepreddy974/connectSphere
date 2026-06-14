import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { roomService } from '../services';
import socketService from '../services/socket';
import { raiseHand, sendReaction, onHandRaised, onReactionReceived, onOnlineUsers, onMeetingEnded } from '../services/socket';
import useWebRTC from '../hooks/useWebRTC';
import { tokenService } from '../utils/storage.js';
import ChatPanel from '../components/Chat/ChatPanel';
import Whiteboard from '../components/Whiteboard/Whiteboard';
import FilePanel from '../components/Meeting/FilePanel';
import { MeetingRoomSkeleton } from '../components/SkeletonLoaders.jsx';
import { SlideRight } from '../components/PageTransition.jsx';
import { BsMicFill, BsMicMuteFill, BsCameraVideoFill, BsCameraVideoOffFill, BsChatDots, BsFolder, BsPen, BsHandIndexFill, BsPeople, BsTranslate, BsFileText, BsCheckSquare, BsBarChartFill } from 'react-icons/bs';
import { MdScreenShare, MdStopScreenShare } from 'react-icons/md';
import LiveCaptions from '../components/AI/LiveCaptions';
import MeetingSummaryPanel from '../components/AI/MeetingSummaryPanel';
import ActionItemsPanel from '../components/AI/ActionItemsPanel';
import SpeakerAnalytics from '../components/AI/SpeakerAnalytics';

const REACTIONS = ['\uD83D\uDC4D', '\u2764\uFE0F', '\uD83C\uDF89', '\uD83D\uDC4F', '\uD83D\uDE02', '\uD83D\uDE2E'];

const VideoBox = ({ stream, name, isSelf }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      try {
        videoRef.current.srcObject = stream;
        // Some browsers require explicit play()
        videoRef.current.play().catch(() => {});
      } catch (err) {
        console.error('Failed to attach stream to video element', err);
      }
    }
  }, [stream]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isSelf}
        className="w-full h-full object-cover"
      />
      {!stream && (
         <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold uppercase tracking-widest text-2xl">
           No Sketch
         </div>
      )}
      <div className="absolute bottom-4 left-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-3 py-1 doodle-border text-sm font-bold shadow-sm dark:text-white">
        {name} {isSelf && '(You)'}
      </div>
    </div>
  );
};

const MeetingRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isCaptionsOpen, setIsCaptionsOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  useEffect(() => {
    const token = tokenService.getToken();
    if (token) {
      socketService.initializeSocket(token);
    }
  }, []);

  // Listen for reactions, hands, online users, meeting ended
  useEffect(() => {
    onHandRaised((data) => {
      // Could show a notification toast here
      console.log('Hand raised:', data);
    });

    onReactionReceived((data) => {
      const id = Date.now() + Math.random();
      setFloatingReactions((prev) => [...prev, { id, ...data }]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    });

    onOnlineUsers((userIds) => {
      setOnlineUserIds(userIds);
    });

    onMeetingEnded((data) => {
      navigate('/dashboard');
    });
  }, [navigate]);

  const { localStream, remoteStreams, participants, toggleVideo, toggleAudio, isScreenSharing, toggleScreenShare } = useWebRTC(roomId, user?._id);

  // Total participant count: online users from socket + local user
  const participantCounts = onlineUserIds.length > 0 ? onlineUserIds.length : Object.keys(remoteStreams).length + 1;

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        setLoading(true);
        // Join the room (auto-creates if it doesn't exist)
        await roomService.joinRoom(roomId);
        const response = await roomService.getRoomDetails(roomId);
        setRoom(response.data);
      } catch (err) {
        setError('Failed to load meeting room.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [roomId]);

  const handleLeaveRoom = async () => {
    try {
      await roomService.leaveRoom(roomId);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error leaving room:', err);
      navigate('/dashboard');
    }
  };

  const handleRaiseHand = () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    raiseHand(roomId, user?._id, user?.name, newState);
  };

  const handleSendReaction = useCallback((emoji) => {
    sendReaction(roomId, user?._id, user?.name, emoji);
    setShowReactions(false);
  }, [roomId, user]);

  const handleToggleVideo = () => {
    const newState = !isVideoOn;
    setIsVideoOn(newState);
    toggleVideo(newState);
  };

  const handleToggleAudio = () => {
    const newState = !isAudioOn;
    setIsAudioOn(newState);
    toggleAudio(newState);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    setIsFilesOpen(false);
    setIsCaptionsOpen(false);
    setIsSummaryOpen(false);
    setIsActionsOpen(false);
    setIsAnalyticsOpen(false);
  };

  const toggleFiles = () => {
    setIsFilesOpen(!isFilesOpen);
    setIsChatOpen(false);
    setIsCaptionsOpen(false);
    setIsSummaryOpen(false);
    setIsActionsOpen(false);
    setIsAnalyticsOpen(false);
  };

  const togglePanel = (panel) => {
    const setter = {
      captions: setIsCaptionsOpen,
      summary: setIsSummaryOpen,
      actions: setIsActionsOpen,
      analytics: setIsAnalyticsOpen
    }[panel];
    const getter = {
      captions: isCaptionsOpen,
      summary: isSummaryOpen,
      actions: isActionsOpen,
      analytics: isAnalyticsOpen
    }[panel];
    setter(!getter);
    setIsChatOpen(false);
    setIsFilesOpen(false);
  };

  if (loading) {
    return <MeetingRoomSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fffaf0] dark:bg-slate-900 flex items-center justify-center font-patrick">
        <div className="max-w-md w-full doodle-card dark:bg-slate-800 dark:border-slate-600 p-8 text-center">
          <div className="text-6xl mb-4">X</div>
          <h2 className="text-3xl font-bold mb-2 dark:text-white">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 text-xl italic">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full doodle-button bg-indigo-500 text-white text-xl py-3"
          >
            Back to Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#fffaf0] dark:bg-slate-900 flex flex-col text-slate-900 dark:text-slate-100 overflow-hidden font-patrick transition-colors duration-300">
      {/* Header */}
      <header className="h-14 sm:h-16 border-b-2 border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500 doodle-border flex items-center justify-center font-bold text-2xl text-white">C</div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold line-clamp-1 dark:text-white">{room?.title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">ID: {roomId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-700 doodle-border dark:border-slate-500 px-4 py-1.5 text-sm font-bold shadow-sm dark:text-white cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-600 transition" onClick={() => setShowParticipants(!showParticipants)}>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <BsPeople size={14} />
            {participantCounts} {participantCounts === 1 ? 'doodler' : 'doodlers'}
          </div>
          <button 
            onClick={handleLeaveRoom}
            className="doodle-button bg-rose-500 text-white hover:bg-rose-600 px-6 py-2"
          >
            Leave 🚪
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden p-3 sm:p-6 gap-3 sm:gap-6">
        {/* Video / Whiteboard Grid */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {isWhiteboardOpen ? (
            <div className="flex-1 doodle-card dark:bg-slate-800 dark:border-slate-600 p-2 overflow-hidden bg-white shadow-xl relative">
               <Whiteboard roomId={roomId} />
               {/* PiP local video on whiteboard */}
               <div className="absolute bottom-4 right-4 w-40 sm:w-52 aspect-video doodle-card overflow-hidden shadow-2xl z-10 border-2 border-white dark:border-slate-600">
                 <VideoBox stream={localStream} name={user?.name} isSelf={true} />
               </div>
            </div>
          ) : (
            <>
              {Object.keys(remoteStreams).length === 0 ? (
                /* ── Solo layout: large centered video + invite hint ── */
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <div className="w-full max-w-2xl aspect-video doodle-card dark:bg-slate-800 dark:border-slate-600 overflow-hidden bg-white shadow-xl relative">
                    <VideoBox 
                      stream={localStream} 
                      name={user?.name} 
                      isSelf={true} 
                    />
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm doodle-border dark:border-slate-600 px-6 py-3 shadow-sm">
                    <div className="flex -space-x-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold font-sans">{user?.name?.charAt(0)?.toUpperCase() || 'Y'}</div>
                    </div>
                    <span className="text-sm font-sans font-medium">Only you here — share the room link to invite others!</span>
                  </div>
                </div>
              ) : (
                /* ── Multi-participant grid ── */
                <div className={`flex-1 grid gap-3 sm:gap-6 overflow-y-auto content-start custom-scrollbar p-2 ${
                  Object.keys(remoteStreams).length <= 1 ? 'grid-cols-1 sm:grid-cols-2' :
                  Object.keys(remoteStreams).length <= 3 ? 'grid-cols-1 sm:grid-cols-2' :
                  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                }`}>
                  {/* Local Video */}
                  <div className="doodle-card dark:bg-slate-800 dark:border-slate-600 overflow-hidden bg-white hover:rotate-1 transition-transform group relative aspect-video">
                    <VideoBox 
                      stream={localStream} 
                      name={user?.name} 
                      isSelf={true} 
                    />
                  </div>

                  {/* Remote Videos */}
                  {Object.entries(remoteStreams).map(([socketId, stream]) => {
                    const participant = participants[socketId];
                    const displayName = participant?.name || `Doodler ${socketId.substring(0, 4)}`;
                    return (
                      <div key={socketId} className="doodle-card dark:bg-slate-800 dark:border-slate-600 overflow-hidden bg-white hover:-rotate-1 transition-transform group relative aspect-video">
                        <VideoBox 
                          stream={stream}
                          name={displayName}
                          isSelf={false}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar Panels */}
        <div className="transition-all duration-300 flex">
          <AnimatePresence mode="wait">
            {isChatOpen && (
              <SlideRight className="w-72 sm:w-80 h-full">
                <ChatPanel 
                  roomId={roomId} 
                  user={user} 
                  onClose={() => setIsChatOpen(false)} 
                />
              </SlideRight>
            )}
            {isFilesOpen && (
              <SlideRight className="w-72 sm:w-80 h-full">
                <FilePanel 
                  roomId={roomId} 
                  onClose={() => setIsFilesOpen(false)} 
                />
              </SlideRight>
            )}
            {isCaptionsOpen && (
              <SlideRight className="w-72 sm:w-80 h-full">
                <LiveCaptions 
                  roomId={roomId} 
                  user={user} 
                  onClose={() => setIsCaptionsOpen(false)} 
                />
              </SlideRight>
            )}
            {isSummaryOpen && (
              <SlideRight className="w-72 sm:w-80 h-full">
                <MeetingSummaryPanel 
                  roomId={roomId} 
                  onClose={() => setIsSummaryOpen(false)} 
                />
              </SlideRight>
            )}
            {isActionsOpen && (
              <SlideRight className="w-72 sm:w-80 h-full">
                <ActionItemsPanel 
                  roomId={roomId} 
                  onClose={() => setIsActionsOpen(false)} 
                />
              </SlideRight>
            )}
            {isAnalyticsOpen && (
              <SlideRight className="w-72 sm:w-80 h-full">
                <SpeakerAnalytics 
                  roomId={roomId} 
                  onClose={() => setIsAnalyticsOpen(false)} 
                />
              </SlideRight>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Reactions */}
      <AnimatePresence>
        {floatingReactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: -100, scale: 1.2 }}
            exit={{ opacity: 0, y: -200, scale: 0.3 }}
            transition={{ duration: 2.5, ease: 'easeOut' }}
            className="fixed bottom-28 left-1/2 text-4xl pointer-events-none z-50"
            style={{ marginLeft: (Math.random() - 0.5) * 200 }}
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Participants Dropdown */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 right-4 sm:right-6 z-50 w-72 bg-white dark:bg-slate-800 doodle-border dark:border-slate-600 shadow-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-patrick text-lg font-bold dark:text-white flex items-center gap-2">
                <BsPeople className="text-indigo-500" size={16} />
                Participants ({participantCounts})
              </h3>
              <button onClick={() => setShowParticipants(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg">x</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {/* Self */}
              <div className="flex items-center gap-3 p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold font-sans">
                  {user?.name?.charAt(0)?.toUpperCase() || 'Y'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold font-sans text-slate-800 dark:text-white">{user?.name || 'You'}</p>
                  <p className="text-[10px] text-slate-400 font-sans">You (Host)</p>
                </div>
                <span className="w-2 h-2 bg-green-500 rounded-full" />
              </div>
              {/* Remote participants */}
              {Object.entries(participants).map(([socketId, p]) => (
                <div key={socketId} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold font-sans">
                    {p.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold font-sans text-slate-800 dark:text-white">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-sans">Connected</p>
                  </div>
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
              ))}
              {Object.keys(participants).length === 0 && (
                <p className="text-xs text-slate-400 font-sans text-center py-2">Waiting for others to join...</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Bar */}
      <footer className="h-16 sm:h-20 flex items-center justify-center px-3 sm:px-6 bg-[#3b3b3b] dark:bg-slate-800 text-white">
        <div className="flex items-center gap-0.5 sm:gap-2 flex-wrap justify-center">
          <button 
            onClick={handleToggleAudio}
            className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 w-12 sm:w-16 h-12 sm:h-14 rounded-lg hover:bg-[#333333] dark:hover:bg-slate-700 transition"
          >
            {isAudioOn ? <BsMicFill size={20} /> : <span className="text-red-500"><BsMicMuteFill size={20} /></span>}
            <span className="text-[10px] sm:text-[11px] font-medium font-sans">{isAudioOn ? 'Mute' : 'Unmute'}</span>
          </button>
          
          <button 
            onClick={handleToggleVideo}
            className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 w-12 sm:w-16 h-12 sm:h-14 rounded-lg hover:bg-[#333333] dark:hover:bg-slate-700 transition"
          >
            {isVideoOn ? <BsCameraVideoFill size={20} /> : <span className="text-red-500"><BsCameraVideoOffFill size={20} /></span>}
            <span className="text-[10px] sm:text-[11px] font-medium font-sans">{isVideoOn ? 'Stop Video' : 'Start Video'}</span>
          </button>

          <button 
            onClick={toggleScreenShare}
            className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 w-12 sm:w-16 h-12 sm:h-14 rounded-lg hover:bg-[#333333] dark:hover:bg-slate-700 transition ${isScreenSharing ? 'text-green-500' : ''}`}
          >
            {isScreenSharing ? <MdStopScreenShare size={20} /> : <MdScreenShare size={20} />}
            <span className="text-[10px] sm:text-[11px] font-medium font-sans">Share</span>
          </button>

          <button 
            onClick={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
            className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 w-12 sm:w-16 h-12 sm:h-14 rounded-lg hover:bg-[#333333] dark:hover:bg-slate-700 transition ${isWhiteboardOpen ? 'text-blue-400' : ''}`}
          >
            <BsPen size={20} />
            <span className="text-[10px] sm:text-[11px] font-medium font-sans">Whiteboard</span>
          </button>

          <button 
            onClick={toggleFiles}
            className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 w-12 sm:w-16 h-12 sm:h-14 rounded-lg hover:bg-[#333333] dark:hover:bg-slate-700 transition ${isFilesOpen ? 'text-blue-400' : ''}`}
          >
            <BsFolder size={20} />
            <span className="text-[10px] sm:text-[11px] font-medium font-sans">Files</span>
          </button>

          <button 
            onClick={toggleChat}
            className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 w-12 sm:w-16 h-12 sm:h-14 rounded-lg hover:bg-[#333333] dark:hover:bg-slate-700 transition ${isChatOpen ? 'text-blue-400' : ''}`}
          >
            <BsChatDots size={20} />
            <span className="text-[10px] sm:text-[11px] font-medium font-sans">Chat</span>
          </button>

          {/* Raise Hand */}
          <button 
            onClick={handleRaiseHand}
            className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 w-12 sm:w-16 h-12 sm:h-14 rounded-lg hover:bg-[#333333] dark:hover:bg-slate-700 transition ${isHandRaised ? 'text-amber-400' : ''}`}
          >
            <BsHandIndexFill size={20} />
            <span className="text-[10px] sm:text-[11px] font-medium font-sans">{isHandRaised ? 'Lower' : 'Raise'}</span>
          </button>

          {/* ── AI Features ── */}
          <div className="w-px h-8 bg-slate-600 mx-1" />

          <button
            onClick={() => togglePanel('captions')}
            className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 w-12 sm:w-16 h-12 sm:h-14 rounded-lg hover:bg-[#333333] dark:hover:bg-slate-700 transition ${isCaptionsOpen ? 'text-indigo-400' : ''}`}
          >
            <BsTranslate size={20} />
            <span className="text-[10px] sm:text-[11px] font-medium font-sans">Captions</span>
          </button>

          <button
            onClick={() => togglePanel('summary')}
            className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 w-12 sm:w-16 h-12 sm:h-14 rounded-lg hover:bg-[#333333] dark:hover:bg-slate-700 transition ${isSummaryOpen ? 'text-emerald-400' : ''}`}
          >
            <BsFileText size={20} />
            <span className="text-[10px] sm:text-[11px] font-medium font-sans">Summary</span>
          </button>

          <button
            onClick={() => togglePanel('actions')}
            className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 w-12 sm:w-16 h-12 sm:h-14 rounded-lg hover:bg-[#333333] dark:hover:bg-slate-700 transition ${isActionsOpen ? 'text-amber-400' : ''}`}
          >
            <BsCheckSquare size={20} />
            <span className="text-[10px] sm:text-[11px] font-medium font-sans">Actions</span>
          </button>

          <button
            onClick={() => togglePanel('analytics')}
            className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 w-12 sm:w-16 h-12 sm:h-14 rounded-lg hover:bg-[#333333] dark:hover:bg-slate-700 transition ${isAnalyticsOpen ? 'text-purple-400' : ''}`}
          >
            <BsBarChartFill size={20} />
            <span className="text-[10px] sm:text-[11px] font-medium font-sans">Speakers</span>
          </button>

          <div className="w-px h-8 bg-slate-600 mx-1" />

          {/* Reactions */}
          <div className="relative">
            <button 
              onClick={() => setShowReactions(!showReactions)}
              className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 w-12 sm:w-16 h-12 sm:h-14 rounded-lg hover:bg-[#333333] dark:hover:bg-slate-700 transition"
            >
              <span className="text-lg">+</span>
              <span className="text-[10px] sm:text-[11px] font-medium font-sans">React</span>
            </button>
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-700 doodle-border p-2 flex gap-1 shadow-xl z-50"
                >
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSendReaction(emoji)}
                      className="text-2xl hover:scale-125 active:scale-90 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="ml-2 sm:ml-8 flex items-center">
            <button 
              onClick={handleLeaveRoom}
              className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold font-sans px-3 sm:px-5 py-2 rounded-md transition"
            >
              End
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MeetingRoom;
