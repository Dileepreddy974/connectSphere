import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import PageTransition from './components/PageTransition.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MeetingRoom from './pages/MeetingRoom.jsx';
import './App.css';

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffaf0] dark:bg-slate-900 text-slate-900 dark:text-white">
        <div className="doodle-card dark:bg-slate-800 dark:border-slate-600 p-8 shadow-xl">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-center font-patrick">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const HomeRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffaf0] dark:bg-slate-900 text-slate-900 dark:text-white">
        <div className="doodle-card dark:bg-slate-800 dark:border-slate-600 p-8 shadow-xl">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-center font-patrick">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomeRedirect />} />
        <Route
          path="/login"
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          }
        />
        <Route
          path="/register"
          element={
            <PageTransition>
              <Register />
            </PageTransition>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <PageTransition>
                <Dashboard />
              </PageTransition>
            </RequireAuth>
          }
        />
        <Route
          path="/room/:roomId"
          element={
            <RequireAuth>
              <PageTransition>
                <MeetingRoom />
              </PageTransition>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-[#fffaf0] dark:bg-slate-900 transition-colors duration-300">
          <AnimatedRoutes />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
