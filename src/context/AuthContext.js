import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import authService from '../services/authService';
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
          setUser(JSON.parse(storedUser));
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
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error('[AuthContext] Logout error', e);
    } finally {
      await AsyncStorage.removeItem('aisep_user');
      await AsyncStorage.removeItem('aisep_token');
      await AsyncStorage.removeItem('aisep_refresh_token');
      setUser(null);
      setIsSessionExpired(false);
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
