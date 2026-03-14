import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from AsyncStorage on mount
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('aisep_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to load user', e);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (userData, accessToken, refreshToken) => {
    await AsyncStorage.setItem('aisep_user', JSON.stringify(userData));
    await AsyncStorage.setItem('aisep_token', accessToken);
    await AsyncStorage.setItem('aisep_refresh_token', refreshToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      await AsyncStorage.removeItem('aisep_user');
      await AsyncStorage.removeItem('aisep_token');
      await AsyncStorage.removeItem('aisep_refresh_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
