import Feather from '@/components/ui/AppIcon';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/context/AppearanceContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type IconName = ComponentProps<typeof Feather>['name'];
type FeedItem = { detail: string; icon: IconName; id: string; location: string; title: string };

const categoryFeed: Record<string, FeedItem[]> = {
  Cafés: [
    { detail: 'Recomendado por 24 vecinos', icon: 'coffee', id: 'cafe-jardin', location: 'Barrio Italia', title: 'Café Jardín' },
    { detail: '4.8 · Abierto hasta las 20:00', icon: 'coffee', id: 'cafe-esquina', location: 'Los Leones', title: 'Café La Esquina' },
  ],
  Comida: [
    { detail: 'Nuevo en el barrio', icon: 'shopping-bag', id: 'panaderia-norte', location: 'Los Leones', title: 'Panadería Norte' },
    { detail: 'Recomendado por 18 vecinos', icon: 'shopping-bag', id: 'bistro-local', location: 'Providencia', title: 'Bistró del Barrio' },
  ],
  Cultura: [
    { detail: 'A 8 min de ti', icon: 'aperture', id: 'galeria-local', location: 'Manuel Montt', title: 'Galería Local' },
    { detail: 'Hoy · 19:30', icon: 'film', id: 'cine-plaza', location: 'Plaza Las Lilas', title: 'Cine bajo las estrellas' },
  ],
  Naturaleza: [
    { detail: 'Ideal para caminar', icon: 'sun', id: 'cerro-san-cristobal', location: 'Providencia', title: 'Cerro San Cristóbal' },
    { detail: 'Dom 15 · 09:00', icon: 'navigation', id: 'trekking-calan', location: 'Cerro Calán', title: 'Trekking al cerro' },
  ],
  Deporte: [
    { detail: 'Este sábado · 10:00', icon: 'activity', id: 'running-parque', location: 'Parque Inés de Suárez', title: 'Running vecinal' },
    { detail: 'Cupos disponibles', icon: 'activity', id: 'yoga-plaza', location: 'Plaza Las Lilas', title: 'Yoga al aire libre' },
  ],
  Comercio: [
    { detail: 'Beneficio para vecinos', icon: 'shopping-bag', id: 'libreria-barrio', location: 'Pedro de Valdivia', title: 'Librería del Barrio' },
    { detail: 'Abierto hoy hasta las 19:00', icon: 'shopping-bag', id: 'mercado-local', location: 'Providencia', title: 'Mercado Local' },
  ],
  Panoramas: [
    { detail: 'Sáb 14 · 10:00', icon: 'calendar', id: 'feria-local', location: 'Plaza Inés de Suárez', title: 'Feria local' },
    { detail: 'Esta semana', icon: 'camera', id: 'ruta-arte', location: 'Barrio Italia', title: 'Ruta de arte y diseño' },
  ],
  Comunidades: [
    { detail: 'Sáb 14 · 11:00', icon: 'users', id: 'limpieza-barrio', location: 'Parque Inés de Suárez', title: 'Limpieza del barrio' },
    { detail: '12 vecinos participan', icon: 'users', id: 'huerto-comunitario', location: 'Providencia', title: 'Huerto comunitario' },
  ],
};

export default function DiscoverCategoryFeed() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useStyles();
  const { category: rawCategory } = useLocalSearchParams<{ category: string }>();
  const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
  const feed = categoryFeed[category] ?? [];
  return (
    <Screen scroll swipeTabs={false}>
      <Stack.Screen options={{ navigationBarHidden: true, statusBarHidden: true }} />
      <View style={styles.header}>
        <Pressable accessibilityLabel="Volver a Discover" hitSlop={10} onPress={() => router.back()} style={[styles.backButton]}>
          <Feather color={colors.text} name="chevron-left" size={23} />
        </Pressable>
        <View style={styles.heading}><AppText variant="eyebrow">DISCOVER</AppText><AppText style={styles.title} variant="heading">{category}</AppText></View>
      </View>

      <AppText style={styles.subtitle} variant="body">Lo que está pasando cerca de ti.</AppText>
      <View style={styles.feed}>
        {feed.map((item) => (
          <Pressable key={item.id} style={({ pressed }) => [styles.feedCard, pressed && styles.pressed]}>
            <View style={styles.iconWrap}><Feather color={colors.primaryDark} name={item.icon} size={21} /></View>
            <View style={styles.copy}><AppText variant="bodyStrong">{item.title}</AppText><View style={styles.meta}><Feather color={colors.textMuted} name="map-pin" size={13} /><AppText style={styles.metaText} variant="caption">{item.location}</AppText></View><AppText style={styles.detail} variant="caption">{item.detail}</AppText></View>
            <Feather color={colors.textMuted} name="chevron-right" size={18} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  backButton: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 42, justifyContent: 'center', width: 42 },
  heading: { flex: 1 },
  title: { letterSpacing: -0.7, marginTop: 1 },
  subtitle: { color: colors.textMuted, marginTop: spacing.lg },
  feed: { gap: spacing.sm, marginTop: spacing.xl },
  feedCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.md, minHeight: 92, padding: spacing.md },
  iconWrap: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 14, height: 48, justifyContent: 'center', width: 48 },
  copy: { flex: 1 },
  meta: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 3 },
  metaText: { color: colors.textMuted },
  detail: { color: colors.textMuted, fontFamily: typography.body, marginTop: 2 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
}));
