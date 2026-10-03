import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/Screen';
import Feather from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/context/AppearanceContext';
import { chatRepository } from '@/features/chat/data/chat-repository';
import type { AudioDraft, Message, PendingImage } from '@/features/chat/domain/message';
import { Composer } from '@/features/chat/ui/components/Composer';
import { ImageViewer, MessageBubble, TypingIndicator } from '@/features/chat/ui/components/MessageBubble';
import { useConversation } from '@/features/chat/ui/hooks/useConversation';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

export default function ConversationScreen({ conversationId }: { conversationId: string }) {
  const { colors, isDark } = useAppAppearance();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const styles = useStyles();
  const listRef = useRef<FlatList<Message>>(null);
  const previousMessageCount = useRef(0);
  const shouldScrollToEnd = useRef(true);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addReaction, conversation, deleteById, loading, messages, retry, sendAudio, sendText, typing } = useConversation(conversationId, chatRepository);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [actionTarget, setActionTarget] = useState<string | null>(null);
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [viewerImage, setViewerImage] = useState<number | string | null>(null);

  useEffect(() => () => {
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
  }, []);

  useEffect(() => {
    if (messages.length > previousMessageCount.current) shouldScrollToEnd.current = true;
    previousMessageCount.current = messages.length;
  }, [messages.length]);

  const dismissMenus = useCallback(() => {
    setActionTarget(null);
    setReactionTarget(null);
  }, []);

  const replyToMessage = useCallback((message: Message) => {
    dismissMenus();
    setReplyingTo(message);
  }, [dismissMenus]);

  const deleteMessage = useCallback((message: Message) => {
    if (deleteTimer.current || deletingMessageId) return;
    dismissMenus();
    setReplyingTo((current) => current?.id === message.id ? null : current);
    setDeletingMessageId(message.id);
    deleteTimer.current = setTimeout(() => {
      deleteById(message.id);
      setDeletingMessageId(null);
      deleteTimer.current = null;
    }, reduceMotion ? 110 : 190);
  }, [deleteById, deletingMessageId, dismissMenus, reduceMotion]);

  const scrollToOriginalMessage = useCallback((messageId: string) => {
    const index = messages.findIndex((message) => message.id === messageId);
    if (index < 0) return;
    dismissMenus();
    shouldScrollToEnd.current = false;
    listRef.current?.scrollToIndex({ animated: !reduceMotion, index, viewPosition: 0.5 });
    setHighlightedMessageId(messageId);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => {
      setHighlightedMessageId(null);
      highlightTimer.current = null;
    }, reduceMotion ? 300 : 620);
  }, [dismissMenus, messages, reduceMotion]);

  const handleSendText = useCallback((text: string, image: PendingImage | null) => {
    shouldScrollToEnd.current = true;
    sendText({ image, replyingTo, text });
    setReplyingTo(null);
  }, [replyingTo, sendText]);

  const handleSendAudio = useCallback((audio: AudioDraft) => {
    shouldScrollToEnd.current = true;
    sendAudio({ audio, replyingTo });
    setReplyingTo(null);
  }, [replyingTo, sendAudio]);

  const ownBubbleBackground = isDark ? '#248A3D' : colors.primaryDark;

  if (loading) {
    return <Screen swipeTabs={false}><View style={styles.center}><ActivityIndicator color={colors.primaryDark} /></View></Screen>;
  }

  if (!conversation) {
    return (
      <Screen swipeTabs={false}>
        <View style={styles.center}><Feather color={colors.textMuted} name="message-circle" size={30} /><AppText variant="bodyStrong">Conversación no disponible</AppText><Pressable onPress={() => router.back()} style={[styles.backAction, { backgroundColor: colors.primarySoft }]}><AppText style={{ color: colors.primaryDark }} variant="bodyStrong">Volver</AppText></Pressable></View>
      </Screen>
    );
  }

  return (
    <Screen swipeTabs={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} onTouchStart={dismissMenus} style={styles.conversationScreen}>
        <View style={[styles.conversationHeader, { borderBottomColor: colors.border }]}>
          <Pressable accessibilityLabel="Volver a conversaciones" hitSlop={8} onPress={() => router.back()} style={({ pressed }) => [styles.headerButton, pressed && styles.buttonPressed]}><Feather color={colors.text} name="chevron-left" size={23} /></Pressable>
          <View style={styles.personHeading}>
            <View style={[styles.smallAvatar, { backgroundColor: conversation.accent }]}><AppText style={styles.smallInitials} variant="caption">{conversation.initials}</AppText>{conversation.online ? <View style={[styles.onlineDot, { borderColor: colors.surface }]} /> : null}</View>
            <View style={styles.personCopy}><AppText numberOfLines={1} variant="bodyStrong">{conversation.name}</AppText><AppText style={[styles.onlineText, { color: colors.primaryDark }]} variant="caption">{typing ? 'Escribiendo…' : conversation.online ? 'En línea' : 'Comunidad'}</AppText></View>
          </View>
          <Pressable accessibilityLabel="Opciones de conversación" style={({ pressed }) => [styles.headerButton, pressed && styles.buttonPressed]}><Feather color={colors.text} name="more-horizontal" size={21} /></Pressable>
        </View>

        <FlatList
          contentContainerStyle={styles.messages}
          data={messages}
          initialNumToRender={12}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          keyExtractor={(message) => message.id}
          ListHeaderComponent={<View style={[styles.dayPill, { backgroundColor: colors.surfaceMuted }]}><AppText style={styles.dayPillText} variant="caption">HOY</AppText></View>}
          ListFooterComponent={typing ? <TypingIndicator colors={colors} participantName={conversation.name.split(' ')[0]} /> : null}
          onContentSizeChange={() => {
            if (!shouldScrollToEnd.current) return;
            listRef.current?.scrollToEnd({ animated: !reduceMotion });
            shouldScrollToEnd.current = false;
          }}
          onScrollToIndexFailed={({ averageItemLength, index }) => listRef.current?.scrollToOffset({ animated: !reduceMotion, offset: Math.max(0, averageItemLength * index) })}
          ref={listRef}
          renderItem={({ index, item }) => {
            const groupedWithPrevious = index > 0 && messages[index - 1]?.mine === item.mine;
            const groupedWithNext = index < messages.length - 1 && messages[index + 1]?.mine === item.mine;
            return <MessageBubble colors={colors} deleting={deletingMessageId === item.id} groupedWithNext={groupedWithNext} groupedWithPrevious={groupedWithPrevious} highlighted={highlightedMessageId === item.id} isActionOpen={actionTarget === item.id} isReactionOpen={reactionTarget === item.id} message={item} onDelete={deleteMessage} onImagePress={setViewerImage} onReaction={addReaction} onReply={replyToMessage} onReplyPress={scrollToOriginalMessage} onRetry={retry} onToggleActions={(messageId) => { setReactionTarget(null); setActionTarget((current) => current === messageId ? null : messageId); }} onToggleReactions={(messageId) => { setActionTarget(null); setReactionTarget((current) => current === messageId ? null : messageId); }} ownBubbleBackground={ownBubbleBackground} showMeta={!groupedWithNext} />;
          }}
          showsVerticalScrollIndicator={false}
        />

        <View style={{ paddingBottom: Math.max(insets.bottom, spacing.sm) }}>
          <Composer colors={colors} onCancelReply={() => setReplyingTo(null)} onSendAudio={handleSendAudio} onSendText={handleSendText} ownBubbleBackground={ownBubbleBackground} participantName={conversation.name} replyingTo={replyingTo} />
        </View>
      </KeyboardAvoidingView>
      <ImageViewer image={viewerImage} onClose={() => setViewerImage(null)} />
    </Screen>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  backAction: { borderCurve: 'continuous', borderRadius: radii.pill, marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  buttonPressed: { opacity: 0.55 },
  center: { alignItems: 'center', flex: 1, gap: spacing.sm, justifyContent: 'center' },
  conversationHeader: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 58, paddingBottom: spacing.sm },
  conversationScreen: { flex: 1 },
  dayPill: { alignSelf: 'center', borderRadius: radii.pill, marginBottom: spacing.sm, paddingHorizontal: 9, paddingVertical: 3 },
  dayPillText: { fontFamily: typography.bodySemiBold, fontSize: 9, letterSpacing: 0.8, lineHeight: 13 },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 40 },
  messages: { paddingBottom: spacing.md, paddingTop: spacing.xs },
  onlineDot: { backgroundColor: colors.primary, borderRadius: radii.pill, borderWidth: 2, bottom: 0, height: 13, position: 'absolute', right: 0, width: 13 },
  onlineText: { fontSize: 10, lineHeight: 13 },
  personCopy: { flex: 1 },
  personHeading: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.sm },
  smallAvatar: { alignItems: 'center', borderCurve: 'continuous', borderRadius: radii.pill, height: 38, justifyContent: 'center', position: 'relative', width: 38 },
  smallInitials: { color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 10 },
}));
