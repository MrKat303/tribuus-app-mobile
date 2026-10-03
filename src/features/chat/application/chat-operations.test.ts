import { removeMessage } from './delete-message';
import {
  appendMeteringSample,
  createWaveformRingBuffer,
  normalizeMetering,
  persistedWaveformSnapshot,
  readWaveformSamples,
} from './record-audio';
import { createOutgoingAudioMessage, createOutgoingMessage } from './send-message';

describe('chat application operations', () => {
  it('creates a text message with image and reply metadata', () => {
    const message = createOutgoingMessage({
      id: 'outgoing-1',
      image: { aspectRatio: 1.5, uri: 'file://image.jpg' },
      participantName: 'Camila',
      replyingTo: { id: 'original', mine: false, text: 'Mensaje original', time: '10:00' },
      text: '  Hola  ',
    });

    expect(message).toMatchObject({
      aspectRatio: 1.5,
      deliveryStatus: 'sending',
      image: 'file://image.jpg',
      replyTo: { author: 'Camila', id: 'original', text: 'Mensaje original' },
      text: 'Hola',
      uploadProgress: 0.08,
    });
  });

  it('creates an audio message without leaking a mutable draft', () => {
    const waveform = [0.2, 0.4];
    const message = createOutgoingAudioMessage({
      audio: { durationMs: 1200, uri: 'file://audio.m4a', waveform },
      id: 'audio-1',
      participantName: 'Camila',
    });

    expect(message).toMatchObject({
      audioDurationMs: 1200,
      audioUri: 'file://audio.m4a',
      deliveryStatus: 'sending',
      id: 'audio-1',
    });
    expect(message.audioWaveform).not.toBe(waveform);
  });

  it('removes only the requested message', () => {
    const messages = [
      { id: 'one', mine: false, text: 'Uno', time: '10:00' },
      { id: 'two', mine: true, text: 'Dos', time: '10:01' },
    ];

    expect(removeMessage(messages, 'one')).toEqual([messages[1]]);
    expect(messages).toHaveLength(2);
  });

  it('bounds waveform history in a fixed-size circular buffer', () => {
    const buffer = createWaveformRingBuffer(40);
    for (let index = 0; index < 500; index += 1) {
      appendMeteringSample(buffer, -12);
    }
    const samples = readWaveformSamples(buffer);

    expect(samples).toHaveLength(40);
    expect(samples.every((sample) => sample >= 0.06 && sample <= 1)).toBe(true);
  });

  it('keeps the newest circular-buffer samples in chronological order', () => {
    const buffer = createWaveformRingBuffer(4);
    const metering = [-40, -30, -20, -10, 0];
    metering.forEach((sample) => appendMeteringSample(buffer, sample));

    const samples = readWaveformSamples(buffer);
    const expected = metering.slice(-4).map(normalizeMetering);

    expect(samples).toHaveLength(expected.length);
    samples.forEach((sample, index) => expect(sample).toBeCloseTo(expected[index], 5));
  });

  it('persists a stable downsampled waveform instead of raw recording history', () => {
    const buffer = createWaveformRingBuffer(80);
    for (let index = 0; index < 80; index += 1) {
      appendMeteringSample(buffer, index % 2 === 0 ? -40 : -4);
    }

    const persisted = persistedWaveformSnapshot(buffer);

    expect(persisted).toHaveLength(64);
    expect(persisted.every((sample) => sample >= 0.06 && sample <= 1)).toBe(true);
  });
});
