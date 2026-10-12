import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useCommunityWallet } from '@/features/community-wallet/application/CommunityWalletProvider';
import { formatClp } from '@/features/community-wallet/components/CommunityFundEntryRow';
import { demoInitiatives } from '@/features/community-wallet/data/community-wallet-demo';
import { useAppAppearance } from '@/theme/AppearanceProvider';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, typography } from '@/theme/tokens';

const suggestedAmounts = [5000, 10000, 25000, 50000];

export function DonationPreviewScreen() {
  const router = useRouter();
  const { colors } = useAppAppearance();
  const { initiatives = [] } = useCommunityWallet();
  const styles = useStyles();
  const availableInitiatives = initiatives.filter((initiative) => initiative.status === 'open');
  const destinations = availableInitiatives.length ? availableInitiatives : demoInitiatives;
  const [amountText, setAmountText] = useState('10000');
  const [initiativeId, setInitiativeId] = useState(destinations[0]?.id ?? 'community-fund');
  const amountClp = Number(amountText || 0);
  const selectedInitiative = destinations.find((initiative) => initiative.id === initiativeId);
  const canContinue = Number.isSafeInteger(amountClp) && amountClp > 0;
  const selectedAmount = suggestedAmounts.includes(amountClp) ? amountClp : null;
  const destinationLabel = selectedInitiative?.title ?? 'Caja general de la comunidad';

  const formattedAmount = useMemo(() => (
    canContinue ? formatClp(amountClp) : '$0'
  ), [amountClp, canContinue]);

  const selectAmount = (amount: number) => {
    setAmountText(String(amount));
    void Haptics.selectionAsync().catch(() => undefined);
  };

  const handleCustomAmount = (value: string) => {
    setAmountText(value.replace(/\D/g, '').slice(0, 9));
  };

  const handlePreview = () => {
    if (!canContinue) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    Alert.alert(
      'Vista previa',
      `Así se vería una donación de ${formattedAmount} para “${destinationLabel}”. No se realizará ningún cobro ni se registrará el movimiento.`,
      [{ text: 'Entendido' }],
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Cerrar" hitSlop={8} onPress={() => router.back()} style={styles.headerButton}>
            <AppIcon color={colors.text} name="x" size={23} />
          </Pressable>
          <AppText style={styles.headerTitle} variant="bodyStrong">Donar</AppText>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.demoNotice}>
            <View style={styles.previewIcon}><AppIcon color={colors.primaryDark} name="eye" size={18} /></View>
            <View style={styles.demoCopy}>
              <AppText variant="bodyStrong">Vista previa de donación</AppText>
              <AppText style={styles.demoText} variant="caption">Explora cómo se vería el flujo. No se realizará ningún cobro.</AppText>
            </View>
          </View>

          <View style={styles.amountHero}>
            <AppText style={styles.amountLabel} variant="eyebrow">Tu aporte</AppText>
            <AppText adjustsFontSizeToFit numberOfLines={1} style={styles.amountValue} variant="hero">{formattedAmount}</AppText>
            <AppText style={styles.amountCurrency} variant="caption">Pesos chilenos</AppText>
          </View>

          <AppText style={styles.fieldLabel} variant="eyebrow">Elige un monto</AppText>
          <View style={styles.amountGrid}>
            {suggestedAmounts.map((amount) => {
              const selected = selectedAmount === amount;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={amount}
                  onPress={() => selectAmount(amount)}
                  style={({ pressed }) => [styles.amountChip, selected && styles.amountChipSelected, pressed && styles.pressed]}>
                  <AppText style={[styles.amountChipText, selected && styles.amountChipTextSelected]} variant="bodyStrong">
                    {formatClp(amount)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <AppText style={styles.fieldLabel} variant="eyebrow">Otro monto</AppText>
          <View style={styles.customAmountWrap}>
            <AppText style={styles.currencyPrefix} variant="bodyStrong">$</AppText>
            <TextInput
              accessibilityLabel="Otro monto en pesos chilenos"
              keyboardType="number-pad"
              maxLength={9}
              onChangeText={handleCustomAmount}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              style={styles.customAmountInput}
              value={selectedAmount ? '' : amountText}
            />
            <AppText style={styles.clpSuffix} variant="caption">CLP</AppText>
          </View>

          <AppText style={styles.fieldLabel} variant="eyebrow">¿A qué iniciativa?</AppText>
          <View style={styles.destinationList}>
            {destinations.slice(0, 3).map((initiative) => {
              const selected = initiative.id === initiativeId;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={initiative.id}
                  onPress={() => {
                    setInitiativeId(initiative.id);
                    void Haptics.selectionAsync().catch(() => undefined);
                  }}
                  style={({ pressed }) => [styles.destination, selected && styles.destinationSelected, pressed && styles.pressed]}>
                  <View style={[styles.destinationIcon, selected && styles.destinationIconSelected]}>
                    <AppIcon color={selected ? colors.textOnPrimary : colors.primaryDark} name="heart" size={17} />
                  </View>
                  <View style={styles.destinationCopy}>
                    <AppText numberOfLines={1} style={styles.destinationTitle} variant="bodyStrong">{initiative.title}</AppText>
                    <AppText numberOfLines={1} style={styles.destinationMeta} variant="caption">{initiative.location ?? 'Tu comunidad'}</AppText>
                  </View>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <AppText style={styles.summaryLabel} variant="caption">Donación</AppText>
              <AppText style={styles.summaryValue} variant="bodyStrong">{formattedAmount}</AppText>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <AppText style={styles.summaryLabel} variant="caption">Destino</AppText>
              <AppText numberOfLines={2} style={styles.summaryDestination} variant="bodyStrong">{destinationLabel}</AppText>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityHint="Muestra el resultado de la simulación sin realizar un cobro"
            accessibilityRole="button"
            disabled={!canContinue}
            onPress={handlePreview}
            style={({ pressed }) => [styles.continueButton, !canContinue && styles.continueDisabled, pressed && canContinue && styles.pressed]}>
            <AppIcon color={colors.textOnPrimary} name="heart" size={18} />
            <AppText style={styles.continueText} variant="bodyStrong">Simular donación de {formattedAmount}</AppText>
          </Pressable>
          <AppText style={styles.footerNote} variant="caption">Vista previa · No se solicitarán datos de pago</AppText>
        </View>
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
  demoNotice: { alignItems: 'center', backgroundColor: colors.warmSoft, borderColor: colors.warm, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginTop: 16, padding: 12 },
  previewIcon: { alignItems: 'center', backgroundColor: colors.warm, borderRadius: 10, height: 38, justifyContent: 'center', width: 38 },
  demoCopy: { flex: 1, marginLeft: 10 },
  demoText: { fontSize: 10, lineHeight: 14, marginTop: 1 },
  amountHero: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.md, marginTop: 12, paddingHorizontal: 18, paddingVertical: 22 },
  amountLabel: { color: colors.primaryDark, fontSize: 10 },
  amountValue: { fontSize: 38, fontVariant: ['tabular-nums'], lineHeight: 46, marginTop: 2 },
  amountCurrency: { color: colors.textMuted, fontSize: 10, marginTop: 1 },
  fieldLabel: { fontSize: 10, marginBottom: 8, marginTop: 20 },
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amountChip: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 44, width: '48%' },
  amountChipSelected: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  amountChipText: { color: colors.text, fontSize: 12 },
  amountChipTextSelected: { color: colors.textOnPrimary },
  customAmountWrap: { alignItems: 'center', backgroundColor: colors.input, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 52, paddingHorizontal: 13 },
  currencyPrefix: { fontSize: 19 },
  customAmountInput: { color: colors.text, flex: 1, fontFamily: typography.bodySemiBold, fontSize: 19, fontVariant: ['tabular-nums'], paddingHorizontal: 7, paddingVertical: 0 },
  clpSuffix: { color: colors.textMuted, fontSize: 10 },
  destinationList: { gap: 8 },
  destination: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 64, padding: 10 },
  destinationSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDark },
  destinationIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 10, height: 40, justifyContent: 'center', width: 40 },
  destinationIconSelected: { backgroundColor: colors.primaryDark },
  destinationCopy: { flex: 1, marginHorizontal: 10, minWidth: 0 },
  destinationTitle: { fontSize: 12 },
  destinationMeta: { color: colors.textMuted, fontSize: 9.5, marginTop: 2 },
  radio: { alignItems: 'center', borderColor: colors.border, borderRadius: radii.pill, borderWidth: 1.5, height: 20, justifyContent: 'center', width: 20 },
  radioSelected: { borderColor: colors.primaryDark },
  radioDot: { backgroundColor: colors.primaryDark, borderRadius: radii.pill, height: 10, width: 10 },
  summaryCard: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.sm, marginTop: 20, padding: 13 },
  summaryRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: colors.textMuted, fontSize: 10 },
  summaryValue: { fontSize: 13, fontVariant: ['tabular-nums'] },
  summaryDestination: { fontSize: 11, marginLeft: 16, maxWidth: '68%', textAlign: 'right' },
  summaryDivider: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth, marginVertical: 11 },
  footer: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingTop: 12 },
  continueButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderCurve: 'continuous', borderRadius: radii.sm, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 50, paddingHorizontal: 16 },
  continueDisabled: { opacity: 0.4 },
  continueText: { color: colors.textOnPrimary, fontSize: 13 },
  footerNote: { color: colors.textMuted, fontSize: 9, marginTop: 7, textAlign: 'center' },
  pressed: { opacity: 0.68, transform: [{ scale: 0.98 }] },
}));
