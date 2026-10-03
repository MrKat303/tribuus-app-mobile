import Feather from '@/components/ui/AppIcon';
import type { ComponentProps, PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/theme/AppearanceProvider';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, typography } from '@/theme/tokens';

type IconName = ComponentProps<typeof Feather>['name'];

export function SettingsDetailLayout({ children, onBack, subtitle, title }: PropsWithChildren<{ onBack: () => void; subtitle: string; title: string }>) {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Pressable accessibilityLabel="Volver" hitSlop={8} onPress={onBack} style={styles.back}><Feather color={colors.text} name="chevron-left" size={24} /></Pressable>
        <AppText style={styles.headerTitle} variant="bodyStrong">{title}</AppText><View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AppText style={styles.intro}>{subtitle}</AppText>{children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function SettingsCard({ children, footer, label }: PropsWithChildren<{ footer?: string; label: string }>) {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  return <View><AppText style={styles.label} variant="caption">{label}</AppText><View style={[styles.card, { backgroundColor: colors.surface }]}>{children}</View>{footer ? <AppText style={styles.footer} variant="caption">{footer}</AppText> : null}</View>;
}

export function SettingsDivider() {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

export function SettingsToggle({ description, icon, label, onChange, value }: { description?: string; icon: IconName; label: string; onChange: (value: boolean) => void; value: boolean }) {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  return <View style={styles.row}><RowIcon icon={icon} /><View style={styles.rowCopy}><AppText style={styles.rowTitle}>{label}</AppText>{description ? <AppText style={styles.rowDescription} variant="caption">{description}</AppText> : null}</View><Switch accessibilityLabel={label} onValueChange={onChange} style={styles.switch} trackColor={{ false: colors.surfaceMuted, true: colors.primary }} thumbColor={colors.surface} value={value} /></View>;
}

export function SettingsAction({ danger = false, description, icon, label, onPress, value }: { danger?: boolean; description?: string; icon: IconName; label: string; onPress: () => void; value?: string }) {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}><RowIcon danger={danger} icon={icon} /><View style={styles.rowCopy}><AppText style={[styles.rowTitle, danger && styles.danger]}>{label}</AppText>{description ? <AppText style={styles.rowDescription} variant="caption">{description}</AppText> : null}</View>{value ? <AppText style={styles.value} variant="caption">{value}</AppText> : null}<Feather color={colors.textMuted} name="chevron-right" size={17} /></Pressable>;
}

export function SettingsField({ label, maxLength, multiline = false, onChange, placeholder, secure = false, value }: { label: string; maxLength?: number; multiline?: boolean; onChange: (value: string) => void; placeholder?: string; secure?: boolean; value: string }) {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  return <View style={styles.field}><View style={styles.fieldHeader}><AppText style={styles.fieldLabel} variant="caption">{label}</AppText>{maxLength ? <AppText style={styles.characterCount} variant="caption">{value.length}/{maxLength}</AppText> : null}</View><TextInput accessibilityLabel={label} autoCapitalize="sentences" maxLength={maxLength} multiline={multiline} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textMuted} secureTextEntry={secure} style={[styles.input, { backgroundColor: colors.surfaceMuted, color: colors.text }, multiline && styles.inputMultiline]} value={value} /></View>;
}

export function SettingsChoice({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: string[]; value: string }) {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  return <View style={styles.choiceBlock}><AppText style={styles.choiceLabel}>{label}</AppText><View style={styles.choices}>{options.map((option) => { const selected = value === option; return <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={option} onPress={() => onChange(option)} style={[styles.choice, { backgroundColor: colors.surfaceMuted }, selected && { backgroundColor: colors.primaryDark }]}><AppText style={[styles.choiceText, selected && { color: colors.background }]} variant="caption">{option}</AppText></Pressable>; })}</View></View>;
}

export function SettingsButton({ danger = false, label, onPress }: { danger?: boolean; label: string; onPress: () => void }) {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: danger ? colors.danger : colors.primaryDark }, pressed && styles.pressed]}><AppText style={[styles.buttonText, { color: danger ? colors.textOnDark : colors.textOnPrimary }]} variant="bodyStrong">{label}</AppText></Pressable>;
}

function RowIcon({ danger = false, icon }: { danger?: boolean; icon: IconName }) {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  return <View style={[styles.icon, { backgroundColor: danger ? colors.dangerSoft : colors.surfaceMuted }]}><Feather color={danger ? colors.danger : colors.textMuted} name={icon} size={17} /></View>;
}

const useStyles = makeThemedStyles((colors) => ({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', backgroundColor: colors.surface, flexDirection: 'row', paddingHorizontal: 12 },
  back: { alignItems: 'center', height: 48, justifyContent: 'center', width: 44 }, headerTitle: { flex: 1, fontSize: 16, textAlign: 'center' },
  content: { alignSelf: 'center', maxWidth: 720, paddingBottom: 40, paddingHorizontal: 16, width: '100%' }, intro: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginHorizontal: 4, marginTop: 16 },
  label: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 10.5, letterSpacing: 0.35, marginBottom: 6, marginLeft: 12, marginTop: 22 },
  card: { backgroundColor: colors.surface, borderRadius: 13, overflow: 'hidden' },
  footer: { color: colors.textMuted, fontSize: 10, lineHeight: 14, marginHorizontal: 12, marginTop: 6 },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 58, paddingHorizontal: 13, paddingVertical: 8 }, rowCopy: { flex: 1 }, rowTitle: { fontSize: 14, lineHeight: 18 }, rowDescription: { color: colors.textMuted, fontSize: 10, lineHeight: 13, marginTop: 2 },
  icon: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 8, height: 30, justifyContent: 'center', marginRight: 10, width: 30 }, iconDanger: { backgroundColor: colors.dangerSoft }, danger: { color: colors.danger }, value: { color: colors.textMuted, fontSize: 10.5, marginRight: 5, maxWidth: 110 },
  divider: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth, marginLeft: 53, opacity: 0.62 }, switch: { transform: [{ scale: 0.8 }] },
  field: { paddingHorizontal: 13, paddingVertical: 10 }, fieldHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }, fieldLabel: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 10 }, characterCount: { color: colors.textMuted, fontSize: 10 }, input: { backgroundColor: colors.surfaceMuted, borderRadius: 9, color: colors.text, fontFamily: typography.body, fontSize: 13, minHeight: 42, paddingHorizontal: 11, paddingVertical: 9 }, inputMultiline: { minHeight: 92, textAlignVertical: 'top' },
  choiceBlock: { padding: 13 }, choiceLabel: { fontSize: 13, marginBottom: 9 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, choice: { backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, minHeight: 34, paddingHorizontal: 12, paddingVertical: 8 }, choiceSelected: { backgroundColor: colors.primaryDark }, choiceText: { color: colors.textMuted, fontSize: 10.5 }, choiceTextSelected: { color: colors.background, fontFamily: typography.bodySemiBold },
  button: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 12, justifyContent: 'center', marginTop: 22, minHeight: 48, paddingHorizontal: 16 }, buttonDanger: { backgroundColor: colors.danger }, buttonText: { color: colors.background, fontSize: 14 }, pressed: { opacity: 0.62 },
}));
