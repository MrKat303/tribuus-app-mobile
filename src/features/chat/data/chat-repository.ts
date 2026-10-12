import type { Conversation } from '@/features/chat/domain/conversation';
import type { Message } from '@/features/chat/domain/message';

export interface ChatRepository {
  deleteMessage(conversationId: string, messageId: string): Promise<void>;
  getConversation(conversationId: string): Promise<Conversation | null>;
  listConversations(): Promise<Conversation[]>;
  listMessages(conversationId: string): Promise<Message[]>;
  saveMessage(conversationId: string, message: Message): Promise<void>;
  subscribeToMessages(conversationId: string, onChange: () => void): () => void;
  toggleReaction(messageId: string, emoji: string): Promise<void>;
}
