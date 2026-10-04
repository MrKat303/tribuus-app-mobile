export type CommunityPostCategory = 'evento' | 'recomendación' | 'comunidad';

export type CommunityComment = {
  id: string;
  author: string;
  content: string;
  initials: string;
  isLiked?: boolean;
  likes?: number;
  replyToCommentId?: string;
  timeLabel?: string;
};

export type CommunityPollOption = {
  id: string;
  label: string;
  votes: number;
};

export type CommunityPoll = {
  options: CommunityPollOption[];
  question: string;
};

export type CommunityPostImageVariant = {
  height: number;
  uri: string;
  width: number;
};

export type CommunityPostImageVariants = {
  feed: CommunityPostImageVariant;
  full: CommunityPostImageVariant;
  thumbnail: CommunityPostImageVariant;
};

export type CommunityPostImage = {
  id: string;
  uri: string;
  variants?: CommunityPostImageVariants;
};

export type CommunityPost = {
  id: string;
  author: string;
  authorId?: string;
  category: CommunityPostCategory;
  commentCount: number;
  content: string;
  initials: string;
  isBookmarked?: boolean;
  isLiked: boolean;
  likes: number;
  location?: string;
  audioName?: string;
  audioUri?: string;
  images?: CommunityPostImage[];
  imageVariants?: CommunityPostImageVariants;
  imageUri?: string;
  poll?: CommunityPoll;
  selectedPollOptionId?: string;
  timeLabel: string;
  title: string;
};

export type CommunityPostDraft = {
  audioName?: string;
  audioUri?: string;
  category?: CommunityPostCategory;
  content: string;
  images?: CommunityPostImage[];
  imageVariants?: CommunityPostImageVariants;
  imageUri?: string;
  location?: string;
  poll?: CommunityPoll;
  title?: string;
};
