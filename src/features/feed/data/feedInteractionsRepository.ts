import { assertNoFeedError } from '@/features/feed/data/feedIdentityRepository';
import { supabase } from '@/shared/infrastructure/supabase/client';

export type FeedInteractionState = {
  bookmarkedPostIds: ReadonlySet<number>;
  likedPostIds: ReadonlySet<number>;
  selectedPollOptions: ReadonlyMap<number, number>;
};

export async function getFeedInteractionState(postIds: number[]): Promise<FeedInteractionState> {
  const sessionResult = await supabase.auth.getSession();
  assertNoFeedError(sessionResult.error);
  const userId = sessionResult.data.session?.user.id;
  if (!userId) {
    return {
      bookmarkedPostIds: new Set(),
      likedPostIds: new Set(),
      selectedPollOptions: new Map(),
    };
  }

  const [likesResult, bookmarksResult, votesResult] = await Promise.all([
    supabase.from('post_likes').select('post_id').eq('user_id', userId).in('post_id', postIds),
    supabase.from('post_bookmarks').select('post_id').eq('user_id', userId).in('post_id', postIds),
    supabase.from('poll_votes').select('post_id, option_id').eq('user_id', userId).in('post_id', postIds),
  ]);
  assertNoFeedError(likesResult.error);
  assertNoFeedError(bookmarksResult.error);
  assertNoFeedError(votesResult.error);

  return {
    bookmarkedPostIds: new Set((bookmarksResult.data ?? []).map((bookmark) => Number(bookmark.post_id))),
    likedPostIds: new Set((likesResult.data ?? []).map((like) => Number(like.post_id))),
    selectedPollOptions: new Map(
      (votesResult.data ?? []).map((vote) => [Number(vote.post_id), Number(vote.option_id)]),
    ),
  };
}

async function getInteractionUserId(errorMessage: string) {
  const sessionResult = await supabase.auth.getSession();
  assertNoFeedError(sessionResult.error);
  const userId = sessionResult.data.session?.user.id;
  if (!userId) throw new Error(errorMessage);
  return userId;
}

export async function setPostLiked(postId: string, liked: boolean) {
  const userId = await getInteractionUserId('Necesitas una sesión para votar una publicación.');
  const result = liked
    ? await supabase.from('post_likes').insert({ post_id: Number(postId), user_id: userId })
    : await supabase.from('post_likes').delete().eq('post_id', Number(postId)).eq('user_id', userId);
  if (result.error?.code !== '23505') assertNoFeedError(result.error);
}

export async function setPostBookmarked(postId: string, bookmarked: boolean) {
  const userId = await getInteractionUserId('Necesitas una sesión para guardar una publicación.');
  const result = bookmarked
    ? await supabase.from('post_bookmarks').insert({ post_id: Number(postId), user_id: userId })
    : await supabase.from('post_bookmarks').delete().eq('post_id', Number(postId)).eq('user_id', userId);
  if (result.error?.code !== '23505') assertNoFeedError(result.error);
}

export async function setCommentLiked(commentId: string, liked: boolean) {
  const userId = await getInteractionUserId('Necesitas una sesión para reaccionar a un comentario.');
  const result = liked
    ? await supabase.from('comment_likes').insert({ comment_id: Number(commentId), user_id: userId })
    : await supabase.from('comment_likes').delete().eq('comment_id', Number(commentId)).eq('user_id', userId);
  if (result.error?.code !== '23505') assertNoFeedError(result.error);
}

export async function setPollVote(postId: string, optionId: string) {
  const userId = await getInteractionUserId('Necesitas una sesión para votar en la encuesta.');
  const result = await supabase.from('poll_votes').upsert({
    option_id: Number(optionId),
    post_id: Number(postId),
    user_id: userId,
  }, { onConflict: 'post_id,user_id' });
  assertNoFeedError(result.error);
}
