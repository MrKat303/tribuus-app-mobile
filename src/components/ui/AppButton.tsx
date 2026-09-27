import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useThemeColors } from '@/context/AppearanceContext';
import { radii, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { AppIcon } from './AppIcon';

type AppButtonProps = ComponentProps<typeof Pressable> & {
  label: string;
  icon?: ComponentProps<typeof AppIcon>['name'];
  variant?: 'primary' | 'secondary';
};

export function AppButton({ icon, label, style, variant = 'primary', ...props }: AppButtonProps) {
  const themeColors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={{ color: themeColors.primarySoft }}
      style={(state) => [
        styles.base,
        { backgroundColor: themeColors.primaryDark, shadowColor: themeColors.primaryDark },
        variant === 'secondary' && styles.secondary,
        variant === 'secondary' && { backgroundColor: themeColors.surface, borderColor: themeColors.border },
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      <View style={styles.content}>
        <AppText
          style={[variant === 'secondary' ? styles.secondaryLabel : styles.primaryLabel, { color: variant === 'secondary' ? themeColors.text : themeColors.textOnPrimary }]}
          variant="bodyStrong">
          {label}
        </AppText>
        {icon ? (
          <AppIcon color={variant === 'secondary' ? themeColors.text : themeColors.textOnPrimary} name={icon} size={16} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.pill,
    elevation: 1,
    minHeight: 46,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: spacing.xl,
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 7,
  },
  content: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  primaryLabel: {},
  secondary: { borderWidth: StyleSheet.hairlineWidth, shadowOpacity: 0.06 },
  secondaryLabel: {},
});
