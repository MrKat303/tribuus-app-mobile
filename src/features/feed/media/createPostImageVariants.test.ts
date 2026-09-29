import { getResizeDimensions } from './createPostImageVariants';

describe('getResizeDimensions', () => {
  it('keeps images that already fit the requested boundary', () => {
    expect(getResizeDimensions(1200, 900, 1280)).toBeNull();
  });

  it('limits a landscape image by width', () => {
    expect(getResizeDimensions(4000, 3000, 1280)).toEqual({ width: 1280 });
  });

  it('limits a portrait image by height', () => {
    expect(getResizeDimensions(3000, 4000, 320)).toEqual({ height: 320 });
  });

  it('does not attempt a resize without valid source dimensions', () => {
    expect(getResizeDimensions(0, 0, 320)).toBeNull();
  });
});
