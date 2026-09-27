export type CommunityPostCategory = 'evento' | 'recomendación' | 'comunidad';

export type CommunityComment = {
  id: string;
  author: string;
  content: string;
  initials: string;
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

export type CommunityPost = {
  id: string;
  author: string;
  category: CommunityPostCategory;
  comments: CommunityComment[];
  content: string;
  initials: string;
  isBookmarked?: boolean;
  isLiked: boolean;
  likes: number;
  location?: string;
  audioName?: string;
  audioUri?: string;
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
  imageUri?: string;
  location?: string;
  poll?: CommunityPoll;
  title?: string;
};
