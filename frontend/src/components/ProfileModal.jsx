import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const PRESET_SEEDS = [
  { name: 'Felix', style: 'adventurer' },
  { name: 'Princess', style: 'lorelei' },
  { name: 'Gizmo', style: 'bottts' },
  { name: 'Buster', style: 'adventurer' },
  { name: 'Bubba', style: 'fun-emoji' },
  { name: 'Sassy', style: 'lorelei' },
  { name: 'Shadow', style: 'pixel-art' },
  { name: 'Ziggy', style: 'fun-emoji' },
  { name: 'Nova', style: 'adventurer' },
  { name: 'Pixel', style: 'pixel-art' },
];

const AVATAR_STYLES = [
  { value: 'fun-emoji', label: 'Fun Emoji', icon: '😜' },
  { value: 'adventurer', label: 'Adventurer', icon: '🧭' },
  { value: 'lorelei', label: 'Lorelei', icon: '✨' },
  { value: 'bottts', label: 'Robots', icon: '🤖' },
  { value: 'pixel-art', label: 'Pixel Art', icon: '👾' },
];

// Small decorative doodles rendered as SVG squiggles
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

export const ProfileModal = ({ onClose }) => {
  const { user, updateProfile, uploadAvatar } = useAuth();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [customSeed, setCustomSeed] = useState('');
  const [customStyle, setCustomStyle] = useState('fun-emoji');
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'custom' | 'upload'

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [avatarPop, setAvatarPop] = useState(false);

  // Trigger a small pop animation on avatar change
  useEffect(() => {
    if (avatar) {
      setAvatarPop(true);
      const t = setTimeout(() => setAvatarPop(false), 350);
      return () => clearTimeout(t);
    }
  }, [avatar]);

  // Helper to compute avatar url
  const getAvatarUrl = (avatarStr) => {
    if (!avatarStr) return 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=default';
    if (avatarStr.startsWith('http://') || avatarStr.startsWith('https://')) return avatarStr;

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    try {
      const origin = new URL(apiUrl).origin;
      return `${origin}${avatarStr}`;
    } catch (_) {
      return avatarStr;
    }
  };

  const handleSelectPreset = (preset) => {
    const url = `https://api.dicebear.com/7.x/${preset.style}/svg?seed=${preset.name}`;
    setAvatar(url);
    setCustomSeed('');
    setError(null);
  };

  const handleCustomSeedChange = (e) => {
    const val = e.target.value;
    setCustomSeed(val);
    if (val.trim()) {
      const url = `https://api.dicebear.com/7.x/${customStyle}/svg?seed=${val.trim()}`;
      setAvatar(url);
    }
  };

  const handleCustomStyleChange = (e) => {
    const style = e.target.value;
    setCustomStyle(style);
    if (customSeed.trim()) {
      const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${customSeed.trim()}`;
      setAvatar(url);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, SVG, etc.)');
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

  const tabBtnClass = (active) =>
    `flex-1 py-2 px-3 text-sm font-bold transition-all doodle-border ${
      active
        ? 'bg-indigo-500 text-white shadow-[2px_2px_0px_0px_#1e293b]'
        : 'bg-white text-slate-700 hover:bg-indigo-50 hover:-rotate-1'
    }`;

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
        {/* Corner doodle decorations */}
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
            {/* Avatar frame with tape effect */}
            <div className="relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-5 bg-amber-200/70 border border-amber-300 rounded-sm transform -rotate-2 z-10" />
              <div
                className={`w-36 h-36 doodle-card bg-white p-2 overflow-hidden transform rotate-2 relative group transition-transform duration-300 ${
                  avatarPop ? 'scale-110 rotate-0' : 'hover:rotate-0 hover:scale-105'
                }`}
              >
                <img
                  src={getAvatarUrl(avatar)}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                  style={{ borderRadius: '12px' }}
                />
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
              accept="image/*"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              disabled={isUploading}
              className="doodle-button bg-indigo-50 text-indigo-600 text-sm py-1.5 w-full hover:bg-indigo-500 hover:text-white"
            >
              {isUploading ? 'Uploading...' : '\uD83D\uDCF7 Upload Photo'}
            </button>
            <p className="text-xs text-slate-400 text-center italic">JPG, PNG, or SVG. Max 10MB.</p>

            {/* Member since badge */}
            <div className="w-full doodle-border bg-amber-50 p-3 text-center transform rotate-1 hover:rotate-0 transition-transform">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">\u2605 Member Since</p>
              <p className="text-sm font-bold text-slate-700 mt-1">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : 'Unknown'}
              </p>
            </div>

            {/* Quick stats doodle card */}
            <div className="w-full doodle-border bg-white p-3 text-center transform -rotate-1 hover:rotate-0 transition-transform">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Display Name</p>
              <p className="text-lg font-bold text-indigo-600 mt-1 truncate">{name || user?.name || '---'}</p>
            </div>
          </div>

          {/* ─── Details & Avatar Selection ─── */}
          <div className="md:col-span-2 space-y-5">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Email (read-only) */}
              <div>
                <label className="block text-lg font-bold text-slate-700 mb-1 flex items-center gap-2">
                  <span className="inline-block w-5 h-5 bg-slate-200 doodle-border rounded-full text-xs flex items-center justify-center">\uD83D\uDD12</span>
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
                  <span className="inline-block w-5 h-5 bg-indigo-100 doodle-border rounded-full text-xs flex items-center justify-center">\u270F</span>
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
                  <span className="inline-block w-5 h-5 bg-rose-100 doodle-border rounded-full text-xs flex items-center justify-center">\uD83D\uDCDD</span>
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

              {/* ─── Avatar Selection Tabs ─── */}
              <div>
                <label className="block text-lg font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="inline-block w-5 h-5 bg-amber-100 doodle-border rounded-full text-xs flex items-center justify-center">\uD83C\uDFA8</span>
                  Choose a Doodle Avatar
                </label>

                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => setActiveTab('presets')} className={tabBtnClass(activeTab === 'presets')}>
                    Presets
                  </button>
                  <button type="button" onClick={() => setActiveTab('custom')} className={tabBtnClass(activeTab === 'custom')}>
                    Custom Seed
                  </button>
                  <button type="button" onClick={() => setActiveTab('upload')} className={tabBtnClass(activeTab === 'upload')}>
                    Upload
                  </button>
                </div>

                {/* Presets Tab */}
                {activeTab === 'presets' && (
                  <div className="doodle-border bg-white p-4" style={{ animation: 'profileFadeIn 0.2s ease-out' }}>
                    <p className="text-sm text-slate-500 italic mb-3">Pick a character that represents you:</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_SEEDS.map((preset) => {
                        const presetUrl = `https://api.dicebear.com/7.x/${preset.style}/svg?seed=${preset.name}`;
                        const isSelected = avatar === presetUrl;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleSelectPreset(preset)}
                            className={`group flex items-center gap-1.5 px-3 py-2 doodle-border text-sm transition-all hover:scale-105 active:scale-95 ${
                              isSelected
                                ? 'bg-indigo-100 border-indigo-400 shadow-[2px_2px_0px_0px_#6366f1]'
                                : 'bg-white text-slate-800 hover:bg-indigo-50'
                            }`}
                          >
                            <img
                              src={presetUrl}
                              alt={preset.name}
                              className={`w-6 h-6 transition-transform ${isSelected ? 'scale-110' : 'group-hover:rotate-12'}`}
                            />
                            <span className="font-bold">{preset.name}</span>
                            {isSelected && <span className="text-indigo-500">\u2713</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Seed Tab */}
                {activeTab === 'custom' && (
                  <div className="doodle-border bg-white p-4 space-y-3" style={{ animation: 'profileFadeIn 0.2s ease-out' }}>
                    <p className="text-sm text-slate-500 italic">Type any word to generate a unique avatar:</p>
                    <div className="flex gap-2">
                      <select
                        value={customStyle}
                        onChange={handleCustomStyleChange}
                        className="doodle-border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:rotate-1 transition-transform"
                      >
                        {AVATAR_STYLES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.icon} {s.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={customSeed}
                        onChange={handleCustomSeedChange}
                        placeholder="Type a seed word..."
                        className="flex-1 doodle-border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:-rotate-1 transition-transform placeholder:text-slate-300"
                      />
                    </div>
                    {customSeed.trim() && (
                      <div className="flex items-center gap-3 p-2 bg-indigo-50 doodle-border">
                        <img
                          src={getAvatarUrl(avatar)}
                          alt="Preview"
                          className="w-12 h-12 doodle-border bg-white p-1"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-700">Preview</p>
                          <p className="text-xs text-slate-500 italic">Style: {AVATAR_STYLES.find((s) => s.value === customStyle)?.label} / Seed: "{customSeed.trim()}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Tab */}
                {activeTab === 'upload' && (
                  <div
                    className="doodle-border bg-white p-6 text-center cursor-pointer hover:bg-indigo-50 transition-colors group"
                    onClick={() => fileInputRef.current.click()}
                    style={{ animation: 'profileFadeIn 0.2s ease-out' }}
                  >
                    <div className="text-5xl mb-3 group-hover:animate-wiggle inline-block">\uD83D\uDDBC</div>
                    <p className="text-lg font-bold text-slate-700">Drop your picture here</p>
                    <p className="text-sm text-slate-500 italic">or click to browse &middot; JPG, PNG, SVG &middot; Max 10MB</p>
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
                )}
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
                    '\u2728 Save Profile'
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
