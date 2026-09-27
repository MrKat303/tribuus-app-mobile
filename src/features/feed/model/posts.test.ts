import type { CommunityPost } from '@/types/community';

import { createCommunityPost, postsReducer } from './posts';

const post: CommunityPost = {
  author: 'Vecina',
  category: 'comunidad',
  comments: [],
  content: 'Hola',
  id: 'post-1',
  initials: 'VE',
  isLiked: false,
  likes: 3,
  poll: {
    options: [
      { id: 'a', label: 'A', votes: 2 },
      { id: 'b', label: 'B', votes: 1 },
    ],
    question: '¿Cuál?',
  },
  timeLabel: 'Ahora',
  title: '',
};

describe('posts model', () => {
  test('creates local posts with a single canonical owner shape', () => {
    expect(createCommunityPost({ content: 'Nueva publicación' }, 'local-1')).toMatchObject({
      author: 'Jaime M.',
      category: 'comunidad',
      comments: [],
      content: 'Nueva publicación',
      id: 'local-1',
      initials: 'JM',
      isBookmarked: false,
      isLiked: false,
      likes: 0,
      location: 'Providencia',
    });
  });

  test('uses the updated profile identity for new posts', () => {
    expect(createCommunityPost(
      { content: 'Publicación con perfil actualizado' },
      'local-2',
      { author: 'Nombre Nuevo', initials: 'NN', location: 'Providencia' },
    )).toMatchObject({ author: 'Nombre Nuevo', initials: 'NN' });
  });

  test('keeps likes and bookmarks in the shared entity', () => {
    const liked = postsReducer([post], { type: 'likeToggled', postId: post.id });
    const bookmarked = postsReducer(liked, { type: 'bookmarkToggled', postId: post.id });

    expect(bookmarked[0]).toMatchObject({ isBookmarked: true, isLiked: true, likes: 4 });
  });

  test('moves a poll vote without double counting', () => {
    const selectedA = postsReducer([post], { type: 'pollOptionSelected', postId: post.id, optionId: 'a' });
    const selectedAAgain = postsReducer(selectedA, { type: 'pollOptionSelected', postId: post.id, optionId: 'a' });
    const selectedB = postsReducer(selectedAAgain, { type: 'pollOptionSelected', postId: post.id, optionId: 'b' });

    expect(selectedAAgain[0].poll?.options.map(({ votes }) => votes)).toEqual([3, 1]);
    expect(selectedB[0].poll?.options.map(({ votes }) => votes)).toEqual([2, 2]);
    expect(selectedB[0].selectedPollOptionId).toBe('b');
  });

  test('adds comments to the post entity', () => {
    const result = postsReducer([post], {
      type: 'commentAdded',
      postId: post.id,
      comment: { author: 'Jaime M.', content: 'Gracias', id: 'comment-1', initials: 'JM' },
    });

    expect(result[0].comments).toHaveLength(1);
    expect(result[0].comments[0].content).toBe('Gracias');
  });
});
