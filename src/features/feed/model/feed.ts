import type { ComponentProps } from 'react';

import { AppIcon } from '@/components/ui/AppIcon';
import type { CommunityPostCategory } from '@/types/community';

export type FeedFilter = 'todo' | CommunityPostCategory;

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
