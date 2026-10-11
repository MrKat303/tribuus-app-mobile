import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useCommunityWallet } from '@/features/community-wallet/application/CommunityWalletProvider';
import { formatClp } from '@/features/community-wallet/components/CommunityFundEntryRow';
import type { CommunityFundEntryType } from '@/features/community-wallet/model/communityWallet';
import { useAppAppearance } from '@/theme/AppearanceProvider';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, typography } from '@/theme/tokens';

const entryTypes: { icon: 'arrow-down-left' | 'arrow-up-right'; label: string; value: CommunityFundEntryType }[] = [
  { icon: 'arrow-down-left', label: 'Donación', value: 'donation' },
  { icon: 'arrow-up-right', label: 'Gasto', value: 'expense' },
];

export function AddCommunityFundEntryScreen() {
  const router = useRouter();
  const { colors } = useAppAppearance();
  const { addFundEntry, role } = useCommunityWallet();
  const styles = useStyles();
  const [type, setType] = useState<CommunityFundEntryType>('donation');
  const [amountText, setAmountText] = useState('');
  const [title, setTitle] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountClp = Number(amountText || 0);
  const canManage = role === 'moderator' || role === 'admin';
  const canSubmit = useMemo(() => (
    canManage
    && Number.isSafeInteger(amountClp)
    && amountClp > 0
    && title.trim().length >= 4
    && !submitting
  ), [amountClp, canManage, submitting, title]);

  const handleAmountChange = (value: string) => {
    setAmountText(value.replace(/\D/g, '').slice(0, 15));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await addFundEntry({
        amountClp,
        counterparty,
        occurredAt: new Date().toISOString(),
        title,
        type,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      Alert.alert('Movimiento registrado', 'La caja comunitaria y su historial ya fueron actualizados.', [
        { text: 'Listo', onPress: () => router.back() },
      ]);
    } catch {
      setError('No pudimos registrar el movimiento. Inténtalo nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Cerrar" hitSlop={8} onPress={() => router.back()} style={styles.headerButton}>
            <AppIcon color={colors.text} name="x" size={23} />
          </Pressable>
          <AppText style={styles.headerTitle} variant="bodyStrong">Registrar movimiento</AppText>
          <View style={styles.headerButton} />
        </View>

        {!canManage ? (
          <View style={styles.restrictedCard}>
            <AppIcon color={colors.textMuted} name="lock" size={25} />
            <AppText style={styles.restrictedTitle} variant="bodyStrong">Acceso restringido</AppText>
            <AppText style={styles.restrictedCopy} variant="caption">Solo moderadores y administradores pueden registrar movimientos de la caja.</AppText>
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.introCard}>
                <AppIcon color={colors.primaryDark} name="file-text" size={20} />
                <AppText style={styles.introCopy} variant="caption">Registra una donación o un gasto que ya ocurrió. Community Wallet muestra el historial, pero no procesa pagos.</AppText>
              </View>

              <AppText style={styles.fieldLabel} variant="eyebrow">Tipo de movimiento</AppText>
              <View style={styles.typeSelector}>
                {entryTypes.map((option) => {
                  const selected = type === option.value;
                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      key={option.value}
                      onPress={() => {
                        setType(option.value);
                        void Haptics.selectionAsync().catch(() => undefined);
                      }}
                      style={({ pressed }) => [styles.typeOption, selected && styles.typeOptionSelected, pressed && styles.pressed]}>
                      <AppIcon color={selected ? colors.textOnPrimary : colors.textMuted} name={option.icon} size={18} />
                      <AppText style={[styles.typeOptionText, selected && styles.typeOptionTextSelected]} variant="bodyStrong">{option.label}</AppText>
                    </Pressable>
                  );
                })}
              </View>

              <AppText style={styles.fieldLabel} variant="eyebrow">Monto en CLP</AppText>
              <TextInput
                accessibilityLabel="Monto en pesos chilenos"
                keyboardType="number-pad"
                maxLength={15}
                onChangeText={handleAmountChange}
                placeholder="Ej.: 25000"
                placeholderTextColor={colors.textMuted}
                style={styles.amountInput}
                value={amountText}
              />
              {amountClp > 0 ? <AppText style={styles.amountPreview} variant="caption">{formatClp(amountClp)}</AppText> : null}

              <AppText style={styles.fieldLabel} variant="eyebrow">Concepto</AppText>
              <TextInput
                accessibilityLabel="Concepto del movimiento"
                maxLength={120}
                onChangeText={setTitle}
                placeholder={type === 'donation' ? 'Ej.: Donación de la feria vecinal' : 'Ej.: Compra de materiales'}
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={title}
              />

              <AppText style={styles.fieldLabel} variant="eyebrow">Persona u organización</AppText>
              <TextInput
                accessibilityLabel="Persona u organización relacionada"
                maxLength={120}
                onChangeText={setCounterparty}
                placeholder="Opcional"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={counterparty}
              />

              {error ? (
                <View style={styles.errorCard}>
                  <AppIcon color={colors.danger} name="alert-circle" size={17} />
                  <AppText style={styles.errorText} variant="caption">{error}</AppText>
                </View>
              ) : null}
            </ScrollView>
            <View style={styles.footer}>
              <Pressable
                accessibilityRole="button"
                disabled={!canSubmit}
                onPress={() => void handleSubmit()}
                style={({ pressed }) => [styles.submitButton, !canSubmit && styles.submitDisabled, pressed && canSubmit && styles.pressed]}>
                <AppText style={styles.submitText} variant="bodyStrong">{submitting ? 'Guardando…' : 'Guardar movimiento'}</AppText>
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) => StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  flex: { flex: 1 },
  header: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 54, paddingHorizontal: 8 },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  headerTitle: { flex: 1, fontSize: 16, textAlign: 'center' },
  content: { paddingBottom: 24, paddingHorizontal: 16 },
  introCard: { alignItems: 'flex-start', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.sm, flexDirection: 'row', gap: 9, marginTop: 16, padding: 13 },
  introCopy: { flex: 1, fontSize: 10.5, lineHeight: 16 },
  fieldLabel: { fontSize: 10, marginBottom: 8, marginTop: 22 },
  typeSelector: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.sm, flexDirection: 'row', gap: 4, padding: 4 },
  typeOption: { alignItems: 'center', borderCurve: 'continuous', borderRadius: 9, flex: 1, flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 44 },
  typeOptionSelected: { backgroundColor: colors.primaryDark },
  typeOptionText: { color: colors.textMuted, fontSize: 12 },
  typeOptionTextSelected: { color: colors.textOnPrimary },
  amountInput: { backgroundColor: colors.input, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 26, fontVariant: ['tabular-nums'], minHeight: 62, paddingHorizontal: 14 },
  amountPreview: { color: colors.primaryDark, fontSize: 11, marginTop: 5, textAlign: 'right' },
  input: { backgroundColor: colors.input, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, color: colors.text, fontFamily: typography.body, fontSize: 14, minHeight: 50, paddingHorizontal: 13 },
  errorCard: { alignItems: 'center', backgroundColor: colors.dangerSoft, borderCurve: 'continuous', borderRadius: radii.sm, flexDirection: 'row', gap: 8, marginTop: 16, padding: 12 },
  errorText: { flex: 1 },
  footer: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, padding: 12 },
  submitButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderCurve: 'continuous', borderRadius: radii.sm, justifyContent: 'center', minHeight: 50 },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: colors.textOnPrimary, fontSize: 14 },
  restrictedCard: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.md, margin: 16, paddingHorizontal: 24, paddingVertical: 32 },
  restrictedTitle: { marginTop: 10 },
  restrictedCopy: { marginTop: 4, maxWidth: 320, textAlign: 'center' },
  pressed: { opacity: 0.65 },
}));
