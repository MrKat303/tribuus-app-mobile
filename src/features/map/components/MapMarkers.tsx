import { MarkerView } from '@rnmapbox/maps';
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/context/AppearanceContext';
import type { MapSearchPlace } from '@/services/mapboxSearch';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, typography } from '@/theme/tokens';

import type { CommunityCluster } from '../model/clustering';
import { iconForEvent, markerColor, type EventCategory, type MapEvent } from '../model/map';

const markerShape: Record<EventCategory, ViewStyle> = {
  Alerta: { borderRadius: 8, height: 35, width: 35 },
  Bar: { borderRadius: radii.pill, height: 31, width: 31 },
  Café: { borderRadius: radii.pill, height: 31, width: 31 },
  Evento: { borderRadius: 13, height: 33, width: 33 },
  Restaurante: { borderRadius: 11, height: 33, width: 33 },
  Servicio: { borderRadius: 7, height: 32, width: 32 },
};

const categoryEmoji: Record<EventCategory, string> = {
  Alerta: '⚠️', Bar: '🍸', Café: '☕', Evento: '📅', Restaurante: '🍴', Servicio: '🔧',
};

type MapMarkersProps = {
  clusters: CommunityCluster[];
  events: MapEvent[];
  onSelectCluster: (cluster: CommunityCluster) => void;
  onSelectEvent: (event: MapEvent) => void;
  reactions: Record<string, string>;
  searchPlace: MapSearchPlace | null;
  selectedClusterId: string | null;
  selectedEventId: string;
  zoomLevel: number;
};

export const MapMarkers = memo(function MapMarkers({
  clusters,
  events,
  onSelectCluster,
  onSelectEvent,
  reactions,
  searchPlace,
  selectedClusterId,
  selectedEventId,
  zoomLevel,
}: MapMarkersProps) {
  const colors = useThemeColors();
  const styles = useStyles();
  return (
    <>
      {clusters.map((cluster) => {
        const selected = selectedClusterId === cluster.id;
        return (
          <MarkerView coordinate={cluster.coordinate} key={cluster.id}>
            <Pressable accessibilityLabel={`${cluster.events.length} lugares recomendados`} onPress={() => onSelectCluster(cluster)} style={styles.clusterWrap}>
              <View style={[styles.clusterMarker]}>
                <AppText style={styles.clusterEmoji}>🍴</AppText>
                <AppText style={styles.clusterCount} variant="caption">{cluster.events.length}</AppText>
              </View>
              <AppText style={[styles.clusterLabel]} variant="caption">lugares</AppText>
              {selected ? (
                <View style={[styles.clusterBreakdown]}>
                  {cluster.breakdown.map((item) => (
                    <View key={item.category} style={styles.clusterBreakdownRow}>
                      <AppText style={styles.clusterBreakdownEmoji}>{categoryEmoji[item.category]}</AppText>
                      <AppText style={styles.clusterBreakdownText} variant="caption">{item.category} · {item.count}</AppText>
                    </View>
                  ))}
                  <AppText style={styles.clusterHint} variant="caption">Acércate para verlos</AppText>
                </View>
              ) : null}
            </Pressable>
          </MarkerView>
        );
      })}
      {events.map((event) => (
        <MarkerView coordinate={event.coordinate} key={event.id}>
          <Pressable onPress={() => onSelectEvent(event)} style={[styles.markerWrap, selectedEventId === event.id && styles.markerSelected]}>
            {reactions[event.id] ? (
              <View style={[styles.mapReactionBadge]}>
                <AppText style={styles.mapReactionEmoji}>{reactions[event.id]}</AppText>
              </View>
            ) : null}
            <View style={[styles.markerIconCircle, markerShape[event.category], { backgroundColor: markerColor[event.category] }]}>
              <AppIcon color={colors.surface} name={iconForEvent(event)} size={event.category === 'Alerta' ? 17 : 15} />
            </View>
            <View style={[styles.markerLabel]}>
              <AppText numberOfLines={1} style={[styles.markerLabelText, { color: markerColor[event.category] }]} variant="caption">
                {zoomLevel >= 13.4 ? event.title : event.category}
              </AppText>
            </View>
          </Pressable>
        </MarkerView>
      ))}
      {searchPlace ? (
        <MarkerView coordinate={searchPlace.coordinate}>
          <View style={styles.searchMarker}>
            <View style={[styles.searchMarkerIcon]}>
              <AppIcon color={'#FFFFFF'} name="map-pin" size={17} />
            </View>
            <View style={[styles.searchMarkerLabel]}>
              <AppText numberOfLines={1} style={styles.searchMarkerText} variant="caption">{searchPlace.name}</AppText>
            </View>
          </View>
        </MarkerView>
      ) : null}
    </>
  );
});

const shadow = { elevation: 3, shadowColor: '#1B211A', shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.08, shadowRadius: 8 };
const useStyles = makeThemedStyles((colors) => ({
  clusterWrap: { alignItems: 'center', minWidth: 62, position: 'relative' },
  clusterMarker: { ...shadow, alignItems: 'center', backgroundColor: '#174D2B', borderColor: '#FFFFFF', borderRadius: radii.pill, borderWidth: 2, flexDirection: 'row', gap: 4, height: 36, justifyContent: 'center', paddingHorizontal: 10 },
  clusterEmoji: { fontSize: 14, lineHeight: 17 },
  clusterCount: { color: '#FFFFFF', fontFamily: typography.bodySemiBold, fontSize: 12 },
  clusterLabel: { color: '#174D2B', fontFamily: typography.bodySemiBold, fontSize: 9, lineHeight: 11, marginTop: 2, textShadowColor: '#FFFFFF', textShadowOffset: { height: 0, width: 0 }, textShadowRadius: 4 },
  clusterBreakdown: { ...shadow, backgroundColor: 'rgba(255,255,255,0.98)', borderColor: 'rgba(23,77,43,0.14)', borderRadius: 12, borderWidth: 1, gap: 4, left: -28, minWidth: 132, paddingHorizontal: 10, paddingVertical: 8, position: 'absolute', top: 53, zIndex: 8 },
  clusterBreakdownRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  clusterBreakdownEmoji: { fontSize: 11, lineHeight: 14 },
  clusterBreakdownText: { color: colors.text, fontFamily: typography.bodyMedium, fontSize: 9, lineHeight: 12 },
  clusterHint: { color: colors.textMuted, fontSize: 8, lineHeight: 11, marginTop: 2 },
  markerWrap: { alignItems: 'center', minHeight: 49, minWidth: 58, paddingBottom: 3, position: 'relative' },
  mapReactionBadge: { ...shadow, alignItems: 'center', backgroundColor: colors.surface, borderColor: '#FFFFFF', borderRadius: radii.pill, borderWidth: 1.5, height: 23, justifyContent: 'center', position: 'absolute', right: 3, top: -7, width: 23, zIndex: 4 },
  mapReactionEmoji: { fontSize: 12, lineHeight: 15 },
  markerIconCircle: { ...shadow, alignItems: 'center', borderColor: colors.surface, borderWidth: 2, justifyContent: 'center', zIndex: 2 },
  markerLabel: { marginTop: 3, maxWidth: 112, minWidth: 52, paddingHorizontal: 3 },
  markerLabelText: { fontFamily: typography.bodySemiBold, fontSize: 9, lineHeight: 11, textAlign: 'center', textShadowColor: 'rgba(255,255,255,0.98)', textShadowOffset: { height: 0, width: 0 }, textShadowRadius: 4 },
  markerSelected: { transform: [{ scale: 1.06 }] },
  searchMarker: { alignItems: 'center', minWidth: 76 },
  searchMarkerIcon: { ...shadow, alignItems: 'center', backgroundColor: '#7357C8', borderColor: '#FFFFFF', borderRadius: radii.pill, borderWidth: 2, height: 36, justifyContent: 'center', width: 36, zIndex: 2 },
  searchMarkerLabel: { ...shadow, backgroundColor: '#EDE7FF', borderColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, marginTop: -7, maxWidth: 150, paddingBottom: 5, paddingHorizontal: 9, paddingTop: 8 },
  searchMarkerText: { color: '#3E2D73', fontFamily: typography.bodySemiBold, fontSize: 9, lineHeight: 12, textAlign: 'center' },
}));
