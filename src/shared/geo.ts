export type Coordinate = [longitude: number, latitude: number];

export type BoundingBox = [
  west: number,
  south: number,
  east: number,
  north: number,
];

export function distanceInKm(from: Coordinate, to: Coordinate) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDistance = toRadians(to[1] - from[1]);
  const longitudeDistance = toRadians(to[0] - from[0]);
  const firstLatitude = toRadians(from[1]);
  const secondLatitude = toRadians(to[1]);
  const haversine = Math.sin(latitudeDistance / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDistance / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function isCoordinateInBoundingBox(coordinate: Coordinate, boundingBox: BoundingBox) {
  const [longitude, latitude] = coordinate;
  const [west, south, east, north] = boundingBox;

  return longitude >= west && longitude <= east && latitude >= south && latitude <= north;
}

export function clampCoordinateToBoundingBox(
  coordinate: Coordinate,
  boundingBox: BoundingBox,
): Coordinate {
  const [longitude, latitude] = coordinate;
  const [west, south, east, north] = boundingBox;

  return [Math.min(east, Math.max(west, longitude)), Math.min(north, Math.max(south, latitude))];
}
