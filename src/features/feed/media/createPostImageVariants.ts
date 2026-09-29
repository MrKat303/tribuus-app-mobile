import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { CommunityPostImageVariant, CommunityPostImageVariants } from '@/types/community';

type SourceImage = {
  height: number;
  uri: string;
  width: number;
};

type VariantPreset = {
  compress: number;
  maxEdge: number;
};

const presets = {
  feed: { compress: 0.8, maxEdge: 1280 },
  full: { compress: 0.86, maxEdge: 2048 },
  thumbnail: { compress: 0.68, maxEdge: 320 },
} satisfies Record<keyof CommunityPostImageVariants, VariantPreset>;

export function getResizeDimensions(width: number, height: number, maxEdge: number) {
  if (width <= 0 || height <= 0 || Math.max(width, height) <= maxEdge) return null;
  return width >= height ? { width: maxEdge } : { height: maxEdge };
}

async function createVariant(source: SourceImage, preset: VariantPreset): Promise<CommunityPostImageVariant> {
  const context = ImageManipulator.manipulate(source.uri);
  const resize = getResizeDimensions(source.width, source.height, preset.maxEdge);
  if (resize) context.resize(resize);

  const image = await context.renderAsync();
  return image.saveAsync({ compress: preset.compress, format: SaveFormat.JPEG });
}

export async function createPostImageVariants(source: SourceImage): Promise<CommunityPostImageVariants> {
  // Run these sequentially to avoid decoding the same large camera image three
  // times at once on memory-constrained devices.
  const thumbnail = await createVariant(source, presets.thumbnail);
  const feed = await createVariant(source, presets.feed);
  const full = await createVariant(source, presets.full);

  return { feed, full, thumbnail };
}
