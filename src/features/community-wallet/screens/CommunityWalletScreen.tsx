import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useCommunityWallet } from '@/features/community-wallet/application/CommunityWalletProvider';
import { CommunityFundEntryRow, formatClp } from '@/features/community-wallet/components/CommunityFundEntryRow';
import {
  demoAchievementRules,
  demoFundEntries,
  demoInitiatives,
} from '@/features/community-wallet/data/community-wallet-demo';
import {
  type ImpactAction,
  type ImpactActionTypeCode,
  type ImpactRule,
  summarizeCommunityFund,
} from '@/features/community-wallet/model/communityWallet';
import { useProfile } from '@/features/profile/application/ProfileProvider';
import { useAppAppearance } from '@/theme/AppearanceProvider';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, typography } from '@/theme/tokens';

const impactPointsArtwork = require('../../../../assets/images/community-impact-points.png');

type CommunityInitiative = ReturnType<typeof useCommunityWallet>['initiatives'][number];

const formatInitiativeDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

const statusCopy: Record<ImpactAction['status'], string> = {
  pending: 'En revisión',
  rejected: 'No aprobado',
  validated: 'Aprobado',
};

const initiativeStatusCopy: Record<string, string> = {
  active: 'Activa',
  cancelled: 'Cancelada',
  closed: 'Cerrada',
  completed: 'Completada',
  draft: 'Próximamente',
  open: 'Abierta',
  published: 'Activa',
  review: 'En revisión',
};

function getInitiativeIcon(contributionKind: string) {
  const kind = contributionKind.toLocaleLowerCase('es');
  if (kind.includes('item') || kind.includes('object') || kind.includes('don')) return 'gift' as const;
  if (kind.includes('particip') || kind.includes('activ') || kind.includes('time') || kind.includes('volunt')) return 'users' as const;
  return 'heart' as const;
}

function getInitiativeActionType(contributionKind: string): ImpactActionTypeCode {
  const kind = contributionKind.toLocaleLowerCase('es');
  if (kind === 'item' || kind.includes('item') || kind.includes('object') || kind.includes('don')) return 'item_share';
  if (kind === 'skill' || kind.includes('skill') || kind.includes('habil')) return 'neighbor_help';
  return 'community_activity';
}

function InitiativeCard({ initiative, onContribute }: { initiative: CommunityInitiative; onContribute: () => void }) {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  const date = formatInitiativeDate(initiative.startsAt) ?? formatInitiativeDate(initiative.endsAt);
  const status = initiativeStatusCopy[initiative.status];
  const canContribute = initiative.status === 'open';
  const supporterCopy = initiative.supporterCount === 1
    ? '1 persona participa'
    : `${initiative.supporterCount} personas participan`;

  return (
    <Pressable
      accessibilityHint={canContribute ? 'Abre el formulario con el tipo de aporte sugerido' : undefined}
      accessibilityLabel={canContribute ? `${initiative.title}. Quiero aportar` : initiative.title}
      accessibilityRole={canContribute ? 'button' : undefined}
      disabled={!canContribute}
      onPress={onContribute}
      style={({ pressed }) => [styles.initiativeCard, pressed && styles.pressed]}>
      <View style={styles.initiativeHeading}>
        <View style={styles.initiativeIcon}>
          <AppIcon color={colors.primaryDark} name={getInitiativeIcon(initiative.contributionKind)} size={20} />
        </View>
        <View style={styles.initiativeTitleWrap}>
          <AppText numberOfLines={2} style={styles.initiativeTitle} variant="bodyStrong">{initiative.title}</AppText>
          {status ? (
            <View style={styles.initiativeStatus}>
              <View style={styles.initiativeStatusDot} />
              <AppText style={styles.initiativeStatusText} variant="caption">{status}</AppText>
            </View>
          ) : null}
        </View>
      </View>

      <AppText numberOfLines={3} style={styles.initiativeSummary} variant="caption">{initiative.summary}</AppText>

      <View style={styles.initiativeMeta}>
        {initiative.location ? (
          <View style={styles.initiativeMetaItem}>
            <AppIcon color={colors.textMuted} name="map-pin" size={13} />
            <AppText numberOfLines={1} style={styles.initiativeMetaText} variant="caption">{initiative.location}</AppText>
          </View>
        ) : null}
        {date ? (
          <View style={styles.initiativeMetaItem}>
            <AppIcon color={colors.textMuted} name="calendar" size={13} />
            <AppText style={styles.initiativeMetaText} variant="caption">{date}</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.initiativeFooter}>
        <View style={styles.initiativeSupporters}>
          <AppIcon color={colors.primaryDark} name="users" size={14} />
          <AppText style={styles.initiativeSupportersText} variant="caption">{supporterCopy}</AppText>
        </View>
        {canContribute ? (
          <View style={styles.initiativeCta}>
            <AppText style={styles.initiativeCtaText} variant="caption">Quiero aportar</AppText>
            <AppIcon color={colors.primaryDark} name="arrow-right" size={14} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function ActionRow({ action, rule }: { action: ImpactAction; rule?: ImpactRule }) {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  const statusColor = action.status === 'rejected' ? colors.danger : action.status === 'validated' ? colors.primaryDark : colors.warning;
  return (
    <View style={styles.actionRow}>
      <View style={styles.actionCopy}>
        <AppText numberOfLines={1} variant="bodyStrong">{rule?.label ?? 'Aporte comunitario'}</AppText>
        <AppText numberOfLines={1} style={styles.actionDescription} variant="caption">{action.description}</AppText>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <AppText style={[styles.statusText, { color: statusColor }]} variant="caption">{statusCopy[action.status]}</AppText>
      </View>
    </View>
  );
}

export function CommunityWalletScreen() {
  const router = useRouter();
  const { colors } = useAppAppearance();
  const { profile } = useProfile();
  const {
    actions,
    fundEntries,
    fundError,
    fundSummary,
    initiatives = [],
    initiativesError,
    isLoading,
    pendingReview,
    refresh,
    role,
    rules,
  } = useCommunityWallet();
  const styles = useStyles();
  const isReviewer = role === 'moderator' || role === 'admin';
  const showFundDemo = !isLoading && fundEntries.length === 0;
  const showInitiativesDemo = !isLoading && initiatives.length === 0;
  const displayedFundEntries = showFundDemo ? demoFundEntries : fundEntries;
  const displayedFundSummary = showFundDemo ? summarizeCommunityFund(demoFundEntries) : fundSummary;
  const displayedInitiatives = showInitiativesDemo ? demoInitiatives : initiatives;
  const ruleByCode = new Map(
    [...demoAchievementRules, ...rules].map((rule) => [rule.code, rule]),
  );

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));

  const navigate = (path:
    | '/community-wallet/add-fund-entry'
    | '/community-wallet/donate-preview'
    | '/community-wallet/history'
    | '/community-wallet/how-it-works'
    | '/community-wallet/review') => {
    void Haptics.selectionAsync().catch(() => undefined);
    router.push(path);
  };

  const startContribution = (type: ImpactActionTypeCode) => {
    void Haptics.selectionAsync().catch(() => undefined);
    router.push({ pathname: '/community-wallet/submit-action', params: { type } });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl onRefresh={() => void refresh()} refreshing={isLoading} tintColor={colors.primaryDark} />}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Volver" hitSlop={8} onPress={() => router.back()} style={styles.headerButton}>
            <AppIcon color={colors.text} name="chevron-left" size={24} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText style={styles.headerTitle} variant="bodyStrong">Community Wallet</AppText>
            <AppText style={styles.headerSubtitle} variant="caption">{profile.location || 'Tu comunidad'}</AppText>
          </View>
          <Pressable accessibilityLabel="Cómo funciona Community Wallet" hitSlop={8} onPress={() => navigate('/community-wallet/how-it-works')} style={styles.headerButton}>
            <AppIcon color={colors.text} name="info" size={21} />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroScoreWrap}>
              <AppText style={styles.heroLabel} variant="eyebrow">Monto en caja</AppText>
              <AppText
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                numberOfLines={1}
                selectable
                style={[styles.score, displayedFundSummary.cashBalanceClp < 0 && { color: colors.danger }]}
                variant="hero">
                {formatClp(displayedFundSummary.cashBalanceClp)}
              </AppText>
            </View>
            <View style={styles.heroArtworkWrap}>
              <Image accessible={false} contentFit="contain" source={impactPointsArtwork} style={styles.heroArtwork} />
            </View>
          </View>
        </View>

        <View style={styles.donateActionRow}>
          <Pressable
            accessibilityHint="Abre una vista previa de aporte"
            accessibilityRole="button"
            onPress={() => navigate('/community-wallet/donate-preview')}
            style={({ pressed }) => [styles.donateButton, pressed && styles.pressed]}>
            <AppIcon color={colors.textOnPrimary} name="heart" size={16} />
            <AppText style={styles.donateTitle} variant="bodyStrong">Donar</AppText>
          </Pressable>
        </View>

        {isReviewer ? (
          <Pressable accessibilityRole="button" onPress={() => navigate('/community-wallet/review')} style={({ pressed }) => [styles.reviewAction, pressed && styles.pressed]}>
            <AppIcon color={colors.primaryDark} name="check-circle" size={18} />
            <AppText style={styles.reviewActionText} variant="bodyStrong">Revisar aportes</AppText>
            <View style={styles.reviewCount}><AppText style={styles.reviewCountText} variant="caption">{pendingReview.length}</AppText></View>
          </Pressable>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <AppText style={styles.sectionTitle} variant="heading">Historial de la caja</AppText>
            <AppText style={styles.sectionSubtitle} variant="caption">Donaciones y gastos de la comunidad.</AppText>
          </View>
          <View style={styles.sectionActions}>
            {isReviewer ? (
              <Pressable
                accessibilityLabel="Registrar movimiento"
                onPress={() => navigate('/community-wallet/add-fund-entry')}
                style={({ pressed }) => [styles.sectionAction, pressed && styles.pressed]}>
                <AppIcon color={colors.primaryDark} name="plus" size={14} />
                <AppText style={styles.sectionActionText} variant="caption">Registrar</AppText>
              </Pressable>
            ) : null}
            {displayedFundEntries.length ? (
              <Pressable onPress={() => navigate('/community-wallet/history')} style={({ pressed }) => [styles.sectionAction, pressed && styles.pressed]}>
                <AppText style={styles.sectionActionText} variant="caption">Ver todo</AppText>
                <AppIcon color={colors.primaryDark} name="chevron-right" size={14} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {fundError && !showFundDemo ? (
          <View style={styles.errorCard}>
            <AppIcon color={colors.danger} name="alert-circle" size={18} />
            <AppText style={styles.errorText} variant="caption">{fundError}</AppText>
            <Pressable onPress={() => void refresh()}><AppText style={styles.retryText} variant="caption">Reintentar</AppText></Pressable>
          </View>
        ) : null}

        <View style={styles.fundList}>
          {displayedFundEntries.slice(0, 5).map((entry, index) => (
            <CommunityFundEntryRow
              entry={entry}
              key={entry.id}
              showDivider={index < Math.min(displayedFundEntries.length, 5) - 1}
            />
          ))}
          {!displayedFundEntries.length && !fundError && !isLoading ? (
            <View style={styles.emptyFund}>
              <View style={styles.emptyFundIcon}><AppIcon color={colors.primaryDark} name="file-text" size={21} /></View>
              <View style={styles.emptyFundCopy}>
                <AppText variant="bodyStrong">Aún no hay movimientos</AppText>
                <AppText style={styles.sectionSubtitle} variant="caption">Las donaciones y gastos aparecerán aquí.</AppText>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <AppText style={styles.sectionTitle} variant="heading">Iniciativas de mi barrio</AppText>
            <AppText style={styles.sectionSubtitle} variant="caption">Formas de colaborar cerca de ti.</AppText>
          </View>
          {displayedInitiatives.length ? <AppText style={styles.sectionCount} variant="caption">{displayedInitiatives.length}</AppText> : null}
        </View>

        <View style={styles.initiativesList}>
          {initiativesError && !showInitiativesDemo ? (
            <View style={styles.errorCard}>
              <AppIcon color={colors.danger} name="alert-circle" size={18} />
              <AppText style={styles.errorText} variant="caption">{initiativesError}</AppText>
              <Pressable onPress={() => void refresh()}><AppText style={styles.retryText} variant="caption">Reintentar</AppText></Pressable>
            </View>
          ) : null}
          {displayedInitiatives.map((initiative) => (
            <InitiativeCard
              initiative={initiative}
              key={initiative.id}
              onContribute={() => startContribution(getInitiativeActionType(initiative.contributionKind))}
            />
          ))}
          {!displayedInitiatives.length && !initiativesError && !isLoading ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}><AppIcon color={colors.primaryDark} name="users" size={24} /></View>
              <AppText variant="bodyStrong">Aún no hay iniciativas publicadas</AppText>
              <AppText style={styles.emptyCopy} variant="caption">Cuando se publique una iniciativa en tu barrio, aparecerá aquí.</AppText>
            </View>
          ) : null}
        </View>

        {actions.length ? (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <AppText style={styles.sectionTitle} variant="heading">Mis aportes</AppText>
                <AppText style={styles.sectionSubtitle} variant="caption">Revisa el estado de lo que compartiste.</AppText>
              </View>
            </View>
            <View style={styles.actionList}>
              {actions.slice(0, 5).map((action) => <ActionRow action={action} key={action.id} rule={ruleByCode.get(action.actionTypeCode)} />)}
            </View>
          </>
        ) : null}

        <Pressable accessibilityRole="button" onPress={() => navigate('/community-wallet/how-it-works')} style={({ pressed }) => [styles.explainer, pressed && styles.pressed]}>
          <View style={styles.explainerIcon}><AppIcon color={colors.primaryDark} name="help-circle" size={18} /></View>
          <View style={styles.explainerCopy}>
            <AppText variant="bodyStrong">¿Cómo funciona Community Wallet?</AppText>
            <AppText style={styles.explainerText} variant="caption">Revisa la caja, sigue iniciativas y consulta el estado de tus aportes comunitarios.</AppText>
          </View>
          <AppIcon color={colors.textMuted} name="chevron-right" size={18} />
        </Pressable>
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
  headerSubtitle: { color: colors.textMuted, fontSize: 10, marginTop: 1 },
  heroCard: { backgroundColor: 'transparent', marginTop: 8, minHeight: 144, overflow: 'hidden', paddingLeft: 4, paddingVertical: 22 },
  heroTop: { alignItems: 'center', flex: 1, flexDirection: 'row', position: 'relative' },
  heroScoreWrap: { flex: 1, minWidth: 0, paddingRight: 112, zIndex: 1 },
  heroLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 0.9 },
  score: { fontSize: 36, fontVariant: ['tabular-nums'], lineHeight: 44, marginTop: 8 },
  heroArtworkWrap: { alignItems: 'center', bottom: -4, justifyContent: 'center', position: 'absolute', right: -8, top: -4, width: 178 },
  heroArtwork: { height: 132, width: 178 },
  donateActionRow: { alignItems: 'flex-end', marginTop: 10 },
  donateButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderCurve: 'continuous', borderRadius: radii.pill, flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 44, paddingHorizontal: 17 },
  donateTitle: { color: colors.textOnPrimary, fontSize: 12 },
  reviewAction: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.sm, flexDirection: 'row', gap: 9, marginTop: 10, minHeight: 48, paddingHorizontal: 14 },
  reviewActionText: { flex: 1, fontSize: 13 },
  reviewCount: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.pill, minWidth: 28, paddingHorizontal: 8, paddingVertical: 3 },
  reviewCountText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontVariant: ['tabular-nums'] },
  errorCard: { alignItems: 'center', backgroundColor: colors.dangerSoft, borderCurve: 'continuous', borderRadius: radii.sm, flexDirection: 'row', gap: 8, marginTop: 10, padding: 12 },
  errorText: { flex: 1, fontSize: 11 },
  retryText: { color: colors.danger, fontFamily: typography.bodySemiBold },
  sectionHeader: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 26 },
  sectionTitle: { fontSize: 22, lineHeight: 28 },
  sectionSubtitle: { fontSize: 10, marginTop: 1 },
  sectionCount: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.pill, minWidth: 28, paddingHorizontal: 8, paddingVertical: 4, textAlign: 'center' },
  sectionActions: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  sectionAction: { alignItems: 'center', borderRadius: radii.pill, flexDirection: 'row', gap: 3, minHeight: 44, paddingHorizontal: 7 },
  sectionActionText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 10 },
  fundList: { backgroundColor: colors.surface, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, marginTop: 11, overflow: 'hidden' },
  emptyFund: { alignItems: 'center', flexDirection: 'row', minHeight: 82, padding: 12 },
  emptyFundIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 11, height: 42, justifyContent: 'center', width: 42 },
  emptyFundCopy: { flex: 1, marginLeft: 10 },
  initiativesList: { gap: 10, marginTop: 11 },
  initiativeCard: { backgroundColor: colors.surface, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, padding: 13 },
  initiativeHeading: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  initiativeIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: 11, height: 42, justifyContent: 'center', width: 42 },
  initiativeTitleWrap: { alignItems: 'flex-start', flex: 1 },
  initiativeTitle: { fontSize: 14, lineHeight: 18 },
  initiativeStatus: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.pill, flexDirection: 'row', gap: 4, marginTop: 4, paddingHorizontal: 7, paddingVertical: 2 },
  initiativeStatusDot: { backgroundColor: colors.primaryDark, borderRadius: radii.pill, height: 5, width: 5 },
  initiativeStatusText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 9, lineHeight: 12 },
  initiativeSummary: { fontSize: 11, lineHeight: 16, marginTop: 10 },
  initiativeMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  initiativeMetaItem: { alignItems: 'center', flexDirection: 'row', gap: 4, maxWidth: '70%' },
  initiativeMetaText: { fontSize: 10, lineHeight: 14 },
  initiativeFooter: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginTop: 11, paddingTop: 10 },
  initiativeSupporters: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  initiativeSupportersText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 10 },
  initiativeCta: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  initiativeCtaText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 10 },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.md, paddingHorizontal: 24, paddingVertical: 26 },
  emptyIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.pill, height: 48, justifyContent: 'center', marginBottom: 10, width: 48 },
  emptyCopy: { marginTop: 5, maxWidth: 340, textAlign: 'center' },
  actionList: { backgroundColor: colors.surface, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, marginTop: 11, overflow: 'hidden' },
  actionRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 64, padding: 12 },
  actionCopy: { flex: 1, paddingRight: 8 },
  actionDescription: { fontSize: 10, marginTop: 1 },
  statusBadge: { alignItems: 'center', borderCurve: 'continuous', borderRadius: radii.pill, flexDirection: 'row', gap: 5, paddingHorizontal: 8, paddingVertical: 5 },
  statusDot: { borderRadius: radii.pill, height: 5, width: 5 },
  statusText: { fontFamily: typography.bodySemiBold, fontSize: 9 },
  explainer: { alignItems: 'center', borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginTop: 24, padding: 13 },
  explainerIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: 10, height: 38, justifyContent: 'center', width: 38 },
  explainerCopy: { flex: 1, marginHorizontal: 10 },
  explainerText: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  pressed: { opacity: 0.68, transform: [{ scale: 0.98 }] },
}));
