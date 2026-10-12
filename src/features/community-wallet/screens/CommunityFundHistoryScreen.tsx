import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useCommunityWallet } from '@/features/community-wallet/application/CommunityWalletProvider';
import { CommunityFundEntryRow, formatClp } from '@/features/community-wallet/components/CommunityFundEntryRow';
import { demoFundEntries } from '@/features/community-wallet/data/community-wallet-demo';
import { summarizeCommunityFund, type CommunityFundEntry } from '@/features/community-wallet/model/communityWallet';
import { useAppAppearance } from '@/theme/AppearanceProvider';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing } from '@/theme/tokens';

export function CommunityFundHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppAppearance();
  const { fundEntries, fundError, fundSummary, isLoading, refresh } = useCommunityWallet();
  const styles = useStyles();
  const showDemo = !isLoading && fundEntries.length === 0;
  const displayedEntries = showDemo ? demoFundEntries : fundEntries;
  const displayedSummary = showDemo ? summarizeCommunityFund(demoFundEntries) : fundSummary;

  const renderEntry = useCallback(({ item }: ListRenderItemInfo<CommunityFundEntry>) => (
    <View style={styles.entryCard}>
      <CommunityFundEntryRow entry={item} showDivider={false} />
    </View>
  ), [styles.entryCard]);

  const header = (
    <>
      <View style={styles.summaryCard}>
        <AppText style={styles.summaryLabel} variant="eyebrow">Monto en caja</AppText>
        <AppText selectable style={styles.summaryBalance} variant="hero">{formatClp(displayedSummary.cashBalanceClp)}</AppText>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <AppText style={styles.summaryStatValue} variant="bodyStrong">{formatClp(displayedSummary.donationsTotalClp)}</AppText>
            <AppText style={styles.summaryStatLabel} variant="caption">donaciones</AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <AppText style={styles.summaryStatValue} variant="bodyStrong">{formatClp(displayedSummary.expensesTotalClp)}</AppText>
            <AppText style={styles.summaryStatLabel} variant="caption">gastos</AppText>
          </View>
        </View>
      </View>
      {fundError && !showDemo ? (
        <View style={styles.errorCard}>
          <AppIcon color={colors.danger} name="alert-circle" size={18} />
          <AppText style={styles.errorText} variant="caption">{fundError}</AppText>
        </View>
      ) : null}
      <AppText style={styles.sectionTitle} variant="heading">Todos los movimientos</AppText>
    </>
  );

  const empty = !isLoading && !fundError ? (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}><AppIcon color={colors.primaryDark} name="file-text" size={23} /></View>
      <AppText variant="bodyStrong">Aún no hay movimientos</AppText>
      <AppText style={styles.emptyCopy} variant="caption">Las donaciones y los gastos registrados por la comunidad aparecerán aquí.</AppText>
    </View>
  ) : null;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.navigationHeader}>
        <Pressable accessibilityLabel="Volver" hitSlop={8} onPress={() => router.back()} style={styles.headerButton}>
          <AppIcon color={colors.text} name="chevron-left" size={24} />
        </Pressable>
        <AppText style={styles.navigationTitle} variant="bodyStrong">Historial de la caja</AppText>
        <View style={styles.headerButton} />
      </View>
      <FlashList
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.lg }]}
        data={displayedEntries}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(entry) => entry.id}
        ListEmptyComponent={empty}
        ListHeaderComponent={header}
        refreshControl={<RefreshControl onRefresh={() => void refresh()} refreshing={isLoading} tintColor={colors.primaryDark} />}
        renderItem={renderEntry}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) => StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  navigationHeader: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 54, paddingHorizontal: 8 },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  navigationTitle: { flex: 1, fontSize: 16, textAlign: 'center' },
  content: { paddingHorizontal: 16 },
  summaryCard: { backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.md, marginBottom: 24, marginTop: 16, padding: 18 },
  summaryLabel: { color: colors.primaryDark, fontSize: 10 },
  summaryBalance: { fontSize: 34, fontVariant: ['tabular-nums'], lineHeight: 42, marginTop: 4 },
  summaryStats: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginTop: 14, paddingTop: 13 },
  summaryStat: { flex: 1 },
  summaryStatValue: { fontSize: 14, fontVariant: ['tabular-nums'] },
  summaryStatLabel: { color: colors.textMuted, fontSize: 10, marginTop: 1 },
  summaryDivider: { backgroundColor: colors.border, marginHorizontal: 14, width: StyleSheet.hairlineWidth },
  sectionTitle: { fontSize: 22, marginBottom: 11 },
  entryCard: { borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  separator: { height: 8 },
  errorCard: { alignItems: 'center', backgroundColor: colors.dangerSoft, borderCurve: 'continuous', borderRadius: radii.sm, flexDirection: 'row', gap: 8, marginBottom: 16, padding: 12 },
  errorText: { flex: 1 },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.md, paddingHorizontal: 24, paddingVertical: 30 },
  emptyIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 48, justifyContent: 'center', marginBottom: 10, width: 48 },
  emptyCopy: { marginTop: 5, maxWidth: 340, textAlign: 'center' },
}));
