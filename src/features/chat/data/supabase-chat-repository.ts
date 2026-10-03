import type { SupabaseClient } from '@supabase/supabase-js';

import type { ChatRepository } from '@/features/chat/data/chat-repository';
import type { Conversation } from '@/features/chat/domain/conversation';
import type { Message } from '@/features/chat/domain/message';

type ConversationRow = {
  accent: string;
  id: string;
  initials: string;
  kind: Conversation['kind'];
  last_message: string;
  name: string;
  online: boolean | null;
  time_label: string;
  unread_count: number | null;
};

type MessageRow = {
  aspect_ratio: number | null;
  audio_duration_ms: number | null;
  audio_uri: string | null;
  audio_waveform: number[] | null;
  conversation_id: string;
  delivery_status: Message['deliveryStatus'] | null;
  id: string;
  image_uri: string | null;
  mine: boolean;
  reactions: Message['reactions'] | null;
  reply_to: Message['replyTo'] | null;
  sent_at: string;
  text: string | null;
  time_label: string;
  upload_progress: number | null;
};

function mapConversation(row: ConversationRow): Conversation {
  return {
    accent: row.accent,
    id: row.id,
    initials: row.initials,
    kind: row.kind,
    lastMessage: row.last_message,
    name: row.name,
    online: row.online ?? undefined,
    time: row.time_label,
    unread: row.unread_count ?? undefined,
  };
}

function mapMessage(row: MessageRow): Message {
  return {
    aspectRatio: row.aspect_ratio ?? undefined,
    audioDurationMs: row.audio_duration_ms ?? undefined,
    audioUri: row.audio_uri ?? undefined,
    audioWaveform: row.audio_waveform ?? undefined,
    deliveryStatus: row.delivery_status ?? undefined,
    id: row.id,
    image: row.image_uri ?? undefined,
    mine: row.mine,
    reactions: row.reactions ?? undefined,
    replyTo: row.reply_to ?? undefined,
    text: row.text ?? undefined,
    time: row.time_label,
    uploadProgress: row.upload_progress ?? undefined,
  };
}

function toMessageRow(conversationId: string, message: Message): MessageRow {
  return {
    aspect_ratio: message.aspectRatio ?? null,
    audio_duration_ms: message.audioDurationMs ?? null,
    audio_uri: message.audioUri ?? null,
    audio_waveform: message.audioWaveform ?? null,
    conversation_id: conversationId,
    delivery_status: message.deliveryStatus ?? null,
    id: message.id,
    image_uri: typeof message.image === 'string' ? message.image : null,
    mine: message.mine,
    reactions: message.reactions ?? null,
    reply_to: message.replyTo ?? null,
    sent_at: new Date().toISOString(),
    text: message.text ?? null,
    time_label: message.time,
    upload_progress: message.uploadProgress ?? null,
  };
}

export function createSupabaseChatRepository(client: SupabaseClient): ChatRepository {
  return {
    async deleteMessage(conversationId, messageId) {
      const { error } = await client
        .from('chat_messages')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('id', messageId);
      if (error) throw error;
    },
    async getConversation(conversationId) {
      const { data, error } = await client
        .from('chat_conversation_summaries')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapConversation(data as ConversationRow) : null;
    },
    async listConversations() {
      const { data, error } = await client
        .from('chat_conversation_summaries')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data as ConversationRow[]).map(mapConversation);
    },
    async listMessages(conversationId) {
      const { data, error } = await client
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });
      if (error) throw error;
      return (data as MessageRow[]).map(mapMessage);
    },
    async saveMessage(conversationId, message) {
      const { error } = await client
        .from('chat_messages')
        .upsert(toMessageRow(conversationId, message));
      if (error) throw error;
    },
  };
}
