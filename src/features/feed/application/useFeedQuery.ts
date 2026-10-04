import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';

import { feedErrorMessage } from '@/features/feed/application/feedError';
import {
  ensureFeedIdentity,
  type FeedIdentity,
} from '@/features/feed/data/feedIdentityRepository';
import {
  type FeedCursor,
  getFeedPost,
  listFeedPosts,
} from '@/features/feed/data/feedRepository';
import type { CommunityPost } from '@/features/feed/model/community';

export type FeedPostsSetter = Dispatch<SetStateAction<CommunityPost[]>>;
export type FeedErrorSetter = Dispatch<SetStateAction<string | null>>;

export function useFeedQuery(identity: FeedIdentity) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [cursor, setCursor] = useState<FeedCursor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadFirstPage = useCallback(async () => {
    const page = await listFeedPosts();
    setPosts(page.posts);
    setCursor(page.cursor);
    setError(null);
  }, []);

  const syncFirstPage = useCallback(async () => {
    try {
      await ensureFeedIdentity(identity);
      await reloadFirstPage();
    } catch (cause) {
      setError(feedErrorMessage(cause));
      throw cause;
    }
  }, [identity, reloadFirstPage]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await syncFirstPage();
    } finally {
      setIsLoading(false);
    }
  }, [syncFirstPage]);

  const syncPost = useCallback(async (postId: string) => {
    try {
      const post = await getFeedPost(postId);
      setPosts((current) => {
        const currentIndex = current.findIndex(({ id }) => id === postId);
        if (!post) return currentIndex === -1 ? current : current.filter(({ id }) => id !== postId);
        if (currentIndex === -1) return [post, ...current];
        return current.map((currentPost) => currentPost.id === postId ? post : currentPost);
      });
      setError(null);
    } catch (cause) {
      setError(feedErrorMessage(cause));
      throw cause;
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!cursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const page = await listFeedPosts(cursor);
      setPosts((current) => {
        const existingIds = new Set(current.map((post) => post.id));
        return [...current, ...page.posts.filter((post) => !existingIds.has(post.id))];
      });
      setCursor(page.cursor);
      setError(null);
    } catch (cause) {
      setError(feedErrorMessage(cause));
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, isLoadingMore]);

  useEffect(() => {
    // The provider must hydrate from the external Supabase store when identity changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void syncFirstPage().catch(() => undefined).finally(() => setIsLoading(false));
  }, [syncFirstPage]);

  return {
    cursor,
    error,
    isLoading,
    isLoadingMore,
    loadMore,
    posts,
    refresh,
    reloadFirstPage,
    setError,
    setPosts,
    syncFirstPage,
    syncPost,
  };
}
