import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import authService from '../services/authService';
import signalRService from '../services/signalRService';
import { eventEmitter } from '../utils/eventEmitter';
import SessionExpiredModal from '../components/auth/SessionExpiredModal';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  useEffect(() => {
    // Load user from AsyncStorage on mount
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('aisep_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // Role check on initialization for security
          const roleStr = typeof parsedUser.role === 'string' ? parsedUser.role.toLowerCase() : (parsedUser.role === 0 ? 'startup' : '');
          if (roleStr !== 'startup') {
            console.log('[AuthContext] Non-startup user detected on init, clearing session');
            await AsyncStorage.multiRemove(['aisep_user', 'aisep_token', 'aisep_refresh_token']);
            setUser(null);
          } else {
            setUser(parsedUser);
            const token = await AsyncStorage.getItem('aisep_token');
            if (token) {
              signalRService.initialize(token);
            }
          }
        }
      } catch (e) {
        console.error('[AuthContext] Failed to load user', e);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Listen for global session_expired events
    const unsubscribe = eventEmitter.on('session_expired', () => {
      console.log('[AuthContext] session_expired event received, clearing user state');
      setUser(null);
      setIsSessionExpired(false); // Reset this since we now use native Alert in apiClient
      signalRService.disconnect();
    });

    return () => {
      console.log('[AuthContext] Unsubscribing session_expired listener');
      unsubscribe();
    };
  }, []);

  const login = async (userData, accessToken, refreshToken) => {
    await AsyncStorage.setItem('aisep_user', JSON.stringify(userData));
    await AsyncStorage.setItem('aisep_token', accessToken);
    await AsyncStorage.setItem('aisep_refresh_token', refreshToken);
    setUser(userData);
    setIsSessionExpired(false);
    signalRService.initialize(accessToken);
  };

  const logout = async () => {
    try {
      const api = require('../services/apiClient').default;
      api.isManualLogout = true;
      await authService.logout();
    } catch (e) {
      console.error('[AuthContext] Logout error', e);
    } finally {
      await AsyncStorage.removeItem('aisep_user');
      await AsyncStorage.removeItem('aisep_token');
      await AsyncStorage.removeItem('aisep_refresh_token');
      setUser(null);
      setIsSessionExpired(false);
      signalRService.disconnect();
      router.replace('/');
      
      // Reset the flag after a small delay to allow background requests to settle
      setTimeout(() => {
        const api = require('../services/apiClient').default;
        api.isManualLogout = false;
      }, 1000);
    }
  };

  const handleModalLogin = () => {
    console.log('[AuthContext] Modal Login clicked');
    setIsSessionExpired(false);
    router.replace('/(auth)/login');
  };

  const handleModalHome = () => {
    console.log('[AuthContext] Modal Home clicked');
    setIsSessionExpired(false);
    router.replace('/(tabs)');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
      <SessionExpiredModal 
        visible={isSessionExpired} 
        onLogin={handleModalLogin} 
        onHome={handleModalHome} 
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
