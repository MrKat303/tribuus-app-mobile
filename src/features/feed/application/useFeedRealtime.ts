import { useCallback, useEffect, useMemo, useRef } from 'react';

import { subscribeToFeedChanges } from '@/features/feed/data/feedRealtimeRepository';
import type { CommunityPost } from '@/features/feed/model/community';

type UseFeedRealtimeParams = {
  isPublishingPost: { current: boolean };
  posts: CommunityPost[];
  syncFirstPage: () => Promise<void>;
  syncPost: (postId: string) => Promise<void>;
};

export function useFeedRealtime({
  isPublishingPost,
  posts,
  syncFirstPage,
  syncPost,
}: UseFeedRealtimeParams) {
  const postRefreshTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const invalidatePost = useCallback((postId: string) => {
    const currentTimer = postRefreshTimers.current.get(postId);
    if (currentTimer) clearTimeout(currentTimer);
    const timer = setTimeout(() => {
      postRefreshTimers.current.delete(postId);
      void syncPost(postId).catch(() => undefined);
    }, 100);
    postRefreshTimers.current.set(postId, timer);
  }, [syncPost]);

  useEffect(() => () => {
    for (const timer of postRefreshTimers.current.values()) clearTimeout(timer);
    postRefreshTimers.current.clear();
  }, []);

  const visiblePostIdsKey = posts.map(({ id }) => id).join(',');
  const visiblePostIds = useMemo(
    () => visiblePostIdsKey ? visiblePostIdsKey.split(',') : [],
    [visiblePostIdsKey],
  );

  useEffect(() => subscribeToFeedChanges(visiblePostIds, (change) => {
    if (isPublishingPost.current) return;
    if (change.scope === 'post') {
      invalidatePost(change.postId);
      return;
    }
    void syncFirstPage().catch(() => undefined);
  }), [invalidatePost, isPublishingPost, syncFirstPage, visiblePostIds]);

  return { invalidatePost };
}
