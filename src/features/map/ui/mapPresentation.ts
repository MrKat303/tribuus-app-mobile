import type { ComponentProps } from 'react';

import type { AppIcon } from '@/components/ui/AppIcon';

import type { AlertKind, EventCategory, MapEvent, MapFilter } from '../model/map';

type IconName = ComponentProps<typeof AppIcon>['name'];

export const markerIcon: Record<EventCategory, IconName> = {
  Alerta: 'alert-triangle',
  Bar: 'moon',
  Café: 'coffee',
  Evento: 'music',
  Restaurante: 'shopping-bag',
  Servicio: 'tool',
};

const alertIcon: Record<AlertKind, IconName> = {
  Incendio: 'thermometer',
  Lluvia: 'cloud-rain',
  Prevención: 'alert-triangle',
};

export const markerColor: Record<EventCategory, string> = {
  Alerta: '#E23D3D',
  Bar: '#8A4F7D',
  Café: '#B97720',
  Evento: '#7159D9',
  Restaurante: '#E0653F',
  Servicio: '#1688B8',
};

export const markerBackground: Record<EventCategory, string> = {
  Alerta: '#FFE8E8',
  Bar: '#F8EAF5',
  Café: '#FFF3DF',
  Evento: '#F0EDFF',
  Restaurante: '#FFECE6',
  Servicio: '#E4F7FF',
};

export const markerLabelColor: Record<EventCategory, string> = markerColor;

export const filterIcon: Record<Exclude<MapFilter, 'Todos'>, IconName> = {
  Bar: markerIcon.Bar,
  Café: markerIcon.Café,
  Evento: markerIcon.Evento,
  Restaurante: markerIcon.Restaurante,
};

export const filterColor: Record<Exclude<MapFilter, 'Todos'>, string> = {
  Bar: markerColor.Bar,
  Café: markerColor.Café,
  Evento: markerColor.Evento,
  Restaurante: markerColor.Restaurante,
};

export const searchIcon: Record<string, IconName> = {
  address: 'hash',
  locality: 'map-pin',
  neighborhood: 'home',
  place: 'map',
  poi: 'map-pin',
  street: 'corner-up-right',
};

export function iconForEvent(event: MapEvent): IconName {
  return event.category === 'Alerta'
    ? alertIcon[event.alertKind ?? 'Prevención']
    : markerIcon[event.category];
}
