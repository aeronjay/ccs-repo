import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authentication services
export const authService = {
  // Register/Sign up
  register: async (email, password, role = 'user') => {
    try {
      const response = await api.post('/auth/register', { email, password, role });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Login/Sign in
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  }
};

// Paper management services
export const paperService = {
  // Upload paper
  upload: async (file, userId, title, description, additionalData = {}) => {
    try {
      const formData = new FormData();
      formData.append('paper', file);
      formData.append('userId', userId);
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);
      
      // Add additional fields
      if (additionalData.journal) formData.append('journal', additionalData.journal);
      if (additionalData.year) formData.append('year', additionalData.year);
      if (additionalData.authors) formData.append('authors', JSON.stringify(additionalData.authors));
      if (additionalData.tags) formData.append('tags', JSON.stringify(additionalData.tags));
      if (additionalData.doi) formData.append('doi', additionalData.doi);

      const response = await api.post('/papers/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Upload failed' };
    }
  },

  // Get user's papers
  getUserPapers: async (userId) => {
    try {
      const response = await api.get(`/papers/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch papers' };
    }
  },

  // Download paper
  downloadPaper: async (fileId, userId) => {
    try {
      const response = await api.get(`/papers/download/${fileId}?userId=${userId}`, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      throw error.response?.data || { message: 'Download failed' };
    }
  },

  // Delete paper
  deletePaper: async (fileId, userId) => {
    try {
      const response = await api.delete(`/papers/${fileId}`, {
        data: { userId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Delete failed' };
    }
  },
  // Get all papers (admin only)
  getAllPapers: async () => {
    try {
      const response = await api.get('/papers/admin/all');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch all papers' };
    }
  },
  // Get all papers for public display (homepage)
  getPublicPapers: async () => {
    try {
      const response = await api.get('/papers/public');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch papers' };
    }
  },  // Get paper details by ID
  getPaperDetails: async (paperId) => {
    try {
      const response = await api.get(`/papers/${paperId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch paper details' };
    }
  },

  // Check download permission
  checkDownloadPermission: async (paperId, userId) => {
    try {
      const response = await api.get(`/papers/${paperId}/download-permission`, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to check download permission' };
    }
  },

  // Like paper
  likePaper: async (paperId, userId) => {
    try {
      const response = await api.post(`/papers/${paperId}/like`, { userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to like paper' };
    }
  },

  // Dislike paper
  dislikePaper: async (paperId, userId) => {
    try {
      const response = await api.post(`/papers/${paperId}/dislike`, { userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to dislike paper' };
    }
  },

  // Add comment
  addComment: async (paperId, userId, userEmail, content, parentCommentId = null) => {
    try {
      const response = await api.post(`/papers/${paperId}/comment`, {
        userId,
        userEmail,
        content,
        parentCommentId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add comment' };
    }
  },

  // Admin functions
  // Delete paper (admin only)
  adminDeletePaper: async (paperId) => {
    try {
      const response = await api.delete(`/papers/admin/papers/${paperId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete paper' };
    }
  },

  // Update paper (admin only)
  adminUpdatePaper: async (paperId, paperData) => {
    try {
      const response = await api.put(`/papers/admin/papers/${paperId}`, paperData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update paper' };
    }
  },

  // Get paper statistics (admin only)
  adminGetPaperStats: async () => {
    try {
      const response = await api.get('/papers/admin/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch paper statistics' };
    }
  }
};

// User management services (admin only)
export const userService = {
  // Get all users (admin only)
  getAllUsers: async () => {
    try {
      const response = await api.get('/auth/admin/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  // Update user role (admin only)
  updateUserRole: async (userId, role) => {
    try {
      const response = await api.put(`/auth/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user role' };
    }
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/auth/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete user' };
    }
  },

  // Get user statistics (admin only)
  getUserStats: async () => {
    try {
      const response = await api.get('/auth/admin/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user statistics' };
    }
  }
};

// Export the api instance for other potential uses
export default api;

