import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const Register = () => {
  const { register, loading, authError } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!name || !email || !password || !confirmPassword) {
      setFormError('Please complete all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    try {
      await register(name, email, password, confirmPassword);
    } catch (error) {
      setFormError(error.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fffaf0] dark:bg-slate-900 px-4 font-patrick transition-colors duration-300">
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 doodle-button bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 text-sm z-50"
      >
        {isDark ? '\u2600' : '\uD83C\uDF19'}
      </button>
      <div className="w-full max-w-md doodle-card dark:bg-slate-800 dark:border-slate-600 p-8 animate-in fade-in zoom-in duration-500 bg-white">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Create a ConnectSphere account</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 font-medium italic">Start secure meetings and collaboration with your team.</p>

        {(formError || authError) && (
          <div className="mb-4 doodle-border bg-rose-50 dark:bg-rose-900/30 px-4 py-3 text-sm text-rose-600 dark:text-rose-400 font-bold animate-wiggle">
            {formError || authError}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-lg font-bold text-slate-700 dark:text-slate-300 ml-1">Full name</label>
            <input
              type="text"
              className="w-full doodle-border bg-white dark:bg-slate-700 dark:text-white dark:border-slate-500 px-4 py-3 text-slate-900 outline-none transition-all focus:rotate-1 placeholder:text-slate-300 dark:placeholder:text-slate-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-lg font-bold text-slate-700 dark:text-slate-300 ml-1">Email address</label>
            <input
              type="email"
              className="w-full doodle-border bg-white dark:bg-slate-700 dark:text-white dark:border-slate-500 px-4 py-3 text-slate-900 outline-none transition-all focus:rotate-1 placeholder:text-slate-300 dark:placeholder:text-slate-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-lg font-bold text-slate-700 dark:text-slate-300 ml-1">Password</label>
            <input
              type="password"
              className="w-full doodle-border bg-white dark:bg-slate-700 dark:text-white dark:border-slate-500 px-4 py-3 text-slate-900 outline-none transition-all focus:-rotate-1 placeholder:text-slate-300 dark:placeholder:text-slate-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-lg font-bold text-slate-700 dark:text-slate-300 ml-1">Confirm password</label>
            <input
              type="password"
              className="w-full doodle-border bg-white dark:bg-slate-700 dark:text-white dark:border-slate-500 px-4 py-3 text-slate-900 outline-none transition-all focus:-rotate-1 placeholder:text-slate-300 dark:placeholder:text-slate-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full doodle-button bg-indigo-500 text-white text-xl py-4 hover:bg-indigo-400 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-8 text-center text-lg text-slate-600 dark:text-slate-400">
          Already registered?{' '}
          <Link className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline hover:rotate-2 inline-block transition" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
