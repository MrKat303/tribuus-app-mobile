import { type PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/BrandMark';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/theme/AppearanceProvider';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

export function AuthScaffold({ children, eyebrow, subtitle, title }: PropsWithChildren<{
  eyebrow: string;
  subtitle: string;
  title: string;
}>) {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BrandMark />
          <View style={styles.header}>
            <AppText style={styles.eyebrow} variant="eyebrow">{eyebrow}</AppText>
            <AppText style={styles.title} variant="heading">{title}</AppText>
            <AppText style={styles.subtitle}>{subtitle}</AppText>
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthField({ label, ...props }: TextInputProps & { label: string }) {
  const colors = useThemeColors();
  const styles = useStyles();
  return (
    <View style={styles.field}>
      <AppText style={styles.label} variant="caption">{label}</AppText>
      <TextInput
        autoCorrect={false}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primaryDark}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function AuthSubmitButton({ disabled, label, onPress }: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.submit, disabled && styles.disabled, pressed && styles.pressed]}>
      <AppText style={styles.submitLabel} variant="bodyStrong">{label}</AppText>
    </Pressable>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  flex: { flex: 1 },
  content: { alignSelf: 'center', flexGrow: 1, maxWidth: 540, padding: spacing.xl, width: '100%' },
  header: { gap: spacing.sm, marginBottom: spacing.xl, marginTop: 52 },
  eyebrow: { color: colors.primaryDark },
  title: { fontSize: 36, letterSpacing: -1.2, lineHeight: 41 },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  field: { gap: 7, marginBottom: spacing.lg },
  label: { color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 12 },
  input: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderCurve: 'continuous',
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    fontFamily: typography.body,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  submit: {
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderCurve: 'continuous',
    borderRadius: radii.sm,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: spacing.lg,
  },
  submitLabel: { color: colors.textOnPrimary },
  disabled: { opacity: 0.46 },
  pressed: { opacity: Platform.OS === 'ios' ? 0.72 : 0.86, transform: [{ scale: 0.985 }] },
}));
