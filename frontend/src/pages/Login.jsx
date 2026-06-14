import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const Login = () => {
  const { login, loading, authError } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Email and password are required.');
      return;
    }

    try {
      await login(email, password);
    } catch (error) {
      setFormError(error.message || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fffaf0] dark:bg-slate-900 px-4 font-patrick transition-colors duration-300">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 doodle-button bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 text-sm z-50"
      >
        {isDark ? '\u2600' : '\uD83C\uDF19'}
      </button>
      <div className="w-full max-w-md doodle-card dark:bg-slate-800 dark:border-slate-600 p-8 animate-in fade-in zoom-in duration-500">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Sign in to ConnectSphere</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 font-medium italic">Meetings, chat, and doodle-tastic collaboration.</p>

        {(formError || authError) && (
          <div className="mb-4 doodle-border bg-rose-50 dark:bg-rose-900/30 px-4 py-3 text-sm text-rose-600 dark:text-rose-400 font-bold animate-wiggle">
            {formError || authError}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-lg font-bold text-slate-700 dark:text-slate-300 ml-1">
              Email address
            </label>
            <input
              type="email"
              className="w-full doodle-border bg-white dark:bg-slate-700 dark:text-white dark:border-slate-500 px-4 py-3 text-slate-900 outline-none transition-all focus:rotate-1 placeholder:text-slate-300 dark:placeholder:text-slate-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-lg font-bold text-slate-700 dark:text-slate-300 ml-1">
              Password
            </label>
            <input
              type="password"
              className="w-full doodle-border bg-white dark:bg-slate-700 dark:text-white dark:border-slate-500 px-4 py-3 text-slate-900 outline-none transition-all focus:-rotate-1 placeholder:text-slate-300 dark:placeholder:text-slate-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full doodle-button bg-indigo-500 text-white text-xl py-4 hover:bg-indigo-400 disabled:opacity-50"
          >
            {loading ? 'Doodling you in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-8 text-center text-lg text-slate-600 dark:text-slate-400">
          New here?{' '}
          <Link className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline hover:rotate-2 inline-block transition" to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
