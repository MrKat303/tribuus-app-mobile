import {
  assertNoFeedError,
  ensureFeedIdentity,
  getFeedAccount,
  type FeedIdentity,
} from '@/features/feed/data/feedIdentityRepository';
import { getFeedInteractionState } from '@/features/feed/data/feedInteractionsRepository';
import { mapPost } from '@/features/feed/data/feedMappers';
import type { FeedPostRow } from '@/features/feed/data/feedRows';
import {
  cleanupDeletedFeedPostMedia,
  type DeletablePostMedia,
  persistFeedPostMedia,
  removeFeedPostMedia,
} from '@/features/feed/data/feedMediaRepository';
import type { CommunityPost, CommunityPostDraft } from '@/features/feed/model/community';
import { supabase } from '@/shared/infrastructure/supabase/client';

export const FEED_PAGE_SIZE = 20;

const FEED_POST_SELECT = `
  id,
  author_id,
  category,
  comment_count,
  content,
  title,
  location,
  image_path,
  audio_path,
  audio_name,
  like_count,
  published_at,
  profiles!posts_author_id_fkey(display_name, initials),
  post_images(id, storage_path, position),
  post_polls(question, poll_options(id, label, position, vote_count))
`;

export type FeedCursor = {
  id: number;
  publishedAt: string;
};

export type FeedPage = {
  cursor: FeedCursor | null;
  posts: CommunityPost[];
};

async function hydrateFeedRows(rows: FeedPostRow[]) {
  if (rows.length === 0) return [];
  const postIds = rows.map((row) => row.id);
  const interactions = await getFeedInteractionState(postIds);

  return rows.map((row) => mapPost(
    row,
    interactions.likedPostIds,
    interactions.bookmarkedPostIds,
    interactions.selectedPollOptions,
  ));
}

export async function listFeedPosts(cursor?: FeedCursor | null): Promise<FeedPage> {
  const { communityId } = await getFeedAccount();
  let query = supabase
    .from('posts')
    .select(FEED_POST_SELECT)
    .eq('community_id', communityId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(FEED_PAGE_SIZE);

  if (cursor) {
    query = query.or(
      `published_at.lt.${cursor.publishedAt},and(published_at.eq.${cursor.publishedAt},id.lt.${cursor.id})`,
    );
  }

  const postsResult = await query;
  assertNoFeedError(postsResult.error);
  const rows = (postsResult.data ?? []) as unknown as FeedPostRow[];
  if (rows.length === 0) return { cursor: null, posts: [] };
  const lastRow = rows.at(-1);
  return {
    cursor: rows.length === FEED_PAGE_SIZE && lastRow
      ? { id: lastRow.id, publishedAt: lastRow.published_at }
      : null,
    posts: await hydrateFeedRows(rows),
  };
}

export async function getFeedPost(postId: string) {
  const numericPostId = Number(postId);
  if (!Number.isSafeInteger(numericPostId) || numericPostId <= 0) return null;

  const { communityId } = await getFeedAccount();
  const result = await supabase
    .from('posts')
    .select(FEED_POST_SELECT)
    .eq('community_id', communityId)
    .eq('id', numericPostId)
    .eq('status', 'published')
    .maybeSingle();
  assertNoFeedError(result.error);
  if (!result.data) return null;

  const [post] = await hydrateFeedRows([result.data as unknown as FeedPostRow]);
  return post ?? null;
}

export async function createFeedPost(draft: CommunityPostDraft, identity: FeedIdentity) {
  const { communityId, user } = await getFeedAccount();
  const postResult = await supabase.from('posts').insert({
    author_id: user.id,
    category: draft.category ?? 'comunidad',
    community_id: communityId,
    content: draft.content.trim(),
    has_poll: Boolean(draft.poll),
    location: draft.location ?? identity.location,
    status: 'draft',
    title: draft.title?.trim() ?? '',
  }).select('id').single();
  assertNoFeedError(postResult.error);
  if (!postResult.data) throw new Error('No fue posible crear la publicación.');

  const postId = Number(postResult.data.id);
  let uploadedPaths: string[] = [];
  try {
    const media = await persistFeedPostMedia(draft, user.id, postId);
    uploadedPaths = media.uploadedPaths;

    if (draft.poll) {
      const pollResult = await supabase.from('post_polls').insert({
        post_id: postId,
        question: draft.poll.question.trim(),
      });
      assertNoFeedError(pollResult.error);
      const optionsResult = await supabase.from('poll_options').insert(
        draft.poll.options.map((option, position) => ({
          label: option.label.trim(),
          position,
          post_id: postId,
        })),
      );
      assertNoFeedError(optionsResult.error);
    }

    const publishResult = await supabase.from('posts').update({
      audio_name: draft.audioName ?? null,
      audio_path: media.audioPath,
      image_path: media.imagePaths[0] ?? null,
      published_at: new Date().toISOString(),
      status: 'published',
    }).eq('id', postId);
    assertNoFeedError(publishResult.error);
    return postId;
  } catch (error) {
    await removeFeedPostMedia(uploadedPaths).catch(() => undefined);
    await supabase.from('posts').delete().eq('id', postId);
    throw error;
  }
}

type DeletablePostRow = DeletablePostMedia & {
  author_id: string;
};

export async function deleteFeedPost(postId: string) {
  const numericPostId = Number(postId);
  if (!Number.isSafeInteger(numericPostId) || numericPostId <= 0) {
    throw new Error('La publicación todavía no está disponible para eliminar.');
  }

  const user = await ensureFeedIdentity({ displayName: '', initials: '', location: '' });
  const postResult = await supabase
    .from('posts')
    .select('author_id, audio_path, image_path, post_images(storage_path)')
    .eq('id', numericPostId)
    .maybeSingle();
  assertNoFeedError(postResult.error);
  const post = postResult.data as DeletablePostRow | null;
  if (!post) return;
  if (post.author_id !== user.id) throw new Error('Solo puedes eliminar tus propias publicaciones.');

  const deleteResult = await supabase
    .from('posts')
    .delete()
    .eq('id', numericPostId)
    .eq('author_id', user.id)
    .select('id')
    .maybeSingle();
  assertNoFeedError(deleteResult.error);
  if (!deleteResult.data) throw new Error('No fue posible eliminar la publicación.');

  // Database deletion is authoritative. Storage cleanup is best-effort so a
  // transient media error cannot resurrect a post whose row was deleted.
  await cleanupDeletedFeedPostMedia(post).catch(() => undefined);
}
