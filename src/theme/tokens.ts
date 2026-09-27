export const lightColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F7F7FA',
  text: '#1C1C1E',
  textMuted: '#6C6C70',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',
  primary: '#34C759',
  primaryDark: '#217D38',
  primarySoft: '#EAF8ED',
  accent: '#007AFF',
  border: '#E5E5EA',
  input: '#F5F5F7',
  overlay: 'rgba(255,255,255,0.94)',
  shadow: 'rgba(16,36,22,0.16)',
  warm: '#F2E8D8',
  warmSoft: '#FAF6EF',
  warning: '#FF9F0A',
  danger: '#FF3B30',
  dangerSoft: '#FFF0EF',
  successSoft: '#EAF8ED',
} as const;

export const darkColors = {
  background: '#050607',
  surface: '#0D0F11',
  surfaceElevated: '#14171A',
  surfaceMuted: '#181B1F',
  text: '#F3F5F7',
  textMuted: '#A6ADB6',
  textOnPrimary: '#061008',
  textOnDark: '#FFFFFF',
  primary: '#46D36F',
  primaryDark: '#7AEA9A',
  primarySoft: '#102417',
  accent: '#64A8FF',
  border: '#252A30',
  input: '#111418',
  overlay: 'rgba(13,15,17,0.96)',
  shadow: 'rgba(0,0,0,0.44)',
  warm: '#4B3D2A',
  warmSoft: '#261F17',
  warning: '#FFB340',
  danger: '#FF6B61',
  dangerSoft: '#3A1E1E',
  successSoft: '#102417',
} as const;

export type ThemeColors = Record<keyof typeof lightColors, string>;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  hero: 48,
} as const;

export const radii = {
  sm: 12,
  md: 20,
  lg: 28,
  pill: 999,
} as const;

export const typography = {
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
  title: 'DMSans_700Bold',
  titleItalic: 'Newsreader_600SemiBold_Italic',
} as const;
