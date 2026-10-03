import type { Coordinate } from '@/shared/geo';

export type PlaceProvider = 'mapbox' | 'community';
export type PlaceCategory = 'Cafetería' | 'Restaurante' | 'Comercio' | 'Panadería' | 'Bar' | 'Otro';
export type PlaceStatus = 'active' | 'hidden' | 'reported';

export type ProviderPlaceData = {
  address: string;
  category: PlaceCategory;
  coordinate: Coordinate;
  mapboxId: string | null;
  name: string;
  neighborhood?: string;
  rawCategory?: string;
};

export type PlaceRecommendation = {
  authorId: string;
  authorName: string;
  confidence: number;
  createdAt: string;
  id: string;
  photoUri?: string;
  text: string;
  tags: string[];
};

export type TribuusPlace = {
  activityScore: number;
  communityTags: string[];
  createdAt: string;
  id: string;
  localRelevance: number;
  popularity: number;
  provider: PlaceProvider;
  providerData: ProviderPlaceData;
  recommendations: PlaceRecommendation[];
  status: PlaceStatus;
};

export type ExternalPlaceCandidate = ProviderPlaceData & {
  distanceMeters?: number;
  provider: 'mapbox';
};

export type RecommendationDraft = {
  photoUri?: string;
  text: string;
  tags: string[];
};

export type CommunityPlaceDraft = Omit<ProviderPlaceData, 'mapboxId'>;

export const PLACE_CATEGORIES: PlaceCategory[] = ['Cafetería', 'Restaurante', 'Comercio', 'Panadería', 'Bar', 'Otro'];
export const PLACE_TAGS = ['Buen café', 'Rico', 'Atención amable', 'Precio justo', 'Pet friendly', 'Producto local'] as const;

export function normalizePlaceName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function categoryFromMapbox(categories: string[] = []): PlaceCategory {
  const value = categories.join(' ').toLocaleLowerCase('es');
  if (value.includes('coffee') || value.includes('cafe')) return 'Cafetería';
  if (value.includes('bakery') || value.includes('panader')) return 'Panadería';
  if (value.includes('bar') || value.includes('pub')) return 'Bar';
  if (value.includes('restaurant') || value.includes('food')) return 'Restaurante';
  if (value.includes('shop') || value.includes('store') || value.includes('retail')) return 'Comercio';
  return 'Otro';
}
