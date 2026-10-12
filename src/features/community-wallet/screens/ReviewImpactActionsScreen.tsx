import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useCommunityWallet } from '@/features/community-wallet/application/CommunityWalletProvider';
import type { PendingImpactAction } from '@/features/community-wallet/model/communityWallet';
import { useAppAppearance } from '@/theme/AppearanceProvider';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii } from '@/theme/tokens';

const formatDate = (value: string) => new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date(value));

export function ReviewImpactActionsScreen() {
  const router = useRouter();
  const { colors } = useAppAppearance();
  const { pendingReview, reviewAction, role, rules } = useCommunityWallet();
  const styles = useStyles();
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canReview = role === 'moderator' || role === 'admin';
  const ruleByCode = new Map(rules.map((rule) => [rule.code, rule]));

  const performReview = async (action: PendingImpactAction, decision: 'approved' | 'rejected') => {
    setWorkingId(action.id);
    setError(null);
    try {
      await reviewAction(action.id, decision);
      await Haptics.notificationAsync(
        decision === 'approved' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      ).catch(() => undefined);
    } catch {
      setError('No pudimos completar la revisión. Inténtalo nuevamente.');
    } finally {
      setWorkingId(null);
    }
  };

  const confirmReview = (action: PendingImpactAction, decision: 'approved' | 'rejected') => {
    const rule = ruleByCode.get(action.actionTypeCode);
    Alert.alert(
      decision === 'approved' ? 'Aprobar aporte' : 'Rechazar aporte',
      decision === 'approved'
        ? `Se sumarán ${rule?.points ?? 0} puntos cuando el aporte quede aprobado. Confirma solo si revisaste la información.`
        : 'La solicitud se cerrará sin sumar puntos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: decision === 'approved' ? 'Aprobar' : 'Rechazar', style: decision === 'approved' ? 'default' : 'destructive', onPress: () => void performReview(action, decision) },
      ],
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Volver" hitSlop={8} onPress={() => router.back()} style={styles.headerButton}><AppIcon color={colors.text} name="chevron-left" size={24} /></Pressable>
        <AppText style={styles.headerTitle} variant="bodyStrong">Revisar aportes</AppText>
        <View style={styles.headerButton} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!canReview ? (
          <View style={styles.emptyCard}>
            <AppIcon color={colors.textMuted} name="lock" size={26} />
            <AppText style={styles.emptyTitle} variant="bodyStrong">Acceso restringido</AppText>
            <AppText style={styles.emptyText} variant="caption">Solo moderadores y administradores de la comunidad pueden revisar aportes.</AppText>
          </View>
        ) : (
          <>
            <View style={styles.introCard}>
              <AppIcon color={colors.primaryDark} name="shield" size={20} />
              <AppText style={styles.introText} variant="caption">Comprueba que el aporte ocurrió antes de aprobarlo y revisa la información disponible.</AppText>
            </View>
            {error ? <View style={styles.errorCard}><AppIcon color={colors.danger} name="alert-circle" size={17} /><AppText style={styles.errorText} variant="caption">{error}</AppText></View> : null}
            <View style={styles.sectionHeader}>
              <AppText style={styles.sectionTitle} variant="heading">Pendientes</AppText>
              <AppText style={styles.count} variant="caption">{pendingReview.length}</AppText>
            </View>
            <View style={styles.list}>
              {pendingReview.map((action) => {
                const rule = ruleByCode.get(action.actionTypeCode);
                const working = workingId === action.id;
                return (
                  <View key={action.id} style={styles.actionCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardIcon}><AppIcon color={colors.primaryDark} name="heart" size={17} /></View>
                      <View style={styles.cardHeaderCopy}>
                        <AppText variant="bodyStrong">{rule?.label ?? 'Aporte comunitario'}</AppText>
                        <AppText style={styles.cardMeta} variant="caption">{formatDate(action.occurredAt)} · {rule?.points ?? 0} puntos</AppText>
                      </View>
                    </View>
                    <AppText style={styles.description}>{action.description}</AppText>
                    {action.confirmationNote ? (
                      <View style={styles.confirmation}>
                        <AppIcon color={colors.textMuted} name="user-check" size={15} />
                        <AppText style={styles.confirmationText} variant="caption">{action.confirmationNote}</AppText>
                      </View>
                    ) : null}
                    <View style={styles.actions}>
                      <Pressable accessibilityRole="button" disabled={working} onPress={() => confirmReview(action, 'rejected')} style={({ pressed }) => [styles.rejectButton, pressed && styles.pressed]}>
                        <AppText style={styles.rejectText} variant="bodyStrong">Rechazar</AppText>
                      </Pressable>
                      <Pressable accessibilityRole="button" disabled={working} onPress={() => confirmReview(action, 'approved')} style={({ pressed }) => [styles.approveButton, working && styles.disabled, pressed && styles.pressed]}>
                        <AppIcon color={colors.textOnPrimary} name="check" size={16} />
                        <AppText style={styles.approveText} variant="bodyStrong">{working ? 'Procesando…' : 'Aprobar'}</AppText>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
              {!pendingReview.length ? (
                <View style={styles.emptyCard}>
                  <View style={styles.doneIcon}><AppIcon color={colors.primaryDark} name="check" size={23} /></View>
                  <AppText style={styles.emptyTitle} variant="bodyStrong">Todo al día</AppText>
                  <AppText style={styles.emptyText} variant="caption">No hay aportes esperando revisión en esta comunidad.</AppText>
                </View>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) => StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 54, paddingHorizontal: 8 },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  headerTitle: { flex: 1, fontSize: 16, textAlign: 'center' },
  content: { alignSelf: 'center', maxWidth: 720, paddingBottom: 48, paddingHorizontal: 16, width: '100%' },
  introCard: { alignItems: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radii.sm, flexDirection: 'row', gap: 9, marginTop: 16, padding: 13 },
  introText: { flex: 1, fontSize: 11, lineHeight: 16 },
  errorCard: { alignItems: 'center', backgroundColor: colors.dangerSoft, borderRadius: radii.sm, flexDirection: 'row', gap: 8, marginTop: 10, padding: 12 },
  errorText: { flex: 1, fontSize: 11 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  sectionTitle: { fontSize: 23 },
  count: { backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, minWidth: 30, paddingHorizontal: 8, paddingVertical: 4, textAlign: 'center' },
  list: { gap: 10, marginTop: 12 },
  actionCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, padding: 13 },
  cardHeader: { alignItems: 'center', flexDirection: 'row' },
  cardIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 10, height: 36, justifyContent: 'center', width: 36 },
  cardHeaderCopy: { flex: 1, marginLeft: 9 },
  cardMeta: { fontSize: 10, marginTop: 1 },
  description: { fontSize: 14, lineHeight: 20, marginTop: 12 },
  confirmation: { alignItems: 'flex-start', backgroundColor: colors.surfaceMuted, borderRadius: 9, flexDirection: 'row', gap: 7, marginTop: 10, padding: 10 },
  confirmationText: { flex: 1, fontSize: 10, lineHeight: 15 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 13 },
  rejectButton: { alignItems: 'center', borderColor: colors.border, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, flex: 1, justifyContent: 'center', minHeight: 44 },
  rejectText: { color: colors.danger, fontSize: 12 },
  approveButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 10, flex: 1.4, flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 44 },
  approveText: { color: colors.textOnPrimary, fontSize: 12 },
  disabled: { opacity: 0.45 },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.md, marginTop: 20, paddingHorizontal: 26, paddingVertical: 30 },
  doneIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 18, height: 48, justifyContent: 'center', width: 48 },
  emptyTitle: { marginTop: 10 },
  emptyText: { marginTop: 4, maxWidth: 320, textAlign: 'center' },
  pressed: { opacity: 0.65 },
}));
