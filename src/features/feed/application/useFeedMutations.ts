import { useCallback, useMemo, useRef } from 'react';

import { feedErrorMessage } from '@/features/feed/application/feedError';
import type {
  FeedErrorSetter,
  FeedPostsSetter,
} from '@/features/feed/application/useFeedQuery';
import type { FeedIdentity } from '@/features/feed/data/feedIdentityRepository';
import {
  setPollVote,
  setPostBookmarked,
  setPostLiked,
} from '@/features/feed/data/feedInteractionsRepository';
import { createFeedPost, deleteFeedPost } from '@/features/feed/data/feedRepository';
import type { CommunityPost, CommunityPostDraft } from '@/features/feed/model/community';
import { postsReducer } from '@/features/feed/model/posts';

type UseFeedMutationsParams = {
  identity: FeedIdentity;
  posts: CommunityPost[];
  reloadFirstPage: () => Promise<void>;
  setError: FeedErrorSetter;
  setPosts: FeedPostsSetter;
};

export function useFeedMutations({
  identity,
  posts,
  reloadFirstPage,
  setError,
  setPosts,
}: UseFeedMutationsParams) {
  const isPublishingPost = useRef(false);

  const addPost = useCallback(async (draft: CommunityPostDraft) => {
    isPublishingPost.current = true;
    try {
      const persistedId = String(await createFeedPost(draft, identity));
      await reloadFirstPage();
      return persistedId;
    } catch (cause) {
      setError(feedErrorMessage(cause));
      throw cause;
    } finally {
      isPublishingPost.current = false;
    }
  }, [identity, reloadFirstPage, setError]);

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
      setError(feedErrorMessage(cause));
      throw cause;
    }
  }, [posts, setError, setPosts]);

  const selectPollOption = useCallback(async (postId: string, optionId: string) => {
    const previousPost = posts.find((post) => post.id === postId);
    if (!previousPost || previousPost.selectedPollOptionId === optionId) return;
    setPosts((current) => postsReducer(current, { optionId, postId, type: 'pollOptionSelected' }));
    try {
      await setPollVote(postId, optionId);
      setError(null);
    } catch (cause) {
      setPosts((current) => current.map((post) => post.id === postId ? previousPost : post));
      setError(feedErrorMessage(cause));
      throw cause;
    }
  }, [posts, setError, setPosts]);

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
      setError(feedErrorMessage(cause));
      throw cause;
    }
  }, [posts, setError, setPosts]);

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
      setError(feedErrorMessage(cause));
      throw cause;
    }
  }, [posts, setError, setPosts]);

  return useMemo(() => ({
    addPost,
    deletePost,
    isPublishingPost,
    selectPollOption,
    toggleBookmark,
    toggleLike,
  }), [
    addPost,
    deletePost,
    selectPollOption,
    toggleBookmark,
    toggleLike,
  ]);
}
