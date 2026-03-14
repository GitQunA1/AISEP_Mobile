export const COLORS = {
  light: {
    background: '#ffffff',
    secondaryBackground: '#f7f9fa',
    hover: '#eff3f4',
    text: '#0f1419',
    secondaryText: '#536471',
    primary: '#1d9bf0',
    border: '#cfd9de',
    error: '#e74c3c',
    success: '#17bf63',
    warning: '#ffad1f',
    overlay: 'rgba(255, 255, 255, 0.95)',
    white: '#ffffff',
  },
  dark: {
    background: '#000000',
    secondaryBackground: '#16181c',
    hover: '#181818',
    text: '#e7e9ea',
    secondaryText: '#71767b',
    primary: '#1d9bf0',
    border: '#2f3336',
    error: '#e74c3c',
    success: '#17bf63',
    warning: '#ffad1f',
    overlay: 'rgba(0, 0, 0, 0.9)',
    white: '#000000',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 6,
  md: 8,
  lg: 16,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
};

export const THEME = {
  colors: COLORS.light,
  spacing: SPACING,
  radius: RADIUS,
  shadows: SHADOWS,
};

export default THEME;
