import type { CommunityPost, CommunityPostDraft } from '@/types/community';

export const currentCommunityUser = {
  author: 'Jaime M.',
  initials: 'JM',
  location: 'Providencia',
} as const;

export type CommunityUserIdentity = {
  author: string;
  initials: string;
  location: string;
};

export type PostsAction =
  | { type: 'postAdded'; post: CommunityPost }
  | { type: 'likeToggled'; postId: string }
  | { type: 'bookmarkToggled'; postId: string }
  | { type: 'commentAdded'; postId: string; comment: CommunityPost['comments'][number] }
  | { type: 'pollOptionSelected'; postId: string; optionId: string };

export function createCommunityPost(draft: CommunityPostDraft, id: string, user: CommunityUserIdentity = currentCommunityUser): CommunityPost {
  return {
    ...draft,
    author: user.author,
    category: draft.category ?? 'comunidad',
    comments: [],
    id,
    initials: user.initials,
    isBookmarked: false,
    isLiked: false,
    likes: 0,
    location: draft.location ?? user.location,
    timeLabel: 'Ahora',
    title: draft.title ?? '',
  };
}

export function postsReducer(posts: CommunityPost[], action: PostsAction): CommunityPost[] {
  switch (action.type) {
    case 'postAdded':
      return [action.post, ...posts];
    case 'likeToggled':
      return posts.map((post) => post.id === action.postId
        ? { ...post, isLiked: !post.isLiked, likes: Math.max(0, post.likes + (post.isLiked ? -1 : 1)) }
        : post);
    case 'bookmarkToggled':
      return posts.map((post) => post.id === action.postId
        ? { ...post, isBookmarked: !(post.isBookmarked ?? false) }
        : post);
    case 'commentAdded':
      return posts.map((post) => post.id === action.postId
        ? { ...post, comments: [...post.comments, action.comment] }
        : post);
    case 'pollOptionSelected':
      return posts.map((post) => {
        if (post.id !== action.postId || !post.poll || post.selectedPollOptionId === action.optionId) return post;
        return {
          ...post,
          poll: {
            ...post.poll,
            options: post.poll.options.map((option) => ({
              ...option,
              votes: Math.max(0, option.votes
                + (option.id === action.optionId ? 1 : 0)
                - (option.id === post.selectedPollOptionId ? 1 : 0)),
            })),
          },
          selectedPollOptionId: action.optionId,
        };
      });
    default:
      return posts;
  }
}
