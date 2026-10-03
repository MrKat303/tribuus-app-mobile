import { useEffect } from 'react';

import { subscribeToPostComments } from '@/features/feed/data/feedRealtime';

export function usePostCommentsRealtime(postId: string | undefined, onInvalidate: (postId: string) => void) {
  useEffect(() => {
    if (!postId) return undefined;
    return subscribeToPostComments(postId, () => onInvalidate(postId));
  }, [onInvalidate, postId]);
}
