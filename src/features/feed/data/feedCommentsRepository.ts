import { mapComment } from '@/features/feed/data/feedMappers';
import type { CommentRow } from '@/features/feed/data/feedRows';
import {
  assertNoFeedError,
  ensureFeedIdentity,
  type FeedIdentity,
} from '@/features/feed/data/feedIdentityRepository';
import { supabase } from '@/shared/infrastructure/supabase/client';

export const COMMENTS_PAGE_SIZE = 20;

export type CommentsCursor = {
  createdAt: string;
  id: number;
};

export type CommentsPage = {
  comments: ReturnType<typeof mapComment>[];
  cursor: CommentsCursor | null;
};

export async function listPostComments(
  postId: string,
  cursor?: CommentsCursor | null,
): Promise<CommentsPage> {
  const numericPostId = Number(postId);
  if (!Number.isSafeInteger(numericPostId) || numericPostId <= 0) {
    return { comments: [], cursor: null };
  }

  let query = supabase
    .from('post_comments')
    .select('id, post_id, content, created_at, like_count, parent_comment_id, profiles!post_comments_author_id_fkey(display_name, initials), comment_likes(user_id)')
    .eq('post_id', numericPostId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(COMMENTS_PAGE_SIZE);

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    );
  }

  const result = await query;
  assertNoFeedError(result.error);

  const rows = (result.data ?? []) as unknown as CommentRow[];
  const oldestRow = rows.at(-1);
  return {
    // The database reads newest-first so the first page always contains the
    // latest conversation. The UI receives each page in chronological order.
    comments: rows.map(mapComment).reverse(),
    cursor: rows.length === COMMENTS_PAGE_SIZE && oldestRow
      ? { createdAt: oldestRow.created_at, id: oldestRow.id }
      : null,
  };
}

export async function createPostComment(
  postId: string,
  content: string,
  identity: FeedIdentity,
  replyToCommentId?: string,
) {
  const user = await ensureFeedIdentity(identity);
  const result = await supabase.from('post_comments').insert({
    author_id: user.id,
    content: content.trim(),
    parent_comment_id: replyToCommentId ? Number(replyToCommentId) : null,
    post_id: Number(postId),
  }).select('id').single();
  assertNoFeedError(result.error);
  if (!result.data) throw new Error('No fue posible publicar el comentario.');
  return String(result.data.id);
}
