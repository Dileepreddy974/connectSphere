import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { roomService } from '../services';
import socketService from '../services/socket';
import useWebRTC from '../hooks/useWebRTC';
import { tokenService } from '../utils/storage.js';
import ChatPanel from '../components/Chat/ChatPanel';
import Whiteboard from '../components/Whiteboard/Whiteboard';
import FilePanel from '../components/Meeting/FilePanel';
import { BsMicFill, BsMicMuteFill, BsCameraVideoFill, BsCameraVideoOffFill, BsChatDots, BsFolder, BsPen } from 'react-icons/bs';
import { MdScreenShare, MdStopScreenShare } from 'react-icons/md';

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
         <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 font-bold uppercase tracking-widest text-2xl">
           No Sketch 🖍️
         </div>
      )}
      <div className="absolute bottom-4 left-4 bg-white/60 backdrop-blur-md px-3 py-1 doodle-border text-sm font-bold shadow-sm">
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

  useEffect(() => {
    const token = tokenService.getToken();
    if (token) {
      socketService.initializeSocket(token);
    }
  }, []);

  const { localStream, remoteStreams, toggleVideo, toggleAudio, isScreenSharing, toggleScreenShare } = useWebRTC(roomId, user?._id);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        setLoading(true);
        const response = await roomService.getRoomDetails(roomId);
        setRoom(response.data);
      } catch (err) {
        setError('Failed to load meeting room. It may not exist.');
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
  };

  const toggleFiles = () => {
    setIsFilesOpen(!isFilesOpen);
    setIsChatOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf0] flex items-center justify-center font-patrick">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-2xl font-bold text-slate-600">Sharpening pencils... Join in!</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fffaf0] flex items-center justify-center font-patrick">
        <div className="max-w-md w-full doodle-card p-8 text-center bg-white">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-3xl font-bold mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6 text-xl italic">{error}</p>
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
    <div className="h-screen bg-[#fffaf0] flex flex-col text-slate-900 overflow-hidden font-patrick">
      {/* Header */}
      <header className="h-16 border-b-2 border-slate-900 flex items-center justify-between px-6 bg-white/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500 doodle-border flex items-center justify-center font-bold text-2xl text-white">C</div>
          <div>
            <h1 className="text-2xl font-bold line-clamp-1">{room?.title}</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">ID: {roomId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-white doodle-border px-4 py-1.5 text-sm font-bold shadow-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            {Object.keys(remoteStreams).length + 1} doodlers
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
      <main className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Video / Whiteboard Grid */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {isWhiteboardOpen ? (
            <div className="flex-1 doodle-card p-2 overflow-hidden bg-white shadow-xl">
               <Whiteboard roomId={roomId} />
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto content-start custom-scrollbar p-2">
              {/* Local Video */}
              <div className="doodle-card overflow-hidden bg-white hover:rotate-1 transition-transform group relative aspect-video">
                <VideoBox 
                  stream={localStream} 
                  name={user?.name} 
                  isSelf={true} 
                />
              </div>

              {/* Remote Videos */}
              {Object.entries(remoteStreams).map(([socketId, stream]) => (
                <div key={socketId} className="doodle-card overflow-hidden bg-white hover:-rotate-1 transition-transform group relative aspect-video">
                  <VideoBox 
                    stream={stream}
                    name={`Doodler ${socketId.substring(0, 4)}`}
                    isSelf={false}
                  />
                </div>
              ))}

              {/* No one else yet */}
              {Object.keys(remoteStreams).length === 0 && (
                <div className="aspect-video doodle-card bg-white flex flex-col items-center justify-center text-slate-400 border-dashed animate-wiggle">
                  <div className="text-5xl mb-4">🖍️</div>
                  <p className="text-xl font-bold uppercase tracking-widest">Waiting for friends...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Panels */}
        <div className="transition-all duration-300 flex">
          {isChatOpen && (
            <div className="w-80 h-full animate-in slide-in-from-right fade-in duration-300">
              <ChatPanel 
                roomId={roomId} 
                user={user} 
                onClose={() => setIsChatOpen(false)} 
              />
            </div>
          )}
          {isFilesOpen && (
            <div className="w-80 h-full animate-in slide-in-from-right fade-in duration-300">
              <FilePanel 
                roomId={roomId} 
                onClose={() => setIsFilesOpen(false)} 
              />
            </div>
          )}
        </div>
      </main>

      {/* Control Bar */}
      <footer className="h-20 flex items-center justify-center px-6 bg-[#3b3b3b] text-white">
        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={handleToggleAudio}
            className="flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-lg hover:bg-[#333333] transition"
          >
            {isAudioOn ? <BsMicFill size={20} /> : <span className="text-red-500"><BsMicMuteFill size={20} /></span>}
            <span className="text-[11px] font-medium font-sans">{isAudioOn ? 'Mute' : 'Unmute'}</span>
          </button>
          
          <button 
            onClick={handleToggleVideo}
            className="flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-lg hover:bg-[#333333] transition"
          >
            {isVideoOn ? <BsCameraVideoFill size={20} /> : <span className="text-red-500"><BsCameraVideoOffFill size={20} /></span>}
            <span className="text-[11px] font-medium font-sans">{isVideoOn ? 'Stop Video' : 'Start Video'}</span>
          </button>

          <button 
            onClick={toggleScreenShare}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-lg hover:bg-[#333333] transition ${isScreenSharing ? 'text-green-500' : ''}`}
          >
            {isScreenSharing ? <MdStopScreenShare size={20} /> : <MdScreenShare size={20} />}
            <span className="text-[11px] font-medium font-sans">Share Screen</span>
          </button>

          <button 
            onClick={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-lg hover:bg-[#333333] transition ${isWhiteboardOpen ? 'text-blue-400' : ''}`}
          >
            <BsPen size={20} />
            <span className="text-[11px] font-medium font-sans">Whiteboard</span>
          </button>

          <button 
            onClick={toggleFiles}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-lg hover:bg-[#333333] transition ${isFilesOpen ? 'text-blue-400' : ''}`}
          >
            <BsFolder size={20} />
            <span className="text-[11px] font-medium font-sans">Files</span>
          </button>

          <button 
            onClick={toggleChat}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-lg hover:bg-[#333333] transition ${isChatOpen ? 'text-blue-400' : ''}`}
          >
            <BsChatDots size={20} />
            <span className="text-[11px] font-medium font-sans">Chat</span>
          </button>

          <div className="ml-4 sm:ml-8 flex items-center">
            <button 
              onClick={handleLeaveRoom}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold font-sans px-5 py-2 rounded-md transition"
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
