import type { BoundingBox, Coordinate } from '@/shared/geo';

export {
  clampCoordinateToBoundingBox,
  distanceInKm,
  isCoordinateInBoundingBox,
  type BoundingBox,
  type Coordinate,
} from '@/shared/geo';

export const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';
export const SANTIAGO: Coordinate = [-70.6483, -33.4569];
export const COUNTRY_NAME = 'Chile';
export const COUNTRY_SEARCH_CODE = 'CL';
export const COUNTRY_MIN_ZOOM = 4.7;
export const COUNTRY_CAMERA_BOUNDING_BOX: BoundingBox = [-76.5, -56.5, -66, -17];
export const COUNTRY_CAMERA_BOUNDS = {
  ne: [COUNTRY_CAMERA_BOUNDING_BOX[2], COUNTRY_CAMERA_BOUNDING_BOX[3]] as Coordinate,
  sw: [COUNTRY_CAMERA_BOUNDING_BOX[0], COUNTRY_CAMERA_BOUNDING_BOX[1]] as Coordinate,
};
export const DEFAULT_MAP_ZOOM = 14.2;
export const EVENT_MARKER_MIN_ZOOM = 14.9;
export const USER_LOCATION_ZOOM = 15.4;

export type MapViewportBounds = { ne: Coordinate; sw: Coordinate };
export type EventCategory = 'Café' | 'Restaurante' | 'Bar' | 'Evento' | 'Servicio' | 'Alerta';
export type MapFilter = 'Todos' | Extract<EventCategory, 'Café' | 'Restaurante' | 'Bar' | 'Evento'>;
export type AlertKind = 'Lluvia' | 'Incendio' | 'Prevención';
export type MapContentKind = 'community-discovery' | 'activity';
export type PermanentPoiCategory = 'cerro' | 'parque' | 'museo' | 'teatro' | 'iglesia' | 'biblioteca' | 'monumento';
export type MapEvent = {
  alertKind?: AlertKind;
  category: EventCategory;
  communitySignals: number;
  coordinate: Coordinate;
  date: string;
  freshnessScore: number;
  id: string;
  location: string;
  personalizationScore: number;
  qualityScore: number;
  title: string;
};

export function isCoordinateInViewport(
  coordinate: Coordinate,
  bounds: MapViewportBounds | null,
  paddingRatio = 0.12,
) {
  if (!bounds) return true;

  const longitudePadding = Math.abs(bounds.ne[0] - bounds.sw[0]) * paddingRatio;
  const latitudePadding = Math.abs(bounds.ne[1] - bounds.sw[1]) * paddingRatio;
  return coordinate[0] >= bounds.sw[0] - longitudePadding
    && coordinate[0] <= bounds.ne[0] + longitudePadding
    && coordinate[1] >= bounds.sw[1] - latitudePadding
    && coordinate[1] <= bounds.ne[1] + latitudePadding;
}

export const PERMANENT_POI_CATEGORIES: PermanentPoiCategory[] = ['cerro', 'parque', 'museo', 'teatro', 'iglesia', 'biblioteca', 'monumento'];

export const MAP_FILTERS: MapFilter[] = ['Todos', 'Café', 'Restaurante', 'Bar', 'Evento'];

export function contentKindForEvent(event: MapEvent): MapContentKind {
  return event.category === 'Alerta' ? 'activity' : 'community-discovery';
}

export function isClusterableCommunityPlace(event: MapEvent) {
  return event.category === 'Café' || event.category === 'Restaurante' || event.category === 'Bar' || event.category === 'Servicio';
}

export function communitySignalLabel(event: MapEvent) {
  if (event.category === 'Alerta') return `Reportado por ${event.communitySignals} vecinos`;
  if (event.category === 'Evento') return `${event.communitySignals} vecinos participarán`;
  return `Recomendado por ${event.communitySignals} vecinos`;
}
