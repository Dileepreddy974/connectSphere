import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { roomService } from '../services';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [roomTitle, setRoomTitle] = useState('');
  const [roomToJoin, setRoomToJoin] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#fffaf0] px-6 py-10 text-slate-900 font-patrick">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold text-slate-900">ConnectSphere Workspace</h1>
            <p className="mt-2 text-xl text-slate-600 italic">Welcome back, <span className="text-indigo-600 font-bold underline decoration-wavy">{user?.name}</span>!</p>
          </div>
          <button
            onClick={logout}
            className="doodle-button bg-rose-50 text-rose-600 text-lg hover:bg-rose-500 hover:text-white"
          >
            Logout 👋
          </button>
        </div>

        {error && (
          <div className="mb-8 doodle-border bg-rose-50 p-4 text-rose-600 text-lg font-bold animate-wiggle">
            {error}
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-8">
            <div className="doodle-card p-6 transform -rotate-1">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                Start a Meeting 🚀
              </h2>
              <form onSubmit={handleCreateRoom} className="space-y-6">
                <div>
                  <label className="text-lg font-bold text-slate-700 block mb-2">Room Title</label>
                  <input
                    type="text"
                    value={roomTitle}
                    onChange={(e) => setRoomTitle(e.target.value)}
                    placeholder="Team Sync, Study Group..."
                    className="w-full doodle-border bg-white px-4 py-3 text-slate-900 outline-none focus:-rotate-1"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full doodle-button bg-indigo-500 text-white text-xl py-3 hover:scale-105"
                >
                  {isCreating ? 'Drawing room...' : 'Create New Room ✨'}
                </button>
              </form>
            </div>

            <div className="doodle-card p-6 transform rotate-1">
              <h2 className="text-2xl font-bold mb-4">Join via ID 🔑</h2>
              <form onSubmit={handleJoinRoom} className="space-y-6">
                <div>
                  <label className="text-lg font-bold text-slate-700 block mb-2">Room ID</label>
                  <input
                    type="text"
                    value={roomToJoin}
                    onChange={(e) => setRoomToJoin(e.target.value)}
                    placeholder="Enter 8-character ID"
                    className="w-full doodle-border bg-white px-4 py-3 text-slate-900 outline-none focus:rotate-1"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full doodle-button bg-slate-100 text-slate-900 text-xl py-3 hover:rotate-1"
                >
                  {isJoining ? 'Finding...' : 'Join Meeting 🏃'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="doodle-card p-6 h-full min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">Recent Rooms 📁</h2>
                <button 
                  onClick={fetchRooms}
                  className="text-lg text-indigo-600 font-bold hover:underline decoration-wavy"
                >
                  Refresh 🔄
                </button>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-xl font-bold">Hunting for rooms...</p>
                </div>
              ) : rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-4xl doodle-border">🏝️</div>
                  <p className="text-xl font-bold">No active rooms yet.</p>
                  <p className="text-lg italic">Why not sketch one out?</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {rooms.map((room) => (
                    <div 
                      key={room._id}
                      onClick={() => navigate(`/room/${room.roomId}`)}
                      className="group cursor-pointer doodle-card p-5 hover:scale-105 transition-transform hover:-rotate-1"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-2xl text-slate-900 group-hover:text-indigo-600">{room.title}</h3>
                        <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 doodle-border">
                          ID: {room.roomId}
                        </span>
                      </div>
                      <p className="text-lg text-slate-600 line-clamp-2 mb-4 font-medium italic">
                        {room.description || 'A mysterious meeting room...'}
                      </p>
                      <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                        <span>👥 {room.participants?.length || 0} participants</span>
                        <span>📅 {new Date(room.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
