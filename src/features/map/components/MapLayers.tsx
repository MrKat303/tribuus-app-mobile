import {
  CircleLayer,
  MarkerView,
  ShapeSource,
  SymbolLayer,
  type CircleLayerStyle,
  type SymbolLayerStyle,
} from '@rnmapbox/maps';
import { memo, useCallback, useMemo, type ComponentProps } from 'react';
import { Pressable, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/theme/AppearanceProvider';
import type { MapSearchPlace } from '@/features/places/data/mapboxSearch';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, typography } from '@/theme/tokens';

import type { CommunityCluster } from '../model/clustering';
import type { EventCategory, MapEvent } from '../model/map';
import { iconForEvent, markerColor } from '../ui/mapPresentation';

const categorySymbol: Record<EventCategory, string> = {
  Alerta: '!', Bar: 'B', Café: 'C', Evento: 'E', Restaurante: 'R', Servicio: 'S',
};

type MarkerProperties = {
  color: string;
  entityId: string;
  label: string;
  priority: number;
  reaction: string;
  symbol: string;
};

const eventCircleStyle: CircleLayerStyle = {
  circleColor: ['get', 'color'], circleRadius: 16, circleStrokeColor: '#FFFFFF', circleStrokeWidth: 2,
};
const eventSymbolStyle: SymbolLayerStyle = {
  symbolSortKey: ['get', 'priority'], textAllowOverlap: true, textColor: '#FFFFFF', textField: ['get', 'symbol'], textSize: 12,
};
const eventLabelStyle: SymbolLayerStyle = {
  symbolSortKey: ['get', 'priority'], textAnchor: 'top', textColor: ['get', 'color'], textField: ['get', 'label'], textHaloColor: '#FFFFFF', textHaloWidth: 1.5, textMaxWidth: 12, textOffset: [0, 1.55], textSize: 10,
};
const reactionStyle: SymbolLayerStyle = {
  textAllowOverlap: true, textField: ['get', 'reaction'], textOffset: [1.15, -1.1], textSize: 13,
};
const clusterCircleStyle: CircleLayerStyle = {
  circleColor: '#174D2B', circleRadius: 19, circleStrokeColor: '#FFFFFF', circleStrokeWidth: 2,
};
const clusterCountStyle: SymbolLayerStyle = {
  textAllowOverlap: true, textColor: '#FFFFFF', textField: ['get', 'label'], textSize: 12,
};

function makeFeature(id: string, coordinate: MapEvent['coordinate'], properties: MarkerProperties): GeoJSON.Feature<GeoJSON.Point, MarkerProperties> {
  return { geometry: { coordinates: coordinate, type: 'Point' }, id, properties, type: 'Feature' };
}

type MapLayersProps = {
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

type ShapePressEvent = Parameters<NonNullable<ComponentProps<typeof ShapeSource>['onPress']>>[0];

export const MapLayers = memo(function MapLayers({
  clusters, events, onSelectCluster, onSelectEvent, reactions, searchPlace,
  selectedClusterId, selectedEventId, zoomLevel,
}: MapLayersProps) {
  const colors = useThemeColors();
  const styles = useStyles();
  const selectedCluster = clusters.find((cluster) => cluster.id === selectedClusterId) ?? null;
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;
  const clusterById = useMemo(() => new Map(clusters.map((cluster) => [cluster.id, cluster])), [clusters]);
  const eventById = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);

  const clusterShape = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, MarkerProperties>>(() => ({
    features: clusters.filter((cluster) => cluster.id !== selectedClusterId).map((cluster) => makeFeature(cluster.id, cluster.coordinate, {
      color: '#174D2B', entityId: cluster.id, label: String(cluster.events.length), priority: cluster.events.length, reaction: '', symbol: '',
    })),
    type: 'FeatureCollection',
  }), [clusters, selectedClusterId]);

  const eventShape = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, MarkerProperties>>(() => ({
    features: events.filter((event) => event.id !== selectedEventId).map((event) => makeFeature(event.id, event.coordinate, {
      color: markerColor[event.category], entityId: event.id,
      label: zoomLevel >= 13.4 ? event.title : event.category,
      priority: event.communitySignals, reaction: reactions[event.id] ?? '', symbol: categorySymbol[event.category],
    })),
    type: 'FeatureCollection',
  }), [events, reactions, selectedEventId, zoomLevel]);

  const selectClusterFromShape = useCallback((event: ShapePressEvent) => {
    const id = event.features[0]?.properties?.entityId;
    const cluster = typeof id === 'string' ? clusterById.get(id) : undefined;
    if (cluster) onSelectCluster(cluster);
  }, [clusterById, onSelectCluster]);

  const selectEventFromShape = useCallback((event: ShapePressEvent) => {
    const id = event.features[0]?.properties?.entityId;
    const mapEvent = typeof id === 'string' ? eventById.get(id) : undefined;
    if (mapEvent) onSelectEvent(mapEvent);
  }, [eventById, onSelectEvent]);

  return (
    <>
      <ShapeSource id="community-clusters" onPress={selectClusterFromShape} shape={clusterShape}>
        <CircleLayer id="community-cluster-circles" style={clusterCircleStyle} />
        <SymbolLayer id="community-cluster-counts" style={clusterCountStyle} />
      </ShapeSource>
      <ShapeSource id="map-events" onPress={selectEventFromShape} shape={eventShape}>
        <CircleLayer id="map-event-circles" style={eventCircleStyle} />
        <SymbolLayer id="map-event-symbols" style={eventSymbolStyle} />
        <SymbolLayer id="map-event-reactions" style={reactionStyle} />
        <SymbolLayer id="map-event-labels" minZoomLevel={13.4} style={eventLabelStyle} />
      </ShapeSource>

      {selectedCluster ? (
        <MarkerView coordinate={selectedCluster.coordinate} key={selectedCluster.id}>
          <Pressable accessibilityLabel={`${selectedCluster.events.length} lugares recomendados`} onPress={() => onSelectCluster(selectedCluster)} style={styles.clusterWrap}>
            <View style={styles.clusterMarker}><AppText style={styles.clusterCount} variant="caption">{selectedCluster.events.length}</AppText></View>
            <View style={styles.clusterBreakdown}>
              {selectedCluster.breakdown.map((item) => <AppText key={item.category} style={styles.clusterBreakdownText} variant="caption">{item.category} · {item.count}</AppText>)}
              <AppText style={styles.clusterHint} variant="caption">Acércate para verlos</AppText>
            </View>
          </Pressable>
        </MarkerView>
      ) : null}

      {selectedEvent ? (
        <MarkerView coordinate={selectedEvent.coordinate} key={selectedEvent.id}>
          <Pressable accessibilityLabel={selectedEvent.title} onPress={() => onSelectEvent(selectedEvent)} style={styles.selectedMarker}>
            {reactions[selectedEvent.id] ? <AppText style={styles.selectedReaction}>{reactions[selectedEvent.id]}</AppText> : null}
            <View style={[styles.selectedMarkerCircle, { backgroundColor: markerColor[selectedEvent.category] }]}><AppIcon color={colors.surface} name={iconForEvent(selectedEvent)} size={16} /></View>
            <AppText numberOfLines={1} style={[styles.selectedLabel, { color: markerColor[selectedEvent.category] }]} variant="caption">{selectedEvent.title}</AppText>
          </Pressable>
        </MarkerView>
      ) : null}

      {searchPlace ? (
        <MarkerView coordinate={searchPlace.coordinate}>
          <View style={styles.searchMarker}>
            <View style={styles.searchMarkerIcon}><AppIcon color="#FFFFFF" name="map-pin" size={17} /></View>
            <View style={styles.searchMarkerLabel}><AppText numberOfLines={1} style={styles.searchMarkerText} variant="caption">{searchPlace.name}</AppText></View>
          </View>
        </MarkerView>
      ) : null}
    </>
  );
});

const shadow = { elevation: 3, shadowColor: '#1B211A', shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.08, shadowRadius: 8 };
const useStyles = makeThemedStyles((colors) => ({
  clusterWrap: { alignItems: 'center', minWidth: 62, position: 'relative' },
  clusterMarker: { ...shadow, alignItems: 'center', backgroundColor: '#174D2B', borderColor: '#FFFFFF', borderRadius: radii.pill, borderWidth: 2, height: 40, justifyContent: 'center', width: 40 },
  clusterCount: { color: '#FFFFFF', fontFamily: typography.bodySemiBold, fontSize: 12 },
  clusterBreakdown: { ...shadow, backgroundColor: 'rgba(255,255,255,0.98)', borderColor: 'rgba(23,77,43,0.14)', borderRadius: 12, borderWidth: 1, gap: 4, left: -28, minWidth: 132, paddingHorizontal: 10, paddingVertical: 8, position: 'absolute', top: 47, zIndex: 8 },
  clusterBreakdownText: { color: colors.text, fontFamily: typography.bodyMedium, fontSize: 9, lineHeight: 12 },
  clusterHint: { color: colors.textMuted, fontSize: 8, lineHeight: 11, marginTop: 2 },
  selectedMarker: { alignItems: 'center', minHeight: 52, minWidth: 64, position: 'relative' },
  selectedMarkerCircle: { ...shadow, alignItems: 'center', borderColor: colors.surface, borderRadius: radii.pill, borderWidth: 2, height: 36, justifyContent: 'center', width: 36 },
  selectedLabel: { fontFamily: typography.bodySemiBold, fontSize: 9, lineHeight: 11, marginTop: 3, maxWidth: 112, textAlign: 'center', textShadowColor: '#FFFFFF', textShadowOffset: { height: 0, width: 0 }, textShadowRadius: 4 },
  selectedReaction: { fontSize: 13, position: 'absolute', right: 0, top: -8, zIndex: 4 },
  searchMarker: { alignItems: 'center', minWidth: 76 },
  searchMarkerIcon: { ...shadow, alignItems: 'center', backgroundColor: '#7357C8', borderColor: '#FFFFFF', borderRadius: radii.pill, borderWidth: 2, height: 36, justifyContent: 'center', width: 36, zIndex: 2 },
  searchMarkerLabel: { ...shadow, backgroundColor: '#EDE7FF', borderColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, marginTop: -7, maxWidth: 150, paddingBottom: 5, paddingHorizontal: 9, paddingTop: 8 },
  searchMarkerText: { color: '#3E2D73', fontFamily: typography.bodySemiBold, fontSize: 9, lineHeight: 12, textAlign: 'center' },
}));
