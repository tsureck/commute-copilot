export const colors = {
  // Backgrounds - Modern Gray
  background: '#121212',
  backgroundGradientStart: '#121212',
  backgroundGradientEnd: '#1E1E1E',
  
  // Surfaces
  surface: 'rgba(255, 255, 255, 0.05)',
  surfaceHover: 'rgba(255, 255, 255, 0.08)',
  surfaceActive: 'rgba(255, 255, 255, 0.12)',
  surfaceElevated: '#1E1E1E',
  
  // Glass effect
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBackground: 'rgba(255, 255, 255, 0.04)',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.45)',
  
  // Accent - Subtle blue-gray
  accent: '#6B7AED',
  accentLight: '#8B97F0',
  accentDark: '#5563D6',
  
  // Status
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  
  // Confidence
  confidenceHigh: '#4ADE80',
  confidenceMedium: '#FBBF24',
  confidenceLow: '#F87171',
  
  // Severity
  severityHigh: '#F87171',
  severityMedium: '#FBBF24',
  severityLow: '#4ADE80',
  
  // Icons
  iconWeather: '#60A5FA',
  iconTrain: '#4ADE80',
  iconTransport: '#4ADE80',
  iconCalendar: '#A78BFA',
  iconTraffic: '#FBBF24',
  
  // Microphone
  micActive: '#F87171',
  micInactive: 'rgba(255, 255, 255, 0.1)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 24,
  full: 9999,
};

export const typography = {
  // Font sizes
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  
  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const animations = {
  fast: 150,
  normal: 300,
  slow: 500,
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  animations,
};

export type Theme = typeof theme;
export default theme;
