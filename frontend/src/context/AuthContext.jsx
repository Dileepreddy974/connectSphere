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
      authService
        .getProfile()
        .then((response) => {
          const userData = response?.data || response;

          setUser(userData);
          userService.setUser(userData);
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
      const response = await authService.login({
        email,
        password
      });

      const token = response?.data?.token;
      const userData = response?.data?.user;

      if (!token || !userData) {
        throw new Error('Invalid login response from server');
      }

      tokenService.setToken(token);
      userService.setUser(userData);
      setUser(userData);

      navigate('/dashboard');

      return response;
    } catch (error) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        'Login failed';

      setAuthError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (
    name,
    email,
    password,
    confirmPassword
  ) => {
    setLoading(true);
    setAuthError(null);

    try {
      const response = await authService.register({
        name,
        email,
        password,
        confirmPassword
      });

      const token = response?.data?.token;
      const userData = response?.data?.user;

      if (!token || !userData) {
        throw new Error('Invalid registration response from server');
      }

      tokenService.setToken(token);
      userService.setUser(userData);
      setUser(userData);

      navigate('/dashboard');

      return response;
    } catch (error) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        'Registration failed';

      setAuthError(errorMessage);
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
      // Ignore logout errors
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
    [user, loading, authError]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};