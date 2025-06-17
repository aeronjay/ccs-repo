import axios from 'axios';

const baseURL = 'http://localhost:3000/api';

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

// Export the api instance for other potential uses
export default api;

