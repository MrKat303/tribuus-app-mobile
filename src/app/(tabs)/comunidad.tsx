import Feather from '@/components/ui/AppIcon';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/context/AppearanceContext';
import { discoverItems, featuredItems, suggestedItems, weekendItems, type DiscoverItem } from '@/features/discover/model/discover';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

type IconName = ComponentProps<typeof Feather>['name'];

const categories: { icon: IconName; label: string }[] = [
  { icon: 'coffee', label: 'Cafés' },
  { icon: 'shopping-bag', label: 'Restaurantes' },
  { icon: 'moon', label: 'Bares y clubes' },
  { icon: 'map', label: 'Naturaleza' },
  { icon: 'aperture', label: 'Cultura' },
  { icon: 'camera', label: 'Panoramas' },
];

const cardFallbacks: Record<DiscoverItem['kind'], string> = {
  food: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=82',
  nightlife: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=82',
  panorama: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=82',
  place: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=82',
};

function SectionHeader({ icon, title }: { icon: IconName; title: string }) {
  const colors = useThemeColors();
  const styles = useStyles();
  return <View style={styles.sectionHeader}><View style={styles.sectionHeading}><Feather color={colors.primaryDark} name={icon} size={16} /><AppText variant="bodyStrong">{title}</AppText></View></View>;
}

function ScenicCard({ compact = false, item, onPress }: { compact?: boolean; item: DiscoverItem; onPress: () => void }) {
  const styles = useStyles();
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <Pressable
      accessibilityHint="Abre la ficha con más información"
      accessibilityLabel={`${item.name}, ${item.location}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [compact ? styles.planCard : styles.featureCard, pressed && styles.pressed]}>
      {item.image ? <Image accessibilityLabel={`Foto de ${item.name}`} cachePolicy="memory-disk" contentFit="cover" contentPosition={item.imagePosition ?? 'center'} onError={() => setImageFailed(true)} source={imageFailed ? cardFallbacks[item.kind] : item.image} style={StyleSheet.absoluteFill} transition={180} /> : null}
      <View style={styles.imageShade} />
      <View style={styles.cardTop}><View style={styles.cardTag}><AppText style={styles.cardTagText} variant="caption">{item.tag}</AppText></View><View style={styles.arrowButton}><Feather color="#FFFFFF" name="arrow-up-right" size={15} /></View></View>
      <View style={styles.cardCopy}>
        <AppText numberOfLines={2} style={[styles.cardTitle, compact && styles.compactCardTitle]} variant="bodyStrong">{item.name}</AppText>
        <View style={styles.cardMeta}><Feather color="rgba(255,255,255,0.88)" name="map-pin" size={11} /><AppText numberOfLines={1} style={styles.cardMetaText} variant="caption">{item.location}</AppText></View>
        <AppText numberOfLines={1} style={styles.cardDetail} variant="caption">{item.detail}</AppText>
      </View>
    </Pressable>
  );
}

export default function CommunityScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useStyles();
  const [query, setQuery] = useState('');
  const searchResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    if (!normalized) return [];
    return discoverItems.filter((item) => `${item.name} ${item.location} ${item.category}`.toLocaleLowerCase('es').includes(normalized));
  }, [query]);
  const searching = Boolean(query.trim());
  const openItem = (id: string) => router.push({ pathname: '/discover/item/[id]', params: { id } });
  const selectCategory = (label: string) => router.push({ pathname: '/discover/[category]', params: { category: label } });

  return (
    <Screen scroll>
      <View style={styles.header}><View><AppText variant="eyebrow">CERCA DE TI</AppText><AppText style={styles.title} variant="heading">Discover</AppText></View><View style={styles.compass}><Feather color={colors.primaryDark} name="compass" size={18} /></View></View>

      <View style={styles.searchBar}>
        <Feather color={colors.textMuted} name="search" size={17} />
        <TextInput onChangeText={setQuery} placeholder="Busca lugares, planes o comunidades" placeholderTextColor={colors.textMuted} returnKeyType="search" style={styles.searchInput} value={query} />
        {query ? <Pressable accessibilityLabel="Limpiar búsqueda" hitSlop={8} onPress={() => setQuery('')}><Feather color={colors.textMuted} name="x" size={16} /></Pressable> : null}
      </View>

      {searching ? (
        <View style={styles.searchSection}>
          <View style={styles.searchResultHeader}><AppText variant="bodyStrong">Resultados</AppText><Pressable onPress={() => setQuery('')}><AppText style={styles.clearText} variant="caption">Limpiar</AppText></Pressable></View>
          {searchResults.length ? searchResults.map((item) => (
            <Pressable accessibilityRole="button" key={item.id} onPress={() => openItem(item.id)} style={({ pressed }) => [styles.searchResult, pressed && styles.rowPressed]}>
              {item.image ? <Image contentFit="cover" source={item.image} style={styles.searchResultImage} transition={120} /> : null}
              <View style={styles.searchResultCopy}><AppText variant="bodyStrong">{item.name}</AppText><AppText style={styles.searchResultMeta} variant="caption">{item.category} · {item.location}</AppText></View>
              <Feather color={colors.textMuted} name="chevron-right" size={16} />
            </Pressable>
          )) : <View style={styles.empty}><Feather color={colors.textMuted} name="search" size={22} /><AppText style={styles.emptyText} variant="caption">No encontramos lugares o planes con ese nombre.</AppText></View>}
        </View>
      ) : (
        <>
          <SectionHeader icon="star" title="Destacados cerca de ti" />
          <ScrollView contentContainerStyle={styles.horizontalContent} horizontal showsHorizontalScrollIndicator={false} style={styles.horizontal}><View style={styles.horizontalSpacer} />{featuredItems.map((item) => <ScenicCard item={item} key={item.id} onPress={() => openItem(item.id)} />)}<View style={styles.horizontalSpacer} /></ScrollView>

          <SectionHeader icon="compass" title="Explora por categorías" />
          <ScrollView contentContainerStyle={styles.horizontalContent} horizontal showsHorizontalScrollIndicator={false} style={styles.horizontal}><View style={styles.horizontalSpacer} />{categories.map((category) => (
            <Pressable accessibilityRole="button" key={category.label} onPress={() => selectCategory(category.label)} style={({ pressed }) => [styles.categoryCard, pressed && styles.rowPressed]}><View style={styles.categoryIcon}><Feather color={colors.primaryDark} name={category.icon} size={21} /></View><AppText numberOfLines={1} style={styles.categoryText} variant="caption">{category.label}</AppText></Pressable>
          ))}<View style={styles.horizontalSpacer} /></ScrollView>

          <SectionHeader icon="calendar" title="Planes para este fin de semana" />
          <ScrollView contentContainerStyle={styles.horizontalContent} horizontal showsHorizontalScrollIndicator={false} style={styles.horizontal}><View style={styles.horizontalSpacer} />{weekendItems.map((item) => <ScenicCard compact item={item} key={item.id} onPress={() => openItem(item.id)} />)}<View style={styles.horizontalSpacer} /></ScrollView>

          <SectionHeader icon="map-pin" title="Lugares que te pueden gustar" />
          <ScrollView contentContainerStyle={styles.horizontalContent} horizontal showsHorizontalScrollIndicator={false} style={styles.horizontal}><View style={styles.horizontalSpacer} />{suggestedItems.map((item) => <ScenicCard compact item={item} key={item.id} onPress={() => openItem(item.id)} />)}<View style={styles.horizontalSpacer} /></ScrollView>
        </>
      )}
    </Screen>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { letterSpacing: -0.7, marginTop: 2 },
  compass: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 40 },
  searchBar: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.sm, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, minHeight: 44, paddingHorizontal: spacing.md },
  searchInput: { color: colors.text, flex: 1, fontFamily: typography.body, fontSize: 13, height: 44, paddingVertical: 0 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  horizontal: { marginHorizontal: -20, marginTop: spacing.md },
  horizontalContent: { gap: spacing.md },
  horizontalSpacer: { width: spacing.sm },
  featureCard: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.md, height: 216, justifyContent: 'space-between', overflow: 'hidden', padding: spacing.md, position: 'relative', width: 236 },
  planCard: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.md, height: 158, justifyContent: 'space-between', overflow: 'hidden', padding: spacing.md, position: 'relative', width: 220 },
  imageShade: { backgroundColor: 'rgba(10,18,12,0.34)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  cardTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cardTag: { backgroundColor: 'rgba(255,255,255,0.92)', borderCurve: 'continuous', borderRadius: radii.pill, minHeight: 23, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  cardTagText: { color: '#183022', fontFamily: typography.bodySemiBold, fontSize: 9, letterSpacing: 0.5 },
  arrowButton: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.28)', borderCurve: 'continuous', borderRadius: radii.pill, height: 32, justifyContent: 'center', width: 32 },
  cardCopy: { gap: 2 },
  cardTitle: { color: '#FFFFFF', fontSize: 19, lineHeight: 23 },
  compactCardTitle: { fontSize: 16, lineHeight: 20 },
  cardMeta: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 2 },
  cardMetaText: { color: 'rgba(255,255,255,0.9)', flex: 1, fontSize: 11 },
  cardDetail: { color: 'rgba(255,255,255,0.82)', fontSize: 10 },
  categoryCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, gap: spacing.sm, height: 94, justifyContent: 'center', width: 92 },
  categoryIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.pill, height: 42, justifyContent: 'center', width: 42 },
  categoryText: { color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 10 },
  searchSection: { marginTop: spacing.xl },
  searchResultHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  clearText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold },
  searchResult: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.md, minHeight: 76, paddingVertical: spacing.sm },
  searchResultImage: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.sm, height: 52, width: 52 },
  searchResultCopy: { flex: 1 },
  searchResultMeta: { color: colors.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.hero },
  emptyText: { color: colors.textMuted, textAlign: 'center' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
  rowPressed: { opacity: 0.65 },
}));
