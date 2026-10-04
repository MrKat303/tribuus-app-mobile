import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { feedErrorMessage } from '@/features/feed/application/feedError';
import {
  createPostComment,
  listPostComments,
  type CommentsCursor,
} from '@/features/feed/data/feedCommentsRepository';
import type { FeedIdentity } from '@/features/feed/data/feedIdentityRepository';
import { setCommentLiked } from '@/features/feed/data/feedInteractionsRepository';
import { subscribeToPostComments } from '@/features/feed/data/feedRealtime';
import type { CommunityComment } from '@/features/feed/model/community';

type UsePostCommentsParams = {
  identity: FeedIdentity;
  onPostInvalidated: (postId: string) => void;
  postId: string | undefined;
};

export function usePostComments({ identity, onPostInvalidated, postId }: UsePostCommentsParams) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [cursor, setCursor] = useState<CommentsCursor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requestSequence = useRef(0);

  const replaceWithFirstPage = useCallback(async () => {
    const requestId = ++requestSequence.current;
    if (!postId) {
      setComments([]);
      setCursor(null);
      return;
    }

    const page = await listPostComments(postId);
    if (requestId !== requestSequence.current) return;
    setComments(page.comments);
    setCursor(page.cursor);
    setError(null);
  }, [postId]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await replaceWithFirstPage();
    } catch (cause) {
      setError(feedErrorMessage(cause));
      throw cause;
    } finally {
      setIsLoading(false);
    }
  }, [replaceWithFirstPage]);

  const loadMore = useCallback(async () => {
    if (!postId || !cursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const page = await listPostComments(postId, cursor);
      setComments((current) => {
        const existingIds = new Set(current.map(({ id }) => id));
        return [
          ...page.comments.filter(({ id }) => !existingIds.has(id)),
          ...current,
        ];
      });
      setCursor(page.cursor);
      setError(null);
    } catch (cause) {
      setError(feedErrorMessage(cause));
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, isLoadingMore, postId]);

  const addComment = useCallback(async (content: string, replyToCommentId?: string) => {
    if (!postId) return;
    const optimisticId = `pending-comment-${Date.now()}`;
    const optimisticComment: CommunityComment = {
      author: identity.displayName,
      content: content.trim(),
      id: optimisticId,
      initials: identity.initials,
      isLiked: false,
      likes: 0,
      replyToCommentId,
      timeLabel: 'Ahora',
    };

    setComments((current) => [...current, optimisticComment]);
    setIsSubmitting(true);
    try {
      const persistedId = await createPostComment(postId, content, identity, replyToCommentId);
      setComments((current) => current.map((comment) => comment.id === optimisticId
        ? { ...comment, id: persistedId }
        : comment));
      setError(null);
      onPostInvalidated(postId);
    } catch (cause) {
      setComments((current) => current.filter(({ id }) => id !== optimisticId));
      setError(feedErrorMessage(cause));
      throw cause;
    } finally {
      setIsSubmitting(false);
    }
  }, [identity, onPostInvalidated, postId]);

  const toggleCommentLike = useCallback(async (commentId: string) => {
    const previousComment = comments.find(({ id }) => id === commentId);
    if (!previousComment || commentId.startsWith('pending-comment-')) return;
    const liked = previousComment.isLiked ?? false;
    setComments((current) => current.map((comment) => comment.id === commentId
      ? {
        ...comment,
        isLiked: !liked,
        likes: Math.max(0, (comment.likes ?? 0) + (liked ? -1 : 1)),
      }
      : comment));

    try {
      await setCommentLiked(commentId, !liked);
      setError(null);
    } catch (cause) {
      setComments((current) => current.map((comment) => comment.id === commentId
        ? previousComment
        : comment));
      setError(feedErrorMessage(cause));
      throw cause;
    }
  }, [comments]);

  useEffect(() => {
    // Comments are an external paginated resource owned by this detail screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh().catch(() => undefined);
  }, [refresh]);

  useEffect(() => {
    if (!postId) return undefined;
    return subscribeToPostComments(postId, () => {
      void replaceWithFirstPage().catch((cause) => setError(feedErrorMessage(cause)));
      onPostInvalidated(postId);
    });
  }, [onPostInvalidated, postId, replaceWithFirstPage]);

  return useMemo(() => ({
    addComment,
    comments,
    error,
    hasMore: cursor !== null,
    isLoading,
    isLoadingMore,
    isSubmitting,
    loadMore,
    refresh,
    toggleCommentLike,
  }), [
    addComment,
    comments,
    cursor,
    error,
    isLoading,
    isLoadingMore,
    isSubmitting,
    loadMore,
    refresh,
    toggleCommentLike,
  ]);
}
