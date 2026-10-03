import type { Conversation } from '@/features/chat/domain/conversation';
import type { Message } from '@/features/chat/domain/message';

export interface ChatRepository {
  deleteMessage(conversationId: string, messageId: string): Promise<void>;
  getConversation(conversationId: string): Promise<Conversation | null>;
  listConversations(): Promise<Conversation[]>;
  listMessages(conversationId: string): Promise<Message[]>;
  saveMessage(conversationId: string, message: Message): Promise<void>;
}

const demoImage = require('../../../../assets/images/tutorial-web.png');

const demoConversations: Conversation[] = [
  { accent: '#DDF4E5', id: 'cami', initials: 'CA', kind: 'friend', lastMessage: 'Sí, nos vemos afuera del café ☕', name: 'Camila Andrade', online: true, time: '10:42', unread: 2 },
  { accent: '#E6EEFF', id: 'diego', initials: 'DM', kind: 'friend', lastMessage: 'Te envié la dirección del evento.', name: 'Diego Morales', time: 'Ayer' },
  { accent: '#F7E8EE', id: 'sofia', initials: 'SP', kind: 'friend', lastMessage: '¡Gracias por la recomendación!', name: 'Sofía Pérez', online: true, time: 'Lun' },
  { accent: '#F4EEDC', id: 'vecinos', initials: 'VP', kind: 'group', lastMessage: 'Nicolás: puedo llevar bolsas.', name: 'Vecinos de Providencia', time: 'Dom', unread: 4 },
];

const demoMessages: Message[] = [
  { id: 'm1', mine: false, text: 'Hola, ¿vas al encuentro del sábado?', time: '10:35' },
  { deliveryStatus: 'read', id: 'm2', mine: true, text: 'Sí, pensaba llegar cerca de las once.', time: '10:38' },
  { aspectRatio: 1480 / 855, id: 'm3', image: demoImage, mine: false, text: 'Este es el punto de encuentro.', time: '10:40' },
  { id: 'm4', mine: false, reactions: [{ count: 1, emoji: '🙌' }], text: 'Sí, nos vemos afuera del café ☕', time: '10:42' },
];

function cloneMessage(message: Message): Message {
  return {
    ...message,
    audioWaveform: message.audioWaveform ? [...message.audioWaveform] : undefined,
    reactions: message.reactions?.map((reaction) => ({ ...reaction })),
    replyTo: message.replyTo ? { ...message.replyTo, audioWaveform: message.replyTo.audioWaveform ? [...message.replyTo.audioWaveform] : undefined } : undefined,
  };
}

export function createInMemoryChatRepository(): ChatRepository {
  const messagesByConversation = new Map<string, Message[]>();

  return {
    async deleteMessage(conversationId, messageId) {
      const messages = messagesByConversation.get(conversationId) ?? demoMessages;
      messagesByConversation.set(conversationId, messages.filter((message) => message.id !== messageId));
    },
    async getConversation(conversationId) {
      return demoConversations.find((conversation) => conversation.id === conversationId) ?? null;
    },
    async listConversations() {
      return demoConversations.map((conversation) => ({ ...conversation }));
    },
    async listMessages(conversationId) {
      const messages = messagesByConversation.get(conversationId) ?? demoMessages;
      return messages.map(cloneMessage);
    },
    async saveMessage(conversationId, message) {
      const messages = messagesByConversation.get(conversationId) ?? demoMessages.map(cloneMessage);
      const existingIndex = messages.findIndex((item) => item.id === message.id);
      const next = existingIndex >= 0
        ? messages.map((item) => item.id === message.id ? cloneMessage(message) : item)
        : [...messages, cloneMessage(message)];
      messagesByConversation.set(conversationId, next);
    },
  };
}

export const chatRepository = createInMemoryChatRepository();
