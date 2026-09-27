import type { Theme } from 'expo-router';

import type { ThemeColors } from './tokens';

export function createTribuusNavigationTheme(colors: ThemeColors, dark: boolean): Theme {
  return {
  dark,
  colors: {
    primary: colors.primaryDark,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
  fonts: {
    regular: { fontFamily: 'DMSans_400Regular', fontWeight: '400' },
    medium: { fontFamily: 'DMSans_500Medium', fontWeight: '500' },
    bold: { fontFamily: 'DMSans_600SemiBold', fontWeight: '600' },
    heavy: { fontFamily: 'DMSans_700Bold', fontWeight: '700' },
  },
  };
}
