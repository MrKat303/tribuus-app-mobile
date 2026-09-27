import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/context/AppearanceContext';
import type { MapSearchSuggestion } from '@/services/mapboxSearch';
import type { TribuusPlace } from '@/features/places/model/place';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

import { distanceInKm, type Coordinate, searchIcon } from '../model/map';

type MapSearchProps = {
  focused: boolean;
  loading: boolean;
  onChangeQuery: (value: string) => void;
  onClear: () => void;
  onFocus: () => void;
  onLocate: () => void;
  onAddPlace: () => void;
  onSelectSuggestion: (suggestion: MapSearchSuggestion) => void;
  onSelectTribuusPlace: (place: TribuusPlace) => void;
  onSubmit: () => void;
  query: string;
  suggestions: MapSearchSuggestion[];
  tribuusPlaces: TribuusPlace[];
  origin: Coordinate;
};

export const MapSearch = memo(function MapSearch({
  focused,
  loading,
  onChangeQuery,
  onClear,
  onFocus,
  onLocate,
  onAddPlace,
  onSelectSuggestion,
  onSelectTribuusPlace,
  onSubmit,
  query,
  suggestions,
  tribuusPlaces,
  origin,
}: MapSearchProps) {
  const { colors: themeColors } = useAppAppearance();
  const styles = useStyles();

  return (
    <>
      <View style={styles.topRow}>
        <View style={[styles.searchBar, { backgroundColor: themeColors.overlay, borderColor: themeColors.border, shadowColor: themeColors.shadow }]}>
          <AppIcon color={themeColors.textMuted} name="search" size={18} />
          <TextInput
            accessibilityLabel="Buscar en el mapa"
            onChangeText={onChangeQuery}
            onFocus={onFocus}
            onSubmitEditing={onSubmit}
            placeholder="Buscar calles, parques o lugares"
            placeholderTextColor={themeColors.textMuted}
            returnKeyType="search"
            style={[styles.searchInput, { color: themeColors.text }]}
            value={query}
          />
          {query ? (
            <Pressable accessibilityLabel="Limpiar búsqueda" hitSlop={8} onPress={onClear}>
              <AppIcon color={themeColors.textMuted} name="x" size={17} />
            </Pressable>
          ) : null}
        </View>
        <Pressable accessibilityLabel="Centrar en mi ubicación" hitSlop={7} onPress={onLocate} style={[styles.roundButton, { backgroundColor: themeColors.overlay, borderColor: themeColors.border, shadowColor: themeColors.shadow }]}>
          <AppIcon color={themeColors.text} name="crosshair" size={20} />
        </Pressable>
      </View>

      {focused && query.trim().length >= 2 ? (
        <View style={[styles.searchResults, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border, shadowColor: themeColors.shadow }]}>
          {loading ? (
            <View style={styles.searchStatus}>
              <ActivityIndicator color={themeColors.primaryDark} size="small" />
              <AppText style={styles.searchStatusText} variant="caption">Buscando calles y lugares…</AppText>
            </View>
          ) : <>
            {tribuusPlaces.length ? <View><AppText style={styles.resultSectionTitle} variant="caption">RECOMENDADOS EN TRIBUUS</AppText>{tribuusPlaces.slice(0, 4).map((place, index) => (
              <Pressable accessibilityRole="button" key={place.id} onPress={() => onSelectTribuusPlace(place)} style={({ pressed }) => [styles.searchResult, index > 0 && styles.searchResultBorder, pressed && styles.pressed]}>
                <View style={[styles.searchResultIcon, styles.tribuusResultIcon]}><AppIcon color="#D94A4A" filled name="heart" size={16} /></View>
                <View style={styles.searchResultCopy}><AppText numberOfLines={1} style={styles.searchResultName} variant="bodyStrong">{place.providerData.name}</AppText><AppText numberOfLines={1} style={styles.searchResultAddress} variant="caption">{place.providerData.category} · {place.providerData.neighborhood ?? place.providerData.address}</AppText><AppText style={styles.socialProof} variant="caption">{place.popularity} vecinos lo recomiendan</AppText></View>
                <AppText style={styles.distance} variant="caption">{Math.round(distanceInKm(origin, place.providerData.coordinate) * 1000)} m</AppText>
              </Pressable>
            ))}</View> : null}
            {suggestions.length ? <View><AppText style={styles.resultSectionTitle} variant="caption">OTROS LUGARES CERCA</AppText>{suggestions.map((suggestion, index) => (
              <Pressable accessibilityRole="button" key={`${suggestion.mapbox_id}-${index}`} onPress={() => onSelectSuggestion(suggestion)} style={({ pressed }) => [styles.searchResult, index > 0 && styles.searchResultBorder, pressed && styles.pressed]}>
                <View style={[styles.searchResultIcon, { backgroundColor: themeColors.primarySoft }]}><AppIcon color={themeColors.primaryDark} name={searchIcon[suggestion.feature_type] ?? 'map-pin'} size={16} /></View>
                <View style={styles.searchResultCopy}><AppText numberOfLines={1} style={styles.searchResultName} variant="bodyStrong">{suggestion.name}</AppText><AppText numberOfLines={1} style={styles.searchResultAddress} variant="caption">{suggestion.poi_category?.[0] ?? 'Lugar'} · {suggestion.place_formatted}</AppText><AppText style={styles.externalHint} variant="caption">Aún sin recomendaciones</AppText></View>
                {suggestion.distance ? <AppText style={styles.distance} variant="caption">{Math.round(suggestion.distance)} m</AppText> : <AppIcon color={themeColors.textMuted} name="chevron-right" size={14} />}
              </Pressable>
            ))}</View> : null}
            {!tribuusPlaces.length && !suggestions.length ? <View style={styles.emptyState}><AppText style={styles.searchEmpty} variant="bodyStrong">No encontramos ese lugar.</AppText><AppText style={styles.emptyQuestion}>¿Es un lugar real de tu comunidad?</AppText><Pressable onPress={onAddPlace} style={[styles.addPlace, { backgroundColor: themeColors.primaryDark }]}><AppIcon color={themeColors.textOnPrimary} name="plus" size={16} /><AppText style={[styles.addPlaceText, { color: themeColors.textOnPrimary }]} variant="bodyStrong">Agregar lugar</AppText></Pressable></View> : null}
          </>}
        </View>
      ) : null}
    </>
  );
});

const shadow = { elevation: 8, shadowColor: '#102416', shadowOffset: { height: 6, width: 0 }, shadowOpacity: 0.16, shadowRadius: 14 };
const useStyles = makeThemedStyles((colors) => ({
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  searchBar: { ...shadow, alignItems: 'center', backgroundColor: 'rgba(20,27,23,0.96)', borderColor: colors.border, borderRadius: radii.pill, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 7, height: 44, paddingHorizontal: spacing.md },
  searchInput: { color: colors.text, flex: 1, fontFamily: typography.bodyMedium, fontSize: 12, height: '100%', paddingVertical: 0 },
  searchResults: { ...shadow, backgroundColor: 'rgba(20,27,23,0.98)', borderColor: colors.border, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, marginRight: 52, marginTop: 2, maxHeight: 480, overflow: 'hidden' },
  searchResult: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 54, paddingHorizontal: spacing.md, paddingVertical: 8 },
  searchResultBorder: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
  searchResultIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 32, justifyContent: 'center', width: 32 },
  searchResultCopy: { flex: 1 },
  searchResultName: { fontSize: 12, lineHeight: 16 },
  searchResultAddress: { color: colors.textMuted, fontSize: 9, lineHeight: 12, marginTop: 1 },
  resultSectionTitle: { backgroundColor: colors.surfaceMuted, color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.7, paddingHorizontal: spacing.md, paddingVertical: 7 },
  tribuusResultIcon: { backgroundColor: colors.dangerSoft }, socialProof: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 8.5, marginTop: 2 }, externalHint: { color: colors.warning, fontSize: 8.5, marginTop: 2 }, distance: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 8.5 },
  searchStatus: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 54, paddingHorizontal: spacing.md },
  searchStatusText: { color: colors.textMuted, fontSize: 10 },
  searchEmpty: { color: colors.textMuted, fontSize: 10, paddingHorizontal: spacing.md, paddingVertical: spacing.lg, textAlign: 'center' },
  emptyState: { alignItems: 'center', padding: spacing.lg }, emptyQuestion: { color: colors.textMuted, fontSize: 11, marginTop: -7 }, addPlace: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: radii.pill, flexDirection: 'row', gap: 6, marginTop: 12, minHeight: 38, paddingHorizontal: 14 }, addPlaceText: { color: colors.background, fontSize: 10 },
  roundButton: { ...shadow, alignItems: 'center', backgroundColor: 'rgba(20,27,23,0.96)', borderColor: colors.border, borderRadius: radii.pill, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  pressed: { opacity: 0.68, transform: [{ scale: 0.98 }] },
}));
