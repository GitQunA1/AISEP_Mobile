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
      name: data.fullName || data.name || '',
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      role: data.role ?? 0,
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
