import type { CommunityPost } from '../model/community';

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

export type PostImageRow = {
  id: number;
  position: number;
  storage_path: string;
};

export type FeedPostRow = {
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

export type CommentRow = {
  id: number;
  post_id: number;
  content: string;
  created_at: string;
  like_count: number;
  parent_comment_id: number | null;
  profiles: ProfileRelation;
  comment_likes: { user_id: string }[];
};
