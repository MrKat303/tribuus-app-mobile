import { fetch as expoFetch } from 'expo/fetch';

import { supabase } from '@/shared/infrastructure/supabase/client';

const POST_MEDIA_BUCKET = 'post-media';
const POST_MEDIA_SIGNED_URL_TTL_SECONDS = 60 * 60;

function mediaType(uri: string, kind: 'audio' | 'image') {
  const extension = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (kind === 'image') {
    if (extension === 'png') return { contentType: 'image/png', extension };
    if (extension === 'webp') return { contentType: 'image/webp', extension };
    if (extension === 'heic') return { contentType: 'image/heic', extension };
    return { contentType: 'image/jpeg', extension: 'jpg' };
  }
  if (extension === 'mp3') return { contentType: 'audio/mpeg', extension };
  if (extension === 'wav') return { contentType: 'audio/wav', extension };
  if (extension === 'mp4') return { contentType: 'audio/mp4', extension };
  return { contentType: 'audio/m4a', extension: 'm4a' };
}

export async function createPostMediaSignedUrlMap(paths: (string | null)[]) {
  const uniquePaths = Array.from(new Set(paths.filter((path): path is string => Boolean(path))));
  if (uniquePaths.length === 0) return new Map<string, string>();

  const result = await supabase.storage
    .from(POST_MEDIA_BUCKET)
    .createSignedUrls(uniquePaths, POST_MEDIA_SIGNED_URL_TTL_SECONDS);
  if (result.error) throw new Error(result.error.message);

  const signedUrls = new Map<string, string>();
  for (const item of result.data) {
    // A deleted/corrupt attachment must not make every otherwise valid post
    // disappear. Missing entries are filtered by the mapper.
    if (item.error) continue;
    if (item.path && item.signedUrl) signedUrls.set(item.path, item.signedUrl);
  }
  return signedUrls;
}

export async function uploadPostMedia(
  uri: string,
  userId: string,
  postId: number,
  kind: 'audio' | 'image',
  suffix = '',
) {
  const response = await expoFetch(uri);
  if (!response.ok) {
    throw new Error(`No fue posible leer el archivo ${kind === 'image' ? 'de imagen' : 'de audio'}.`);
  }

  const file = await response.arrayBuffer();
  const media = mediaType(uri, kind);
  const path = `${userId}/${postId}/${kind}${suffix}.${media.extension}`;
  const uploadResult = await supabase.storage.from(POST_MEDIA_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: media.contentType,
    upsert: false,
  });
  if (uploadResult.error) throw new Error(uploadResult.error.message);

  return path;
}

export async function removePostMedia(paths: string[]) {
  if (paths.length === 0) return;
  const result = await supabase.storage.from(POST_MEDIA_BUCKET).remove(paths);
  if (result.error) throw new Error(result.error.message);
}
