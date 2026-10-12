import { createContext, type PropsWithChildren, useContext, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/application/AuthProvider';
import { useFeedMutations } from '@/features/feed/application/useFeedMutations';
import { useFeedQuery } from '@/features/feed/application/useFeedQuery';
import { useFeedRealtime } from '@/features/feed/application/useFeedRealtime';
import type { FeedIdentity } from '@/features/feed/data/feedIdentityRepository';
import type { CommunityPost, CommunityPostDraft } from '@/features/feed/model/community';
import type { FeedFilter } from '@/features/feed/model/feed';

type FeedContextValue = {
  activeFilter: FeedFilter;
  addPost: (draft: CommunityPostDraft) => Promise<string>;
  allPosts: CommunityPost[];
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
  setActiveFilter: (filter: FeedFilter) => void;
  toggleBookmark: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
};

const FeedContext = createContext<FeedContextValue | null>(null);

export function FeedProvider({ children }: PropsWithChildren) {
  const { profile } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('todo');
  const identity = useMemo<FeedIdentity>(() => ({
    displayName: profile?.displayName ?? 'Miembro de Tribus',
    initials: profile?.initials || 'V',
    location: profile?.location ?? 'Tu comunidad',
  }), [profile]);

  const {
    allPosts,
    cursor,
    error,
    isLoading,
    isLoadingMore,
    loadMore,
    mutationPosts,
    posts,
    refresh,
    reloadFirstPage,
    setError,
    setPosts,
    syncFirstPage,
    syncPost,
  } = useFeedQuery(identity, activeFilter);
  const {
    addPost,
    deletePost,
    isPublishingPost,
    selectPollOption,
    toggleBookmark,
    toggleLike,
  } = useFeedMutations({
    identity,
    posts: mutationPosts,
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
    activeFilter,
    addPost,
    allPosts,
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
    setActiveFilter,
    toggleBookmark,
    toggleLike,
  }), [
    activeFilter,
    addPost,
    allPosts,
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
