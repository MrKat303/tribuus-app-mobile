import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useCommunityWallet } from '@/features/community-wallet/application/CommunityWalletProvider';
import type { ImpactActionTypeCode } from '@/features/community-wallet/model/communityWallet';
import { useAppAppearance } from '@/theme/AppearanceProvider';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, typography } from '@/theme/tokens';

export function SubmitImpactActionScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string | string[] }>();
  const { colors } = useAppAppearance();
  const { rules, submitAction } = useCommunityWallet();
  const styles = useStyles();
  const [selectedCode, setSelectedCode] = useState<ImpactActionTypeCode | null>(null);
  const [description, setDescription] = useState('');
  const [confirmationNote, setConfirmationNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestedType = Array.isArray(type) ? type[0] : type;
  const preselectedCode = rules.find((rule) => rule.code === requestedType)?.code ?? null;
  const effectiveCode = selectedCode ?? preselectedCode ?? rules[0]?.code ?? null;
  const canSubmit = useMemo(() => Boolean(effectiveCode && description.trim().length >= 10 && !submitting), [description, effectiveCode, submitting]);

  const handleSubmit = async () => {
    if (!canSubmit || !effectiveCode) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitAction({
        actionTypeCode: effectiveCode,
        confirmationNote,
        description,
        occurredAt: new Date().toISOString(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      Alert.alert('Aporte enviado', 'La comunidad revisará la información antes de confirmar tu aporte.', [
        { text: 'Listo', onPress: () => router.back() },
      ]);
    } catch {
      setError('No pudimos enviar tu aporte. Inténtalo nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Cerrar" hitSlop={8} onPress={() => router.back()} style={styles.headerButton}><AppIcon color={colors.text} name="x" size={23} /></Pressable>
          <AppText style={styles.headerTitle} variant="bodyStrong">Registrar aporte</AppText>
          <View style={styles.headerButton} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.intro}>
            <View style={styles.introIcon}><AppIcon color={colors.primaryDark} name="heart" size={22} /></View>
            <View style={styles.introCopy}>
              <AppText variant="bodyStrong">Cuéntanos cómo aportaste a tu comunidad</AppText>
              <AppText style={styles.introText} variant="caption">Los puntos se suman cuando una persona responsable confirma el aporte.</AppText>
            </View>
          </View>

          <AppText style={styles.fieldLabel} variant="eyebrow">Tipo de aporte</AppText>
          <View style={styles.ruleList}>
            {rules.map((rule) => {
              const selected = effectiveCode === rule.code;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={rule.code}
                  onPress={() => { setSelectedCode(rule.code); void Haptics.selectionAsync().catch(() => undefined); }}
                  style={({ pressed }) => [styles.ruleOption, selected && styles.ruleOptionSelected, pressed && styles.pressed]}>
                  <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioInner} /> : null}</View>
                  <View style={styles.ruleCopy}>
                    <AppText style={styles.ruleLabel} variant="bodyStrong">{rule.label}</AppText>
                    <AppText numberOfLines={2} style={styles.ruleDescription} variant="caption">{rule.description}</AppText>
                  </View>
                  <View style={styles.rulePoints}><AppText style={styles.rulePointsText} variant="caption">+{rule.points}</AppText></View>
                </Pressable>
              );
            })}
          </View>

          <AppText style={styles.fieldLabel} variant="eyebrow">Descripción</AppText>
          <TextInput
            accessibilityLabel="Descripción del aporte"
            maxLength={500}
            multiline
            onChangeText={setDescription}
            placeholder="Ej.: Acompañé a una vecina mayor a retirar sus medicamentos."
            placeholderTextColor={colors.textMuted}
            style={styles.textArea}
            textAlignVertical="top"
            value={description}
          />
          <View style={styles.fieldHelper}>
            <AppText style={styles.helperText} variant="caption">Mínimo 10 caracteres</AppText>
            <AppText style={styles.counter} variant="caption">{description.length}/500</AppText>
          </View>

          <AppText style={styles.fieldLabel} variant="eyebrow">Quién puede confirmarlo</AppText>
          <TextInput
            accessibilityLabel="Información para confirmar el aporte"
            maxLength={300}
            multiline
            onChangeText={setConfirmationNote}
            placeholder="Nombre de la persona, organización o responsable (opcional)."
            placeholderTextColor={colors.textMuted}
            style={styles.noteArea}
            textAlignVertical="top"
            value={confirmationNote}
          />

          {error ? <View style={styles.errorCard}><AppIcon color={colors.danger} name="alert-circle" size={17} /><AppText style={styles.errorText} variant="caption">{error}</AppText></View> : null}

          <View style={styles.privacyNote}>
            <AppIcon color={colors.textMuted} name="shield" size={17} />
            <AppText style={styles.privacyText} variant="caption">La descripción y tus datos se usan solo para revisar el aporte dentro de Tribus.</AppText>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Pressable accessibilityRole="button" disabled={!canSubmit} onPress={() => void handleSubmit()} style={({ pressed }) => [styles.submitButton, !canSubmit && styles.submitDisabled, pressed && canSubmit && styles.pressed]}>
            <AppText style={styles.submitText} variant="bodyStrong">{submitting ? 'Enviando…' : 'Enviar aporte'}</AppText>
          </Pressable>
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
  intro: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.sm, flexDirection: 'row', marginTop: 16, padding: 14 },
  introIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 13, height: 44, justifyContent: 'center', width: 44 },
  introCopy: { flex: 1, marginLeft: 11 },
  introText: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  fieldLabel: { fontSize: 10, marginBottom: 8, marginTop: 22 },
  ruleList: { gap: 7 },
  ruleOption: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 66, padding: 11 },
  ruleOptionSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDark },
  radio: { alignItems: 'center', borderColor: colors.textMuted, borderRadius: radii.pill, borderWidth: 1.5, height: 20, justifyContent: 'center', width: 20 },
  radioSelected: { borderColor: colors.primaryDark },
  radioInner: { backgroundColor: colors.primaryDark, borderRadius: radii.pill, height: 10, width: 10 },
  ruleCopy: { flex: 1, marginHorizontal: 10 },
  ruleLabel: { fontSize: 13 },
  ruleDescription: { fontSize: 10, lineHeight: 14, marginTop: 1 },
  rulePoints: { backgroundColor: colors.surface, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 4 },
  rulePointsText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 10 },
  textArea: { backgroundColor: colors.input, borderColor: colors.border, borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, color: colors.text, fontFamily: typography.body, fontSize: 14, lineHeight: 20, minHeight: 116, padding: 12 },
  noteArea: { backgroundColor: colors.input, borderColor: colors.border, borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, color: colors.text, fontFamily: typography.body, fontSize: 14, lineHeight: 20, minHeight: 82, padding: 12 },
  fieldHelper: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  helperText: { fontSize: 9 },
  counter: { fontSize: 9, fontVariant: ['tabular-nums'] },
  errorCard: { alignItems: 'center', backgroundColor: colors.dangerSoft, borderRadius: radii.sm, flexDirection: 'row', gap: 8, marginTop: 14, padding: 12 },
  errorText: { flex: 1, fontSize: 11 },
  privacyNote: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, marginTop: 18, paddingHorizontal: 4 },
  privacyText: { flex: 1, fontSize: 10, lineHeight: 15 },
  footer: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, padding: 12 },
  submitButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: radii.sm, justifyContent: 'center', minHeight: 50 },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: colors.textOnPrimary, fontSize: 14 },
  pressed: { opacity: 0.65 },
}));
