const DEFAULT_MAX_WAVEFORM_SAMPLES = 240;

export function normalizeMetering(decibels: number) {
  return Math.max(0.06, Math.min(1, Math.pow(10, decibels / 40)));
}

export function appendWaveformSample(
  samples: readonly number[],
  decibels: number,
  maxSamples = DEFAULT_MAX_WAVEFORM_SAMPLES,
) {
  const nextSample = normalizeMetering(decibels);
  if (samples.length < maxSamples) return [...samples, nextSample];

  const compacted = samples.filter((_, index) => index % 2 === 0);
  return [...compacted.slice(-(maxSamples - 1)), nextSample];
}
