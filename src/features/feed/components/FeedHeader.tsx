import { memo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/context/AppearanceContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

import { feedFilters, type FeedFilter } from '../model/feed';
import { InlineFeedComposer, type InlinePostDraft } from './InlineFeedComposer';

type FeedHeaderProps = {
  activeFilter: FeedFilter;
  onChangeFilter: (filter: FeedFilter) => void;
  onCreatePost: (draft: InlinePostDraft) => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenWallet: () => void;
};

export const FeedHeader = memo(function FeedHeader({ activeFilter, onChangeFilter, onCreatePost, onOpenNotifications, onOpenProfile, onOpenWallet }: FeedHeaderProps) {
  const { colors: themeColors } = useAppAppearance();
  const styles = useStyles();

  return (
    <>
      <View style={styles.topBar}>
        <BrandMark />
        <View style={styles.topActions}>
          <Pressable accessibilityLabel="Community Wallet del barrio" accessibilityRole="button" onPress={onOpenWallet} style={[styles.notificationButton, { backgroundColor: themeColors.primarySoft }]}>
            <AppIcon color={themeColors.primaryDark} name="briefcase" size={17} />
          </Pressable>
          <Pressable accessibilityLabel="Notificaciones" accessibilityRole="button" onPress={onOpenNotifications} style={[styles.notificationButton, { backgroundColor: themeColors.primarySoft }]}>
            <AppIcon color={themeColors.primaryDark} name="bell" size={17} />
            <View style={[styles.notificationDot, { backgroundColor: themeColors.warning, borderColor: themeColors.surface }]} />
          </Pressable>
          <Pressable accessibilityLabel="Abrir mi perfil" accessibilityRole="button" onPress={onOpenProfile} style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}>
            <AppText style={styles.profileInitials} variant="caption">JM</AppText>
          </Pressable>
        </View>
      </View>

      <InlineFeedComposer onCreatePost={onCreatePost} />

      <ScrollView contentContainerStyle={styles.filtersContent} horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {feedFilters.map((filter) => {
          const isActive = activeFilter === filter.value;
          return (
            <Pressable key={filter.value} onPress={() => onChangeFilter(filter.value)} style={[styles.filterChip, { backgroundColor: isActive ? themeColors.primarySoft : themeColors.surfaceMuted }]}>
              <AppIcon color={isActive ? themeColors.primaryDark : themeColors.textMuted} name={filter.icon} size={12} />
              <AppText style={[styles.filterLabel, { color: isActive ? themeColors.primaryDark : themeColors.textMuted }]} variant="caption">{filter.label}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.feedHeading}>
        <AppText style={styles.feedTitle} variant="heading">Publicaciones cerca de ti</AppText>
        <Pressable accessibilityLabel="Cambiar comuna" hitSlop={8} style={styles.feedLocation}>
          <AppIcon color={themeColors.primaryDark} name="navigation" size={14} />
          <AppText style={[styles.feedLocationText, { color: themeColors.textMuted }]} variant="caption">Providencia</AppText>
          <AppIcon color={themeColors.textMuted} name="chevron-down" size={13} />
        </Pressable>
      </View>
    </>
  );
});

const useStyles = makeThemedStyles((colors) => ({
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  topActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  notificationButton: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 36, justifyContent: 'center', position: 'relative', width: 36 },
  notificationDot: { backgroundColor: colors.primary, borderColor: colors.surface, borderRadius: radii.pill, borderWidth: 1, height: 7, position: 'absolute', right: 5, top: 4, width: 7 },
  profileButton: { alignItems: 'center', backgroundColor: colors.text, borderRadius: radii.pill, height: 36, justifyContent: 'center', width: 36 },
  profileInitials: { color: colors.surface, fontSize: 10 },
  filters: { marginHorizontal: -20, marginTop: spacing.sm },
  filtersContent: { gap: 6, paddingHorizontal: 20, paddingVertical: spacing.xs },
  filterChip: { alignItems: 'center', borderRadius: radii.pill, flexDirection: 'row', gap: 5, minHeight: 28, paddingHorizontal: 10, paddingVertical: 4 },
  filterLabel: { fontFamily: typography.bodySemiBold, fontSize: 11, lineHeight: 14 },
  feedHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11, marginTop: spacing.lg },
  feedTitle: { fontSize: 19, letterSpacing: -0.45, lineHeight: 24 },
  feedLocation: { alignItems: 'center', flexDirection: 'row', gap: 4, minHeight: 36 },
  feedLocationText: { fontFamily: typography.bodyMedium, fontSize: 10 },
  pressed: { opacity: 0.65, transform: [{ scale: 0.98 }] },
  featuredEvent: { backgroundColor: '#E9E1FA', borderColor: colors.text, borderRadius: 14, borderWidth: 1.4, flexDirection: 'row', marginTop: spacing.md, minHeight: 196, overflow: 'hidden', padding: 13 },
  featuredCopy: { flex: 0.93, paddingRight: 5, zIndex: 2 },
  featuredEyebrow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  featuredEyebrowText: { color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.25 },
  featuredTitle: { fontFamily: typography.title, fontSize: 24, letterSpacing: -1.15, lineHeight: 23, marginTop: 9 },
  featuredMeta: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 10 },
  featuredMetaText: { color: colors.text, fontSize: 8.5 },
  featuredCta: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#0B2117', borderRadius: radii.pill, flexDirection: 'row', gap: 8, marginTop: 12, minHeight: 38, paddingHorizontal: 13 },
  featuredCtaText: { color: '#FFFFFF', fontFamily: typography.bodySemiBold, fontSize: 10 },
  featuredVisual: { flex: 1.08, justifyContent: 'flex-end', marginLeft: 2, position: 'relative' },
  featuredImage: { borderRadius: 12, height: 151, transform: [{ rotate: '1.5deg' }], width: '100%' },
  participants: { alignItems: 'center', bottom: 3, flexDirection: 'row', position: 'absolute', right: 1 },
  participant: { alignItems: 'center', backgroundColor: '#DCEFEA', borderColor: '#FFFFFF', borderRadius: radii.pill, borderWidth: 2, height: 28, justifyContent: 'center', width: 28 },
  participantCount: { backgroundColor: colors.surface, borderColor: colors.text },
  participantText: { color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 7 },
  sparkle: { position: 'absolute', right: -7, top: -7 },
}));
