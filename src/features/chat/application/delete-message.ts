import type { Message } from '@/features/chat/domain/message';

export function removeMessage(messages: readonly Message[], messageId: string) {
  return messages.filter((message) => message.id !== messageId);
}
