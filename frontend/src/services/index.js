import apiClient from './api';


/**
 * Authentication Service
 */

export const authService = {
  // Register
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Login
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await apiClient.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Upload avatar image
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await apiClient.put('/users/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

/**
 * Room Service
 */

export const roomService = {
  // Create room
  createRoom: async (roomData) => {
    try {
      const response = await apiClient.post('/rooms/create', roomData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Join room
  joinRoom: async (roomId) => {
    try {
      const response = await apiClient.post('/rooms/join', { roomId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get room details
  getRoomDetails: async (roomId) => {
    try {
      const response = await apiClient.get(`/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all rooms
  getAllRooms: async () => {
    try {
      const response = await apiClient.get('/rooms');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Leave room
  leaveRoom: async (roomId) => {
    try {
      const response = await apiClient.post(`/rooms/${roomId}/leave`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

/**
 * File Service
 */

export const fileService = {
  // Upload file
  uploadFile: async (file, roomId) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', roomId);

      // Send as multipart/form-data (override default JSON header)
      const response = await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Download file
  downloadFile: async (fileId) => {
    try {
      const response = await apiClient.get(`/files/download/${fileId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get room files
  getRoomFiles: async (roomId) => {
    try {
      const response = await apiClient.get(`/files/room/${roomId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete file
  deleteFile: async (fileId) => {
    try {
      const response = await apiClient.delete(`/files/${fileId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export const messageService = {
  // Send message
  sendMessage: async (message) => {
    try {
      const response = await apiClient.post('/messages/send', message);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get room messages
  getRoomMessages: async (roomId) => {
    try {
      const response = await apiClient.get(`/messages/room/${roomId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Edit message
  editMessage: async (messageId, content) => {
    try {
      const response = await apiClient.put(`/messages/${messageId}`, { content });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      const response = await apiClient.delete(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
