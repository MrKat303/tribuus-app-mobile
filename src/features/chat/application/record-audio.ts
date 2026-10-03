export const LIVE_WAVEFORM_BAR_COUNT = 26;
export const PERSISTED_WAVEFORM_SAMPLE_COUNT = 64;
const DEFAULT_RING_BUFFER_CAPACITY = 600;

export type WaveformRingBuffer = {
  capacity: number;
  size: number;
  values: Float32Array;
  writeIndex: number;
};

export function normalizeMetering(decibels: number) {
  return Math.max(0.06, Math.min(1, Math.pow(10, decibels / 40)));
}

export function createWaveformRingBuffer(capacity = DEFAULT_RING_BUFFER_CAPACITY): WaveformRingBuffer {
  if (!Number.isInteger(capacity) || capacity <= 0) throw new Error('La capacidad del waveform debe ser un entero positivo.');
  return { capacity, size: 0, values: new Float32Array(capacity), writeIndex: 0 };
}

export function appendMeteringSample(buffer: WaveformRingBuffer, decibels: number) {
  buffer.values[buffer.writeIndex] = normalizeMetering(decibels);
  buffer.writeIndex = (buffer.writeIndex + 1) % buffer.capacity;
  buffer.size = Math.min(buffer.size + 1, buffer.capacity);
}

export function resetWaveformRingBuffer(buffer: WaveformRingBuffer) {
  buffer.size = 0;
  buffer.writeIndex = 0;
}

export function readWaveformSamples(buffer: WaveformRingBuffer) {
  const samples = new Array<number>(buffer.size);
  const startIndex = buffer.size === buffer.capacity ? buffer.writeIndex : 0;
  for (let index = 0; index < buffer.size; index += 1) {
    samples[index] = buffer.values[(startIndex + index) % buffer.capacity];
  }
  return samples;
}

function readLatestWaveformSamples(buffer: WaveformRingBuffer, count: number) {
  const sampleCount = Math.min(buffer.size, count);
  const samples = new Array<number>(sampleCount);
  const startIndex = (buffer.writeIndex - sampleCount + buffer.capacity) % buffer.capacity;
  for (let index = 0; index < sampleCount; index += 1) {
    samples[index] = buffer.values[(startIndex + index) % buffer.capacity];
  }
  return samples;
}

export function downsampleWaveform(samples: readonly number[], count: number) {
  if (!Number.isInteger(count) || count <= 0) throw new Error('El número de muestras debe ser un entero positivo.');
  if (samples.length === 0) return Array.from({ length: count }, () => 0.12);

  if (samples.length <= count) {
    return Array.from({ length: count }, (_, index) => {
      const position = count === 1 ? 0 : (index / (count - 1)) * (samples.length - 1);
      const lower = Math.floor(position);
      const upper = Math.min(samples.length - 1, Math.ceil(position));
      const mix = position - lower;
      return samples[lower] * (1 - mix) + samples[upper] * mix;
    });
  }

  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor((index / count) * samples.length);
    const end = Math.max(start + 1, Math.floor(((index + 1) / count) * samples.length));
    let maximum = 0;
    for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
      maximum = Math.max(maximum, samples[sampleIndex]);
    }
    return maximum;
  });
}

export function liveWaveformSnapshot(buffer: WaveformRingBuffer) {
  return downsampleWaveform(
    readLatestWaveformSamples(buffer, LIVE_WAVEFORM_BAR_COUNT),
    LIVE_WAVEFORM_BAR_COUNT,
  );
}

export function persistedWaveformSnapshot(buffer: WaveformRingBuffer) {
  return downsampleWaveform(readWaveformSamples(buffer), PERSISTED_WAVEFORM_SAMPLE_COUNT);
}
