export type DeliveryStatus = 'delivered' | 'error' | 'read' | 'sending' | 'sent';

export type Reaction = {
  count: number;
  emoji: string;
  mine?: boolean;
};

export type MessageReply = {
  audioDurationMs?: number;
  audioWaveform?: number[];
  author: string;
  id: string;
  image?: number | string;
  text: string;
};

export type Message = {
  aspectRatio?: number;
  audioDurationMs?: number;
  audioUri?: string;
  audioWaveform?: number[];
  deliveryStatus?: DeliveryStatus;
  id: string;
  image?: number | string;
  mine: boolean;
  reactions?: Reaction[];
  replyTo?: MessageReply;
  text?: string;
  time: string;
  uploadProgress?: number;
};

export type PendingImage = {
  aspectRatio: number;
  uri: string;
};

export type AudioDraft = {
  durationMs: number;
  uri: string;
  waveform: number[];
};

export function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

export function replyLabel(message: Message) {
  if (message.audioUri) return `Audio · ${formatDuration(message.audioDurationMs ?? 0)}`;
  if (message.image) return 'Imagen';
  return message.text ?? 'Mensaje';
}

export function waveformBars(samples: readonly number[], count: number) {
  if (!samples.length) return Array.from({ length: count }, () => 0.12);
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
    return Math.max(...samples.slice(start, end));
  });
}

export function toggleReaction(message: Message, emoji: string): Message {
  const existing = message.reactions?.find((reaction) => reaction.emoji === emoji);
  const otherReactions = message.reactions?.filter((reaction) => reaction.emoji !== emoji) ?? [];

  if (existing?.mine) {
    return {
      ...message,
      reactions: existing.count > 1
        ? [...otherReactions, { ...existing, count: existing.count - 1, mine: false }]
        : otherReactions,
    };
  }

  return {
    ...message,
    reactions: [...otherReactions, { count: (existing?.count ?? 0) + 1, emoji, mine: true }],
  };
}
