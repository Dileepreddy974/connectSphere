import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const SquiggleDecor = ({ className = '', color = '#6366f1' }) => (
  <svg className={className} viewBox="0 0 120 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2 6C10 2 18 10 26 6C34 2 42 10 50 6C58 2 66 10 74 6C82 2 90 10 98 6C106 2 114 10 118 6"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const StarDoodle = ({ className = '' }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// Helper to compute full avatar URL from a stored path like "/uploads/file-xxx.png"
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

export const ProfileModal = ({ onClose }) => {
  const { user, updateProfile, uploadAvatar } = useAuth();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [avatarPop, setAvatarPop] = useState(false);

  useEffect(() => {
    if (avatar) {
      setAvatarPop(true);
      const t = setTimeout(() => setAvatarPop(false), 350);
      return () => clearTimeout(t);
    }
  }, [avatar]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPG, JPEG, or PNG image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Max 10MB allowed.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      const updatedUser = await uploadAvatar(file);
      setAvatar(updatedUser.avatar);
      setSuccess('Profile picture uploaded!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to upload profile picture.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
    setError(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        avatar: avatar,
      });
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const avatarUrl = getAvatarUrl(avatar);
  const userInitial = (name || user?.name || '?').charAt(0).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      style={{ animation: 'profileFadeIn 0.3s ease-out' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#fffaf0] doodle-card p-6 md:p-8 max-h-[90vh] overflow-y-auto font-patrick"
        style={{ animation: 'profileSlideUp 0.35s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner decorations */}
        <div className="absolute top-3 left-3 text-indigo-300 opacity-50 pointer-events-none select-none">
          <StarDoodle />
        </div>
        <div className="absolute top-3 right-12 text-amber-300 opacity-50 pointer-events-none select-none">
          <StarDoodle />
        </div>
        <div className="absolute bottom-3 left-6 text-rose-300 opacity-40 pointer-events-none select-none rotate-12">
          <StarDoodle />
        </div>

        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-dashed border-slate-300 pb-4 mb-6">
          <div>
            <h2 className="text-4xl font-bold text-slate-900 flex items-center gap-2">
              <span className="inline-block transform -rotate-3">&#9998;</span>
              Your Profile
            </h2>
            <p className="text-lg text-slate-500 italic mt-1">Customize your presence on ConnectSphere</p>
            <SquiggleDecor className="mt-2 w-32 h-3 opacity-40" color="#6366f1" />
          </div>
          <button
            onClick={onClose}
            className="doodle-button bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white text-xl px-3 py-1"
          >
            &#10005;
          </button>
        </div>

        {/* Status messages */}
        {error && (
          <div className="mb-4 doodle-border bg-rose-50 p-3 text-rose-600 font-bold text-center animate-wiggle">
            &#9888; {error}
          </div>
        )}
        {success && (
          <div className="mb-4 doodle-border bg-emerald-50 p-3 text-emerald-700 font-bold text-center" style={{ animation: 'profileSlideUp 0.3s ease-out' }}>
            &#10003; {success}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* ─── Avatar Section ─── */}
          <div className="md:col-span-1 flex flex-col items-center gap-4">
            {/* Avatar frame */}
            <div className="relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-5 bg-amber-200/70 border border-amber-300 rounded-sm transform -rotate-2 z-10" />
              <div
                className={`w-36 h-36 doodle-card bg-white p-2 overflow-hidden transform rotate-2 relative group transition-transform duration-300 ${
                  avatarPop ? 'scale-110 rotate-0' : 'hover:rotate-0 hover:scale-105'
                }`}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    style={{ borderRadius: '12px' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900" style={{ borderRadius: '12px' }}>
                    <span className="text-5xl font-bold text-indigo-400">{userInitial}</span>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center font-bold text-slate-800">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-xl">
                  <span className="text-white font-bold text-sm drop-shadow">Change</span>
                </div>
              </div>
            </div>

            {/* Upload button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/webp"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              disabled={isUploading}
              className="doodle-button bg-indigo-50 text-indigo-600 text-sm py-1.5 w-full hover:bg-indigo-500 hover:text-white"
            >
              {isUploading ? 'Uploading...' : '📷 Upload Photo'}
            </button>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold underline"
              >
                Remove photo
              </button>
            )}

            <p className="text-xs text-slate-400 text-center italic">JPG, PNG, or WebP. Max 10MB.</p>

            {/* Member since badge */}
            <div className="w-full doodle-border bg-amber-50 p-3 text-center transform rotate-1 hover:rotate-0 transition-transform">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">★ Member Since</p>
              <p className="text-sm font-bold text-slate-700 mt-1">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : 'Unknown'}
              </p>
            </div>

            {/* Display Name card */}
            <div className="w-full doodle-border bg-white p-3 text-center transform -rotate-1 hover:rotate-0 transition-transform">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Display Name</p>
              <p className="text-lg font-bold text-indigo-600 mt-1 truncate">{name || user?.name || '---'}</p>
            </div>
          </div>

          {/* ─── Details Section ─── */}
          <div className="md:col-span-2 space-y-5">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Email (read-only) */}
              <div>
                <label className="block text-lg font-bold text-slate-700 mb-1 flex items-center gap-2">
                  <span className="inline-block w-5 h-5 bg-slate-200 doodle-border rounded-full text-xs flex items-center justify-center">🔒</span>
                  Email (Locked)
                </label>
                <input
                  type="text"
                  value={user?.email || ''}
                  disabled
                  className="w-full doodle-border bg-slate-100 px-3 py-2 text-slate-500 cursor-not-allowed outline-none"
                />
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-lg font-bold text-slate-700 mb-1 flex items-center gap-2">
                  <span className="inline-block w-5 h-5 bg-indigo-100 doodle-border rounded-full text-xs flex items-center justify-center">✏</span>
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your creative name..."
                  className="w-full doodle-border bg-white px-3 py-2 text-slate-900 outline-none focus:-rotate-1 transition-transform placeholder:text-slate-300"
                  maxLength={50}
                  required
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-lg font-bold text-slate-700 mb-1 flex items-center gap-2">
                  <span className="inline-block w-5 h-5 bg-rose-100 doodle-border rounded-full text-xs flex items-center justify-center">📝</span>
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about yourself..."
                  className="w-full doodle-border bg-white px-3 py-2 text-slate-900 outline-none focus:rotate-1 h-20 resize-none transition-transform placeholder:text-slate-300"
                  maxLength={500}
                />
                <p className="text-xs text-slate-400 text-right mt-1">{bio.length}/500</p>
              </div>

              {/* ─── Profile Picture Upload Area ─── */}
              <div>
                <label className="block text-lg font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="inline-block w-5 h-5 bg-amber-100 doodle-border rounded-full text-xs flex items-center justify-center">🖼</span>
                  Profile Picture
                </label>

                <div
                  className="doodle-border bg-white p-6 text-center cursor-pointer hover:bg-indigo-50 transition-colors group"
                  onClick={() => fileInputRef.current.click()}
                >
                  {avatarUrl ? (
                    <>
                      <img
                        src={avatarUrl}
                        alt="Current profile"
                        className="w-24 h-24 mx-auto object-cover doodle-border mb-3"
                        style={{ borderRadius: '12px' }}
                      />
                      <p className="text-lg font-bold text-slate-700">Click to change your photo</p>
                      <p className="text-sm text-slate-500 italic">JPG, PNG, WebP &middot; Max 10MB</p>
                    </>
                  ) : (
                    <>
                      <div className="text-5xl mb-3 group-hover:animate-wiggle inline-block">🖼</div>
                      <p className="text-lg font-bold text-slate-700">Drop your picture here</p>
                      <p className="text-sm text-slate-500 italic">or click to browse &middot; JPG, PNG, WebP &middot; Max 10MB</p>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current.click();
                    }}
                    disabled={isUploading}
                    className="doodle-button bg-indigo-50 text-indigo-600 text-sm py-2 px-6 mt-4 hover:bg-indigo-500 hover:text-white inline-block"
                  >
                    {isUploading ? 'Uploading...' : 'Choose File'}
                  </button>
                </div>
              </div>

              {/* ─── Action Buttons ─── */}
              <div className="flex gap-4 pt-4 border-t-2 border-dashed border-slate-300">
                <SquiggleDecor className="absolute left-8 -mt-3 w-24 h-3 opacity-20" color="#6366f1" />
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 doodle-button bg-slate-100 text-slate-700 text-lg py-2 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 doodle-button bg-indigo-500 text-white text-lg py-2 hover:bg-indigo-600 disabled:opacity-60"
                  style={{ color: '#fff' }}
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                      Saving...
                    </span>
                  ) : (
                    '✨ Save Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer doodle */}
        <div className="mt-6 flex justify-center opacity-30 pointer-events-none select-none">
          <SquiggleDecor className="w-40 h-3" color="#94a3b8" />
        </div>
      </div>
    </div>
  );
};
