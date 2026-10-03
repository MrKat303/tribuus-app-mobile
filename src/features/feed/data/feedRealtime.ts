import { supabase } from '@/shared/infrastructure/supabase/client';

type RealtimeRow = Record<string, unknown>;

type FeedRealtimePayload = {
  eventType: 'DELETE' | 'INSERT' | 'UPDATE';
  new: RealtimeRow;
  old: RealtimeRow;
};

export type FeedRealtimeChange =
  | { scope: 'feed' }
  | { postId: string; scope: 'post' };

const MAX_REALTIME_POST_FILTER_SIZE = 100;
let channelSequence = 0;

export function postIdFromRealtimePayload(payload: Pick<FeedRealtimePayload, 'new' | 'old'>) {
  const value = payload.new.post_id ?? payload.new.id ?? payload.old.post_id ?? payload.old.id;
  const numericValue = typeof value === 'string' ? Number(value) : value;
  return typeof numericValue === 'number' && Number.isSafeInteger(numericValue) && numericValue > 0
    ? String(numericValue)
    : null;
}

function emitPostChange(payload: FeedRealtimePayload, onChange: (change: FeedRealtimeChange) => void) {
  const postId = postIdFromRealtimePayload(payload);
  onChange(postId ? { postId, scope: 'post' } : { scope: 'feed' });
}

export function subscribeToCommunityFeedChanges(
  communityId: string,
  visiblePostIds: string[],
  onChange: (change: FeedRealtimeChange) => void,
) {
  channelSequence += 1;
  const channel = supabase
    .channel(`feed:${communityId}:${channelSequence}`)
    .on('postgres_changes', {
      event: '*',
      filter: `community_id=eq.${communityId}`,
      schema: 'public',
      table: 'posts',
    }, (payload) => emitPostChange(payload as FeedRealtimePayload, onChange));

  const numericPostIds = visiblePostIds
    .map(Number)
    .filter((postId) => Number.isSafeInteger(postId) && postId > 0)
    .slice(0, MAX_REALTIME_POST_FILTER_SIZE);

  if (numericPostIds.length > 0) {
    const filter = `post_id=in.(${numericPostIds.join(',')})`;
    for (const table of ['post_images', 'post_polls', 'poll_options'] as const) {
      channel
        .on('postgres_changes', {
          event: 'INSERT',
          filter,
          schema: 'public',
          table,
        }, (payload) => emitPostChange(payload as FeedRealtimePayload, onChange))
        .on('postgres_changes', {
          event: 'UPDATE',
          filter,
          schema: 'public',
          table,
        }, (payload) => emitPostChange(payload as FeedRealtimePayload, onChange));
    }
  }

  channel.subscribe();
  return () => { void supabase.removeChannel(channel); };
}

export function subscribeToPostComments(postId: string, onChange: () => void) {
  const numericPostId = Number(postId);
  if (!Number.isSafeInteger(numericPostId) || numericPostId <= 0) return () => undefined;

  const filter = `post_id=eq.${numericPostId}`;
  const channel = supabase
    .channel(`post-comments:${numericPostId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      filter,
      schema: 'public',
      table: 'post_comments',
    }, onChange)
    .on('postgres_changes', {
      event: 'UPDATE',
      filter,
      schema: 'public',
      table: 'post_comments',
    }, onChange)
    .subscribe();

  return () => { void supabase.removeChannel(channel); };
}
