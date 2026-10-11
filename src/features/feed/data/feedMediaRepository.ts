import { removePostMedia, uploadPostMedia } from '@/features/feed/data/postMediaStorage';
import type { CommunityPostDraft } from '@/features/feed/model/community';
import { mapWithConcurrency } from '@/shared/utils/mapWithConcurrency';

const POST_MEDIA_UPLOAD_CONCURRENCY = 3;

export type DeletablePostMedia = {
  audio_path: string | null;
  image_path: string | null;
  post_images: { storage_path: string }[] | null;
};

export async function persistFeedPostMedia(
  draft: CommunityPostDraft,
  userId: string,
  postId: number,
) {
  const uploadedPaths: string[] = [];
  try {
    const draftImages = draft.images?.length
      ? draft.images
      : draft.imageUri
        ? [{ id: 'legacy', uri: draft.imageUri }]
        : [];
    const imagePaths = await mapWithConcurrency(
      draftImages,
      POST_MEDIA_UPLOAD_CONCURRENCY,
      async (image, position) => {
        const imagePath = await uploadPostMedia(image.uri, userId, postId, 'image', `-${position}`);
        uploadedPaths.push(imagePath);
        return imagePath;
      },
    );
    const audioPath = draft.audioUri
      ? await uploadPostMedia(draft.audioUri, userId, postId, 'audio')
      : null;
    if (audioPath) uploadedPaths.push(audioPath);
    return {
      audioPath,
      imagePaths,
      uploadedPaths: [...imagePaths, ...(audioPath ? [audioPath] : [])],
    };
  } catch (error) {
    await removePostMedia(uploadedPaths).catch(() => undefined);
    throw error;
  }
}

export async function removeFeedPostMedia(paths: string[]) {
  await removePostMedia(paths);
}

export async function cleanupDeletedFeedPostMedia(post: DeletablePostMedia) {
  const mediaPaths = Array.from(new Set([
    post.audio_path,
    post.image_path,
    ...(post.post_images ?? []).map(({ storage_path: storagePath }) => storagePath),
  ].filter((path): path is string => Boolean(path))));
  if (mediaPaths.length > 0) await removePostMedia(mediaPaths);
}
