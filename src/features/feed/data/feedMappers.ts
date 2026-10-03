import type {
  CommunityComment,
  CommunityPost,
  CommunityPollOption,
} from '../model/community';
import type { CommentRow, FeedPostRow } from './feedRows';
import { getPublicPostMediaUrl } from './postMediaStorage';

function formatRelativeTime(timestamp: string) {
  const elapsedSeconds = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (elapsedSeconds < 60) return 'Ahora';
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `Hace ${elapsedMinutes} min`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `Hace ${elapsedHours} h`;
  return `Hace ${Math.floor(elapsedHours / 24)} d`;
}

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

export function mapComment(row: CommentRow): CommunityComment {
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

export function mapPost(
  row: FeedPostRow,
  comments: readonly CommunityComment[],
  likedPostIds: ReadonlySet<number>,
  bookmarkedPostIds: ReadonlySet<number>,
  selectedPollOptions: ReadonlyMap<number, number>,
): CommunityPost {
  const author = normalizeRelation(row.profiles);
  const poll = normalizeRelation(row.post_polls);
  const pollOptions = [...(poll?.poll_options ?? [])]
    .sort((left, right) => left.position - right.position);

  return {
    audioName: row.audio_name ?? undefined,
    audioUri: getPublicPostMediaUrl(row.audio_path),
    author: author?.display_name ?? 'Vecino/a',
    authorId: row.author_id,
    category: row.category,
    comments: [...comments],
    content: row.content,
    id: String(row.id),
    images: [...(row.post_images ?? [])]
      .sort((left, right) => left.position - right.position)
      .map((image) => ({ id: String(image.id), uri: getPublicPostMediaUrl(image.storage_path)! })),
    imageUri: getPublicPostMediaUrl(row.image_path),
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
