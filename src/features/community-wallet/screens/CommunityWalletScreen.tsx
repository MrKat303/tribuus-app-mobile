import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/theme/AppearanceProvider';
import { useCommunityWallet } from '@/features/community-wallet/application/CommunityWalletProvider';
import { demoWalletActivity, type CommunityInitiative, type CommunityWalletActivity } from '@/features/community-wallet/model/communityWallet';
import { fetchCommunityActivity, fetchCommunityBalance, isStellarConfigured, stellarExplorerTransactionUrl } from '@/features/community-wallet/data/stellar';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, typography } from '@/theme/tokens';

type WalletSection = 'initiatives' | 'activity';

const formatClp = (value: number) => new Intl.NumberFormat('es-CL', {
  currency: 'CLP',
  maximumFractionDigits: 0,
  style: 'currency',
}).format(value);
const formatDate = (value: string) => new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));

function InitiativeCard({ initiative, onSupport }: { initiative: CommunityInitiative; onSupport: () => void }) {
  const { colors } = useAppAppearance();
  const styles = useStyles();

  return (
    <View style={styles.initiativeCard}>
      <View style={styles.initiativeHeader}>
        <View style={styles.initiativeIcon}><AppIcon color={colors.primaryDark} name="map-pin" size={16} /></View>
        <View style={styles.initiativeTitleWrap}>
          <AppText style={styles.initiativeLabel} variant="caption">INICIATIVA</AppText>
          <AppText numberOfLines={2} style={styles.initiativeTitle} variant="bodyStrong">{initiative.title}</AppText>
        </View>
      </View>

      <View style={styles.initiativeFacts}>
        <View style={styles.fact}>
          <AppText style={styles.factLabel} variant="caption">COSTO</AppText>
          <AppText selectable style={styles.costValue} variant="bodyStrong">{formatClp(initiative.costClp)}</AppText>
        </View>
        <View style={styles.factDivider} />
        <View style={styles.fact}>
          <AppText style={styles.factLabel} variant="caption">PROPUESTA POR</AppText>
          <AppText numberOfLines={1} style={styles.proposedBy} variant="bodyStrong">{initiative.proposedBy}</AppText>
        </View>
      </View>

      <View style={styles.initiativeFooter}>
        <View style={styles.supportCount}>
          <AppIcon color={colors.textMuted} name="users" size={14} />
          <AppText style={styles.supportCountText} variant="caption">{initiative.supporters} apoyos</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: initiative.supportedByMe }}
          onPress={onSupport}
          style={({ pressed }) => [styles.supportButton, initiative.supportedByMe && styles.supportButtonActive, pressed && styles.pressed]}>
          <AppIcon color={initiative.supportedByMe ? colors.textOnPrimary : colors.primaryDark} name={initiative.supportedByMe ? 'check' : 'heart'} size={15} />
          <AppText style={[styles.supportButtonText, initiative.supportedByMe && styles.supportButtonTextActive]} variant="caption">
            {initiative.supportedByMe ? 'Apoyando' : 'Apoyar'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function ActivityRow({ activity, onOpen }: { activity: CommunityWalletActivity; onOpen?: () => void }) {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  const incoming = activity.direction === 'incoming';
  return (
    <Pressable disabled={!onOpen} onPress={onOpen} style={({ pressed }) => [styles.activityRow, pressed && styles.rowPressed]}>
      <View style={[styles.activityIcon, { backgroundColor: incoming ? colors.primarySoft : colors.surfaceMuted }]}>
        <AppIcon color={incoming ? colors.primaryDark : colors.textMuted} name={incoming ? 'arrow-down-left' : 'arrow-up-right'} size={16} />
      </View>
      <View style={styles.activityCopy}>
        <AppText style={styles.activityLabel} variant="bodyStrong">{activity.label}</AppText>
        <AppText style={styles.activityMeta} variant="caption">{formatDate(activity.createdAt)} · {activity.counterparty}</AppText>
      </View>
      <View style={styles.activityAmountWrap}>
        <AppText style={[styles.activityAmount, { color: incoming ? colors.primaryDark : colors.text }]} variant="bodyStrong">{incoming ? '+' : '−'}{formatClp(activity.amountClp)}</AppText>
        {onOpen ? <AppIcon color={colors.textMuted} name="external-link" size={12} /> : null}
      </View>
    </Pressable>
  );
}

export function CommunityWalletScreen() {
  const router = useRouter();
  const { colors } = useAppAppearance();
  const styles = useStyles();
  const { initiatives, toggleSupport } = useCommunityWallet();
  const configured = isStellarConfigured();
  const [section, setSection] = useState<WalletSection>('initiatives');
  const [balance, setBalance] = useState<number | null>(null);
  const [activity, setActivity] = useState<CommunityWalletActivity[]>(configured ? [] : demoWalletActivity);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);

  const loadStellar = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      const [nextBalance, nextActivity] = await Promise.all([fetchCommunityBalance(), fetchCommunityActivity()]);
      setBalance(nextBalance);
      setActivity(nextActivity);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No pudimos consultar Stellar.');
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useFocusEffect(useCallback(() => { void loadStellar(); }, [loadStellar]));

  const totals = useMemo(() => activity.reduce((result, item) => ({
    incoming: result.incoming + (item.direction === 'incoming' ? item.amountClp : 0),
    outgoing: result.outgoing + (item.direction === 'outgoing' ? item.amountClp : 0),
  }), { incoming: 0, outgoing: 0 }), [activity]);
  const demoBalance = Math.max(0, totals.incoming - totals.outgoing + 1850000);

  const selectSection = (next: WalletSection) => {
    setSection(next);
    void Haptics.selectionAsync().catch(() => undefined);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={configured ? <RefreshControl onRefresh={() => void loadStellar()} refreshing={loading} tintColor={colors.primaryDark} /> : undefined} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Volver" hitSlop={8} onPress={() => router.back()} style={styles.headerButton}><AppIcon color={colors.text} name="chevron-left" size={24} /></Pressable>
          <View style={styles.headerCopy}><AppText style={styles.headerTitle} variant="bodyStrong">Fondo del barrio</AppText><AppText style={styles.headerSubtitle} variant="caption">Providencia</AppText></View>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <View><AppText style={styles.balanceLabel} variant="caption">FONDO DISPONIBLE</AppText><AppText selectable style={styles.balanceValue} variant="heading">{formatClp(configured && balance !== null ? balance : demoBalance)}</AppText></View>
            <View style={styles.stellarBadge}><View style={[styles.networkDot, { backgroundColor: configured ? colors.primary : colors.warning }]} /><AppText style={styles.stellarBadgeText} variant="caption">STELLAR</AppText></View>
          </View>
          <View style={styles.balanceFooter}><AppIcon color={colors.primaryDark} name="shield" size={15} /><AppText style={styles.balanceHelper} variant="caption">Movimientos públicos y verificables</AppText></View>
        </View>

        <View style={styles.primaryActions}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/community-wallet/donate')} style={({ pressed }) => [styles.donateAction, pressed && styles.pressed]}><AppIcon color={colors.textOnPrimary} name="plus" size={18} /><AppText style={styles.donateActionText} variant="bodyStrong">Aportar al fondo</AppText></Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/community-wallet/propose')} style={({ pressed }) => [styles.proposeAction, pressed && styles.pressed]}><AppIcon color={colors.primaryDark} name="edit-3" size={17} /><AppText style={styles.proposeActionText} variant="bodyStrong">Proponer</AppText></Pressable>
        </View>

        <View accessibilityRole="tablist" style={styles.segmented}>
          {([{ label: 'Iniciativas', value: 'initiatives' }, { label: 'Historial', value: 'activity' }] as const).map((item) => {
            const selected = section === item.value;
            return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} key={item.value} onPress={() => selectSection(item.value)} style={[styles.segment, selected && styles.segmentSelected]}><AppText style={[styles.segmentText, selected && styles.segmentTextSelected]} variant="caption">{item.label}</AppText></Pressable>;
          })}
        </View>

        {section === 'initiatives' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeading}><View><AppText style={styles.sectionTitle} variant="heading">Iniciativas vecinales</AppText><AppText style={styles.sectionSubtitle} variant="caption">Apoya las ideas que quieres ver en tu barrio.</AppText></View><AppText style={styles.sectionCount} variant="caption">{initiatives.length}</AppText></View>
            <View style={styles.cards}>
              {initiatives.map((initiative) => <InitiativeCard initiative={initiative} key={initiative.id} onSupport={() => { toggleSupport(initiative.id); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined); }} />)}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeading}><View><AppText style={styles.sectionTitle} variant="heading">Historial del fondo</AppText><AppText style={styles.sectionSubtitle} variant="caption">Aportes y gastos expresados en pesos chilenos.</AppText></View></View>
            {error ? <View style={styles.errorCard}><AppText style={styles.errorText} variant="caption">{error}</AppText><Pressable onPress={() => void loadStellar()}><AppText style={styles.retryText} variant="caption">Reintentar</AppText></Pressable></View> : null}
            {!activity.length && !loading ? <View style={styles.empty}><AppIcon color={colors.textMuted} name="inbox" size={26} /><AppText variant="bodyStrong">Todavía no hay movimientos</AppText><AppText style={styles.emptyText} variant="caption">Los aportes y gastos aparecerán aquí cuando Stellar los confirme.</AppText></View> : null}
            <View style={styles.activityList}>{activity.map((item) => <ActivityRow activity={item} key={item.id} onOpen={item.transactionHash ? () => void WebBrowser.openBrowserAsync(stellarExplorerTransactionUrl(item.transactionHash!)) : undefined} />)}</View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) => StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { alignSelf: 'center', maxWidth: 720, paddingBottom: 48, paddingHorizontal: 16, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 56 },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  headerCopy: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 16 },
  headerSubtitle: { color: colors.textMuted, fontSize: 9, marginTop: 1 },
  balanceCard: { backgroundColor: colors.primarySoft, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, marginTop: 8, padding: 16 },
  balanceTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  balanceLabel: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.7 },
  balanceValue: { fontSize: 28, fontVariant: ['tabular-nums'], lineHeight: 35, marginTop: 3 },
  stellarBadge: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.pill, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 6 },
  networkDot: { borderRadius: radii.pill, height: 6, width: 6 },
  stellarBadgeText: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.55 },
  balanceFooter: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 6, marginTop: 13, paddingTop: 11 },
  balanceHelper: { color: colors.textMuted, fontSize: 10 },
  primaryActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  donateAction: { alignItems: 'center', backgroundColor: colors.primaryDark, borderCurve: 'continuous', borderRadius: radii.sm, flex: 1.3, flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 48, paddingHorizontal: 12 },
  donateActionText: { color: colors.textOnPrimary, fontSize: 12 },
  proposeAction: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.sm, flex: 1, flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 48, paddingHorizontal: 12 },
  proposeActionText: { color: colors.text, fontSize: 12 },
  segmented: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.sm, flexDirection: 'row', marginTop: 22, padding: 3 },
  segment: { alignItems: 'center', borderCurve: 'continuous', borderRadius: 9, flex: 1, justifyContent: 'center', minHeight: 38 },
  segmentSelected: { backgroundColor: colors.surface, boxShadow: `0 1px 4px ${colors.shadow}` },
  segmentText: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 11 },
  segmentTextSelected: { color: colors.text, fontFamily: typography.bodySemiBold },
  section: { marginTop: 22 },
  sectionHeading: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 22, lineHeight: 28 },
  sectionSubtitle: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  sectionCount: { backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, color: colors.textMuted, minWidth: 28, paddingHorizontal: 8, paddingVertical: 4, textAlign: 'center' },
  cards: { gap: 9, marginTop: 12 },
  initiativeCard: { backgroundColor: colors.surface, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, padding: 13 },
  initiativeHeader: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  initiativeIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 10, height: 36, justifyContent: 'center', width: 36 },
  initiativeTitleWrap: { flex: 1 },
  initiativeLabel: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 7, letterSpacing: 0.65 },
  initiativeTitle: { fontSize: 14, lineHeight: 18, marginTop: 2 },
  initiativeFacts: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: 10, flexDirection: 'row', marginTop: 11, paddingVertical: 9 },
  fact: { flex: 1, paddingHorizontal: 10 },
  factDivider: { backgroundColor: colors.border, width: StyleSheet.hairlineWidth },
  factLabel: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 7, letterSpacing: 0.5 },
  costValue: { fontSize: 12, fontVariant: ['tabular-nums'], marginTop: 2 },
  proposedBy: { fontSize: 11, marginTop: 2 },
  initiativeFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  supportCount: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  supportCountText: { color: colors.textMuted, fontSize: 9 },
  supportButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.pill, flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 38, minWidth: 104, paddingHorizontal: 14 },
  supportButtonActive: { backgroundColor: colors.primaryDark },
  supportButtonText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 10 },
  supportButtonTextActive: { color: colors.textOnPrimary },
  activityList: { backgroundColor: colors.surface, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, marginTop: 12, overflow: 'hidden' },
  activityRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 68, paddingHorizontal: 12 },
  activityIcon: { alignItems: 'center', borderRadius: 10, height: 36, justifyContent: 'center', width: 36 },
  activityCopy: { flex: 1, marginLeft: 10 },
  activityLabel: { fontSize: 11 },
  activityMeta: { color: colors.textMuted, fontSize: 8, marginTop: 2 },
  activityAmountWrap: { alignItems: 'flex-end', gap: 3 },
  activityAmount: { fontSize: 10, fontVariant: ['tabular-nums'] },
  rowPressed: { backgroundColor: colors.surfaceMuted },
  errorCard: { alignItems: 'center', backgroundColor: colors.dangerSoft, borderRadius: radii.sm, flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, padding: 12 },
  errorText: { color: colors.danger, flex: 1, fontSize: 10 },
  retryText: { color: colors.danger, fontFamily: typography.bodySemiBold, marginLeft: 10 },
  empty: { alignItems: 'center', gap: 7, paddingHorizontal: 30, paddingVertical: 42 },
  emptyText: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
}));
