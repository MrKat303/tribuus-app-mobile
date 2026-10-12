import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CommunityPlaceDraft,
  ExternalPlaceCandidate,
  PlaceCategory,
  PlaceRecommendation,
  RecommendationDraft,
  TribuusPlace,
} from '@/features/places/model/place';
import type { BoundingBox } from '@/shared/geo';
import { supabase } from '@/shared/infrastructure/supabase/client';

type PlaceRow = {
  activity_score: number;
  address: string;
  category: string;
  created_at: string;
  id: string;
  latitude: number;
  local_relevance: number;
  longitude: number;
  name: string;
  neighborhood: string | null;
  popularity: number;
  provider: TribuusPlace['provider'];
  provider_id: string | null;
};

type RecommendationRow = {
  author_id: string;
  confidence: number;
  created_at: string;
  id: string;
  photo_uri: string | null;
  place_id: string;
  profiles: { display_name: string } | { display_name: string }[] | null;
  tags: string[];
  text: string;
};

function relationName(value: RecommendationRow['profiles']) {
  const profile = Array.isArray(value) ? value[0] : value;
  return profile?.display_name ?? 'Miembro de Tribus';
}

function mapRecommendation(row: RecommendationRow): PlaceRecommendation {
  return {
    authorId: row.author_id,
    authorName: relationName(row.profiles),
    confidence: row.confidence,
    createdAt: row.created_at,
    id: row.id,
    photoUri: row.photo_uri ?? undefined,
    tags: row.tags,
    text: row.text,
  };
}

function assertRemotePhoto(photoUri?: string) {
  if (photoUri && /^(file|content|ph):/i.test(photoUri)) {
    throw new Error('La foto debe subirse al almacenamiento antes de publicar la recomendación.');
  }
}

async function getCurrentUserId(client: SupabaseClient) {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Tu sesión ya no está activa.');
  return data.user.id;
}

async function saveRecommendation(client: SupabaseClient, placeId: string, draft: RecommendationDraft) {
  assertRemotePhoto(draft.photoUri);
  const { error } = await client.rpc('upsert_place_recommendation', {
    p_photo_uri: draft.photoUri ?? null,
    p_place_id: placeId,
    p_tags: draft.tags,
    p_text: draft.text,
  });
  if (error) throw error;
}

export function createSupabasePlacesRepository(client: SupabaseClient) {
  return {
    async createCommunityPlace(draft: CommunityPlaceDraft, recommendation: RecommendationDraft) {
      const userId = await getCurrentUserId(client);
      const { data, error } = await client.from('places').insert({
        activity_score: 0,
        address: draft.address,
        category: draft.category,
        local_relevance: 0,
        location: `POINT(${draft.coordinate[0]} ${draft.coordinate[1]})`,
        name: draft.name,
        neighborhood: draft.neighborhood ?? null,
        owner_id: userId,
        popularity: 0,
        provider: 'community',
        provider_id: null,
        status: 'active',
      }).select('id').single();
      if (error) throw error;
      await saveRecommendation(client, String(data.id), recommendation);
    },
    async listPlacesInView([west, south, east, north]: BoundingBox): Promise<TribuusPlace[]> {
      const { data, error } = await client.rpc('places_in_view', {
        max_lat: north,
        max_long: east,
        min_lat: south,
        min_long: west,
        result_limit: 200,
      });
      if (error) throw error;
      const rows = (data ?? []) as PlaceRow[];
      if (!rows.length) return [];

      const { data: recommendationData, error: recommendationError } = await client
        .from('place_recommendations')
        .select('id, place_id, author_id, text, tags, photo_uri, confidence, created_at, profiles!place_recommendations_author_id_fkey(display_name)')
        .in('place_id', rows.map((row) => row.id))
        .order('created_at', { ascending: false });
      if (recommendationError) throw recommendationError;

      const recommendationsByPlace = new Map<string, PlaceRecommendation[]>();
      ((recommendationData ?? []) as RecommendationRow[]).forEach((row) => {
        const recommendations = recommendationsByPlace.get(row.place_id) ?? [];
        recommendations.push(mapRecommendation(row));
        recommendationsByPlace.set(row.place_id, recommendations);
      });

      return rows.map((row) => {
        const recommendations = recommendationsByPlace.get(row.id) ?? [];
        return {
          activityScore: row.activity_score,
          communityTags: [...new Set(recommendations.flatMap((item) => item.tags))],
          createdAt: row.created_at,
          id: row.id,
          localRelevance: row.local_relevance,
          popularity: row.popularity,
          provider: row.provider,
          providerData: {
            address: row.address,
            category: row.category as PlaceCategory,
            coordinate: [row.longitude, row.latitude],
            mapboxId: row.provider_id,
            name: row.name,
            neighborhood: row.neighborhood ?? undefined,
          },
          recommendations,
          status: 'active',
        } satisfies TribuusPlace;
      });
    },
    async recommendExternalPlace(candidate: ExternalPlaceCandidate, recommendation: RecommendationDraft) {
      const userId = await getCurrentUserId(client);
      const existing = await client
        .from('places')
        .select('id')
        .eq('provider', 'mapbox')
        .eq('provider_id', candidate.mapboxId)
        .maybeSingle();
      if (existing.error) throw existing.error;
      let placeId = existing.data?.id as string | undefined;

      if (!placeId) {
        const inserted = await client.from('places').insert({
          activity_score: 0,
          address: candidate.address,
          category: candidate.category,
          local_relevance: 0,
          location: `POINT(${candidate.coordinate[0]} ${candidate.coordinate[1]})`,
          name: candidate.name,
          neighborhood: candidate.neighborhood ?? null,
          owner_id: userId,
          popularity: 0,
          provider: 'mapbox',
          provider_id: candidate.mapboxId,
          status: 'active',
        }).select('id').single();
        if (inserted.error) {
          if (inserted.error.code !== '23505') throw inserted.error;
          const raced = await client.from('places').select('id').eq('provider', 'mapbox').eq('provider_id', candidate.mapboxId).single();
          if (raced.error) throw raced.error;
          placeId = String(raced.data.id);
        } else {
          placeId = String(inserted.data.id);
        }
      }
      await saveRecommendation(client, placeId, recommendation);
    },
    async recommendPlace(placeId: string, recommendation: RecommendationDraft) {
      await saveRecommendation(client, placeId, recommendation);
    },
  };
}

export const placesRepository = createSupabasePlacesRepository(supabase);
