import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

type SourceImage = {
  height: number;
  uri: string;
  width: number;
};

const FEED_IMAGE_MAX_EDGE = 1280;
const FEED_IMAGE_COMPRESSION = 0.8;

export function getResizeDimensions(width: number, height: number, maxEdge: number) {
  if (width <= 0 || height <= 0 || Math.max(width, height) <= maxEdge) return null;
  return width >= height ? { width: maxEdge } : { height: maxEdge };
}

export async function createPostFeedImage(source: SourceImage) {
  const context = ImageManipulator.manipulate(source.uri);
  const resize = getResizeDimensions(source.width, source.height, FEED_IMAGE_MAX_EDGE);
  if (resize) context.resize(resize);

  const image = await context.renderAsync();
  return image.saveAsync({ compress: FEED_IMAGE_COMPRESSION, format: SaveFormat.JPEG });
}
