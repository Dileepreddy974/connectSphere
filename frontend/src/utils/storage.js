import Cookies from 'js-cookie';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'user';

/**
 * Token management
 */
export const tokenService = {
  setToken: (token) => {
    Cookies.set(TOKEN_KEY, token, { expires: 7 });
  },
  
  getToken: () => {
    return Cookies.get(TOKEN_KEY);
  },
  
  removeToken: () => {
    Cookies.remove(TOKEN_KEY);
  },
  
  isTokenValid: () => {
    return !!Cookies.get(TOKEN_KEY);
  }
};

/**
 * User management
 */
export const userService = {
  setUser: (user) => {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  
  getUser: () => {
    const user = sessionStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  
  removeUser: () => {
    sessionStorage.removeItem(USER_KEY);
  },
  
  isAuthenticated: () => {
    return !!sessionStorage.getItem(USER_KEY) && tokenService.isTokenValid();
  }
};

/**
 * Local storage utility
 */
export const storageService = {
  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  
  get: (key) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  
  remove: (key) => {
    localStorage.removeItem(key);
  },
  
  clear: () => {
    localStorage.clear();
  }
};

const defaultExport = {
  tokenService,
  userService,
  storageService
};

export default defaultExport;
