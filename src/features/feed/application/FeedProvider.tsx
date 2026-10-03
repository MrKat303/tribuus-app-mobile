import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/features/auth/application/AuthProvider';
import { postsReducer } from '@/features/feed/model/posts';
import {
  createFeedPost,
  createPostComment,
  deleteFeedPost,
  ensureFeedIdentity,
  type FeedCursor,
  type FeedIdentity,
  getFeedPost,
  listFeedPosts,
  setCommentLiked,
  setPollVote,
  setPostBookmarked,
  setPostLiked,
  subscribeToFeedChanges,
} from '@/features/feed/services/postsRepository';
import type { CommunityPost, CommunityPostDraft } from '@/features/feed/model/community';

type FeedContextValue = {
  addComment: (postId: string, content: string, replyToCommentId?: string) => Promise<void>;
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
  toggleCommentLike: (postId: string, commentId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
};

const FeedContext = createContext<FeedContextValue | null>(null);

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No fue posible sincronizar el feed.';
}

export function FeedProvider({ children }: PropsWithChildren) {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [cursor, setCursor] = useState<FeedCursor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPublishingPost = useRef(false);
  const postRefreshTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const identity = useMemo<FeedIdentity>(() => ({
    displayName: profile?.displayName ?? 'Miembro de Tribus',
    initials: profile?.initials || 'V',
    location: profile?.location ?? 'Providencia',
  }), [profile]);

  const syncFirstPage = useCallback(async () => {
    try {
      await ensureFeedIdentity(identity);
      const page = await listFeedPosts();
      setPosts(page.posts);
      setCursor(page.cursor);
      setError(null);
    } catch (cause) {
      setError(errorMessage(cause));
      throw cause;
    }
  }, [identity]);

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
      setError(errorMessage(cause));
      throw cause;
    }
  }, []);

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

  useEffect(() => {
    // The provider must hydrate from the external Supabase store when identity changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void syncFirstPage().catch(() => undefined).finally(() => setIsLoading(false));
  }, [syncFirstPage]);

  const realtimePostIdsKey = posts.map(({ id }) => id).join(',');
  const realtimePostIds = useMemo(
    () => realtimePostIdsKey ? realtimePostIdsKey.split(',') : [],
    [realtimePostIdsKey],
  );

  useEffect(() => subscribeToFeedChanges(realtimePostIds, (change) => {
    if (isPublishingPost.current) return;
    if (change.scope === 'post') {
      invalidatePost(change.postId);
      return;
    }
    void syncFirstPage().catch(() => undefined);
  }), [invalidatePost, realtimePostIds, syncFirstPage]);

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
      setError(errorMessage(cause));
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, isLoadingMore]);

  const addPost = useCallback(async (draft: CommunityPostDraft) => {
    isPublishingPost.current = true;
    try {
      const persistedId = String(await createFeedPost(draft, identity));
      const page = await listFeedPosts();
      setPosts(page.posts);
      setCursor(page.cursor);
      setError(null);
      return persistedId;
    } catch (cause) {
      setError(errorMessage(cause));
      throw cause;
    } finally {
      isPublishingPost.current = false;
    }
  }, [identity]);

  const deletePost = useCallback(async (postId: string) => {
    const deletedIndex = posts.findIndex((post) => post.id === postId);
    const deletedPost = posts[deletedIndex];
    if (!deletedPost) return;

    setPosts((current) => postsReducer(current, { postId, type: 'postDeleted' }));
    try {
      await deleteFeedPost(postId);
      setError(null);
    } catch (cause) {
      setPosts((current) => {
        if (current.some((post) => post.id === postId)) return current;
        const restored = [...current];
        restored.splice(Math.min(Math.max(deletedIndex, 0), restored.length), 0, deletedPost);
        return restored;
      });
      setError(errorMessage(cause));
      throw cause;
    }
  }, [posts]);

  const addComment = useCallback(async (postId: string, content: string, replyToCommentId?: string) => {
    const optimisticId = `pending-comment-${Date.now()}`;
    const optimisticComment: CommunityPost['comments'][number] = {
      author: identity.displayName,
      content: content.trim(),
      id: optimisticId,
      initials: identity.initials,
      isLiked: false,
      likes: 0,
      replyToCommentId,
      timeLabel: 'Ahora',
    };
    setPosts((current) => postsReducer(current, {
      comment: optimisticComment,
      postId,
      type: 'commentAdded',
    }));

    try {
      const persistedId = await createPostComment(postId, content, identity, replyToCommentId);
      setPosts((current) => current.map((post) => post.id === postId
        ? {
          ...post,
          comments: post.comments.map((comment) => comment.id === optimisticId
            ? { ...comment, id: persistedId }
            : comment),
        }
        : post));
      setError(null);
    } catch (cause) {
      setPosts((current) => current.map((post) => post.id === postId
        ? { ...post, comments: post.comments.filter((comment) => comment.id !== optimisticId) }
        : post));
      setError(errorMessage(cause));
      throw cause;
    }
  }, [identity]);

  const selectPollOption = useCallback(async (postId: string, optionId: string) => {
    const previousPost = posts.find((post) => post.id === postId);
    if (!previousPost || previousPost.selectedPollOptionId === optionId) return;
    setPosts((current) => postsReducer(current, { optionId, postId, type: 'pollOptionSelected' }));
    try {
      await setPollVote(postId, optionId);
      setError(null);
    } catch (cause) {
      setPosts((current) => current.map((post) => post.id === postId ? previousPost : post));
      setError(errorMessage(cause));
      throw cause;
    }
  }, [posts]);

  const toggleBookmark = useCallback(async (postId: string) => {
    const previousPost = posts.find((post) => post.id === postId);
    if (!previousPost) return;
    const nextValue = !(previousPost.isBookmarked ?? false);
    setPosts((current) => postsReducer(current, { postId, type: 'bookmarkToggled' }));
    try {
      await setPostBookmarked(postId, nextValue);
      setError(null);
    } catch (cause) {
      setPosts((current) => current.map((post) => post.id === postId ? previousPost : post));
      setError(errorMessage(cause));
      throw cause;
    }
  }, [posts]);

  const toggleCommentLike = useCallback(async (postId: string, commentId: string) => {
    const previousPost = posts.find((post) => post.id === postId);
    const previousComment = previousPost?.comments.find((comment) => comment.id === commentId);
    if (!previousPost || !previousComment) return;
    const nextValue = !(previousComment.isLiked ?? false);
    setPosts((current) => postsReducer(current, { commentId, postId, type: 'commentLikeToggled' }));
    try {
      await setCommentLiked(commentId, nextValue);
      setError(null);
    } catch (cause) {
      setPosts((current) => current.map((post) => post.id === postId ? previousPost : post));
      setError(errorMessage(cause));
      throw cause;
    }
  }, [posts]);

  const toggleLike = useCallback(async (postId: string) => {
    const previousPost = posts.find((post) => post.id === postId);
    if (!previousPost) return;
    const nextValue = !previousPost.isLiked;
    setPosts((current) => postsReducer(current, { postId, type: 'likeToggled' }));
    try {
      await setPostLiked(postId, nextValue);
      setError(null);
    } catch (cause) {
      setPosts((current) => current.map((post) => post.id === postId ? previousPost : post));
      setError(errorMessage(cause));
      throw cause;
    }
  }, [posts]);

  const value = useMemo(() => ({
    addComment,
    addPost,
    deletePost,
    error,
    hasMore: cursor !== null,
    isLoading,
    isLoadingMore,
    invalidatePost,
    loadMore,
    posts,
    refresh,
    selectPollOption,
    toggleBookmark,
    toggleCommentLike,
    toggleLike,
  }), [
    addComment, addPost, cursor, deletePost, error, invalidatePost, isLoading, isLoadingMore, loadMore, posts,
    refresh, selectPollOption, toggleBookmark, toggleCommentLike, toggleLike,
  ]);

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeed() {
  const context = useContext(FeedContext);
  if (!context) throw new Error('useFeed debe usarse dentro de FeedProvider.');
  return context;
}
