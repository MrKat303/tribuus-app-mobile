import type { ComponentProps } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useThemeColors } from '@/theme/AppearanceProvider';
import { typography } from '@/theme/tokens';

type TextVariant = 'body' | 'bodyStrong' | 'caption' | 'eyebrow' | 'heading' | 'hero';

type AppTextProps = ComponentProps<typeof Text> & {
  variant?: TextVariant;
};

export function AppText({ style, variant = 'body', ...props }: AppTextProps) {
  const themeColors = useThemeColors();
  return <Text style={[styles.base, { color: themeColors.text }, styles[variant], variant === 'caption' && { color: themeColors.textMuted }, variant === 'eyebrow' && { color: themeColors.primaryDark }, style]} {...props} />;
}

const styles = StyleSheet.create({
  base: {
    fontFamily: typography.body,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {},
  bodyStrong: {
    fontFamily: typography.bodySemiBold,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
  },
  eyebrow: {
    fontFamily: typography.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  heading: {
    fontFamily: typography.title,
    fontSize: 29,
    letterSpacing: -0.7,
    lineHeight: 34,
  },
  hero: {
    fontFamily: typography.title,
    fontSize: 42,
    letterSpacing: -1.2,
    lineHeight: 46,
  },
});
