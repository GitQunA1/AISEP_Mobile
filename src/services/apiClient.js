import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translateMessage } from '../utils/errorMessages';

// Set the production API URL as default for mobile
const baseURL = 'https://api.aisep.tech';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject JWT token from AsyncStorage
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('aisep_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handles message translation and automatic token refresh
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && data.message) {
      data.message = translateMessage(data.message);
    }
    return data;
  },
  async (error) => {
    const originalRequest = error.config;
    const responseData = error.response?.data;

    if (responseData?.message) {
      responseData.message = translateMessage(responseData.message);
    }

    // Handle 401 Unauthorized — attempt to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = await AsyncStorage.getItem('aisep_refresh_token');

      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(`${baseURL}/api/Auth/refresh-token`, {
            refreshToken: refreshToken
          }, {
             headers: { 'Content-Type': 'application/json' }
          });

          const apiResponse = refreshResponse.data;
          const tokenData = apiResponse?.data;

          if (apiResponse?.success && tokenData?.accessToken) {
            await AsyncStorage.setItem('aisep_token', tokenData.accessToken);
            await AsyncStorage.setItem('aisep_refresh_token', tokenData.refreshToken);

            originalRequest.headers.Authorization = `Bearer ${tokenData.accessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }

      // If no refresh token or refresh failed, clear session
      await AsyncStorage.removeItem('aisep_token');
      await AsyncStorage.removeItem('aisep_refresh_token');
      await AsyncStorage.removeItem('aisep_user');
      
      // In mobile, we'll use a listener or state to handle navigation to login
      // we can use a custom event or a context-based logout
    }

    const normalizedError = {
      message: responseData?.message
        ? responseData.message
        : error.message?.includes('Network Error') || error.code === 'ERR_NETWORK'
          ? 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.'
          : translateMessage(error.message || 'Đã xảy ra lỗi không xác định.'),
      errors: responseData?.errors || [],
      statusCode: error.response?.status,
    };

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
