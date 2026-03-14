import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, THEME } from '../constants/Theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [activeTheme, setActiveTheme] = useState(THEME);

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    updateActiveTheme();
  }, [themeMode, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('user_theme_preference');
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const updateActiveTheme = () => {
    const isDark = themeMode === 'system' 
      ? systemColorScheme === 'dark' 
      : themeMode === 'dark';
    
    const colors = isDark ? COLORS.dark : COLORS.light;
    
    setActiveTheme({
      ...THEME,
      colors,
      isDark,
    });
  };

  const updateThemeMode = async (mode) => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem('user_theme_preference', mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ themeMode, activeTheme, updateThemeMode, isDark: activeTheme.isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
