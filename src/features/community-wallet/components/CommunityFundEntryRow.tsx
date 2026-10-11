import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import type { CommunityFundEntry } from '@/features/community-wallet/model/communityWallet';
import { useAppAppearance } from '@/theme/AppearanceProvider';
import { makeThemedStyles } from '@/theme/themedStyles';
import { typography } from '@/theme/tokens';

export const formatClp = (value: number) => new Intl.NumberFormat('es-CL', {
  currency: 'CLP',
  maximumFractionDigits: 0,
  style: 'currency',
}).format(value);

const formatEntryDate = (value: string) => new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(new Date(value));

export const CommunityFundEntryRow = memo(function CommunityFundEntryRow({
  entry,
  showDivider = true,
}: {
  entry: CommunityFundEntry;
  showDivider?: boolean;
}) {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  const isDonation = entry.type === 'donation';
  const meta = [isDonation ? 'Donación' : 'Gasto', entry.counterparty, formatEntryDate(entry.occurredAt)]
    .filter(Boolean)
    .join(' · ');
  const amount = `${isDonation ? '+' : '−'}${formatClp(entry.amountClp)}`;

  return (
    <View
      accessibilityLabel={`${entry.title}. ${meta}. ${amount}`}
      style={[styles.row, showDivider && styles.divider]}>
      <View style={[styles.icon, { backgroundColor: isDonation ? colors.primarySoft : colors.dangerSoft }]}>
        <AppIcon
          color={isDonation ? colors.primaryDark : colors.danger}
          name={isDonation ? 'arrow-down-left' : 'arrow-up-right'}
          size={18}
        />
      </View>
      <View style={styles.copy}>
        <AppText numberOfLines={1} style={styles.title} variant="bodyStrong">{entry.title}</AppText>
        <AppText numberOfLines={1} style={styles.meta} variant="caption">{meta}</AppText>
      </View>
      <AppText
        selectable
        style={[styles.amount, { color: isDonation ? colors.primaryDark : colors.danger }]}
        variant="bodyStrong">
        {amount}
      </AppText>
    </View>
  );
});

const useStyles = makeThemedStyles((colors) => StyleSheet.create({
  row: { alignItems: 'center', backgroundColor: colors.surface, flexDirection: 'row', minHeight: 68, paddingHorizontal: 12, paddingVertical: 9 },
  divider: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
  icon: { alignItems: 'center', borderCurve: 'continuous', borderRadius: 11, height: 40, justifyContent: 'center', width: 40 },
  copy: { flex: 1, marginLeft: 10, minWidth: 0 },
  title: { fontSize: 12.5 },
  meta: { color: colors.textMuted, fontSize: 9.5, marginTop: 2 },
  amount: { fontFamily: typography.bodySemiBold, fontSize: 12, fontVariant: ['tabular-nums'], marginLeft: 8 },
}));
