import { Image } from 'expo-image';
import { memo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/theme/AppearanceProvider';
import type { TribuusPlace } from '@/features/places/model/place';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

const categoryIcon = { Bar: 'moon', Cafetería: 'coffee', Comercio: 'shopping-bag', Otro: 'map-pin', Panadería: 'shopping-bag', Restaurante: 'shopping-bag' } as const;

export const PlaceCard = memo(function PlaceCard({ distanceKm, onRecommend, onView, place }: { distanceKm: number; onRecommend: () => void; onView: () => void; place: TribuusPlace }) {
  const colors = useThemeColors();
  const styles = useStyles();
  const latest = [...place.recommendations].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  const count = place.popularity;
  return (
    <View style={[styles.card]}>
      <View style={styles.visual}>
        {latest?.photoUri ? <Image contentFit="cover" source={{ uri: latest.photoUri }} style={StyleSheet.absoluteFill} /> : <>
          <View style={styles.visualCircle}><AppIcon color={colors.primaryDark} name={categoryIcon[place.providerData.category]} size={28} /></View>
          <View style={styles.visualLines}><View style={styles.visualLineWide} /><View style={styles.visualLine} /></View>
        </>}
        <View style={styles.origin}><AppText style={styles.originText} variant="caption">{place.provider === 'community' ? 'CREADO POR LA COMUNIDAD' : 'RECOMENDADO EN TRIBUUS'}</AppText></View>
      </View>
      <View style={styles.content}>
        <AppText style={styles.category} variant="caption">{place.providerData.category.toLocaleUpperCase('es')}</AppText>
        <AppText numberOfLines={1} style={styles.name} variant="heading">{place.providerData.name}</AppText>
        <AppText style={styles.location} variant="caption">{place.providerData.neighborhood ?? place.providerData.address} · {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}</AppText>
        <View style={styles.proof}><AppIcon color="#D94A4A" filled name="heart" size={15} /><AppText style={styles.proofText} variant="bodyStrong">{count} {count === 1 ? 'vecino lo recomienda' : 'vecinos lo recomiendan'}</AppText></View>
        {latest ? <AppText numberOfLines={2} style={styles.quote}>“{latest.text}”</AppText> : null}
        <View style={styles.tags}>{place.communityTags.slice(0, 3).map((tag) => <View key={tag} style={styles.tag}><AppText style={styles.tagText} variant="caption">{tag}</AppText></View>)}</View>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={onView} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><AppText style={styles.secondaryText} variant="bodyStrong">Ver lugar</AppText></Pressable>
          <Pressable accessibilityRole="button" onPress={onRecommend} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><AppIcon color={colors.primaryDark} name="heart" size={14} /><AppText style={styles.primaryText} variant="bodyStrong">Recomendar</AppText></Pressable>
        </View>
      </View>
    </View>
  );
});

const useStyles = makeThemedStyles((colors) => ({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000000', shadowOffset: { height: 5, width: 0 }, shadowOpacity: 0.18, shadowRadius: 18 }, android: { elevation: 8 } }) },
  visual: { backgroundColor: colors.primarySoft, height: 68, overflow: 'hidden', padding: 10, position: 'relative' }, visualCircle: { alignItems: 'center', backgroundColor: colors.primarySoft, borderColor: colors.primaryDark, borderRadius: 16, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 },
  visualLines: { bottom: 16, gap: 7, position: 'absolute', right: 15 }, visualLineWide: { backgroundColor: 'rgba(23,77,43,0.15)', borderRadius: 4, height: 8, width: 100 }, visualLine: { alignSelf: 'flex-end', backgroundColor: 'rgba(23,77,43,0.10)', borderRadius: 4, height: 8, width: 68 },
  origin: { backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 4, position: 'absolute', right: 11, top: 10 }, originText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 7.5, letterSpacing: 0.45 },
  content: { padding: 14 }, category: { color: colors.warning, fontFamily: typography.bodySemiBold, fontSize: 8.5, letterSpacing: 0.8 }, name: { fontSize: 22, letterSpacing: -0.6, lineHeight: 27, marginTop: 2 }, location: { color: colors.textMuted, fontSize: 10, marginTop: 1 },
  proof: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 10 }, proofText: { color: colors.text, fontSize: 11.5 }, quote: { color: colors.textMuted, fontSize: 11, fontStyle: 'italic', lineHeight: 16, marginTop: 7 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 9 }, tag: { backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 5 }, tagText: { color: colors.primaryDark, fontSize: 8.5 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: 13 }, secondaryButton: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 14, flex: 1, justifyContent: 'center', minHeight: 46 }, primaryButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderColor: colors.primaryDark, borderRadius: 14, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 46 }, secondaryText: { color: colors.text, fontSize: 11 }, primaryText: { color: colors.primaryDark, fontSize: 11 }, pressed: { opacity: 0.7, transform: [{ scale: 0.985 }] },
}));
