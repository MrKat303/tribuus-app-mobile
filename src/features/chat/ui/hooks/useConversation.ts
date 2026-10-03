import { useCallback, useEffect, useRef, useState } from 'react';

import { removeMessage } from '@/features/chat/application/delete-message';
import { createOutgoingAudioMessage, createOutgoingMessage } from '@/features/chat/application/send-message';
import type { ChatRepository } from '@/features/chat/data/chat-repository';
import type { Conversation } from '@/features/chat/domain/conversation';
import type { AudioDraft, Message, PendingImage } from '@/features/chat/domain/message';
import { toggleReaction } from '@/features/chat/domain/message';
import { useMessageDelivery } from '@/features/chat/ui/hooks/useMessageDelivery';

type SendTextInput = {
  image?: PendingImage | null;
  replyingTo?: Message | null;
  text: string;
};

type SendAudioInput = {
  audio: AudioDraft;
  replyingTo?: Message | null;
};

export function useConversation(conversationId: string, repository: ChatRepository) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loadedConversationId, setLoadedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      repository.getConversation(conversationId),
      repository.listMessages(conversationId),
    ])
      .then(([nextConversation, nextMessages]) => {
        if (!active) return;
        setConversation(nextConversation);
        setMessages(nextMessages);
      })
      .catch(() => {
        if (!active) return;
        setConversation(null);
        setMessages([]);
      })
      .finally(() => {
        if (active) setLoadedConversationId(conversationId);
      });
    return () => { active = false; };
  }, [conversationId, repository]);

  useEffect(() => () => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
  }, []);

  const updateDelivery = useCallback((messageId: string, patch: Pick<Message, 'deliveryStatus' | 'uploadProgress'>) => {
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, ...patch } : message));
  }, []);
  const scheduleDelivery = useMessageDelivery(updateDelivery);

  const simulateReply = useCallback(() => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setTyping(true);
    replyTimer.current = setTimeout(() => {
      const reply: Message = { id: `reply-${Date.now()}`, mine: false, text: '¡Perfecto! Te leo 🙌', time: 'Ahora' };
      setTyping(false);
      setMessages((current) => [...current, reply]);
      void repository.saveMessage(conversationId, reply);
      replyTimer.current = null;
    }, 1400);
  }, [conversationId, repository]);

  const sendText = useCallback(({ image, replyingTo, text }: SendTextInput) => {
    if (!text.trim() && !image) return null;
    const message = createOutgoingMessage({
      id: `local-${Date.now()}`,
      image,
      participantName: conversation?.name ?? 'Mensaje',
      replyingTo,
      text,
    });
    setMessages((current) => [...current, message]);
    scheduleDelivery(message.id, Boolean(image));
    void repository.saveMessage(conversationId, message).catch(() => {
      updateDelivery(message.id, { deliveryStatus: 'error', uploadProgress: message.uploadProgress });
    });
    simulateReply();
    return message;
  }, [conversation?.name, conversationId, repository, scheduleDelivery, simulateReply, updateDelivery]);

  const sendAudio = useCallback(({ audio, replyingTo }: SendAudioInput) => {
    const message = createOutgoingAudioMessage({
      audio,
      id: `audio-${Date.now()}`,
      participantName: conversation?.name ?? 'Mensaje',
      replyingTo,
    });
    setMessages((current) => [...current, message]);
    scheduleDelivery(message.id, false);
    void repository.saveMessage(conversationId, message).catch(() => {
      updateDelivery(message.id, { deliveryStatus: 'error' });
    });
    simulateReply();
    return message;
  }, [conversation?.name, conversationId, repository, scheduleDelivery, simulateReply, updateDelivery]);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    setMessages((current) => current.map((message) => message.id === messageId ? toggleReaction(message, emoji) : message));
  }, []);

  const deleteById = useCallback((messageId: string) => {
    setMessages((current) => removeMessage(current, messageId));
    void repository.deleteMessage(conversationId, messageId);
  }, [conversationId, repository]);

  const retry = useCallback((message: Message) => {
    updateDelivery(message.id, { deliveryStatus: 'sending', uploadProgress: message.image ? 0.08 : undefined });
    scheduleDelivery(message.id, Boolean(message.image));
    void repository.saveMessage(conversationId, message).catch(() => {
      updateDelivery(message.id, { deliveryStatus: 'error', uploadProgress: message.uploadProgress });
    });
  }, [conversationId, repository, scheduleDelivery, updateDelivery]);

  return {
    addReaction,
    conversation,
    deleteById,
    loading: loadedConversationId !== conversationId,
    messages,
    retry,
    sendAudio,
    sendText,
    typing,
  };
}
