import { supabase } from '@/shared/infrastructure/supabase/client';
import { mapComment, mapPost } from '@/features/feed/data/feedMappers';
import { subscribeToCommunityFeedChanges, type FeedRealtimeChange } from '@/features/feed/data/feedRealtime';
import type { CommentRow, FeedPostRow } from '@/features/feed/data/feedRows';
import { removePostMedia, uploadPostMedia } from '@/features/feed/data/postMediaStorage';
import type {
  CommunityComment,
  CommunityPost,
  CommunityPostDraft,
} from '@/features/feed/model/community';

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

export type FeedIdentity = {
  displayName: string;
  initials: string;
  location: string;
};

export type FeedPage = {
  cursor: FeedCursor | null;
  posts: CommunityPost[];
};

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function ensureFeedIdentity(_identity: FeedIdentity) {
  const currentSession = await supabase.auth.getSession();
  assertNoError(currentSession.error);
  const user = currentSession.data.session?.user;
  if (!user) throw new Error('Inicia sesión para participar en la comunidad.');
  return user;
}

async function getFeedAccount() {
  const user = await ensureFeedIdentity({ displayName: '', initials: '', location: '' });
  const profileResult = await supabase
    .from('profiles')
    .select('primary_community_id')
    .eq('id', user.id)
    .single();
  assertNoError(profileResult.error);
  const communityId = profileResult.data?.primary_community_id as string | null | undefined;
  if (!communityId) throw new Error('Completa tu perfil y elige una comunidad para ver el feed.');
  return { communityId, user };
}

async function hydrateFeedRows(rows: FeedPostRow[]) {
  if (rows.length === 0) return [];

  const postIds = rows.map((row) => row.id);
  const sessionResult = await supabase.auth.getSession();
  assertNoError(sessionResult.error);
  const userId = sessionResult.data.session?.user.id;

  const commentsPromise = supabase
    .from('post_comments')
    .select('id, post_id, content, created_at, like_count, parent_comment_id, profiles!post_comments_author_id_fkey(display_name, initials), comment_likes(user_id)')
    .in('post_id', postIds)
    .order('created_at', { ascending: true });
  const likesPromise = userId
    ? supabase.from('post_likes').select('post_id').eq('user_id', userId).in('post_id', postIds)
    : Promise.resolve({ data: [], error: null });
  const bookmarksPromise = userId
    ? supabase.from('post_bookmarks').select('post_id').eq('user_id', userId).in('post_id', postIds)
    : Promise.resolve({ data: [], error: null });
  const votesPromise = userId
    ? supabase.from('poll_votes').select('post_id, option_id').eq('user_id', userId).in('post_id', postIds)
    : Promise.resolve({ data: [], error: null });

  const [commentsResult, likesResult, bookmarksResult, votesResult] = await Promise.all([
    commentsPromise,
    likesPromise,
    bookmarksPromise,
    votesPromise,
  ]);
  assertNoError(commentsResult.error);
  assertNoError(likesResult.error);
  assertNoError(bookmarksResult.error);
  assertNoError(votesResult.error);

  const commentsByPost = new Map<number, CommunityComment[]>();
  for (const comment of (commentsResult.data ?? []) as unknown as CommentRow[]) {
    const current = commentsByPost.get(comment.post_id) ?? [];
    current.push(mapComment(comment));
    commentsByPost.set(comment.post_id, current);
  }

  const likedPostIds = new Set((likesResult.data ?? []).map((like) => Number(like.post_id)));
  const bookmarkedPostIds = new Set((bookmarksResult.data ?? []).map((bookmark) => Number(bookmark.post_id)));
  const selectedPollOptions = new Map(
    (votesResult.data ?? []).map((vote) => [Number(vote.post_id), Number(vote.option_id)]),
  );

  return rows.map((row) => mapPost(
    row,
    commentsByPost.get(row.id) ?? [],
    likedPostIds,
    bookmarkedPostIds,
    selectedPollOptions,
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
  assertNoError(postsResult.error);
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
  assertNoError(result.error);
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
  assertNoError(postResult.error);
  if (!postResult.data) throw new Error('No fue posible crear la publicación.');

  const postId = Number(postResult.data.id);
  const uploadedPaths: string[] = [];
  try {
    const draftImages = draft.images?.length
      ? draft.images
      : draft.imageUri
        ? [{ id: 'legacy', uri: draft.imageUri }]
        : [];
    const imagePaths: string[] = [];
    for (const [position, image] of draftImages.entries()) {
      const imagePath = await uploadPostMedia(image.uri, user.id, postId, 'image', `-${position}`);
      imagePaths.push(imagePath);
      uploadedPaths.push(imagePath);
    }
    if (imagePaths.length > 0) {
      const imagesResult = await supabase.from('post_images').insert(imagePaths.map((storagePath, position) => ({
        position,
        post_id: postId,
        storage_path: storagePath,
      })));
      assertNoError(imagesResult.error);
    }
    const audioPath = draft.audioUri
      ? await uploadPostMedia(draft.audioUri, user.id, postId, 'audio')
      : null;
    if (audioPath) uploadedPaths.push(audioPath);

    if (draft.poll) {
      const pollResult = await supabase.from('post_polls').insert({
        post_id: postId,
        question: draft.poll.question.trim(),
      });
      assertNoError(pollResult.error);
      const optionsResult = await supabase.from('poll_options').insert(
        draft.poll.options.map((option, position) => ({
          label: option.label.trim(),
          position,
          post_id: postId,
        })),
      );
      assertNoError(optionsResult.error);
    }

    const publishResult = await supabase.from('posts').update({
      audio_name: draft.audioName ?? null,
      audio_path: audioPath,
      image_path: imagePaths[0] ?? null,
      published_at: new Date().toISOString(),
      status: 'published',
    }).eq('id', postId);
    assertNoError(publishResult.error);
    return postId;
  } catch (error) {
    await removePostMedia(uploadedPaths).catch(() => undefined);
    await supabase.from('posts').delete().eq('id', postId);
    throw error;
  }
}

type DeletablePostRow = {
  audio_path: string | null;
  author_id: string;
  image_path: string | null;
  post_images: { storage_path: string }[] | null;
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
  assertNoError(postResult.error);
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
  assertNoError(deleteResult.error);
  if (!deleteResult.data) throw new Error('No fue posible eliminar la publicación.');

  const mediaPaths = Array.from(new Set([
    post.audio_path,
    post.image_path,
    ...(post.post_images ?? []).map(({ storage_path: storagePath }) => storagePath),
  ].filter((path): path is string => Boolean(path))));
  if (mediaPaths.length === 0) return;

  // Database deletion is authoritative. Storage cleanup is best-effort so a
  // transient media error cannot resurrect a post whose row was deleted.
  await removePostMedia(mediaPaths).catch(() => undefined);
}

export async function setPostLiked(postId: string, liked: boolean) {
  const sessionResult = await supabase.auth.getSession();
  assertNoError(sessionResult.error);
  const userId = sessionResult.data.session?.user.id;
  if (!userId) throw new Error('Necesitas una sesión para votar una publicación.');
  const result = liked
    ? await supabase.from('post_likes').insert({ post_id: Number(postId), user_id: userId })
    : await supabase.from('post_likes').delete().eq('post_id', Number(postId)).eq('user_id', userId);
  if (result.error?.code !== '23505') assertNoError(result.error);
}

export async function setPostBookmarked(postId: string, bookmarked: boolean) {
  const sessionResult = await supabase.auth.getSession();
  assertNoError(sessionResult.error);
  const userId = sessionResult.data.session?.user.id;
  if (!userId) throw new Error('Necesitas una sesión para guardar una publicación.');
  const result = bookmarked
    ? await supabase.from('post_bookmarks').insert({ post_id: Number(postId), user_id: userId })
    : await supabase.from('post_bookmarks').delete().eq('post_id', Number(postId)).eq('user_id', userId);
  if (result.error?.code !== '23505') assertNoError(result.error);
}

export async function createPostComment(postId: string, content: string, identity: FeedIdentity, replyToCommentId?: string) {
  const user = await ensureFeedIdentity(identity);
  const result = await supabase.from('post_comments').insert({
    author_id: user.id,
    content: content.trim(),
    parent_comment_id: replyToCommentId ? Number(replyToCommentId) : null,
    post_id: Number(postId),
  }).select('id').single();
  assertNoError(result.error);
  if (!result.data) throw new Error('No fue posible publicar el comentario.');
  return String(result.data.id);
}

export async function setCommentLiked(commentId: string, liked: boolean) {
  const sessionResult = await supabase.auth.getSession();
  assertNoError(sessionResult.error);
  const userId = sessionResult.data.session?.user.id;
  if (!userId) throw new Error('Necesitas una sesión para reaccionar a un comentario.');
  const result = liked
    ? await supabase.from('comment_likes').insert({ comment_id: Number(commentId), user_id: userId })
    : await supabase.from('comment_likes').delete().eq('comment_id', Number(commentId)).eq('user_id', userId);
  if (result.error?.code !== '23505') assertNoError(result.error);
}

export async function setPollVote(postId: string, optionId: string) {
  const sessionResult = await supabase.auth.getSession();
  assertNoError(sessionResult.error);
  const userId = sessionResult.data.session?.user.id;
  if (!userId) throw new Error('Necesitas una sesión para votar en la encuesta.');
  const result = await supabase.from('poll_votes').upsert({
    option_id: Number(optionId),
    post_id: Number(postId),
    user_id: userId,
  }, { onConflict: 'post_id,user_id' });
  assertNoError(result.error);
}

export function subscribeToFeedChanges(
  visiblePostIds: string[],
  onChange: (change: FeedRealtimeChange) => void,
) {
  let active = true;
  let unsubscribe: (() => void) | null = null;

  void getFeedAccount().then(({ communityId }) => {
    if (!active) return;
    unsubscribe = subscribeToCommunityFeedChanges(communityId, visiblePostIds, onChange);
  }).catch(() => undefined);

  return () => {
    active = false;
    unsubscribe?.();
  };
}
