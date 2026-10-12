import type { FeedPostRow } from './feedRows';
import { mapPost } from './feedMappers';

const row: FeedPostRow = {
  audio_name: 'Nota de voz',
  audio_path: 'user-1/42/audio.m4a',
  author_id: 'user-1',
  category: 'comunidad',
  comment_count: 0,
  content: 'Contenido',
  id: 42,
  image_path: 'user-1/42/image-0.jpg',
  like_count: 0,
  location: 'Providencia',
  post_images: [
    { id: 1, position: 0, storage_path: 'user-1/42/image-0.jpg' },
    { id: 2, position: 1, storage_path: 'user-1/42/image-1.jpg' },
  ],
  post_polls: null,
  profiles: { display_name: 'Persona', initials: 'PE' },
  published_at: '2026-10-04T00:00:00.000Z',
  title: '',
};

describe('feed mappers', () => {
  test('uses only authorized signed media URLs', () => {
    const signedUrls = new Map([
      ['user-1/42/audio.m4a', 'https://signed.example/audio'],
      ['user-1/42/image-0.jpg', 'https://signed.example/image-0'],
    ]);

    const post = mapPost(row, new Set(), new Set(), new Map(), signedUrls);

    expect(post.audioUri).toBe('https://signed.example/audio');
    expect(post.imageUri).toBe('https://signed.example/image-0');
    expect(post.images).toEqual([
      { id: '1', uri: 'https://signed.example/image-0' },
    ]);
  });
});
