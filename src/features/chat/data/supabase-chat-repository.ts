import type { SupabaseClient } from '@supabase/supabase-js';

import type { ChatRepository } from '@/features/chat/data/chat-repository';
import type { Conversation } from '@/features/chat/domain/conversation';
import type { Message, Reaction } from '@/features/chat/domain/message';
import { supabase } from '@/shared/infrastructure/supabase/client';

type ConversationRow = {
  accent: string;
  id: string;
  initials: string;
  kind: Conversation['kind'];
  last_message: string;
  name: string;
  online: boolean;
  unread_count: number;
  updated_at: string;
};

type ReactionRow = { emoji: string; user_id: string };

type MessageRow = {
  aspect_ratio: number | null;
  audio_duration_ms: number | null;
  audio_uri: string | null;
  audio_waveform: number[] | null;
  chat_message_reactions?: ReactionRow[] | null;
  conversation_id: string;
  id: string;
  image_uri: string | null;
  reply_to: Message['replyTo'] | null;
  sender_id: string;
  sent_at: string;
  text: string | null;
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}

function mapConversation(row: ConversationRow): Conversation {
  return {
    accent: row.accent,
    id: row.id,
    initials: row.initials,
    kind: row.kind,
    lastMessage: row.last_message,
    name: row.name,
    online: row.online || undefined,
    time: formatTimestamp(row.updated_at),
    unread: row.unread_count || undefined,
  };
}

function aggregateReactions(rows: ReactionRow[] | null | undefined, currentUserId: string): Reaction[] | undefined {
  if (!rows?.length) return undefined;
  const grouped = new Map<string, Reaction>();
  rows.forEach((row) => {
    const current = grouped.get(row.emoji) ?? { count: 0, emoji: row.emoji };
    grouped.set(row.emoji, {
      ...current,
      count: current.count + 1,
      mine: current.mine || row.user_id === currentUserId,
    });
  });
  return [...grouped.values()];
}

function mapMessage(row: MessageRow, currentUserId: string): Message {
  return {
    aspectRatio: row.aspect_ratio ?? undefined,
    audioDurationMs: row.audio_duration_ms ?? undefined,
    audioUri: row.audio_uri ?? undefined,
    audioWaveform: row.audio_waveform ?? undefined,
    deliveryStatus: row.sender_id === currentUserId ? 'sent' : undefined,
    id: row.id,
    image: row.image_uri ?? undefined,
    mine: row.sender_id === currentUserId,
    reactions: aggregateReactions(row.chat_message_reactions, currentUserId),
    replyTo: row.reply_to ?? undefined,
    text: row.text ?? undefined,
    time: formatTimestamp(row.sent_at),
  };
}

function assertRemoteMedia(message: Message) {
  const uris = [typeof message.image === 'string' ? message.image : undefined, message.audioUri].filter(Boolean) as string[];
  if (uris.some((uri) => /^(file|content|ph):/i.test(uri))) {
    throw new Error('El archivo debe subirse al almacenamiento antes de enviar el mensaje.');
  }
}

async function getCurrentUserId(client: SupabaseClient) {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Tu sesión ya no está activa.');
  return data.user.id;
}

function toMessageRow(conversationId: string, userId: string, message: Message) {
  assertRemoteMedia(message);
  return {
    aspect_ratio: message.aspectRatio ?? null,
    audio_duration_ms: message.audioDurationMs ?? null,
    audio_uri: message.audioUri ?? null,
    audio_waveform: message.audioWaveform ?? null,
    conversation_id: conversationId,
    id: message.id,
    image_uri: typeof message.image === 'string' ? message.image : null,
    reply_to: message.replyTo ?? null,
    sender_id: userId,
    text: message.text ?? null,
  };
}

export function createSupabaseChatRepository(client: SupabaseClient): ChatRepository {
  const listConversations = async () => {
    const { data, error } = await client.rpc('list_chat_conversations');
    if (error) throw error;
    return ((data ?? []) as ConversationRow[]).map(mapConversation);
  };

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
      const conversations = await listConversations();
      return conversations.find((conversation) => conversation.id === conversationId) ?? null;
    },
    listConversations,
    async listMessages(conversationId) {
      const currentUserId = await getCurrentUserId(client);
      const { data, error } = await client
        .from('chat_messages')
        .select('id, conversation_id, sender_id, text, image_uri, aspect_ratio, audio_uri, audio_duration_ms, audio_waveform, reply_to, sent_at, chat_message_reactions(emoji, user_id)')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });
      if (error) throw error;
      const readResult = await client
        .from('chat_conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);
      if (readResult.error) throw readResult.error;
      return ((data ?? []) as MessageRow[]).map((row) => mapMessage(row, currentUserId));
    },
    async saveMessage(conversationId, message) {
      const currentUserId = await getCurrentUserId(client);
      const { error } = await client
        .from('chat_messages')
        .upsert(toMessageRow(conversationId, currentUserId, message), { onConflict: 'id' });
      if (error) throw error;
    },
    subscribeToMessages(conversationId, onChange) {
      const channel = client
        .channel(`chat-messages:${conversationId}:${Date.now()}`)
        .on('postgres_changes', {
          event: '*',
          filter: `conversation_id=eq.${conversationId}`,
          schema: 'public',
          table: 'chat_messages',
        }, onChange)
        .subscribe();
      return () => { void client.removeChannel(channel); };
    },
    async toggleReaction(messageId, emoji) {
      const currentUserId = await getCurrentUserId(client);
      const { data, error } = await client
        .from('chat_message_reactions')
        .select('message_id')
        .eq('message_id', messageId)
        .eq('user_id', currentUserId)
        .eq('emoji', emoji)
        .maybeSingle();
      if (error) throw error;
      const result = data
        ? await client.from('chat_message_reactions').delete().eq('message_id', messageId).eq('user_id', currentUserId).eq('emoji', emoji)
        : await client.from('chat_message_reactions').insert({ emoji, message_id: messageId, user_id: currentUserId });
      if (result.error) throw result.error;
    },
  };
}

export const chatRepository = createSupabaseChatRepository(supabase);
