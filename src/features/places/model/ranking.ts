import { distanceInKm, type Coordinate } from '@/features/map/model/map';

import type { TribuusPlace } from './place';

export type PlaceRankingWeights = {
  activity: number;
  confidence: number;
  distance: number;
  localRelevance: number;
  recency: number;
  recommendations: number;
};

export const DEFAULT_PLACE_RANKING_WEIGHTS: PlaceRankingWeights = {
  activity: 0.12,
  confidence: 0.13,
  distance: 0.2,
  localRelevance: 0.1,
  recency: 0.15,
  recommendations: 0.3,
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function placeRankingScore(place: TribuusPlace, origin: Coordinate, weights = DEFAULT_PLACE_RANKING_WEIGHTS) {
  const latest = place.recommendations.reduce((date, item) => Math.max(date, Date.parse(item.createdAt)), 0);
  const ageDays = Math.max(0, (Date.now() - latest) / 86_400_000);
  const recency = Math.exp(-ageDays / 45);
  const recommendationScore = clamp01(Math.log1p(place.popularity) / Math.log1p(50));
  const distanceScore = clamp01(1 - distanceInKm(origin, place.providerData.coordinate) / 8);
  const confidence = place.recommendations.length
    ? place.recommendations.reduce((sum, item) => sum + item.confidence, 0) / place.recommendations.length
    : 0;

  return recommendationScore * weights.recommendations
    + recency * weights.recency
    + distanceScore * weights.distance
    + clamp01(place.activityScore) * weights.activity
    + clamp01(confidence) * weights.confidence
    + clamp01(place.localRelevance) * weights.localRelevance;
}

export function placeVisualBudget(zoom: number) {
  if (zoom >= 17) return 24;
  if (zoom >= 15.7) return 16;
  if (zoom >= 14.5) return 10;
  return 6;
}
