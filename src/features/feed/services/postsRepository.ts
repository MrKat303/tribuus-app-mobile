// Compatibility facade. New feed code should import from the focused data
// repositories directly; external consumers can migrate without a flag day.
export { createPostComment } from '@/features/feed/data/feedCommentsRepository';
export {
  ensureFeedIdentity,
  type FeedIdentity,
} from '@/features/feed/data/feedIdentityRepository';
export {
  setCommentLiked,
  setPollVote,
  setPostBookmarked,
  setPostLiked,
} from '@/features/feed/data/feedInteractionsRepository';
export {
  createFeedPost,
  deleteFeedPost,
  FEED_PAGE_SIZE,
  type FeedCursor,
  type FeedPage,
  getFeedPost,
  listFeedPosts,
} from '@/features/feed/data/feedRepository';
export { subscribeToFeedChanges } from '@/features/feed/data/feedRealtimeRepository';
