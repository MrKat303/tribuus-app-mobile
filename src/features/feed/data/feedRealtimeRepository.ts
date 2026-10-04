import {
  subscribeToCommunityFeedChanges,
  type FeedRealtimeChange,
} from '@/features/feed/data/feedRealtime';
import { getFeedAccount } from '@/features/feed/data/feedIdentityRepository';

export function subscribeToFeedChanges(
  visiblePostIds: string[],
  onChange: (change: FeedRealtimeChange) => void,
) {
  let active = true;
  let unsubscribe: (() => void) | null = null;

  void getFeedAccount().then(({ communityId }) => {
    if (!active) return;
    unsubscribe = subscribeToCommunityFeedChanges(communityId, visiblePostIds, onChange);
  }).catch(() => undefined);

  return () => {
    active = false;
    unsubscribe?.();
  };
}
