export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
} as const;

export const lightColors = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  primary: '#2E7D32',
  primaryMuted: '#E8F5E9',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#E0E0E0',
  danger: '#D32F2F',
  dangerMuted: '#FFEBEE',
  warning: '#F57C00',
  success: '#2E7D32',
  tabBar: '#FFFFFF',
  inputBackground: '#F0F0F0',
  overlay: 'rgba(0,0,0,0.5)',
};

export const darkColors = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceElevated: '#252525',
  primary: '#4CAF50',
  primaryMuted: '#1B3A1B',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#707070',
  border: '#333333',
  danger: '#EF5350',
  dangerMuted: '#3A1515',
  warning: '#FFA726',
  success: '#66BB6A',
  tabBar: '#141414',
  inputBackground: '#2A2A2A',
  overlay: 'rgba(0,0,0,0.7)',
};

export type ThemeColors = typeof darkColors;
