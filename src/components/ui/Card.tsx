import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemeColors } from '@/context/AppearanceContext';
import { spacing } from '@/theme/tokens';

export function Card({ style, ...props }: ComponentProps<typeof View>) {
  const colors = useThemeColors();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 1,
    padding: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.045,
    shadowRadius: 9,
  },
});
