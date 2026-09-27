import {
  clampCoordinateToBoundingBox,
  COUNTRY_CAMERA_BOUNDING_BOX,
  distanceInKm,
  isCoordinateInBoundingBox,
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
});
