import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { demoPlaces } from '@/features/places/data/demoPlaces';
import type { CommunityPlaceDraft, ExternalPlaceCandidate, RecommendationDraft, TribuusPlace } from '@/features/places/model/place';
import { normalizePlaceName } from '@/features/places/model/place';
import { distanceInKm } from '@/shared/geo';

type PlacesContextValue = {
  createCommunityPlace: (draft: CommunityPlaceDraft, recommendation: RecommendationDraft) => void;
  findPotentialDuplicates: (name: string, coordinate: CommunityPlaceDraft['coordinate']) => TribuusPlace[];
  places: TribuusPlace[];
  recommendExternalPlace: (candidate: ExternalPlaceCandidate, recommendation: RecommendationDraft) => void;
  recommendPlace: (placeId: string, recommendation: RecommendationDraft) => void;
  searchPlaces: (query: string) => TribuusPlace[];
};

const PlacesContext = createContext<PlacesContextValue | null>(null);
const currentUser = { id: 'current-user', name: 'Jaime M.' };

function makeRecommendation(draft: RecommendationDraft) {
  return { ...draft, authorId: currentUser.id, authorName: currentUser.name, confidence: 0.9, createdAt: new Date().toISOString(), id: `recommendation-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
}

function addOrReplaceRecommendation(place: TribuusPlace, draft: RecommendationDraft): TribuusPlace {
  const recommendation = makeRecommendation(draft);
  const alreadyRecommended = place.recommendations.some((item) => item.authorId === currentUser.id);
  const withoutCurrentUser = place.recommendations.filter((item) => item.authorId !== currentUser.id);
  const recommendations = [...withoutCurrentUser, recommendation];
  return { ...place, activityScore: Math.min(1, place.activityScore + 0.08), communityTags: Array.from(new Set([...place.communityTags, ...draft.tags])), popularity: alreadyRecommended ? place.popularity : place.popularity + 1, recommendations };
}

function nameSimilarity(first: string, second: string) {
  const firstTokens = new Set(normalizePlaceName(first).split(' ').filter(Boolean));
  const secondTokens = new Set(normalizePlaceName(second).split(' ').filter(Boolean));
  const intersection = [...firstTokens].filter((token) => secondTokens.has(token)).length;
  return intersection / Math.max(1, new Set([...firstTokens, ...secondTokens]).size);
}

export function PlacesProvider({ children }: PropsWithChildren) {
  const [places, setPlaces] = useState<TribuusPlace[]>(demoPlaces);

  const searchPlaces = useCallback((query: string) => {
    const normalized = normalizePlaceName(query);
    if (normalized.length < 2) return [];
    return places.filter((place) => normalizePlaceName(`${place.providerData.name} ${place.providerData.category} ${place.providerData.neighborhood ?? ''}`).includes(normalized));
  }, [places]);

  const findPotentialDuplicates = useCallback((name: string, coordinate: CommunityPlaceDraft['coordinate']) => places
    .filter((place) => distanceInKm(coordinate, place.providerData.coordinate) <= 0.6 && nameSimilarity(name, place.providerData.name) >= 0.34)
    .sort((first, second) => distanceInKm(coordinate, first.providerData.coordinate) - distanceInKm(coordinate, second.providerData.coordinate)), [places]);

  const recommendPlace = useCallback((placeId: string, recommendation: RecommendationDraft) => {
    setPlaces((current) => current.map((place) => place.id === placeId ? addOrReplaceRecommendation(place, recommendation) : place));
  }, []);

  const recommendExternalPlace = useCallback((candidate: ExternalPlaceCandidate, recommendation: RecommendationDraft) => {
    setPlaces((current) => {
      // Recheck inside the atomic update to avoid duplicate provider records under concurrent UI actions.
      const existing = current.find((place) => place.provider === 'mapbox' && place.providerData.mapboxId === candidate.mapboxId);
      if (existing) return current.map((place) => place.id === existing.id ? addOrReplaceRecommendation(place, recommendation) : place);
      const created: TribuusPlace = {
        activityScore: 0.55, communityTags: recommendation.tags, createdAt: new Date().toISOString(), id: `place-mapbox-${candidate.mapboxId}`, localRelevance: 0.75, popularity: 1, provider: 'mapbox', providerData: { address: candidate.address, category: candidate.category, coordinate: candidate.coordinate, mapboxId: candidate.mapboxId, name: candidate.name, neighborhood: candidate.neighborhood, rawCategory: candidate.rawCategory }, recommendations: [makeRecommendation(recommendation)], status: 'active',
      };
      return [...current, created];
    });
  }, []);

  const createCommunityPlace = useCallback((draft: CommunityPlaceDraft, recommendation: RecommendationDraft) => {
    setPlaces((current) => {
      // A second proximity/name check mirrors the constraint a future backend transaction must enforce.
      const duplicate = current.find((place) => distanceInKm(draft.coordinate, place.providerData.coordinate) <= 0.15 && nameSimilarity(draft.name, place.providerData.name) >= 0.72);
      if (duplicate) return current.map((place) => place.id === duplicate.id ? addOrReplaceRecommendation(place, recommendation) : place);
      return [...current, { activityScore: 0.5, communityTags: recommendation.tags, createdAt: new Date().toISOString(), id: `place-community-${Date.now()}`, localRelevance: 0.9, popularity: 1, provider: 'community', providerData: { ...draft, mapboxId: null }, recommendations: [makeRecommendation(recommendation)], status: 'active' }];
    });
  }, []);

  const value = useMemo(() => ({ createCommunityPlace, findPotentialDuplicates, places, recommendExternalPlace, recommendPlace, searchPlaces }), [createCommunityPlace, findPotentialDuplicates, places, recommendExternalPlace, recommendPlace, searchPlaces]);
  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>;
}

export function usePlaces() {
  const context = useContext(PlacesContext);
  if (!context) throw new Error('usePlaces debe usarse dentro de PlacesProvider');
  return context;
}
