import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/context/AppearanceContext';
import { useCommunityWallet } from '@/context/CommunityWalletContext';
import { buildStellarDonationUri, fetchXlmClpRate, isStellarConfigured, stellarConfig } from '@/services/stellar';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, typography } from '@/theme/tokens';

const quickAmounts = [5000, 10000, 25000, 50000];
const formatClp = (value: number) => new Intl.NumberFormat('es-CL', { currency: 'CLP', maximumFractionDigits: 0, style: 'currency' }).format(value);

export function CommunityWalletDonateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ initiativeId?: string }>();
  const { colors } = useAppAppearance();
  const styles = useStyles();
  const { initiatives } = useCommunityWallet();
  const initiative = useMemo(() => initiatives.find((item) => item.id === params.initiativeId), [initiatives, params.initiativeId]);
  const configured = isStellarConfigured();
  const [amount, setAmount] = useState('10000');
  const [anonymous, setAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const numericAmount = Number(amount.replace(/\D/g, ''));
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0;

  const openWallet = async () => {
    if (!configured || !validAmount || submitting) return;
    setSubmitting(true);
    try {
      const xlmClpRate = await fetchXlmClpRate();
      const uri = buildStellarDonationUri({ amountClp: numericAmount, anonymous, initiativeId: initiative?.id, xlmClpRate });
      await Linking.openURL(uri);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    } catch {
      Alert.alert('No encontramos una wallet compatible', 'Instala una wallet que admita solicitudes SEP-7 o copia la dirección comunitaria para hacer el pago manualmente.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyAccount = async () => {
    if (!configured) return;
    await Clipboard.setStringAsync(stellarConfig.accountId);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    Alert.alert('Dirección copiada', 'Verifica que coincida al pegarla en tu wallet.');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable accessibilityLabel="Cancelar donación" hitSlop={8} onPress={() => router.back()} style={styles.headerButton}>
              <AppIcon color={colors.text} name="x" size={22} />
            </Pressable>
            <AppText style={styles.headerTitle} variant="bodyStrong">Donar con Stellar</AppText>
            <View style={styles.headerButton} />
          </View>

          <View style={styles.destination}>
            <View style={styles.destinationIcon}><AppIcon color={colors.primaryDark} name={initiative ? 'target' : 'users'} size={20} /></View>
            <View style={styles.destinationCopy}>
              <AppText style={styles.destinationKicker} variant="caption">DESTINO</AppText>
              <AppText variant="bodyStrong">{initiative?.title ?? 'Fondo general de Providencia'}</AppText>
              <AppText style={styles.destinationMeta} variant="caption">Pago procesado en {stellarConfig.network === 'public' ? 'Stellar Mainnet' : 'Stellar Testnet'}</AppText>
            </View>
            <AppIcon color={colors.primaryDark} name="check-circle" size={20} />
          </View>

          {!configured ? (
            <View style={styles.setupCard}>
              <AppIcon color={colors.warning} name="alert-circle" size={20} />
              <View style={styles.setupCopy}><AppText variant="bodyStrong">Cuenta Stellar pendiente</AppText><AppText style={styles.setupText} variant="caption">Agrega `EXPO_PUBLIC_STELLAR_COMMUNITY_ACCOUNT` para habilitar donaciones reales. El formulario queda disponible como vista previa.</AppText></View>
            </View>
          ) : null}

          <View style={styles.amountSection}>
            <AppText style={styles.fieldLabel} variant="caption">MONTO A DONAR</AppText>
            <View style={styles.amountField}>
              <TextInput
                accessibilityLabel="Monto en pesos chilenos"
                keyboardType="number-pad"
                maxLength={12}
                onChangeText={(value) => setAmount(value.replace(/\D/g, ''))}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.primaryDark}
                style={styles.amountInput}
                value={amount}
              />
              <AppText style={styles.currency} variant="heading">CLP</AppText>
            </View>
            {!validAmount && amount.length > 0 ? <AppText style={styles.errorText} variant="caption">Ingresa un monto mayor que cero.</AppText> : null}
            <View style={styles.quickAmounts}>
              {quickAmounts.map((value) => {
                const selected = numericAmount === value;
                return (
                  <Pressable accessibilityState={{ selected }} key={value} onPress={() => { setAmount(String(value)); void Haptics.selectionAsync().catch(() => undefined); }} style={[styles.quickAmount, selected && styles.quickAmountSelected]}>
                    <AppText style={[styles.quickAmountText, selected && styles.quickAmountTextSelected]} variant="caption">{formatClp(value)}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.privacyRow}>
            <View style={styles.privacyIcon}><AppIcon color={colors.primaryDark} name="eye-off" size={18} /></View>
            <View style={styles.privacyCopy}>
              <AppText variant="bodyStrong">Mostrar como anónima en Tribus</AppText>
              <AppText style={styles.privacyText} variant="caption">Tu nombre no aparecerá en la comunidad. La dirección y el pago seguirán públicos en Stellar.</AppText>
            </View>
            <Switch accessibilityLabel="Mostrar donación como anónima" onValueChange={setAnonymous} thumbColor={colors.surface} trackColor={{ false: colors.surfaceMuted, true: colors.primary }} value={anonymous} />
          </View>

          <View style={styles.securityNote}>
            <AppIcon color={colors.textMuted} name="lock" size={16} />
            <AppText style={styles.securityText} variant="caption">Tribus no pide ni almacena tu clave privada. Tu wallet revisa, firma y envía la transacción.</AppText>
          </View>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              disabled={!configured || !validAmount || submitting}
              onPress={() => void openWallet()}
              style={({ pressed }) => [styles.submitButton, (!configured || !validAmount || submitting) && styles.submitDisabled, pressed && styles.pressed]}>
              <AppText style={styles.submitText} variant="bodyStrong">{submitting ? 'Calculando conversión…' : 'Continuar en Stellar'}</AppText>
              <AppIcon color={colors.textOnPrimary} name="external-link" size={17} />
            </Pressable>
            {configured ? (
              <Pressable accessibilityRole="button" onPress={() => void copyAccount()} style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}>
                <AppIcon color={colors.textMuted} name="copy" size={15} />
                <AppText style={styles.copyText} variant="caption">Copiar dirección Stellar</AppText>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) => StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  flex: { flex: 1 },
  content: { alignSelf: 'center', flexGrow: 1, maxWidth: 620, paddingBottom: 24, paddingHorizontal: 18, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 52 },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  headerTitle: { fontSize: 16 },
  destination: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.md, flexDirection: 'row', marginTop: 12, minHeight: 82, padding: 14 },
  destinationIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.pill, height: 44, justifyContent: 'center', width: 44 },
  destinationCopy: { flex: 1, marginLeft: 11 },
  destinationKicker: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.7 },
  destinationMeta: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  setupCard: { alignItems: 'flex-start', backgroundColor: colors.warmSoft, borderCurve: 'continuous', borderRadius: radii.sm, flexDirection: 'row', gap: 10, marginTop: 12, padding: 13 },
  setupCopy: { flex: 1 },
  setupText: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  amountSection: { marginTop: 31 },
  fieldLabel: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 9, letterSpacing: 0.7 },
  amountField: { alignItems: 'baseline', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'center', marginTop: 13, paddingBottom: 12 },
  amountInput: { color: colors.text, fontFamily: typography.title, fontSize: 53, fontVariant: ['tabular-nums'], lineHeight: 62, maxWidth: '72%', minWidth: 80, padding: 0, textAlign: 'center' },
  currency: { color: colors.textMuted, fontSize: 20, marginLeft: 8 },
  errorText: { color: colors.danger, fontSize: 10, marginTop: 7, textAlign: 'center' },
  quickAmounts: { flexDirection: 'row', gap: 7, marginTop: 14 },
  quickAmount: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderColor: 'transparent', borderCurve: 'continuous', borderRadius: 10, borderWidth: 1, flex: 1, minHeight: 40, justifyContent: 'center' },
  quickAmountSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDark },
  quickAmountText: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 10 },
  quickAmountTextSelected: { color: colors.primaryDark, fontFamily: typography.bodySemiBold },
  privacyRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginTop: 31, paddingVertical: 16 },
  privacyIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.sm, height: 40, justifyContent: 'center', width: 40 },
  privacyCopy: { flex: 1, marginHorizontal: 11 },
  privacyText: { color: colors.textMuted, fontSize: 10, lineHeight: 14, marginTop: 2 },
  securityNote: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, marginTop: 16, paddingHorizontal: 4 },
  securityText: { color: colors.textMuted, flex: 1, fontSize: 10, lineHeight: 15 },
  footer: { gap: 7, marginTop: 'auto', paddingTop: 32 },
  submitButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderCurve: 'continuous', borderRadius: 14, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 54 },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: colors.textOnPrimary },
  copyButton: { alignItems: 'center', flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 44 },
  copyText: { color: colors.textMuted, fontFamily: typography.bodyMedium },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
}));
