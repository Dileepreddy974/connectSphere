import axios from 'axios';
import Cookies from 'js-cookie';

// Use the environment provided API URL in production or hosting platforms.
// Relying on a hardcoded localhost fallback in production can cause issues,
// so we only use `REACT_APP_API_URL` here. For local development, set
// REACT_APP_API_URL in your `.env` (e.g. REACT_APP_API_URL=http://localhost:5000/api).
const API_BASE_URL = process.env.REACT_APP_API_URL;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      Cookies.remove('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
