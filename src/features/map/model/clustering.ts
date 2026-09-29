import { type Coordinate, type EventCategory, isClusterableCommunityPlace, type MapEvent } from './map';

export const COMMUNITY_CLUSTER_BREAK_ZOOM = 15.7;

export type CommunityCluster = {
  breakdown: { category: EventCategory; count: number }[];
  coordinate: Coordinate;
  events: MapEvent[];
  id: string;
};

function clusterCellSize(zoomLevel: number) {
  if (zoomLevel < 15.2) return 0.018;
  return 0.009;
}

export function communityVisualBudget(zoomLevel: number) {
  if (zoomLevel >= 17) return 28;
  if (zoomLevel >= COMMUNITY_CLUSTER_BREAK_ZOOM) return 18;
  return 10;
}

export function nowVisualBudget(zoomLevel: number) {
  return zoomLevel >= 16 ? 8 : 5;
}

export function clusterCommunityPlaces(events: MapEvent[], zoomLevel: number) {
  if (zoomLevel >= COMMUNITY_CLUSTER_BREAK_ZOOM) {
    return { clusters: [] as CommunityCluster[], singles: events };
  }

  const clusterable = events.filter(isClusterableCommunityPlace);
  const singles = events.filter((event) => !isClusterableCommunityPlace(event));
  const cellSize = clusterCellSize(zoomLevel);
  const groups = new Map<string, MapEvent[]>();

  clusterable.forEach((event) => {
    const longitudeCell = Math.floor(event.coordinate[0] / cellSize);
    const latitudeCell = Math.floor(event.coordinate[1] / cellSize);
    const key = `${longitudeCell}:${latitudeCell}`;
    const group = groups.get(key);
    if (group) group.push(event);
    else groups.set(key, [event]);
  });

  const clusters: CommunityCluster[] = [];
  groups.forEach((group, key) => {
    if (group.length === 1) {
      singles.push(group[0]);
      return;
    }
    const coordinate: Coordinate = [
      group.reduce((sum, event) => sum + event.coordinate[0], 0) / group.length,
      group.reduce((sum, event) => sum + event.coordinate[1], 0) / group.length,
    ];
    const counts = new Map<EventCategory, number>();
    group.forEach((event) => counts.set(event.category, (counts.get(event.category) ?? 0) + 1));
    clusters.push({
      breakdown: Array.from(counts, ([category, count]) => ({ category, count })),
      coordinate,
      events: group,
      id: `community-cluster-${key}`,
    });
  });

  return { clusters, singles };
}
