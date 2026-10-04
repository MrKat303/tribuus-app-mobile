import { createContext, type PropsWithChildren, useContext, useMemo } from 'react';

import { useAuth } from '@/features/auth/application/AuthProvider';
import { useFeedMutations } from '@/features/feed/application/useFeedMutations';
import { useFeedQuery } from '@/features/feed/application/useFeedQuery';
import { useFeedRealtime } from '@/features/feed/application/useFeedRealtime';
import type { FeedIdentity } from '@/features/feed/data/feedIdentityRepository';
import type { CommunityPost, CommunityPostDraft } from '@/features/feed/model/community';

type FeedContextValue = {
  addPost: (draft: CommunityPostDraft) => Promise<string>;
  deletePost: (postId: string) => Promise<void>;
  error: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  invalidatePost: (postId: string) => void;
  loadMore: () => Promise<void>;
  posts: CommunityPost[];
  refresh: () => Promise<void>;
  selectPollOption: (postId: string, optionId: string) => Promise<void>;
  toggleBookmark: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
};

const FeedContext = createContext<FeedContextValue | null>(null);

export function FeedProvider({ children }: PropsWithChildren) {
  const { profile } = useAuth();
  const identity = useMemo<FeedIdentity>(() => ({
    displayName: profile?.displayName ?? 'Miembro de Tribus',
    initials: profile?.initials || 'V',
    location: profile?.location ?? 'Providencia',
  }), [profile]);

  const {
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
  } = useFeedQuery(identity);
  const {
    addPost,
    deletePost,
    isPublishingPost,
    selectPollOption,
    toggleBookmark,
    toggleLike,
  } = useFeedMutations({
    identity,
    posts,
    reloadFirstPage,
    setError,
    setPosts,
  });
  const { invalidatePost } = useFeedRealtime({
    isPublishingPost,
    posts,
    syncFirstPage,
    syncPost,
  });

  const value = useMemo<FeedContextValue>(() => ({
    addPost,
    deletePost,
    error,
    hasMore: cursor !== null,
    invalidatePost,
    isLoading,
    isLoadingMore,
    loadMore,
    posts,
    refresh,
    selectPollOption,
    toggleBookmark,
    toggleLike,
  }), [
    addPost,
    cursor,
    deletePost,
    error,
    invalidatePost,
    isLoading,
    isLoadingMore,
    loadMore,
    posts,
    refresh,
    selectPollOption,
    toggleBookmark,
    toggleLike,
  ]);

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeed() {
  const context = useContext(FeedContext);
  if (!context) throw new Error('useFeed debe usarse dentro de FeedProvider.');
  return context;
}
