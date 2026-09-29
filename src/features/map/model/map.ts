import type { ComponentProps } from 'react';

import { AppIcon } from '@/components/ui/AppIcon';

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

export type Coordinate = [number, number];
export type BoundingBox = [west: number, south: number, east: number, north: number];
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

type IconName = ComponentProps<typeof AppIcon>['name'];

export const INITIAL_EVENTS: MapEvent[] = [
  { category: 'Servicio', communitySignals: 31, coordinate: [-70.6437, -33.4414], date: 'Disponible 24 h', freshnessScore: 0.72, id: 'punto-seguro', location: 'Metro Baquedano', personalizationScore: 0.68, qualityScore: 0.88, title: 'Punto de apoyo vecinal' },
  { alertKind: 'Lluvia', category: 'Alerta', communitySignals: 19, coordinate: [-70.6571, -33.4522], date: 'Prevención · próximas 3 h', freshnessScore: 0.98, id: 'lluvia-alerta', location: 'Barrio Brasil', personalizationScore: 0.55, qualityScore: 0.86, title: 'Lluvia intensa' },
  { alertKind: 'Incendio', category: 'Alerta', communitySignals: 42, coordinate: [-70.6703, -33.4388], date: 'Alerta activa · hace 12 min', freshnessScore: 0.94, id: 'incendio-alerta', location: 'Quinta Normal', personalizationScore: 0.7, qualityScore: 0.93, title: 'Foco de incendio reportado' },
  { alertKind: 'Prevención', category: 'Alerta', communitySignals: 13, coordinate: [-70.6312, -33.4634], date: 'Precaución · hace 25 min', freshnessScore: 0.86, id: 'prevencion-alerta', location: 'Ñuñoa', personalizationScore: 0.62, qualityScore: 0.8, title: 'Cruce temporalmente bloqueado' },
  { category: 'Café', communitySignals: 24, coordinate: [-70.6388, -33.4384], date: 'Abierto hasta 20:00', freshnessScore: 0.76, id: 'cafe-triciclo', location: 'Providencia', personalizationScore: 0.9, qualityScore: 0.91, title: 'Café Triciclo' },
  { category: 'Restaurante', communitySignals: 38, coordinate: [-70.626, -33.4527], date: 'Abierto hasta 23:00', freshnessScore: 0.8, id: 'restaurante-popular', location: 'Plaza Ñuñoa', personalizationScore: 0.82, qualityScore: 0.94, title: 'La Popular Pizza' },
  { category: 'Bar', communitySignals: 29, coordinate: [-70.6408, -33.4375], date: 'Abierto hasta 02:00', freshnessScore: 0.82, id: 'bar-barrio', location: 'Bellavista', personalizationScore: 0.78, qualityScore: 0.89, title: 'Bar del Barrio' },
  { category: 'Evento', communitySignals: 27, coordinate: [-70.6629, -33.4474], date: 'Sáb, 10:30', freshnessScore: 0.9, id: 'yoga-parque', location: 'Parque de los Reyes', personalizationScore: 0.73, qualityScore: 0.87, title: 'Yoga al aire libre' },
  { category: 'Evento', communitySignals: 44, coordinate: [-70.6354, -33.4491], date: 'Hoy, 18:30', freshnessScore: 0.98, id: 'intercambio', location: 'Parque Bustamante', personalizationScore: 0.88, qualityScore: 0.92, title: 'Intercambio de libros' },
];

export const PERMANENT_POI_CATEGORIES: PermanentPoiCategory[] = ['cerro', 'parque', 'museo', 'teatro', 'iglesia', 'biblioteca', 'monumento'];

export const MAP_FILTERS: MapFilter[] = ['Todos', 'Café', 'Restaurante', 'Bar', 'Evento'];
export const PLACE_REACTIONS = ['❤️', '🔥', '😋', '🎉', '⚠️'] as const;
export const FRIENDS_NEARBY = ['VM', 'CR', 'SP', 'DM'];

export const markerIcon: Record<EventCategory, IconName> = {
  Alerta: 'alert-triangle', Bar: 'moon', Café: 'coffee', Evento: 'music', Restaurante: 'shopping-bag', Servicio: 'tool',
};
const alertIcon: Record<AlertKind, IconName> = {
  Incendio: 'thermometer', Lluvia: 'cloud-rain', Prevención: 'alert-triangle',
};
export const markerColor: Record<EventCategory, string> = {
  Alerta: '#E23D3D', Bar: '#8A4F7D', Café: '#B97720', Evento: '#7159D9', Restaurante: '#E0653F', Servicio: '#1688B8',
};
export const markerBackground: Record<EventCategory, string> = {
  Alerta: '#FFE8E8', Bar: '#F8EAF5', Café: '#FFF3DF', Evento: '#F0EDFF', Restaurante: '#FFECE6', Servicio: '#E4F7FF',
};
export const markerLabelColor: Record<EventCategory, string> = {
  Alerta: '#E23D3D', Bar: '#8A4F7D', Café: '#B97720', Evento: '#7159D9', Restaurante: '#E0653F', Servicio: '#1688B8',
};
export const filterIcon: Record<Exclude<MapFilter, 'Todos'>, IconName> = {
  Bar: markerIcon.Bar, Café: markerIcon.Café, Evento: markerIcon.Evento, Restaurante: markerIcon.Restaurante,
};
export const filterColor: Record<Exclude<MapFilter, 'Todos'>, string> = {
  Bar: markerColor.Bar, Café: markerColor.Café, Evento: markerColor.Evento, Restaurante: markerColor.Restaurante,
};
export const searchIcon: Record<string, IconName> = {
  address: 'hash', locality: 'map-pin', neighborhood: 'home', place: 'map', poi: 'map-pin', street: 'corner-up-right',
};

export function iconForEvent(event: MapEvent): IconName {
  return event.category === 'Alerta' ? alertIcon[event.alertKind ?? 'Prevención'] : markerIcon[event.category];
}

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

export function distanceInKm(from: Coordinate, to: Coordinate) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDistance = toRadians(to[1] - from[1]);
  const longitudeDistance = toRadians(to[0] - from[0]);
  const firstLatitude = toRadians(from[1]);
  const secondLatitude = toRadians(to[1]);
  const haversine = Math.sin(latitudeDistance / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDistance / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function isCoordinateInBoundingBox(coordinate: Coordinate, boundingBox: BoundingBox) {
  const [longitude, latitude] = coordinate;
  const [west, south, east, north] = boundingBox;
  return longitude >= west && longitude <= east && latitude >= south && latitude <= north;
}

export function clampCoordinateToBoundingBox(coordinate: Coordinate, boundingBox: BoundingBox): Coordinate {
  const [longitude, latitude] = coordinate;
  const [west, south, east, north] = boundingBox;
  return [Math.min(east, Math.max(west, longitude)), Math.min(north, Math.max(south, latitude))];
}
