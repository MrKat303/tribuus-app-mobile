import type { ComponentProps } from 'react';

import type { AppIcon } from '@/components/ui/AppIcon';

import type { FeedFilter } from '../model/feed';

type IconName = ComponentProps<typeof AppIcon>['name'];

export const feedFilters: {
  icon: IconName;
  label: string;
  value: FeedFilter;
}[] = [
  { icon: 'grid', label: 'Todo', value: 'todo' },
  { icon: 'calendar', label: 'Eventos', value: 'evento' },
  { icon: 'star', label: 'Recomendaciones', value: 'recomendación' },
  { icon: 'users', label: 'Comunidad', value: 'comunidad' },
];
