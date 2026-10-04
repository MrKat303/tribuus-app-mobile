import { assertNoFeedError } from '@/features/feed/data/feedIdentityRepository';
import { removePostMedia, uploadPostMedia } from '@/features/feed/data/postMediaStorage';
import type { CommunityPostDraft } from '@/features/feed/model/community';
import { supabase } from '@/shared/infrastructure/supabase/client';

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
    const imagePaths: string[] = [];
    for (const [position, image] of draftImages.entries()) {
      const imagePath = await uploadPostMedia(image.uri, userId, postId, 'image', `-${position}`);
      imagePaths.push(imagePath);
      uploadedPaths.push(imagePath);
    }
    if (imagePaths.length > 0) {
      const imagesResult = await supabase.from('post_images').insert(imagePaths.map((storagePath, position) => ({
        position,
        post_id: postId,
        storage_path: storagePath,
      })));
      assertNoFeedError(imagesResult.error);
    }

    const audioPath = draft.audioUri
      ? await uploadPostMedia(draft.audioUri, userId, postId, 'audio')
      : null;
    if (audioPath) uploadedPaths.push(audioPath);
    return { audioPath, imagePaths, uploadedPaths };
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
