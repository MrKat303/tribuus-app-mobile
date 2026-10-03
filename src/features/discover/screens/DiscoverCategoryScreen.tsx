import Feather from '@/components/ui/AppIcon';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/theme/AppearanceProvider';
import { getItemsByCategory, type DiscoverKind } from '@/features/discover/model/discover';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

type IconName = ComponentProps<typeof Feather>['name'];

const kindIcons: Record<DiscoverKind, IconName> = {
  food: 'coffee', nightlife: 'moon', panorama: 'calendar', place: 'map-pin',
};

export default function DiscoverCategoryFeed() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useStyles();
  const { category: rawCategory } = useLocalSearchParams<{ category: string }>();
  const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
  const feed = getItemsByCategory(category);

  return (
    <Screen scroll swipeTabs={false}>
      <Stack.Screen options={{ navigationBarHidden: true, statusBarHidden: true }} />
      <View style={styles.header}>
        <Pressable accessibilityLabel="Volver a Discover" hitSlop={10} onPress={() => router.back()} style={styles.backButton}><Feather color={colors.text} name="chevron-left" size={23} /></Pressable>
        <View style={styles.heading}><AppText variant="eyebrow">DISCOVER</AppText><AppText style={styles.title} variant="heading">{category}</AppText></View>
      </View>

      <AppText style={styles.subtitle} variant="body">Recomendaciones y planes cerca de ti.</AppText>
      <View style={styles.feed}>
        {feed.length ? feed.map((item) => (
          <Pressable
            accessibilityHint="Abre la ficha con más información"
            accessibilityRole="button"
            key={item.id}
            onPress={() => router.push({ pathname: '/discover/item/[id]', params: { id: item.id } })}
            style={({ pressed }) => [styles.feedCard, pressed && styles.pressed]}>
            {item.image ? <Image contentFit="cover" source={item.image} style={styles.thumbnail} transition={150} /> : <View style={styles.iconWrap}><Feather color={colors.primaryDark} name={kindIcons[item.kind]} size={21} /></View>}
            <View style={styles.copy}><AppText variant="bodyStrong">{item.name}</AppText><View style={styles.meta}><Feather color={colors.textMuted} name="map-pin" size={13} /><AppText style={styles.metaText} variant="caption">{item.location}</AppText></View><AppText numberOfLines={1} style={styles.detail} variant="caption">{item.detail}</AppText></View>
            <Feather color={colors.textMuted} name="chevron-right" size={18} />
          </Pressable>
        )) : <View style={styles.empty}><Feather color={colors.textMuted} name="compass" size={24} /><AppText style={styles.emptyTitle} variant="bodyStrong">Aún no hay recomendaciones</AppText><AppText style={styles.emptyText} variant="caption">Pronto sumaremos nuevos lugares y planes en esta categoría.</AppText></View>}
      </View>
    </Screen>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  backButton: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.pill, height: 44, justifyContent: 'center', width: 44 },
  heading: { flex: 1 },
  title: { letterSpacing: -0.7, marginTop: 1 },
  subtitle: { color: colors.textMuted, marginTop: spacing.lg },
  feed: { gap: spacing.sm, marginTop: spacing.xl },
  feedCard: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.md, minHeight: 92, paddingVertical: spacing.md },
  thumbnail: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.sm, height: 64, width: 72 },
  iconWrap: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.sm, height: 56, justifyContent: 'center', width: 56 },
  copy: { flex: 1 },
  meta: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 3 },
  metaText: { color: colors.textMuted },
  detail: { color: colors.textMuted, fontFamily: typography.body, marginTop: 2 },
  empty: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.hero },
  emptyTitle: { marginTop: spacing.sm },
  emptyText: { color: colors.textMuted, textAlign: 'center' },
  pressed: { opacity: 0.6 },
}));
