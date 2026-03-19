import axios from 'axios';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translateMessage } from '../utils/errorMessages';
import { eventEmitter } from '../utils/eventEmitter';

// Set the production API URL as default for mobile
const baseURL = 'https://api.aisep.tech';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Singleton to avoid parallel refreshes
let refreshPromise = null;
let isAlertVisible = false;

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
      console.log('[ApiClient] 401 detected on: ' + originalRequest.url);
      
      const refreshToken = await AsyncStorage.getItem('aisep_refresh_token');

      if (refreshToken) {
        try {
          if (!refreshPromise) {
            console.log('[ApiClient] Attempting token refresh...');
            refreshPromise = axios.post(`${baseURL}/api/Auth/refresh-token`, {
              refreshToken: refreshToken
            }, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 10000
            }).finally(() => {
              refreshPromise = null;
            });
          }

          const refreshResponse = await refreshPromise;
          const apiResponse = refreshResponse.data;
          const tokenData = apiResponse?.data;

          if (apiResponse?.success && tokenData?.accessToken) {
            console.log('[ApiClient] Refresh success. Retrying...');
            await AsyncStorage.setItem('aisep_token', tokenData.accessToken);
            await AsyncStorage.setItem('aisep_refresh_token', tokenData.refreshToken);

            originalRequest.headers.Authorization = `Bearer ${tokenData.accessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          console.error('[ApiClient] Refresh failed', refreshError);
        }
      }

      // If we reach here, either no refresh token or refresh failed
      console.log('[ApiClient] Session expired. Clearing data...');
      await AsyncStorage.removeItem('aisep_token');
      await AsyncStorage.removeItem('aisep_refresh_token');
      await AsyncStorage.removeItem('aisep_user');
      
      // Emit event so AuthContext can update user state internally
      eventEmitter.emit('session_expired');

      // Show native alert and redirect only if not already showing
      if (!isAlertVisible) {
        isAlertVisible = true;
        Alert.alert(
          'Phiên làm việc hết hạn',
          'Phiên làm việc của bạn đã kết thúc. Vui lòng đăng nhập lại để tiếp tục.',
          [
            { 
              text: 'Đăng nhập lại', 
              onPress: () => {
                isAlertVisible = false;
                router.replace('/(auth)/login');
              } 
            },
            {
              text: 'Về trang chủ',
              style: 'cancel',
              onPress: () => {
                isAlertVisible = false;
                router.replace('/(tabs)');
              }
            }
          ],
          { cancelable: false }
        );
      }
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
