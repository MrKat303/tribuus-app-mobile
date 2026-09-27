import { contentKindForEvent, type Coordinate, distanceInKm, type MapEvent } from './map';

type RelevanceContext = {
  exploredCenter: Coordinate;
  userCoordinate: Coordinate | null;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function proximityScore(from: Coordinate, to: Coordinate, usefulRadiusKm: number) {
  return clamp01(1 - distanceInKm(from, to) / usefulRadiusKm);
}

function communityScore(signals: number) {
  return clamp01(Math.log1p(signals) / Math.log1p(80));
}

function weightedGeometricMean(factors: { value: number; weight: number }[]) {
  return factors.reduce((score, factor) => score * Math.pow(Math.max(0.05, factor.value), factor.weight), 1);
}

export function mapRelevanceScore(event: MapEvent, context: RelevanceContext) {
  const community = communityScore(event.communitySignals);
  const freshness = clamp01(event.freshnessScore);
  const personalization = clamp01(event.personalizationScore);
  const confidence = clamp01(event.qualityScore);

  if (contentKindForEvent(event) === 'activity') {
    const origin = context.userCoordinate ?? context.exploredCenter;
    const proximity = proximityScore(origin, event.coordinate, 5);
    return weightedGeometricMean([
      { value: proximity, weight: 0.42 },
      { value: freshness, weight: 0.3 },
      { value: community, weight: 0.15 },
      { value: confidence, weight: 0.1 },
      { value: personalization, weight: 0.03 },
    ]);
  }

  const proximity = proximityScore(context.exploredCenter, event.coordinate, 4);
  return weightedGeometricMean([
    { value: community, weight: 0.3 },
    { value: proximity, weight: 0.27 },
    { value: confidence, weight: 0.23 },
    { value: freshness, weight: 0.12 },
    { value: personalization, weight: 0.08 },
  ]);
}
