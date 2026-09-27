import Feather from '@/components/ui/AppIcon';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/context/AppearanceContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

type IconName = ComponentProps<typeof Feather>['name'];
type DiscoverItem = { accent: string; category: string; detail: string; icon: IconName; id: string; location: string; name: string; tag: string };

const featured: DiscoverItem[] = [
  { accent: '#3A4367', category: 'Eventos', detail: 'Vie 12 de sep · 19:00', icon: 'film', id: 'cinema', location: 'Plaza Las Lilas', name: 'Cine bajo las estrellas', tag: 'EVENTO' },
  { accent: '#42755C', category: 'Naturaleza', detail: 'Ideal para caminar', icon: 'sun', id: 'hill', location: 'Providencia', name: 'Cerro San Cristóbal', tag: 'NATURALEZA' },
  { accent: '#81583B', category: 'Cafés', detail: '4.8 · 24 vecinos', icon: 'coffee', id: 'cafe', location: 'Los Leones', name: 'Café La Esquina', tag: 'CAFÉ' },
];

const categories: { accent: string; icon: IconName; label: string }[] = [
  { accent: '#F6E8D8', icon: 'coffee', label: 'Cafés' },
  { accent: '#F8E5D0', icon: 'shopping-bag', label: 'Comida' },
  { accent: '#EFE2FA', icon: 'aperture', label: 'Cultura' },
  { accent: '#DDF2E1', icon: 'map', label: 'Naturaleza' },
  { accent: '#DDEBFA', icon: 'activity', label: 'Deporte' },
  { accent: '#F7E2D5', icon: 'shopping-bag', label: 'Comercio' },
  { accent: '#E9E5FA', icon: 'camera', label: 'Panoramas' },
  { accent: '#DCEFEA', icon: 'users', label: 'Comunidades' },
];

const weekend: DiscoverItem[] = [
  { accent: '#B66A37', category: 'Panoramas', detail: 'Sáb 14 · 10:00', icon: 'shopping-bag', id: 'market', location: 'Plaza Inés de Suárez', name: 'Feria local', tag: 'SÁB 14' },
  { accent: '#4B7D66', category: 'Comunidades', detail: 'Sáb 14 · 11:00', icon: 'users', id: 'clean', location: 'Parque Inés de Suárez', name: 'Limpieza del barrio', tag: 'SÁB 14' },
  { accent: '#597D54', category: 'Naturaleza', detail: 'Dom 15 · 09:00', icon: 'navigation', id: 'trekking', location: 'Cerro Calán', name: 'Trekking al cerro', tag: 'DOM 15' },
];

const places: DiscoverItem[] = [
  { accent: '#487C55', category: 'Cafés', detail: 'Recomendado por 24 vecinos', icon: 'coffee', id: 'garden-cafe', location: 'Barrio Italia', name: 'Café Jardín', tag: 'POPULAR' },
  { accent: '#745A84', category: 'Cultura', detail: 'A 8 min de ti', icon: 'aperture', id: 'gallery', location: 'Manuel Montt', name: 'Galería Local', tag: 'CERCA DE TI' },
  { accent: '#B2654F', category: 'Comida', detail: 'Nuevo en el barrio', icon: 'shopping-bag', id: 'bakery', location: 'Los Leones', name: 'Panadería Norte', tag: 'NUEVO' },
];

function SectionHeader({ icon, title }: { icon: IconName; title: string }) {
  const colors = useThemeColors();
  const styles = useStyles();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeading}><Feather color={colors.primaryDark} name={icon} size={16} /><AppText variant="bodyStrong">{title}</AppText></View>
      <Pressable hitSlop={8}><AppText style={styles.seeAll} variant="caption">Ver todo  ›</AppText></Pressable>
    </View>
  );
}

function ScenicCard({ compact = false, item }: { compact?: boolean; item: DiscoverItem }) {
  const styles = useStyles();
  return (
    <Pressable style={({ pressed }) => [compact ? styles.planCard : styles.featureCard, { backgroundColor: item.accent }, pressed && styles.pressed]}>
      <View style={styles.cardDecorationLarge} /><View style={styles.cardDecorationSmall} />
      <View style={styles.cardTop}><View style={styles.cardTag}><AppText style={styles.cardTagText} variant="caption">{item.tag}</AppText></View><Feather color="#FFFFFF" name="heart" size={17} /></View>
      <View style={styles.cardIllustration}><Feather color="rgba(255,255,255,0.94)" name={item.icon} size={compact ? 30 : 40} /></View>
      <View style={styles.cardCopy}>
        <AppText numberOfLines={1} style={styles.cardTitle} variant="bodyStrong">{item.name}</AppText>
        <View style={styles.cardMeta}><Feather color="rgba(255,255,255,0.84)" name="map-pin" size={10} /><AppText numberOfLines={1} style={styles.cardMetaText} variant="caption">{item.location}</AppText></View>
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
    const all = [...featured, ...weekend, ...places];
    if (!normalized) return [];
    return all.filter((item) => {
      const matchesQuery = !normalized || `${item.name} ${item.location} ${item.category}`.toLocaleLowerCase('es').includes(normalized);
      return matchesQuery;
    });
  }, [query]);
  const searching = Boolean(query.trim());

  const selectCategory = (label: string) => {
    router.push({ pathname: '/discover/[category]', params: { category: label } });
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View><AppText variant="eyebrow">CERCA DE TI</AppText><AppText style={styles.title} variant="heading">Discover</AppText></View>
        <View style={[styles.compass]}><Feather color={colors.primaryDark} name="compass" size={18} /></View>
      </View>

      <View style={[styles.searchBar]}>
        <Feather color={colors.textMuted} name="search" size={17} />
        <TextInput onChangeText={setQuery} placeholder="Busca lugares, planes o comunidades" placeholderTextColor={colors.textMuted} style={styles.searchInput} value={query} />
        {query ? <Pressable accessibilityLabel="Limpiar búsqueda" hitSlop={8} onPress={() => setQuery('')}><Feather color={colors.textMuted} name="x" size={16} /></Pressable> : null}
      </View>

      {searching ? (
        <View style={styles.searchSection}>
          <View style={styles.searchResultHeader}><AppText variant="bodyStrong">Resultados</AppText><Pressable onPress={() => setQuery('')}><AppText style={styles.clearText} variant="caption">Limpiar</AppText></Pressable></View>
          {searchResults.length ? searchResults.map((item) => (
            <Pressable key={item.id} style={({ pressed }) => [styles.searchResult, pressed && styles.pressed]}>
              <View style={[styles.searchResultIcon, { backgroundColor: `${item.accent}18` }]}><Feather color={item.accent} name={item.icon} size={19} /></View>
              <View style={styles.searchResultCopy}><AppText variant="bodyStrong">{item.name}</AppText><AppText style={styles.searchResultMeta} variant="caption">{item.category} · {item.location}</AppText></View>
              <Feather color={colors.textMuted} name="chevron-right" size={16} />
            </Pressable>
          )) : <View style={styles.empty}><Feather color={colors.textMuted} name="search" size={22} /><AppText style={styles.emptyText} variant="caption">No encontramos resultados con esos filtros.</AppText></View>}
        </View>
      ) : (
        <>
          <SectionHeader icon="star" title="Destacados cerca de ti" />
          <ScrollView contentContainerStyle={styles.horizontalContent} horizontal showsHorizontalScrollIndicator={false} style={styles.horizontal}><View style={styles.horizontalSpacer} />{featured.map((item) => <ScenicCard item={item} key={item.id} />)}<View style={styles.horizontalSpacer} /></ScrollView>

          <SectionHeader icon="compass" title="Explora por categorías" />
          <ScrollView contentContainerStyle={styles.horizontalContent} horizontal showsHorizontalScrollIndicator={false} style={styles.horizontal}><View style={styles.horizontalSpacer} />{categories.map((category) => (
            <Pressable key={category.label} onPress={() => selectCategory(category.label)} style={({ pressed }) => [styles.categoryCard, { backgroundColor: category.accent }, pressed && styles.pressed]}>
              <Feather color={colors.text} name={category.icon} size={27} /><AppText style={styles.categoryText} variant="caption">{category.label}</AppText>
            </Pressable>
          ))}<View style={styles.horizontalSpacer} /></ScrollView>

          <SectionHeader icon="calendar" title="Planes para este fin de semana" />
          <ScrollView contentContainerStyle={styles.horizontalContent} horizontal showsHorizontalScrollIndicator={false} style={styles.horizontal}><View style={styles.horizontalSpacer} />{weekend.map((item) => <ScenicCard compact item={item} key={item.id} />)}<View style={styles.horizontalSpacer} /></ScrollView>

          <SectionHeader icon="map-pin" title="Lugares que te pueden gustar" />
          <ScrollView contentContainerStyle={styles.horizontalContent} horizontal showsHorizontalScrollIndicator={false} style={styles.horizontal}><View style={styles.horizontalSpacer} />{places.map((item) => <ScenicCard compact item={item} key={item.id} />)}<View style={styles.horizontalSpacer} /></ScrollView>
        </>
      )}
    </Screen>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { letterSpacing: -0.7, marginTop: 2 },
  compass: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 40 },
  outlined: { backgroundColor: colors.surface, borderColor: colors.text, borderRadius: 12, borderWidth: 1.2 },
  searchBar: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 14, flexDirection: 'row', gap: 8, marginTop: spacing.lg, minHeight: 44, paddingHorizontal: 13 },
  searchInput: { color: colors.text, flex: 1, fontFamily: typography.body, fontSize: 13, height: 44, paddingVertical: 0 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  seeAll: { color: colors.textMuted, fontSize: 10 },
  horizontal: { marginHorizontal: -20, marginTop: 9 },
  horizontalContent: { gap: 9 },
  horizontalSpacer: { width: 11 },
  featureCard: { borderRadius: 17, height: 190, overflow: 'hidden', padding: 10, position: 'relative', width: 160 },
  planCard: { borderRadius: 15, height: 132, overflow: 'hidden', padding: 9, position: 'relative', width: 174 },
  cardDecorationLarge: { backgroundColor: 'rgba(255,255,255,0.09)', borderRadius: radii.pill, height: 140, position: 'absolute', right: -52, top: -35, width: 140 },
  cardDecorationSmall: { backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: radii.pill, bottom: -30, height: 100, left: -30, position: 'absolute', width: 100 },
  cardTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', zIndex: 2 },
  cardTag: { backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: radii.pill, minHeight: 21, paddingHorizontal: 7, paddingVertical: 4 },
  cardTagText: { color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 7 },
  cardIllustration: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  cardCopy: { zIndex: 2 },
  cardTitle: { color: '#FFFFFF', fontSize: 12.5, lineHeight: 16 },
  cardMeta: { alignItems: 'center', flexDirection: 'row', gap: 3, marginTop: 2 },
  cardMetaText: { color: 'rgba(255,255,255,0.84)', flex: 1, fontSize: 8.5 },
  cardDetail: { color: 'rgba(255,255,255,0.78)', fontSize: 8, marginTop: 2 },
  categoryCard: { alignItems: 'center', borderRadius: 14, gap: 8, height: 82, justifyContent: 'center', width: 78 },
  categoryText: { color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 9 },
  searchSection: { marginTop: spacing.xl },
  searchResultHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  clearText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold },
  searchResult: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 11, minHeight: 74, paddingVertical: 9 },
  searchResultIcon: { alignItems: 'center', borderRadius: 12, height: 44, justifyContent: 'center', width: 44 },
  searchResultCopy: { flex: 1 },
  searchResultMeta: { color: colors.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: 48 },
  emptyText: { color: colors.textMuted, textAlign: 'center' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
}));
