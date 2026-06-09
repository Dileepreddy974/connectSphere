import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/index.js';
import { tokenService, userService } from '../utils/storage.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(userService.getUser());
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const token = tokenService.getToken();
    if (token && !user) {
      authService.getProfile()
        .then((response) => {
          setUser(response.data);
          userService.setUser(response.data);
        })
        .catch(() => {
          tokenService.removeToken();
          userService.removeUser();
          setUser(null);
        });
    }
  }, [user]);

  const handleLogin = async (email, password) => {
    setLoading(true);
    setAuthError(null);

    try {
      const response = await authService.login({ email, password });
      tokenService.setToken(response.data.token);
      userService.setUser(response.data.user);
      setUser(response.data.user);
      navigate('/dashboard');
      return response;
    } catch (error) {
      const errorMessage = error.errors ? error.errors.map(e => e.message).join(', ') : error.message;
      setAuthError(errorMessage || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (name, email, password, confirmPassword) => {
    setLoading(true);
    setAuthError(null);

    try {
      const response = await authService.register({ name, email, password, confirmPassword });
      tokenService.setToken(response.data.token);
      userService.setUser(response.data.user);
      setUser(response.data.user);
      navigate('/dashboard');
      return response;
    } catch (error) {
      const errorMessage = error.errors ? error.errors.map(e => e.message).join(', ') : error.message;
      setAuthError(errorMessage || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (_) {
      // ignore logout errors and clear client state
    }
    tokenService.removeToken();
    userService.removeUser();
    setUser(null);
    navigate('/login');
    setLoading(false);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
      isAuthenticated: !!user
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
