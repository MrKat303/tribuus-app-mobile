import type { AudioDraft, Message, MessageReply, PendingImage } from '@/features/chat/domain/message';
import { replyLabel } from '@/features/chat/domain/message';

type ReplyInput = {
  participantName: string;
  replyingTo?: Message | null;
};

function createReply({ participantName, replyingTo }: ReplyInput): MessageReply | undefined {
  if (!replyingTo) return undefined;

  return {
    audioDurationMs: replyingTo.audioDurationMs,
    audioWaveform: replyingTo.audioWaveform ? [...replyingTo.audioWaveform] : undefined,
    author: replyingTo.mine ? 'Tú' : participantName,
    id: replyingTo.id,
    image: replyingTo.image,
    text: replyLabel(replyingTo),
  };
}

export function createOutgoingMessage({
  id,
  image,
  participantName,
  replyingTo,
  text,
}: ReplyInput & {
  id: string;
  image?: PendingImage | null;
  text: string;
}): Message {
  const normalizedText = text.trim();

  return {
    aspectRatio: image?.aspectRatio,
    deliveryStatus: 'sending',
    id,
    image: image?.uri,
    mine: true,
    replyTo: createReply({ participantName, replyingTo }),
    text: normalizedText || undefined,
    time: 'Ahora',
    uploadProgress: image ? 0.08 : undefined,
  };
}

export function createOutgoingAudioMessage({
  audio,
  id,
  participantName,
  replyingTo,
}: ReplyInput & {
  audio: AudioDraft;
  id: string;
}): Message {
  return {
    audioDurationMs: audio.durationMs,
    audioUri: audio.uri,
    audioWaveform: [...audio.waveform],
    deliveryStatus: 'sending',
    id,
    mine: true,
    replyTo: createReply({ participantName, replyingTo }),
    time: 'Ahora',
  };
}
