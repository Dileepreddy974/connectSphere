import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
  const { login, loading, authError } = useAuth();
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
    <div className="min-h-screen flex items-center justify-center bg-[#fffaf0] px-4 font-patrick">
      <div className="w-full max-w-md doodle-card p-8 animate-in fade-in zoom-in duration-500">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Sign in to ConnectSphere</h1>
        <p className="text-lg text-slate-600 mb-6 font-medium italic">Meetings, chat, and doodle-tastic collaboration.</p>

        {(formError || authError) && (
          <div className="mb-4 doodle-border bg-rose-50 px-4 py-3 text-sm text-rose-600 font-bold animate-wiggle">
            {formError || authError}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-lg font-bold text-slate-700 ml-1">
              Email address
            </label>
            <input
              type="email"
              className="w-full doodle-border bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:rotate-1 placeholder:text-slate-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-lg font-bold text-slate-700 ml-1">
              Password
            </label>
            <input
              type="password"
              className="w-full doodle-border bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:-rotate-1 placeholder:text-slate-300"
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

        <p className="mt-8 text-center text-lg text-slate-600">
          New here?{' '}
          <Link className="font-bold text-indigo-600 hover:underline hover:rotate-2 inline-block transition" to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
