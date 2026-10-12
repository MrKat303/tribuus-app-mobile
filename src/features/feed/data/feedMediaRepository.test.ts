import { persistFeedPostMedia } from '@/features/feed/data/feedMediaRepository';
import { removePostMedia, uploadPostMedia } from '@/features/feed/data/postMediaStorage';
import { supabase } from '@/shared/infrastructure/supabase/client';

jest.mock('@/features/feed/data/postMediaStorage', () => ({
  removePostMedia: jest.fn(),
  uploadPostMedia: jest.fn(),
}));

jest.mock('@/shared/infrastructure/supabase/client', () => ({
  supabase: { from: jest.fn() },
}));

const mockRemovePostMedia = jest.mocked(removePostMedia);
const mockUploadPostMedia = jest.mocked(uploadPostMedia);
const mockFrom = jest.mocked(supabase.from);

beforeEach(() => {
  jest.clearAllMocks();
  mockRemovePostMedia.mockResolvedValue(undefined);
});

describe('persistFeedPostMedia', () => {
  it('uploads media and leaves metadata creation to publish_feed_post', async () => {
    mockUploadPostMedia
      .mockResolvedValueOnce('user-1/42/image-0.jpg')
      .mockResolvedValueOnce('user-1/42/image-1.jpg')
      .mockResolvedValueOnce('user-1/42/audio.m4a');

    const result = await persistFeedPostMedia({
      audioUri: 'file:///voice.m4a',
      content: 'Publicación con archivos',
      images: [
        { id: 'image-1', uri: 'file:///first.jpg' },
        { id: 'image-2', uri: 'file:///second.jpg' },
      ],
    }, 'user-1', 42);

    expect(mockUploadPostMedia).toHaveBeenNthCalledWith(
      1,
      'file:///first.jpg',
      'user-1',
      42,
      'image',
      '-0',
    );
    expect(mockUploadPostMedia).toHaveBeenNthCalledWith(
      2,
      'file:///second.jpg',
      'user-1',
      42,
      'image',
      '-1',
    );
    expect(mockUploadPostMedia).toHaveBeenNthCalledWith(
      3,
      'file:///voice.m4a',
      'user-1',
      42,
      'audio',
    );
    expect(mockFrom).not.toHaveBeenCalled();
    expect(result).toEqual({
      audioPath: 'user-1/42/audio.m4a',
      imagePaths: ['user-1/42/image-0.jpg', 'user-1/42/image-1.jpg'],
      uploadedPaths: [
        'user-1/42/image-0.jpg',
        'user-1/42/image-1.jpg',
        'user-1/42/audio.m4a',
      ],
    });
  });

  it('removes files already uploaded when a later upload fails', async () => {
    mockUploadPostMedia
      .mockResolvedValueOnce('user-1/42/image-0.jpg')
      .mockRejectedValueOnce(new Error('upload failed'));

    await expect(persistFeedPostMedia({
      content: 'Publicación con archivos',
      images: [
        { id: 'image-1', uri: 'file:///first.jpg' },
        { id: 'image-2', uri: 'file:///second.jpg' },
      ],
    }, 'user-1', 42)).rejects.toThrow('upload failed');

    expect(mockRemovePostMedia).toHaveBeenCalledWith(['user-1/42/image-0.jpg']);
  });

  it('uploads at most three images concurrently and preserves their positions', async () => {
    let activeUploads = 0;
    let maximumActiveUploads = 0;
    mockUploadPostMedia.mockImplementation(async (_uri, _userId, _postId, _kind, suffix) => {
      activeUploads += 1;
      maximumActiveUploads = Math.max(maximumActiveUploads, activeUploads);
      await new Promise((resolve) => setTimeout(resolve, 2));
      activeUploads -= 1;
      return `user-1/42/image${suffix}.jpg`;
    });

    const images = Array.from({ length: 12 }, (_, index) => ({
      id: `image-${index}`,
      uri: `file:///image-${index}.jpg`,
    }));
    const result = await persistFeedPostMedia({ content: 'Galería', images }, 'user-1', 42);

    expect(maximumActiveUploads).toBe(3);
    expect(result.imagePaths).toEqual(images.map((_, index) => `user-1/42/image-${index}.jpg`));
  });
});
