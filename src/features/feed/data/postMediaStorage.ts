import { fetch as expoFetch } from 'expo/fetch';

import { supabase } from '@/shared/infrastructure/supabase/client';

const POST_MEDIA_BUCKET = 'post-media';

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

export function getPublicPostMediaUrl(path: string | null) {
  if (!path) return undefined;
  return supabase.storage.from(POST_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
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
