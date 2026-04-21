export const COLORS = {
  light: {
    background: '#ffffff',
    secondaryBackground: '#f7f9fa',
    card: '#ffffff',
    hover: '#eff3f4',
    text: '#0f1419',
    secondaryText: '#536471',
    primary: '#1d9bf0',
    primaryLight: 'rgba(29, 155, 240, 0.1)',
    border: '#cfd9de',
    error: '#e74c3c',
    success: '#17bf63',
    successLight: '#ecfdf5',
    warning: '#ffad1f',
    mutedBackground: '#f7f9fa',
    white: '#ffffff',
    shadow: '#000000',
    // Status colors
    statusApprovedBg: 'rgba(23, 191, 99, 0.15)',
    statusApprovedText: '#17bf63',
    statusDraftBg: 'rgba(83, 100, 113, 0.15)',
    statusDraftText: '#536471',
    statusPendingBg: 'rgba(255, 173, 31, 0.15)',
    statusPendingText: '#ffad1f',
    statusRejectedBg: 'rgba(231, 76, 60, 0.15)',
    statusRejectedText: '#e74c3c',
    // Accent colors for categories
    accentCyan: '#1d9bf0',
    accentPurple: '#7c3aed',
    accentOrange: '#ffad1f',
    accentGreen: '#17bf63',
    // Input colors
    inputBackground: '#f7f9fa',
    inputBorder: '#cfd9de',
    inputBorderFocus: '#1d9bf0',
  },
  dark: {
    background: '#000000',
    secondaryBackground: '#16181c',
    card: '#000000',
    hover: '#181818',
    text: '#e7e9ea',
    secondaryText: '#71767b',
    primary: '#1d9bf0',
    primaryLight: 'rgba(29, 155, 240, 0.15)',
    border: '#2f3336',
    error: '#f4212e',
    success: '#00ba7c',
    successLight: 'rgba(0, 186, 124, 0.1)',
    warning: '#ffd400',
    mutedBackground: '#16181c',
    white: '#ffffff',
    shadow: '#ffffff',
    // Status colors
    statusApprovedBg: 'rgba(0, 186, 124, 0.15)',
    statusApprovedText: '#00ba7c',
    statusDraftBg: 'rgba(113, 118, 123, 0.15)',
    statusDraftText: '#71767b',
    statusPendingBg: 'rgba(255, 212, 0, 0.15)',
    statusPendingText: '#ffd400',
    statusRejectedBg: 'rgba(244, 33, 46, 0.15)',
    statusRejectedText: '#f4212e',
    // Accent colors for categories
    accentCyan: '#1d9bf0',
    accentPurple: '#a78bfa',
    accentOrange: '#fbbf24',
    accentGreen: '#34d399',
    // Input colors
    inputBackground: '#1a1a1a',
    inputBorder: '#333639',
    inputBorderFocus: '#1d9bf0',
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
  lg: 24, // High-fidelity roundness for mobile cards
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
  isDark: false,
  spacing: SPACING,
  radius: RADIUS,
  shadows: SHADOWS,
};

export default THEME;
