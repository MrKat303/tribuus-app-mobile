export type MapSearchSuggestion = {
  address?: string;
  distance?: number;
  feature_type: string;
  full_address?: string;
  mapbox_id: string;
  name: string;
  place_formatted: string;
  poi_category?: string[];
  poi_category_ids?: string[];
};

export type MapSearchPlace = {
  coordinate: [number, number];
  featureType: string;
  id: string;
  label: string;
  name: string;
  poiCategories: string[];
};

type SuggestResponse = { suggestions?: MapSearchSuggestion[] };
type RetrieveResponse = {
  features?: {
    geometry?: { coordinates?: number[] };
    properties?: {
      context?: { country?: { country_code?: string } };
      feature_type?: string;
      full_address?: string;
      mapbox_id?: string;
      name?: string;
      place_formatted?: string;
      poi_category?: string[];
      poi_category_ids?: string[];
    };
  }[];
};

const SEARCH_BASE_URL = 'https://api.mapbox.com/search/searchbox/v1';

function mapboxUrl(path: string, params: Record<string, string>) {
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return `${SEARCH_BASE_URL}${path}?${query}`;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`Mapbox Search respondió ${response.status}`);
  return response.json() as Promise<T>;
}

export function createSearchSessionToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export async function suggestMapPlaces({
  accessToken,
  categories,
  country,
  proximity,
  query,
  sessionToken,
  signal,
}: {
  accessToken: string;
  categories?: string[];
  country: string;
  proximity: [number, number];
  query: string;
  sessionToken: string;
  signal?: AbortSignal;
}) {
  const params: Record<string, string> = {
    access_token: accessToken,
    country,
    language: 'es',
    limit: '6',
    proximity: proximity.join(','),
    q: query,
    session_token: sessionToken,
    types: 'poi',
  };
  if (categories?.length) params.poi_category = categories.join(',');
  const url = mapboxUrl('/suggest', params);
  const response = await fetch(url, { signal });
  const data = await readJson<SuggestResponse>(response);
  return data.suggestions ?? [];
}

export async function retrieveMapPlace({
  accessToken,
  country,
  sessionToken,
  suggestion,
}: {
  accessToken: string;
  country: string;
  sessionToken: string;
  suggestion: MapSearchSuggestion;
}) {
  const url = mapboxUrl(`/retrieve/${encodeURIComponent(suggestion.mapbox_id)}`, {
    access_token: accessToken,
    language: 'es',
    session_token: sessionToken,
  });
  const response = await fetch(url);
  const data = await readJson<RetrieveResponse>(response);
  const feature = data.features?.[0];
  const coordinates = feature?.geometry?.coordinates;
  if (!coordinates || coordinates.length < 2) throw new Error('El resultado no incluye coordenadas');

  const properties = feature.properties;
  const resultCountry = feature.properties?.context?.country?.country_code;
  if (resultCountry && resultCountry.toUpperCase() !== country.toUpperCase()) {
    throw new MapSearchOutsideCountryError();
  }

  return {
    coordinate: [coordinates[0], coordinates[1]] as [number, number],
    featureType: properties?.feature_type ?? suggestion.feature_type,
    id: properties?.mapbox_id ?? suggestion.mapbox_id,
    label: properties?.full_address ?? properties?.place_formatted ?? suggestion.full_address ?? suggestion.place_formatted,
    name: properties?.name ?? suggestion.name,
    poiCategories: properties?.poi_category ?? properties?.poi_category_ids ?? suggestion.poi_category ?? suggestion.poi_category_ids ?? [],
  } satisfies MapSearchPlace;
}

export class MapSearchOutsideCountryError extends Error {
  constructor() {
    super('El resultado está fuera del país permitido');
    this.name = 'MapSearchOutsideCountryError';
  }
}
