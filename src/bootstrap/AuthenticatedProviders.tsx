import type { PropsWithChildren } from 'react';

import { FeedProvider } from '@/features/feed/application/FeedProvider';
import { ProfileProvider } from '@/features/profile/application/ProfileProvider';

export function AuthenticatedProviders({ children }: PropsWithChildren) {
  return (
    <ProfileProvider>
      <FeedProvider>{children}</FeedProvider>
    </ProfileProvider>
  );
}
