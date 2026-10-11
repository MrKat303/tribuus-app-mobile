import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { placesRepository } from '@/features/places/data/supabase-places-repository';
import type { CommunityPlaceDraft, ExternalPlaceCandidate, RecommendationDraft, TribuusPlace } from '@/features/places/model/place';
import { normalizePlaceName } from '@/features/places/model/place';
import { distanceInKm, type BoundingBox } from '@/shared/geo';

type PlacesContextValue = {
  createCommunityPlace: (draft: CommunityPlaceDraft, recommendation: RecommendationDraft) => Promise<void>;
  findPotentialDuplicates: (name: string, coordinate: CommunityPlaceDraft['coordinate']) => TribuusPlace[];
  loadPlacesInView: (bounds: BoundingBox) => Promise<void>;
  places: TribuusPlace[];
  recommendExternalPlace: (candidate: ExternalPlaceCandidate, recommendation: RecommendationDraft) => Promise<void>;
  recommendPlace: (placeId: string, recommendation: RecommendationDraft) => Promise<void>;
  searchPlaces: (query: string) => TribuusPlace[];
};

const PlacesContext = createContext<PlacesContextValue | null>(null);

function nameSimilarity(first: string, second: string) {
  const firstTokens = new Set(normalizePlaceName(first).split(' ').filter(Boolean));
  const secondTokens = new Set(normalizePlaceName(second).split(' ').filter(Boolean));
  const intersection = [...firstTokens].filter((token) => secondTokens.has(token)).length;
  return intersection / Math.max(1, new Set([...firstTokens, ...secondTokens]).size);
}

export function PlacesProvider({ children }: PropsWithChildren) {
  const [places, setPlaces] = useState<TribuusPlace[]>([]);
  const lastBounds = useRef<BoundingBox | null>(null);
  const loadRequestId = useRef(0);

  const loadPlacesInView = useCallback(async (bounds: BoundingBox) => {
    const requestId = ++loadRequestId.current;
    lastBounds.current = bounds;
    const nextPlaces = await placesRepository.listPlacesInView(bounds);
    if (requestId === loadRequestId.current) setPlaces(nextPlaces);
  }, []);

  const refresh = useCallback(async () => {
    if (lastBounds.current) await loadPlacesInView(lastBounds.current);
  }, [loadPlacesInView]);

  const searchPlaces = useCallback((query: string) => {
    const normalized = normalizePlaceName(query);
    if (normalized.length < 2) return [];
    return places.filter((place) => normalizePlaceName(`${place.providerData.name} ${place.providerData.category} ${place.providerData.neighborhood ?? ''}`).includes(normalized));
  }, [places]);

  const findPotentialDuplicates = useCallback((name: string, coordinate: CommunityPlaceDraft['coordinate']) => places
    .filter((place) => distanceInKm(coordinate, place.providerData.coordinate) <= 0.6 && nameSimilarity(name, place.providerData.name) >= 0.34)
    .sort((first, second) => distanceInKm(coordinate, first.providerData.coordinate) - distanceInKm(coordinate, second.providerData.coordinate)), [places]);

  const recommendPlace = useCallback(async (placeId: string, recommendation: RecommendationDraft) => {
    await placesRepository.recommendPlace(placeId, recommendation);
    await refresh();
  }, [refresh]);

  const recommendExternalPlace = useCallback(async (candidate: ExternalPlaceCandidate, recommendation: RecommendationDraft) => {
    await placesRepository.recommendExternalPlace(candidate, recommendation);
    await refresh();
  }, [refresh]);

  const createCommunityPlace = useCallback(async (draft: CommunityPlaceDraft, recommendation: RecommendationDraft) => {
    await placesRepository.createCommunityPlace(draft, recommendation);
    await refresh();
  }, [refresh]);

  const value = useMemo(() => ({ createCommunityPlace, findPotentialDuplicates, loadPlacesInView, places, recommendExternalPlace, recommendPlace, searchPlaces }), [createCommunityPlace, findPotentialDuplicates, loadPlacesInView, places, recommendExternalPlace, recommendPlace, searchPlaces]);
  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>;
}

export function usePlaces() {
  const context = useContext(PlacesContext);
  if (!context) throw new Error('usePlaces debe usarse dentro de PlacesProvider');
  return context;
}
