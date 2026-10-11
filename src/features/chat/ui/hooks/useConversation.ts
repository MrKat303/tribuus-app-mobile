import { useCallback, useEffect, useState } from 'react';

import { removeMessage } from '@/features/chat/application/delete-message';
import { createOutgoingAudioMessage, createOutgoingMessage } from '@/features/chat/application/send-message';
import type { ChatRepository } from '@/features/chat/data/chat-repository';
import type { Conversation } from '@/features/chat/domain/conversation';
import type { AudioDraft, Message, PendingImage } from '@/features/chat/domain/message';
import { toggleReaction } from '@/features/chat/domain/message';

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

  useEffect(() => {
    let active = true;
    const unsubscribe = repository.subscribeToMessages(conversationId, () => {
      void repository.listMessages(conversationId).then((nextMessages) => {
        if (active) setMessages(nextMessages);
      }).catch(() => undefined);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [conversationId, repository]);

  const updateDelivery = useCallback((messageId: string, patch: Pick<Message, 'deliveryStatus' | 'uploadProgress'>) => {
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, ...patch } : message));
  }, []);
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
    void repository.saveMessage(conversationId, message)
      .then(() => updateDelivery(message.id, { deliveryStatus: 'sent', uploadProgress: image ? 1 : undefined }))
      .catch(() => updateDelivery(message.id, { deliveryStatus: 'error', uploadProgress: message.uploadProgress }));
    return message;
  }, [conversation?.name, conversationId, repository, updateDelivery]);

  const sendAudio = useCallback(({ audio, replyingTo }: SendAudioInput) => {
    const message = createOutgoingAudioMessage({
      audio,
      id: `audio-${Date.now()}`,
      participantName: conversation?.name ?? 'Mensaje',
      replyingTo,
    });
    setMessages((current) => [...current, message]);
    void repository.saveMessage(conversationId, message)
      .then(() => updateDelivery(message.id, { deliveryStatus: 'sent' }))
      .catch(() => updateDelivery(message.id, { deliveryStatus: 'error' }));
    return message;
  }, [conversation?.name, conversationId, repository, updateDelivery]);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    setMessages((current) => current.map((message) => message.id === messageId ? toggleReaction(message, emoji) : message));
    void repository.toggleReaction(messageId, emoji).catch(() => {
      setMessages((current) => current.map((message) => message.id === messageId ? toggleReaction(message, emoji) : message));
    });
  }, [repository]);

  const deleteById = useCallback((messageId: string) => {
    setMessages((current) => removeMessage(current, messageId));
    void repository.deleteMessage(conversationId, messageId);
  }, [conversationId, repository]);

  const retry = useCallback((message: Message) => {
    updateDelivery(message.id, { deliveryStatus: 'sending', uploadProgress: message.image ? 0.08 : undefined });
    void repository.saveMessage(conversationId, message)
      .then(() => updateDelivery(message.id, { deliveryStatus: 'sent', uploadProgress: message.image ? 1 : undefined }))
      .catch(() => updateDelivery(message.id, { deliveryStatus: 'error', uploadProgress: message.uploadProgress }));
  }, [conversationId, repository, updateDelivery]);

  return {
    addReaction,
    conversation,
    deleteById,
    loading: loadedConversationId !== conversationId,
    messages,
    retry,
    sendAudio,
    sendText,
    typing: false,
  };
}
