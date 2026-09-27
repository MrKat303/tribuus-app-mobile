import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard } from 'react-native';

import {
  createSearchSessionToken,
  MapSearchOutsideCountryError,
  type MapSearchPlace,
  type MapSearchSuggestion,
  retrieveMapPlace,
  suggestMapPlaces,
} from '@/services/mapboxSearch';

import {
  type Coordinate,
  COUNTRY_NAME,
  COUNTRY_SEARCH_CODE,
  MAPBOX_TOKEN,
} from '../model/map';

type MoveCamera = (settings: {
  animationDuration: number;
  animationMode: 'flyTo';
  centerCoordinate: Coordinate;
  zoomLevel: number;
}) => void;

export function useMapSearch({ categories, getProximity, moveCamera }: { categories?: string[]; getProximity: () => Coordinate; moveCamera: MoveCamera }) {
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef(createSearchSessionToken());
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [place, setPlace] = useState<MapSearchPlace | null>(null);
  const [suggestions, setSuggestions] = useState<MapSearchSuggestion[]>([]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    abortRef.current?.abort();
    if (trimmedQuery.length < 2 || (place && trimmedQuery === place.name) || !MAPBOX_TOKEN) return;

    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(() => {
      setLoading(true);
      void suggestMapPlaces({
        accessToken: MAPBOX_TOKEN,
        categories,
        country: COUNTRY_SEARCH_CODE,
        proximity: getProximity(),
        query: trimmedQuery,
        sessionToken: sessionRef.current,
        signal: controller.signal,
      })
        .then(setSuggestions)
        .catch((error: unknown) => {
          if (error instanceof Error && error.name !== 'AbortError') setSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [categories, getProximity, place, query]);

  const selectSuggestion = useCallback(async (suggestion: MapSearchSuggestion) => {
    abortRef.current?.abort();
    setLoading(true);
    try {
      const nextPlace = await retrieveMapPlace({
        accessToken: MAPBOX_TOKEN,
        country: COUNTRY_SEARCH_CODE,
        sessionToken: sessionRef.current,
        suggestion,
      });
      sessionRef.current = createSearchSessionToken();
      setPlace(nextPlace);
      setQuery(nextPlace.name);
      setSuggestions([]);
      setFocused(false);
      Keyboard.dismiss();
      moveCamera({ animationDuration: 800, animationMode: 'flyTo', centerCoordinate: nextPlace.coordinate, zoomLevel: nextPlace.featureType === 'place' ? 12.5 : 16 });
      return nextPlace;
    } catch (error) {
      Alert.alert(
        error instanceof MapSearchOutsideCountryError ? `Busca dentro de ${COUNTRY_NAME}` : 'No pudimos abrir ese lugar',
        error instanceof MapSearchOutsideCountryError
          ? `Por ahora solo puedes buscar calles y lugares dentro de ${COUNTRY_NAME}.`
          : 'Revisa tu conexión e inténtalo nuevamente.',
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [moveCamera]);

  const changeQuery = useCallback((value: string) => {
    abortRef.current?.abort();
    setPlace(null);
    setQuery(value);
    setLoading(false);
    setSuggestions([]);
  }, []);

  const clearSearch = useCallback(() => {
    abortRef.current?.abort();
    sessionRef.current = createSearchSessionToken();
    setPlace(null);
    setLoading(false);
    setQuery('');
    setSuggestions([]);
  }, []);

  return {
    changeQuery,
    clearSearch,
    focused,
    loading,
    place,
    query,
    selectSuggestion,
    setFocused,
    suggestions,
  };
}
