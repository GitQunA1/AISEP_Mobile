export const COLORS = {
  light: {
    background: '#ffffff',
    secondaryBackground: '#f8fafc',
    card: '#ffffff',
    hover: '#eff3f4',
    text: '#0f1419',
    secondaryText: '#64748b',
    primary: '#1d9bf0',
    primaryLight: 'rgba(29, 155, 240, 0.1)',
    border: '#e2e8f0',
    error: '#ef4444',
    success: '#10b981',
    successLight: '#ecfdf5',
    warning: '#f59e0b',
    mutedBackground: '#f1f5f9',
    white: '#ffffff',
    shadow: '#000000',
    // Form specific
    inputBackground: '#f8fafc',
    inputBorder: 'rgba(0,0,0,0.12)',
    inputBorderFocus: '#1d9bf0',
    destructive: '#ef4444',
    // Status colors
    statusApprovedBg: 'rgba(16, 185, 129, 0.15)',
    statusApprovedText: '#059669',
    statusDraftBg: 'rgba(100, 116, 139, 0.15)',
    statusDraftText: '#475569',
    statusPendingBg: 'rgba(245, 158, 11, 0.15)',
    statusPendingText: '#d97706',
    statusRejectedBg: 'rgba(239, 68, 68, 0.15)',
    statusRejectedText: '#dc2626',
    // Profile specific
    profileGradient: ['#1a6fd4', '#0ea5e9'],
    divider: '#e2e8f0',
    // Accent colors for categories
    accentCyan: '#0ea5e9',
    accentPurple: '#8b5cf6',
    accentOrange: '#f59e0b',
    accentGreen: '#10b981',
  },
  dark: {
    background: '#000000',
    secondaryBackground: '#15181c',
    card: '#000000',
    hover: '#181818',
    text: '#eff3f4',
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
    // Form specific
    inputBackground: '#000000',
    inputBorder: '#333639',
    inputBorderFocus: '#1d9bf0',
    destructive: '#f4212e',
    // Status colors
    statusApprovedBg: 'rgba(0, 186, 124, 0.15)',
    statusApprovedText: '#00ba7c',
    statusDraftBg: 'rgba(113, 118, 123, 0.15)',
    statusDraftText: '#71767b',
    statusPendingBg: 'rgba(255, 212, 0, 0.15)',
    statusPendingText: '#ffd400',
    statusRejectedBg: 'rgba(244, 33, 46, 0.15)',
    statusRejectedText: '#f4212e',
    // Profile specific
    profileGradient: ['#000000', '#1d9bf0'],
    divider: '#2f3336',
    // Accent colors for categories
    accentCyan: '#0ea5e9',
    accentPurple: '#a78bfa',
    accentOrange: '#fbbf24',
    accentGreen: '#34d399',
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
  colors: COLORS.dark,
  isDark: true,
  spacing: SPACING,
  radius: RADIUS,
  shadows: SHADOWS,
};

export default THEME;
