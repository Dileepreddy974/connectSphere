import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { roomService } from '../services';
import { ProfileModal } from '../components/ProfileModal.jsx';
import { DashboardSkeleton } from '../components/SkeletonLoaders.jsx';
import { StaggeredList, StaggeredItem } from '../components/PageTransition.jsx';

const getAvatarUrl = (avatarStr) => {
  if (!avatarStr) return null;
  if (avatarStr.startsWith('http://') || avatarStr.startsWith('https://')) return avatarStr;
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  try {
    const origin = new URL(apiUrl).origin;
    return `${origin}${avatarStr}`;
  } catch (_) {
    return avatarStr;
  }
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [roomTitle, setRoomTitle] = useState('');
  const [roomToJoin, setRoomToJoin] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomService.getAllRooms();
      setRooms(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load rooms.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomTitle.trim()) return;
    try {
      setIsCreating(true);
      const response = await roomService.createRoom({ title: roomTitle });
      const newRoom = response.data;
      navigate(`/room/${newRoom.roomId}`);
    } catch (err) {
      setError(err.message || 'Failed to create room.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomToJoin.trim()) return;
    try {
      setIsJoining(true);
      const response = await roomService.joinRoom(roomToJoin);
      const room = response.data;
      navigate(`/room/${room.roomId}`);
    } catch (err) {
      setError(err.message || 'Failed to join room. Please check the ID.');
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-[#fffaf0] dark:bg-slate-900 px-4 sm:px-6 py-6 sm:py-10 text-slate-900 dark:text-slate-100 font-patrick transition-colors duration-300">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold dark:text-white">ConnectSphere Workspace</h1>
            <p className="mt-2 text-lg sm:text-xl text-slate-600 dark:text-slate-400 italic">
              Welcome back, <span className="text-indigo-600 dark:text-indigo-400 font-bold underline decoration-wavy">{user?.name}</span>!
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="doodle-button bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 text-lg hover:bg-amber-500 hover:text-white"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? '\u2600 Light' : '\uD83C\uDF19 Dark'}
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="doodle-button bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-lg hover:bg-indigo-500 hover:text-white flex items-center gap-2"
            >
              {getAvatarUrl(user?.avatar) ? (
                <img src={getAvatarUrl(user.avatar)} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-indigo-300" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold font-sans">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              Profile
            </button>
            <button
              onClick={logout}
              className="doodle-button bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 text-lg hover:bg-rose-500 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 doodle-border bg-rose-50 dark:bg-rose-900/30 p-4 text-rose-600 dark:text-rose-400 text-lg font-bold animate-wiggle">
            {error}
          </div>
        )}

        <div className="grid gap-6 sm:gap-10 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6 sm:space-y-8">
            <div className="doodle-card dark:bg-slate-800 dark:border-slate-600 p-5 sm:p-6 transform -rotate-1">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 dark:text-white">Start a Meeting</h2>
              <form onSubmit={handleCreateRoom} className="space-y-6">
                <div>
                  <label className="text-lg font-bold text-slate-700 dark:text-slate-300 block mb-2">Room Title</label>
                  <input
                    type="text"
                    value={roomTitle}
                    onChange={(e) => setRoomTitle(e.target.value)}
                    placeholder="Team Sync, Study Group..."
                    className="w-full doodle-border bg-white dark:bg-slate-700 dark:text-white dark:border-slate-500 px-4 py-3 text-slate-900 outline-none focus:-rotate-1 transition-transform placeholder:text-slate-300 dark:placeholder:text-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full doodle-button bg-indigo-500 text-white text-xl py-3 hover:scale-105 disabled:opacity-50"
                >
                  {isCreating ? 'Drawing room...' : 'Create New Room'}
                </button>
              </form>
            </div>

            <div className="doodle-card dark:bg-slate-800 dark:border-slate-600 p-5 sm:p-6 transform rotate-1">
              <h2 className="text-2xl font-bold mb-4 dark:text-white">Join via ID</h2>
              <form onSubmit={handleJoinRoom} className="space-y-6">
                <div>
                  <label className="text-lg font-bold text-slate-700 dark:text-slate-300 block mb-2">Room ID</label>
                  <input
                    type="text"
                    value={roomToJoin}
                    onChange={(e) => setRoomToJoin(e.target.value)}
                    placeholder="Enter 8-character ID"
                    className="w-full doodle-border bg-white dark:bg-slate-700 dark:text-white dark:border-slate-500 px-4 py-3 text-slate-900 outline-none focus:rotate-1 transition-transform placeholder:text-slate-300 dark:placeholder:text-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full doodle-button bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white text-xl py-3 hover:rotate-1 disabled:opacity-50"
                >
                  {isJoining ? 'Finding...' : 'Join Meeting'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="doodle-card dark:bg-slate-800 dark:border-slate-600 p-5 sm:p-6 h-full min-h-[400px]">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold dark:text-white">Recent Rooms</h2>
                <button
                  onClick={fetchRooms}
                  className="text-lg text-indigo-600 dark:text-indigo-400 font-bold hover:underline decoration-wavy"
                >
                  Refresh
                </button>
              </div>

              {rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4 text-4xl doodle-border">No rooms</div>
                  <p className="text-xl font-bold">No active rooms yet.</p>
                  <p className="text-lg italic">Why not sketch one out?</p>
                </div>
              ) : (
                <StaggeredList className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                  {rooms.map((room) => (
                    <StaggeredItem key={room._id}>
                      <div
                        onClick={() => navigate(`/room/${room.roomId}`)}
                        className="group cursor-pointer doodle-card dark:bg-slate-700 dark:border-slate-500 p-5 hover:scale-105 transition-transform hover:-rotate-1"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-xl sm:text-2xl text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{room.title}</h3>
                          <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-2 py-1 doodle-border">
                            ID: {room.roomId}
                          </span>
                        </div>
                        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 font-medium italic">
                          {room.description || 'A mysterious meeting room...'}
                        </p>
                        <div className="flex items-center justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
                          <span>{room.participants?.length || 0} participants</span>
                          <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </StaggeredItem>
                  ))}
                </StaggeredList>
              )}
            </div>
          </div>
        </div>
      </div>

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

export default Dashboard;
