import Mapbox, { Camera, LocationPuck, MapView } from '@rnmapbox/maps';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/context/AppearanceContext';
import { usePlaces } from '@/context/PlacesContext';
import { ManualPlaceComposer } from '@/features/places/components/ManualPlaceComposer';
import { PlaceCard } from '@/features/places/components/PlaceCard';
import { RecommendationComposer } from '@/features/places/components/RecommendationComposer';
import { categoryFromMapbox, normalizePlaceName, type ExternalPlaceCandidate, type RecommendationDraft, type TribuusPlace } from '@/features/places/model/place';
import { placeRankingScore, placeVisualBudget } from '@/features/places/model/ranking';
import { mapStyles } from '@/theme/mapStyle';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

import { MapFilters } from '../components/MapFilters';
import { MapMarkers } from '../components/MapMarkers';
import { MapSearch } from '../components/MapSearch';
import { useMapCamera } from '../hooks/useMapCamera';
import { useMapSearch } from '../hooks/useMapSearch';
import { useUserLocation } from '../hooks/useUserLocation';
import { clusterCommunityPlaces, communityVisualBudget, type CommunityCluster, nowVisualBudget } from '../model/clustering';
import {
  communitySignalLabel,
  contentKindForEvent,
  COUNTRY_CAMERA_BOUNDS,
  COUNTRY_MIN_ZOOM,
  distanceInKm,
  DEFAULT_MAP_ZOOM,
  EVENT_MARKER_MIN_ZOOM,
  FRIENDS_NEARBY,
  iconForEvent,
  INITIAL_EVENTS,
  MAPBOX_TOKEN,
  type MapEvent,
  type EventCategory,
  type MapFilter,
  markerBackground,
  markerColor,
  PLACE_REACTIONS,
  SANTIAGO,
} from '../model/map';
import { mapRelevanceScore } from '../model/relevance';

const placeEventCategory: Record<TribuusPlace['providerData']['category'], EventCategory> = {
  Bar: 'Bar', Cafetería: 'Café', Comercio: 'Servicio', Otro: 'Servicio', Panadería: 'Café', Restaurante: 'Restaurante',
};
const mapboxCategories: Partial<Record<MapFilter, string[]>> = { Bar: ['bar', 'pub'], Café: ['coffee_shop', 'cafe'], Restaurante: ['restaurant'] };

function placeAsMapEvent(place: TribuusPlace): MapEvent {
  return { category: placeEventCategory[place.providerData.category], communitySignals: place.popularity, coordinate: place.providerData.coordinate, date: `${place.popularity} recomendaciones`, freshnessScore: 0.9, id: place.id, location: place.providerData.neighborhood ?? place.providerData.address, personalizationScore: place.localRelevance, qualityScore: place.recommendations.reduce((sum, item) => sum + item.confidence, 0) / Math.max(1, place.recommendations.length), title: place.providerData.name };
}

type RecommendationTarget = { candidate: ExternalPlaceCandidate; kind: 'external' } | { kind: 'tribuus'; place: TribuusPlace };

Mapbox.setAccessToken(MAPBOX_TOKEN);

export function MapScreen() {
  const { colors: themeColors, themeMode } = useAppAppearance();
  const styles = useStyles();
  const { createCommunityPlace, findPotentialDuplicates, places, recommendExternalPlace, recommendPlace, searchPlaces } = usePlaces();
  const insets = useSafeAreaInsets();
  const bottomNavigationOffset = Math.max(insets.bottom, 12) + 80;
  const nearbySheetOffset = bottomNavigationOffset + 12;
  const mapCreditsOffset = Math.max(insets.bottom, 12) + 4;
  const { cameraRef, handleCameraChanged, mapCenter, mapCenterRef, moveCamera, zoomLevel } = useMapCamera();
  const { locateUser, locationGranted, userCoordinate } = useUserLocation(moveCamera);
  const [activeFilter, setActiveFilter] = useState<MapFilter>('Todos');
  const getSearchProximity = useCallback(() => userCoordinate ?? mapCenterRef.current, [mapCenterRef, userCoordinate]);
  const {
    changeQuery,
    clearSearch,
    focused: searchFocused,
    loading: searchLoading,
    query: searchQuery,
    selectSuggestion,
    setFocused: setSearchFocused,
    suggestions: searchSuggestions,
  } = useMapSearch({ categories: mapboxCategories[activeFilter], getProximity: getSearchProximity, moveCamera });
  const socialPlaces = useMemo(() => places
    .filter((place) => place.status === 'active' && place.recommendations.length > 0)
    .sort((first, second) => placeRankingScore(second, mapCenter) - placeRankingScore(first, mapCenter))
    .slice(0, placeVisualBudget(zoomLevel)), [mapCenter, places, zoomLevel]);
  const events = useMemo(() => [
    ...INITIAL_EVENTS.filter((event) => event.category !== 'Café' && event.category !== 'Restaurante' && event.category !== 'Bar'),
    ...socialPlaces.map(placeAsMapEvent),
  ], [socialPlaces]);
  const [selectedEvent, setSelectedEvent] = useState<MapEvent>(INITIAL_EVENTS[0]);
  const [selectedPlace, setSelectedPlace] = useState<TribuusPlace | null>(null);
  const [recommendationTarget, setRecommendationTarget] = useState<RecommendationTarget | null>(null);
  const [manualComposerVisible, setManualComposerVisible] = useState(false);
  const [placeReactions, setPlaceReactions] = useState<Record<string, string>>({});
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const tribuusSearchResults = useMemo(() => searchPlaces(searchQuery)
    .sort((first, second) => {
      const firstMatchesFilter = activeFilter === 'Todos' || placeEventCategory[first.providerData.category] === activeFilter;
      const secondMatchesFilter = activeFilter === 'Todos' || placeEventCategory[second.providerData.category] === activeFilter;
      if (firstMatchesFilter !== secondMatchesFilter) return secondMatchesFilter ? 1 : -1;
      return placeRankingScore(second, userCoordinate ?? mapCenter) - placeRankingScore(first, userCoordinate ?? mapCenter);
    }), [activeFilter, mapCenter, searchPlaces, searchQuery, userCoordinate]);
  const externalSearchSuggestions = useMemo(() => {
    const knownProviderIds = new Set(places.map((place) => place.providerData.mapboxId).filter(Boolean));
    const seen = new Set<string>();
    return searchSuggestions.filter((suggestion) => {
      if (knownProviderIds.has(suggestion.mapbox_id)) return false;
      const fallbackKey = `${normalizePlaceName(suggestion.name)}|${normalizePlaceName(suggestion.place_formatted)}`;
      const key = suggestion.mapbox_id || fallbackKey;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 3);
  }, [places, searchSuggestions]);

  const visibleEvents = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('es');
    return events
      .filter((event) => {
        const matchesFilter = activeFilter === 'Todos' || event.category === activeFilter;
        const searchableText = `${event.title} ${event.location} ${event.category}`.toLocaleLowerCase('es');
        return matchesFilter && (!query || searchableText.includes(query));
      })
      .sort((first, second) => mapRelevanceScore(second, { exploredCenter: mapCenter, userCoordinate })
        - mapRelevanceScore(first, { exploredCenter: mapCenter, userCoordinate }));
  }, [activeFilter, events, mapCenter, searchQuery, userCoordinate]);

  const displayedEvent = visibleEvents.find((event) => event.id === selectedEvent.id) ?? visibleEvents[0];
  const { clusters: communityClusters, markerEvents } = useMemo(() => {
    if (zoomLevel < EVENT_MARKER_MIN_ZOOM) return { clusters: [], markerEvents: [] };

    const communityEvents = visibleEvents.filter((event) => contentKindForEvent(event) === 'community-discovery');
    const nowOrigin = userCoordinate ?? mapCenter;
    const nowEvents = visibleEvents
      .filter((event) => contentKindForEvent(event) === 'activity')
      .filter((event) => distanceInKm(nowOrigin, event.coordinate) <= 6);
    const clusteredCommunity = clusterCommunityPlaces(communityEvents, zoomLevel);
    const communityBudget = communityVisualBudget(zoomLevel);
    const visibleClusters = clusteredCommunity.clusters.slice(0, communityBudget);
    const remainingCommunitySlots = Math.max(0, communityBudget - visibleClusters.length);

    return {
      clusters: visibleClusters,
      markerEvents: [
        ...nowEvents.slice(0, nowVisualBudget(zoomLevel)),
        ...clusteredCommunity.singles.slice(0, remainingCommunitySlots),
      ],
    };
  }, [mapCenter, userCoordinate, visibleEvents, zoomLevel]);
  const nearbyRadiusKm = zoomLevel >= 15 ? 0.75 : zoomLevel >= 14.3 ? 1.25 : 2;
  const nearbyEvents = useMemo(
    () => markerEvents.filter((event) => distanceInKm(mapCenter, event.coordinate) <= nearbyRadiusKm),
    [mapCenter, markerEvents, nearbyRadiusKm],
  );
  const selectedNearby = nearbyEvents.find((event) => event.id === selectedEvent.id) ?? nearbyEvents[0];
  const selectedDistance = selectedNearby ? distanceInKm(mapCenter, selectedNearby.coordinate) : 0;
  const currentSelectedPlace = selectedPlace ? places.find((place) => place.id === selectedPlace.id) ?? selectedPlace : null;

  const selectEvent = useCallback((event: MapEvent) => {
    setSelectedClusterId(null);
    setSelectedEvent(event);
    setSelectedPlace(places.find((place) => place.id === event.id) ?? null);
  }, [places]);
  const selectTribuusPlace = useCallback((place: TribuusPlace) => {
    setSelectedPlace(place);
    setSelectedEvent(placeAsMapEvent(place));
    setSearchFocused(false);
    moveCamera({ animationDuration: 700, animationMode: 'flyTo', centerCoordinate: place.providerData.coordinate, zoomLevel: Math.max(zoomLevel, 15.6) });
  }, [moveCamera, setSearchFocused, zoomLevel]);
  const selectExternalSuggestion = useCallback(async (suggestion: (typeof searchSuggestions)[number]) => {
    const result = await selectSuggestion(suggestion);
    if (!result) return;
    setRecommendationTarget({ candidate: { address: result.label, category: categoryFromMapbox(result.poiCategories), coordinate: result.coordinate, mapboxId: result.id, name: result.name, provider: 'mapbox', rawCategory: result.poiCategories.join(', ') }, kind: 'external' });
  }, [selectSuggestion]);
  const handleSearchSubmit = useCallback(() => {
    if (tribuusSearchResults[0]) selectTribuusPlace(tribuusSearchResults[0]);
    else if (externalSearchSuggestions[0]) void selectExternalSuggestion(externalSearchSuggestions[0]);
    else if (displayedEvent) moveCamera({ animationDuration: 600, animationMode: 'flyTo', centerCoordinate: displayedEvent.coordinate, zoomLevel: Math.max(zoomLevel, EVENT_MARKER_MIN_ZOOM) });
  }, [displayedEvent, externalSearchSuggestions, moveCamera, selectExternalSuggestion, selectTribuusPlace, tribuusSearchResults, zoomLevel]);
  const selectCluster = useCallback((cluster: CommunityCluster) => {
    setSelectedClusterId((current) => current === cluster.id ? null : cluster.id);
  }, []);
  const handleLocate = useCallback(() => void locateUser(), [locateUser]);
  const focusSearch = useCallback(() => setSearchFocused(true), [setSearchFocused]);
  const submitRecommendation = useCallback((draft: RecommendationDraft) => {
    if (!recommendationTarget) return;
    if (recommendationTarget.kind === 'external') recommendExternalPlace(recommendationTarget.candidate, draft);
    else recommendPlace(recommendationTarget.place.id, draft);
    setRecommendationTarget(null);
  }, [recommendExternalPlace, recommendPlace, recommendationTarget]);

  return (
    <View style={styles.container}>
      <MapView
        attributionEnabled={false}
        compassEnabled={false}
        localizeLabels={{ locale: 'es' }}
        logoEnabled
        logoPosition={{ bottom: mapCreditsOffset, left: 8 }}
        onCameraChanged={handleCameraChanged}
        projection="mercator"
        rotateEnabled={false}
        scaleBarEnabled={false}
        style={StyleSheet.absoluteFill}
        styleJSON={mapStyles[themeMode]}>
        <Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: SANTIAGO, zoomLevel: DEFAULT_MAP_ZOOM }}
          maxBounds={COUNTRY_CAMERA_BOUNDS}
          minZoomLevel={COUNTRY_MIN_ZOOM}
        />
        {locationGranted && Platform.OS !== 'web' ? <LocationPuck pulsing={{ color: '#00BFF3', isEnabled: true, radius: 24 }} scale={1.2} /> : null}
        <MapMarkers
          clusters={communityClusters}
          events={markerEvents}
          onSelectCluster={selectCluster}
          onSelectEvent={selectEvent}
          reactions={placeReactions}
          searchPlace={null}
          selectedClusterId={selectedClusterId}
          selectedEventId={selectedEvent.id}
          zoomLevel={zoomLevel}
        />
      </MapView>

      <SafeAreaView edges={['top', 'left', 'right']} pointerEvents="box-none" style={styles.topOverlay}>
        <MapSearch
          focused={searchFocused}
          loading={searchLoading}
          onChangeQuery={changeQuery}
          onClear={clearSearch}
          onFocus={focusSearch}
          onLocate={handleLocate}
          onAddPlace={() => setManualComposerVisible(true)}
          onSelectSuggestion={(suggestion) => void selectExternalSuggestion(suggestion)}
          onSelectTribuusPlace={selectTribuusPlace}
          onSubmit={handleSearchSubmit}
          origin={userCoordinate ?? mapCenter}
          query={searchQuery}
          suggestions={externalSearchSuggestions}
          tribuusPlaces={tribuusSearchResults}
        />
        <MapFilters activeFilter={activeFilter} onChange={setActiveFilter} />
      </SafeAreaView>

      {zoomLevel >= 13.7 && currentSelectedPlace ? (
        <View style={[styles.nearbySheet, { bottom: nearbySheetOffset }]}>
          <PlaceCard
            distanceKm={distanceInKm(userCoordinate ?? mapCenter, currentSelectedPlace.providerData.coordinate)}
            onRecommend={() => setRecommendationTarget({ kind: 'tribuus', place: currentSelectedPlace })}
            onView={() => Alert.alert(currentSelectedPlace.providerData.name, `${currentSelectedPlace.providerData.address}\n\n${currentSelectedPlace.recommendations.map((item) => `“${item.text}” — ${item.authorName}`).join('\n\n')}`)}
            place={currentSelectedPlace}
          />
        </View>
      ) : zoomLevel >= 13.7 && selectedNearby ? (
        <View style={[styles.nearbySheet, { bottom: nearbySheetOffset }]}>
          <View style={[styles.placeCard, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
            <View style={styles.placeHeader}>
              <View style={[styles.placeAvatar, { backgroundColor: markerBackground[selectedNearby.category] }]}>
                <AppIcon color={markerColor[selectedNearby.category]} name={iconForEvent(selectedNearby)} size={18} />
              </View>
              <View style={styles.placeHeadingCopy}>
                <View style={styles.placeTitleRow}>
                  <AppText numberOfLines={1} style={styles.placeTitle} variant="bodyStrong">{selectedNearby.title}</AppText>
                  {placeReactions[selectedNearby.id] ? <AppText style={styles.cardReactionEmoji}>{placeReactions[selectedNearby.id]}</AppText> : null}
                </View>
                <AppText style={styles.placeCategory} variant="caption">{selectedNearby.category}{selectedNearby.alertKind ? ` · ${selectedNearby.alertKind}` : ''} · {selectedDistance.toFixed(1)} km</AppText>
                <View style={styles.communityProof}>
                  <AppIcon
                    color={contentKindForEvent(selectedNearby) === 'activity' ? markerColor[selectedNearby.category] : '#D94A4A'}
                    filled={contentKindForEvent(selectedNearby) === 'community-discovery'}
                    name={contentKindForEvent(selectedNearby) === 'activity' ? 'alert-circle' : 'heart'}
                    size={12}
                  />
                  <AppText style={styles.communityProofText} variant="caption">{communitySignalLabel(selectedNearby)}</AppText>
                </View>
              </View>
              <View style={[styles.nearbyCount]}><AppText style={styles.nearbyCountText} variant="caption">{nearbyEvents.length}</AppText></View>
            </View>
            <View style={styles.placeMeta}>
              <View style={styles.metaRow}><AppIcon color={themeColors.textMuted} name="map-pin" size={12} /><AppText numberOfLines={1} style={styles.metaText} variant="caption">{selectedNearby.location}, Santiago</AppText></View>
              <View style={styles.metaRow}><AppIcon color={themeColors.primaryDark} name="clock" size={12} /><AppText numberOfLines={1} style={styles.openText} variant="caption">{selectedNearby.date}</AppText></View>
            </View>
            <View style={styles.socialRow}>
              <View style={styles.friendsBlock}>
                <AppText style={styles.socialLabel} variant="caption">Amigos que fueron</AppText>
                <View style={styles.friendAvatars}>{FRIENDS_NEARBY.map((friend, index) => <View key={friend} style={[styles.friendAvatar, index > 0 && styles.friendAvatarOverlap]}><AppText style={styles.friendInitials} variant="caption">{friend}</AppText></View>)}</View>
              </View>
              <View style={styles.reactionsBlock}>
                <AppText style={styles.socialLabel} variant="caption">Reacciona</AppText>
                <View style={styles.reactionRow}>
                  {PLACE_REACTIONS.map((emoji) => {
                    const selected = placeReactions[selectedNearby.id] === emoji;
                    return <Pressable accessibilityLabel={`Reaccionar con ${emoji}`} hitSlop={6} key={emoji} onPress={() => setPlaceReactions((current) => ({ ...current, [selectedNearby.id]: selected ? '' : emoji }))} style={({ pressed }) => [styles.reactionButton, selected && styles.reactionButtonSelected, pressed && styles.pressed]}><AppText style={styles.reactionEmoji}>{emoji}</AppText></Pressable>;
                  })}
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {recommendationTarget ? <RecommendationComposer
        onClose={() => setRecommendationTarget(null)}
        onSubmit={submitRecommendation}
        placeName={recommendationTarget.kind === 'external' ? recommendationTarget.candidate.name : recommendationTarget.place.providerData.name}
        visible
      /> : null}
      {manualComposerVisible ? <ManualPlaceComposer
        findDuplicates={findPotentialDuplicates}
        initialCoordinate={mapCenter}
        onClose={() => setManualComposerVisible(false)}
        onCreate={(draft, recommendation) => { createCommunityPlace(draft, recommendation); setManualComposerVisible(false); }}
        onRecommendExisting={(place) => { setManualComposerVisible(false); setRecommendationTarget({ kind: 'tribuus', place }); }}
        visible
      /> : null}

      <Pressable accessibilityLabel="Información del mapa" onPress={() => void Linking.openURL('https://www.mapbox.com/about/maps/')} style={[styles.mapAttribution, { bottom: mapCreditsOffset }]}>
        <AppText style={styles.mapAttributionText} variant="caption">mapbox · © OpenStreetMap</AppText>
      </Pressable>
    </View>
  );
}

const shadow = { elevation: 3, shadowColor: '#1B211A', shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.08, shadowRadius: 8 };
const useStyles = makeThemedStyles((colors) => ({
  container: { backgroundColor: colors.background, flex: 1 },
  topOverlay: { gap: 5, left: 0, paddingHorizontal: spacing.sm, paddingTop: 5, position: 'absolute', right: 0 },
  nearbySheet: { left: spacing.sm, position: 'absolute', right: spacing.sm },
  placeCard: { ...shadow, backgroundColor: 'rgba(20,27,23,0.98)', borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md },
  placeHeader: { alignItems: 'center', flexDirection: 'row' },
  placeAvatar: { alignItems: 'center', borderRadius: radii.pill, height: 46, justifyContent: 'center', marginRight: spacing.sm, width: 46 },
  placeHeadingCopy: { flex: 1 },
  placeTitleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  placeTitle: { flex: 1, fontSize: 14 },
  placeCategory: { color: colors.textMuted, fontSize: 10, lineHeight: 13, marginTop: 1 },
  communityProof: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 4 },
  communityProofText: { color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 9, lineHeight: 12 },
  nearbyCount: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 24, justifyContent: 'center', minWidth: 24, paddingHorizontal: 6 },
  nearbyCountText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 10 },
  cardReactionEmoji: { fontSize: 18, lineHeight: 21 },
  placeMeta: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, gap: 5, marginTop: spacing.sm, paddingBottom: spacing.sm },
  metaRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  metaText: { color: colors.textMuted, flex: 1, fontSize: 10 },
  openText: { color: colors.primaryDark, flex: 1, fontFamily: typography.bodyMedium, fontSize: 10 },
  socialRow: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  friendsBlock: { flex: 1 },
  reactionsBlock: { alignItems: 'flex-end' },
  socialLabel: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 9, marginBottom: 5 },
  friendAvatars: { alignItems: 'center', flexDirection: 'row' },
  friendAvatar: { alignItems: 'center', backgroundColor: colors.warm, borderColor: colors.surface, borderRadius: radii.pill, borderWidth: 2, height: 30, justifyContent: 'center', width: 30 },
  friendAvatarOverlap: { marginLeft: -7 },
  friendInitials: { color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 7 },
  reactionRow: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  reactionButton: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderColor: 'transparent', borderRadius: radii.pill, borderWidth: 1, height: 28, justifyContent: 'center', width: 28 },
  reactionButtonSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  reactionEmoji: { fontSize: 15, lineHeight: 19 },
  pressed: { opacity: 0.68, transform: [{ scale: 0.98 }] },
  mapAttribution: { backgroundColor: 'rgba(20,27,23,0.72)', borderRadius: 3, left: 70, opacity: 0.72, paddingHorizontal: 3, paddingVertical: 1, position: 'absolute' },
  mapAttributionText: { color: '#72786F', fontSize: 7, lineHeight: 9 },
}));
