import apiClient from './apiClient';

/**
 * Authentication Service
 * Handles user login, registration, and email confirmation
 */
export const authService = {
  /**
   * Register a new user
   */
  register: async (data) => {
    const payload = {
      fullName: data.fullName || '',
      name: data.username || data.name || (data.fullName ? data.fullName.replace(/\s+/g, '').toLowerCase() : ''), 
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      role: 0, // Strictly Startup role for Mobile
    };

    const response = await apiClient.post('/api/Auth/register', payload);
    return response;
  },

  /**
   * Log in a user
   */
  login: async (credentials) => {
    const response = await apiClient.post('/api/Auth/login', credentials);
    return response;
  },

  /**
   * Trigger a password reset email
   */
  forgotPassword: async (email) => {
    const response = await apiClient.post('/api/Auth/forgot-password', { email });
    return response;
  },

  /**
   * Confirm an email address
   */
  confirmEmail: async (userId, token) => {
    const response = await apiClient.get('/api/Auth/confirm-email', {
      params: { userId, token }
    });
    return response;
  },
  
  /**
   * Refresh the access token
   */
  refreshToken: async (refreshToken) => {
     const response = await apiClient.post('/api/Auth/refresh-token', { refreshToken });
     return response;
  },
  
  /**
   * Logout user from backend
   */
  logout: async () => {
    const response = await apiClient.post('/api/Auth/logout');
    return response;
  }
};

export default authService;
