import { createContext, type PropsWithChildren, useCallback, useContext, useMemo, useReducer } from 'react';

import { demoPosts } from '@/data/demo-community';
import { createCommunityPost, currentCommunityUser, postsReducer } from '@/features/feed/model/posts';
import type { CommunityPost, CommunityPostDraft } from '@/types/community';
import { useProfile } from '@/context/ProfileContext';

type PostsContextValue = {
  addComment: (postId: string, content: string, replyToCommentId?: string) => void;
  addPost: (draft: CommunityPostDraft) => string;
  posts: CommunityPost[];
  selectPollOption: (postId: string, optionId: string) => void;
  toggleBookmark: (postId: string) => void;
  toggleCommentLike: (postId: string, commentId: string) => void;
  toggleLike: (postId: string) => void;
};

const PostsContext = createContext<PostsContextValue | null>(null);

export function PostsProvider({ children }: PropsWithChildren) {
  const { profile } = useProfile();
  const [posts, dispatch] = useReducer(postsReducer, demoPosts);
  const userIdentity = useMemo(() => ({
    author: profile.name,
    initials: profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase(),
    location: currentCommunityUser.location,
  }), [profile.name]);
  const addPost = useCallback((draft: CommunityPostDraft) => {
    const postId = `local-post-${Date.now()}`;
    dispatch({ type: 'postAdded', post: createCommunityPost(draft, postId, userIdentity) });
    return postId;
  }, [userIdentity]);
  const addComment = useCallback((postId: string, content: string, replyToCommentId?: string) => {
    dispatch({
      type: 'commentAdded',
      postId,
      comment: {
        author: userIdentity.author,
        content: content.trim(),
        id: `local-comment-${Date.now()}`,
        initials: userIdentity.initials,
        isLiked: false,
        likes: 0,
        replyToCommentId,
        timeLabel: 'Ahora',
      },
    });
  }, [userIdentity]);
  const selectPollOption = useCallback((postId: string, optionId: string) => {
    dispatch({ type: 'pollOptionSelected', postId, optionId });
  }, []);
  const toggleBookmark = useCallback((postId: string) => dispatch({ type: 'bookmarkToggled', postId }), []);
  const toggleCommentLike = useCallback((postId: string, commentId: string) => dispatch({ type: 'commentLikeToggled', postId, commentId }), []);
  const toggleLike = useCallback((postId: string) => dispatch({ type: 'likeToggled', postId }), []);
  const value = useMemo(
    () => ({ addComment, addPost, posts, selectPollOption, toggleBookmark, toggleCommentLike, toggleLike }),
    [addComment, addPost, posts, selectPollOption, toggleBookmark, toggleCommentLike, toggleLike],
  );

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (!context) throw new Error('usePosts debe usarse dentro de PostsProvider.');
  return context;
}
