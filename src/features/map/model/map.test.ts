import {
  clampCoordinateToBoundingBox,
  COUNTRY_CAMERA_BOUNDING_BOX,
  distanceInKm,
  isCoordinateInBoundingBox,
  isCoordinateInViewport,
  SANTIAGO,
} from './map';

describe('map model', () => {
  test('calculates zero distance for the same coordinate', () => {
    expect(distanceInKm(SANTIAGO, SANTIAGO)).toBe(0);
  });

  test('calculates a realistic distance between two Santiago landmarks', () => {
    const plazaDeArmas: [number, number] = [-70.6506, -33.4372];
    const distance = distanceInKm(SANTIAGO, plazaDeArmas);

    expect(distance).toBeGreaterThan(2);
    expect(distance).toBeLessThan(3);
  });

  test('recognizes coordinates inside the Chile camera bounds', () => {
    expect(isCoordinateInBoundingBox(SANTIAGO, COUNTRY_CAMERA_BOUNDING_BOX)).toBe(true);
    expect(isCoordinateInBoundingBox([0, 0], COUNTRY_CAMERA_BOUNDING_BOX)).toBe(false);
  });

  test('clamps an out-of-bounds coordinate to the nearest boundary', () => {
    expect(clampCoordinateToBoundingBox([-80, -60], COUNTRY_CAMERA_BOUNDING_BOX)).toEqual([-76.5, -56.5]);
  });

  test('filters coordinates outside the committed map viewport', () => {
    const viewport = { ne: [-70.62, -33.42] as [number, number], sw: [-70.68, -33.48] as [number, number] };

    expect(isCoordinateInViewport(SANTIAGO, viewport, 0)).toBe(true);
    expect(isCoordinateInViewport([-71, -34], viewport, 0)).toBe(false);
  });

  test('keeps a small viewport buffer to avoid marker pop-in at the edge', () => {
    const viewport = { ne: [-70.62, -33.42] as [number, number], sw: [-70.68, -33.48] as [number, number] };

    expect(isCoordinateInViewport([-70.685, -33.45], viewport, 0.1)).toBe(true);
    expect(isCoordinateInViewport([-70.7, -33.45], viewport, 0.1)).toBe(false);
  });
});
