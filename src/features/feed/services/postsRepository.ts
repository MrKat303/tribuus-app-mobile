import { fetch as expoFetch } from 'expo/fetch';

import { supabase } from '@/services/supabase';
import type {
  CommunityComment,
  CommunityPost,
  CommunityPostDraft,
  CommunityPollOption,
} from '@/types/community';

const POST_MEDIA_BUCKET = 'post-media';
export const FEED_PAGE_SIZE = 20;

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

type ProfileRelation = {
  display_name: string;
  initials: string;
};

type PollOptionRow = {
  id: number;
  label: string;
  position: number;
  vote_count: number;
};

type PollRow = {
  question: string;
  poll_options: PollOptionRow[];
};

type FeedPostRow = {
  id: number;
  author_id: string;
  category: CommunityPost['category'];
  comment_count: number;
  content: string;
  title: string;
  location: string | null;
  image_path: string | null;
  audio_path: string | null;
  audio_name: string | null;
  like_count: number;
  published_at: string;
  profiles: ProfileRelation;
  post_images: PostImageRow[];
  post_polls: PollRow | null;
};

type PostImageRow = {
  id: number;
  position: number;
  storage_path: string;
};

type CommentRow = {
  id: number;
  post_id: number;
  content: string;
  created_at: string;
  like_count: number;
  parent_comment_id: number | null;
  profiles: ProfileRelation;
  comment_likes: { user_id: string }[];
};

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function getPublicMediaUrl(path: string | null) {
  if (!path) return undefined;
  return supabase.storage.from(POST_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

function formatRelativeTime(timestamp: string) {
  const elapsedSeconds = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (elapsedSeconds < 60) return 'Ahora';
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `Hace ${elapsedMinutes} min`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `Hace ${elapsedHours} h`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `Hace ${elapsedDays} d`;
}

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

function mapComment(row: CommentRow): CommunityComment {
  const author = normalizeRelation(row.profiles);
  return {
    author: author?.display_name ?? 'Vecino/a',
    content: row.content,
    id: String(row.id),
    initials: author?.initials ?? 'V',
    isLiked: row.comment_likes.length > 0,
    likes: row.like_count,
    replyToCommentId: row.parent_comment_id ? String(row.parent_comment_id) : undefined,
    timeLabel: formatRelativeTime(row.created_at),
  };
}

function mapPost(
  row: FeedPostRow,
  comments: readonly CommunityComment[],
  likedPostIds: ReadonlySet<number>,
  bookmarkedPostIds: ReadonlySet<number>,
  selectedPollOptions: ReadonlyMap<number, number>,
): CommunityPost {
  const author = normalizeRelation(row.profiles);
  const poll = normalizeRelation(row.post_polls);
  const pollOptions = [...(poll?.poll_options ?? [])].sort((left, right) => left.position - right.position);

  return {
    audioName: row.audio_name ?? undefined,
    audioUri: getPublicMediaUrl(row.audio_path),
    author: author?.display_name ?? 'Vecino/a',
    category: row.category,
    comments: [...comments],
    content: row.content,
    id: String(row.id),
    images: [...(row.post_images ?? [])]
      .sort((left, right) => left.position - right.position)
      .map((image) => ({ id: String(image.id), uri: getPublicMediaUrl(image.storage_path)! })),
    imageUri: getPublicMediaUrl(row.image_path),
    initials: author?.initials ?? 'V',
    isBookmarked: bookmarkedPostIds.has(row.id),
    isLiked: likedPostIds.has(row.id),
    likes: row.like_count,
    location: row.location ?? undefined,
    poll: poll ? {
      options: pollOptions.map((option): CommunityPollOption => ({
        id: String(option.id),
        label: option.label,
        votes: option.vote_count,
      })),
      question: poll.question,
    } : undefined,
    selectedPollOptionId: selectedPollOptions.has(row.id)
      ? String(selectedPollOptions.get(row.id))
      : undefined,
    timeLabel: formatRelativeTime(row.published_at),
    title: row.title,
  };
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

export async function listFeedPosts(cursor?: FeedCursor | null): Promise<FeedPage> {
  const { communityId } = await getFeedAccount();
  let query = supabase
    .from('posts')
    .select(`
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
    `)
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
  const lastRow = rows.at(-1);

  return {
    cursor: rows.length === FEED_PAGE_SIZE && lastRow
      ? { id: lastRow.id, publishedAt: lastRow.published_at }
      : null,
    posts: rows.map((row) => mapPost(
      row,
      commentsByPost.get(row.id) ?? [],
      likedPostIds,
      bookmarkedPostIds,
      selectedPollOptions,
    )),
  };
}

function mediaType(uri: string, kind: 'audio' | 'image') {
  const extension = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (kind === 'image') {
    if (extension === 'png') return { contentType: 'image/png', extension };
    if (extension === 'webp') return { contentType: 'image/webp', extension };
    if (extension === 'heic') return { contentType: 'image/heic', extension };
    return { contentType: 'image/jpeg', extension: 'jpg' };
  }
  if (extension === 'mp3') return { contentType: 'audio/mpeg', extension };
  if (extension === 'wav') return { contentType: 'audio/wav', extension };
  if (extension === 'mp4') return { contentType: 'audio/mp4', extension };
  return { contentType: 'audio/m4a', extension: 'm4a' };
}

async function uploadPostMedia(
  uri: string,
  userId: string,
  postId: number,
  kind: 'audio' | 'image',
  suffix = '',
) {
  const response = await expoFetch(uri);
  if (!response.ok) throw new Error(`No fue posible leer el archivo ${kind === 'image' ? 'de imagen' : 'de audio'}.`);
  const file = await response.arrayBuffer();
  const media = mediaType(uri, kind);
  const path = `${userId}/${postId}/${kind}${suffix}.${media.extension}`;
  const uploadResult = await supabase.storage.from(POST_MEDIA_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: media.contentType,
    upsert: false,
  });
  assertNoError(uploadResult.error);
  return path;
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
    if (uploadedPaths.length > 0) await supabase.storage.from(POST_MEDIA_BUCKET).remove(uploadedPaths);
    await supabase.from('posts').delete().eq('id', postId);
    throw error;
  }
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

export function subscribeToFeedChanges(onChange: () => void) {
  let active = true;
  let channel: ReturnType<typeof supabase.channel> | null = null;

  void getFeedAccount().then(({ communityId }) => {
    if (!active) return;
    channel = supabase
      .channel(`feed:${communityId}`)
      .on('postgres_changes', {
        event: '*',
        filter: `community_id=eq.${communityId}`,
        schema: 'public',
        table: 'posts',
      }, onChange)
      .subscribe();
  });

  return () => {
    active = false;
    if (channel) void supabase.removeChannel(channel);
  };
}
