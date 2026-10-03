import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { memo, useCallback, useEffect, useRef } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  ZoomIn,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import Feather from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import type { Message, Reaction } from '@/features/chat/domain/message';
import { formatDuration } from '@/features/chat/domain/message';
import { radii, spacing, typography, type ThemeColors } from '@/theme/tokens';

import { AudioMessage, AudioWaveform } from './AudioMessage';

const reactionOptions = ['❤️', '😂', '🙌', '👍'];

function selectionHaptic() {
  void Haptics.selectionAsync().catch(() => undefined);
}

export function TypingIndicator({ colors, participantName }: { colors: ThemeColors; participantName: string }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotion) progress.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1, false);
  }, [progress, reduceMotion]);

  return (
    <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={styles.typingRow}>
      <View accessibilityLabel={`${participantName} está escribiendo`} style={[styles.typingBubble, { backgroundColor: colors.surfaceMuted }]}>
        {[0, 1, 2].map((index) => <TypingDot colors={colors} index={index} key={index} progress={progress} reduceMotion={reduceMotion} />)}
      </View>
      <AppText style={{ color: colors.textMuted, fontSize: 11 }} variant="caption">{participantName} está escribiendo</AppText>
    </Animated.View>
  );
}

function TypingDot({ colors, index, progress, reduceMotion }: {
  colors: ThemeColors;
  index: number;
  progress: ReturnType<typeof useSharedValue<number>>;
  reduceMotion: boolean;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: 0.7, transform: [{ translateY: 0 }] };
    const phase = (progress.value + index * 0.2) % 1;
    return {
      opacity: interpolate(phase, [0, 0.45, 1], [0.35, 1, 0.35]),
      transform: [{ translateY: interpolate(phase, [0, 0.45, 1], [0, -3, 0]) }],
    };
  });
  return <Animated.View style={[styles.typingDot, { backgroundColor: colors.textMuted }, animatedStyle]} />;
}

function DeliveryIndicator({ colors, message, onRetry }: { colors: ThemeColors; message: Message; onRetry: (message: Message) => void }) {
  const reduceMotion = useReducedMotion();
  const rotation = useSharedValue(0);
  const status = message.deliveryStatus ?? 'read';

  useEffect(() => {
    rotation.value = status === 'sending' && !reduceMotion
      ? withRepeat(withTiming(1, { duration: 850, easing: Easing.linear }), -1, false)
      : 0;
  }, [reduceMotion, rotation, status]);

  const spinnerStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value * 360}deg` }] }));
  if (status === 'error') {
    return (
      <Pressable accessibilityLabel="Error al enviar. Reintentar" hitSlop={8} onPress={() => onRetry(message)}>
        <Animated.View entering={FadeIn.duration(120)}>
          <Feather color={colors.danger} name="alert-circle" size={13} />
        </Animated.View>
      </Pressable>
    );
  }
  if (status === 'sending') {
    return (
      <Animated.View accessibilityLabel="Enviando" entering={FadeIn.duration(100)} style={spinnerStyle}>
        <Feather color={colors.textMuted} name="loader" size={12} />
      </Animated.View>
    );
  }
  if (status === 'sent') {
    return (
      <Animated.View accessibilityLabel="Enviado" entering={FadeIn.duration(120)} key={status} style={styles.deliveryIcon}>
        <Ionicons color={colors.textMuted} name="checkmark" size={15} />
      </Animated.View>
    );
  }

  const checkColor = status === 'read' ? colors.primary : colors.textMuted;
  return (
    <Animated.View accessibilityLabel={status === 'read' ? 'Leído' : 'Entregado'} entering={reduceMotion ? FadeIn.duration(120) : ZoomIn.duration(160)} key={status} style={styles.deliveryIcon}>
      <Ionicons color={checkColor} name="checkmark-done" size={16} />
    </Animated.View>
  );
}

type MessageBubbleProps = {
  colors: ThemeColors;
  deleting: boolean;
  groupedWithNext: boolean;
  groupedWithPrevious: boolean;
  highlighted: boolean;
  isActionOpen: boolean;
  isReactionOpen: boolean;
  message: Message;
  onDelete: (message: Message) => void;
  onImagePress: (image: number | string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
  onReplyPress: (messageId: string) => void;
  onRetry: (message: Message) => void;
  onToggleActions: (messageId: string) => void;
  onToggleReactions: (messageId: string) => void;
  ownBubbleBackground: string;
  showMeta: boolean;
};

export const MessageBubble = memo(function MessageBubble({ colors, deleting, groupedWithNext, groupedWithPrevious, highlighted, isActionOpen, isReactionOpen, message, onDelete, onImagePress, onReaction, onReply, onReplyPress, onRetry, onToggleActions, onToggleReactions, ownBubbleBackground, showMeta }: MessageBubbleProps) {
  const reduceMotion = useReducedMotion();
  const longPressTriggered = useRef(false);
  const measuredHeight = useSharedValue(0);
  const deleteProgress = useSharedValue(0);
  const highlightProgress = useSharedValue(0);
  const mountProgress = useSharedValue(reduceMotion || !message.mine ? 1 : 0);
  const swipeX = useSharedValue(0);
  const swipeArmed = useSharedValue(false);
  const hapticSent = useSharedValue(false);
  const replyIconScale = useSharedValue(1);
  const entrance = reduceMotion
    ? FadeIn.duration(140)
    : message.mine ? undefined : FadeInDown.duration(200).easing(Easing.bezier(0.23, 1, 0.32, 1));
  const rowLayout = reduceMotion
    ? LinearTransition.duration(140)
    : LinearTransition.springify().damping(26).stiffness(250).mass(0.72);
  const bubbleBackground = message.mine ? ownBubbleBackground : colors.surfaceMuted;
  const textColor = message.mine ? '#FFFFFF' : colors.text;
  const groupedBubbleStyle = groupedWithPrevious && groupedWithNext
    ? message.mine ? styles.bubbleMineMiddle : styles.bubbleOtherMiddle
    : groupedWithPrevious
      ? message.mine ? styles.bubbleMineLast : styles.bubbleOtherLast
      : groupedWithNext
        ? message.mine ? styles.bubbleMineFirst : styles.bubbleOtherFirst
        : null;
  const bubbleShape = [styles.bubble, message.mine ? styles.bubbleMine : styles.bubbleOther, groupedBubbleStyle, { backgroundColor: bubbleBackground }];
  const imageBubbleShape = [
    styles.standaloneImage,
    message.mine ? styles.imageBubbleMine : styles.imageBubbleOther,
    groupedBubbleStyle,
    { backgroundColor: colors.surfaceMuted },
  ];
  const isUploadingImage = Boolean(message.image && message.mine && message.deliveryStatus === 'sending');
  const replyQuoteContent = message.replyTo ? (
    <Pressable accessibilityLabel="Ir al mensaje original" onPress={() => onReplyPress(message.replyTo!.id)} style={[styles.replyQuote, { borderLeftColor: message.mine ? 'rgba(255,255,255,0.72)' : colors.primary }]}>
      {message.replyTo.image ? <Image contentFit="cover" source={message.replyTo.image} style={styles.replyQuoteImage} /> : null}
      {message.replyTo.audioDurationMs !== undefined ? (
        <View style={styles.replyQuoteWaveform}>
          <AudioWaveform activeColor={message.mine ? 'rgba(255,255,255,0.78)' : colors.primaryDark} barCount={10} height={20} inactiveColor={message.mine ? 'rgba(255,255,255,0.3)' : colors.border} progress={1} samples={message.replyTo.audioWaveform ?? []} />
        </View>
      ) : null}
      <View style={styles.replyQuoteCopy}>
        <AppText style={[styles.replyQuoteAuthor, { color: message.mine ? '#FFFFFF' : colors.primaryDark }]} variant="caption">{message.replyTo.author}</AppText>
        <AppText numberOfLines={1} style={[styles.replyQuoteText, { color: message.mine ? 'rgba(255,255,255,0.78)' : colors.textMuted }]} variant="caption">
          {message.replyTo.audioDurationMs !== undefined ? `Audio · ${formatDuration(message.replyTo.audioDurationMs)}` : message.replyTo.image ? 'Imagen' : message.replyTo.text}
        </AppText>
      </View>
    </Pressable>
  ) : null;

  useEffect(() => {
    if (!message.mine || reduceMotion) return;
    mountProgress.value = withSpring(1, { damping: 22, mass: 0.7, stiffness: 260 });
  }, [message.mine, mountProgress, reduceMotion]);

  useEffect(() => {
    deleteProgress.value = deleting
      ? withTiming(1, { duration: reduceMotion ? 100 : 180, easing: Easing.inOut(Easing.cubic) })
      : 0;
  }, [deleteProgress, deleting, reduceMotion]);

  useEffect(() => {
    if (!highlighted) return;
    highlightProgress.value = reduceMotion
      ? withSequence(withTiming(1, { duration: 80 }), withTiming(0, { duration: 180 }))
      : withSequence(withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) }), withTiming(0, { duration: 350, easing: Easing.inOut(Easing.cubic) }));
  }, [highlightProgress, highlighted, reduceMotion]);

  const completeSwipeReply = useCallback(() => onReply(message), [message, onReply]);
  const swipeGesture = Gesture.Pan()
    .enabled(!deleting && !isActionOpen && !isReactionOpen)
    .activeOffsetX(8)
    .failOffsetY([-12, 12])
    .onBegin(() => {
      swipeArmed.value = false;
      hapticSent.value = false;
    })
    .onUpdate((event) => {
      const nextX = Math.max(0, Math.min(72, event.translationX));
      const crossedThreshold = nextX >= 55;
      swipeX.value = nextX;
      swipeArmed.value = crossedThreshold;
      if (crossedThreshold && !hapticSent.value) {
        hapticSent.value = true;
        replyIconScale.value = withSequence(withSpring(1.2, { damping: 12, mass: 0.45, stiffness: 360 }), withSpring(1, { damping: 15, mass: 0.5, stiffness: 300 }));
        scheduleOnRN(selectionHaptic);
      }
    })
    .onEnd(() => {
      if (swipeArmed.value) scheduleOnRN(completeSwipeReply);
      swipeX.value = reduceMotion ? withTiming(0, { duration: 100 }) : withSpring(0, { damping: 18, mass: 0.65, stiffness: 260 });
    })
    .onFinalize(() => {
      swipeX.value = reduceMotion ? withTiming(0, { duration: 100 }) : withSpring(0, { damping: 18, mass: 0.65, stiffness: 260 });
    });

  const rowAnimatedStyle = useAnimatedStyle(() => ({
    height: deleting && measuredHeight.value > 0 ? measuredHeight.value * (1 - deleteProgress.value) : undefined,
    opacity: mountProgress.value * (1 - deleteProgress.value),
    transform: [
      { translateY: (1 - mountProgress.value) * 8 },
      { scale: (0.96 + mountProgress.value * 0.04) * (1 - deleteProgress.value * 0.04) * (1 + highlightProgress.value * 0.02) },
    ],
  }));
  const swipeAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: swipeX.value }] }));
  const swipeIconAnimatedStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, swipeX.value / 28), transform: [{ translateX: -swipeX.value }, { scale: replyIconScale.value }] }));

  return (
    <Animated.View entering={entrance} layout={rowLayout} onLayout={(event) => { if (!deleting) measuredHeight.value = event.nativeEvent.layout.height; }} style={[styles.messageRow, groupedWithPrevious ? styles.messageRowGrouped : styles.messageRowSeparated, message.mine && styles.messageRowMine, deleting && styles.messageRowDeleting, rowAnimatedStyle]}>
      <View style={[styles.messageLine, message.mine && styles.messageLineMine]}>
        {!message.mine ? <ReactionTrigger colors={colors} messageId={message.id} onPress={onToggleReactions} /> : null}
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[styles.messageBlock, message.mine && styles.messageBlockMine, swipeAnimatedStyle]}>
            <Animated.View pointerEvents="none" style={[styles.swipeReplyIcon, swipeIconAnimatedStyle]}>
              <Feather color={colors.primaryDark} name="corner-up-left" size={17} />
            </Animated.View>
            <Pressable
              accessibilityHint="Mantén presionado para ver acciones o desliza a la derecha para responder"
              accessibilityLabel={message.text ?? (message.audioUri ? 'Nota de voz' : 'Imagen compartida')}
              delayLongPress={260}
              onLongPress={() => { longPressTriggered.current = true; onToggleActions(message.id); }}
              onPress={message.image ? () => { if (!longPressTriggered.current) onImagePress(message.image!); } : undefined}
              onPressOut={() => setTimeout(() => { longPressTriggered.current = false; }, 0)}
              style={[styles.messagePressable, message.mine && styles.messagePressableMine]}>
              {message.image ? (
                <View style={imageBubbleShape}>
                  <Image accessibilityLabel="Imagen compartida en el chat" blurRadius={isUploadingImage ? 2.5 : 0} contentFit="cover" recyclingKey={message.id} source={message.image} style={[styles.messageImage, isUploadingImage && styles.messageImageUploading]} transition={160} />
                  {isUploadingImage ? (
                    <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(160)} pointerEvents="none" style={styles.imageUploadOverlay}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <AppText style={styles.imageUploadLabel} variant="caption">Enviando…</AppText>
                      <View style={styles.imageUploadTrack}><View style={[styles.imageUploadProgress, { width: `${Math.round((message.uploadProgress ?? 0) * 100)}%` }]} /></View>
                    </Animated.View>
                  ) : message.deliveryStatus === 'sent' ? (
                    <Animated.View entering={reduceMotion ? FadeIn.duration(120) : ZoomIn.duration(180)} pointerEvents="none" style={styles.imageUploadComplete}><Feather color="#FFFFFF" name="check" size={14} /></Animated.View>
                  ) : (
                    <View pointerEvents="none" style={styles.imageHint}><Feather color="#FFFFFF" name="maximize-2" size={12} /></View>
                  )}
                </View>
              ) : null}
              {message.audioUri ? <View style={bubbleShape}>{replyQuoteContent}<AudioMessage colors={colors} durationMs={message.audioDurationMs ?? 0} mine={message.mine} uri={message.audioUri} waveform={message.audioWaveform ?? []} /></View> : null}
              {message.text || (message.replyTo && !message.audioUri) ? <View style={bubbleShape}>{!message.audioUri ? replyQuoteContent : null}{message.text ? <AppText style={[styles.messageText, { color: textColor }]}>{message.text}</AppText> : null}</View> : null}
            </Pressable>
          </Animated.View>
        </GestureDetector>
      </View>

      {isActionOpen ? (
        <Animated.View entering={reduceMotion ? FadeIn.duration(120) : FadeInDown.duration(180)} exiting={FadeOut.duration(100)} onTouchStart={(event) => event.stopPropagation()} style={[styles.messageActions, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={styles.actionButtons}>
            <Pressable accessibilityLabel="Responder al mensaje" onPress={() => onReply(message)} style={({ pressed }) => [styles.messageActionButton, pressed && styles.messageActionPressed]}><Feather color={colors.text} name="corner-up-left" size={16} /><AppText style={styles.messageActionLabel} variant="caption">Responder</AppText></Pressable>
            <Pressable accessibilityLabel={message.mine ? 'Eliminar mensaje' : 'Eliminar para mí'} onPress={() => onDelete(message)} style={({ pressed }) => [styles.messageActionButton, pressed && styles.messageActionPressed]}><Feather color={colors.danger} name="trash-2" size={16} /><AppText numberOfLines={1} style={[styles.messageActionLabel, { color: colors.danger }]} variant="caption">{message.mine ? 'Eliminar mensaje' : 'Eliminar para mí'}</AppText></Pressable>
          </View>
        </Animated.View>
      ) : null}

      {isReactionOpen ? (
        <Animated.View entering={reduceMotion ? FadeIn.duration(120) : FadeInDown.duration(160)} exiting={FadeOut.duration(90)} onTouchStart={(event) => event.stopPropagation()} style={[styles.reactionPicker, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          {reactionOptions.map((emoji) => <Pressable accessibilityLabel={`Reaccionar con ${emoji}`} key={emoji} onPress={() => onReaction(message.id, emoji)} style={({ pressed }) => [styles.reactionOption, pressed && styles.reactionOptionPressed]}><AppText style={styles.reactionEmoji}>{emoji}</AppText></Pressable>)}
        </Animated.View>
      ) : null}

      {message.reactions?.length ? <View style={[styles.messageReactions, message.mine && styles.messageReactionsMine]}>{message.reactions.map((reaction) => <ReactionChip colors={colors} key={reaction.emoji} messageId={message.id} onReaction={onReaction} reaction={reaction} />)}</View> : null}
      {showMeta ? <View style={[styles.messageMeta, message.mine && styles.messageMetaMine]}><AppText style={[styles.messageTime, { color: colors.textMuted }]} variant="caption">{message.time}</AppText>{message.mine ? <DeliveryIndicator colors={colors} message={message} onRetry={onRetry} /> : null}</View> : null}
    </Animated.View>
  );
});

function ReactionTrigger({ colors, messageId, onPress }: { colors: ThemeColors; messageId: string; onPress: (id: string) => void }) {
  return <Pressable accessibilityLabel="Reaccionar al mensaje" hitSlop={8} onPress={() => onPress(messageId)} style={({ pressed }) => [styles.reactionTrigger, pressed && styles.reactionTriggerPressed]}><Feather color={colors.textMuted} name="smile" size={14} /></Pressable>;
}

function ReactionChip({ colors, messageId, onReaction, reaction }: { colors: ThemeColors; messageId: string; onReaction: (messageId: string, emoji: string) => void; reaction: Reaction }) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 0.8);
  useEffect(() => {
    if (reduceMotion) { scale.value = 1; return; }
    scale.value = 0.8;
    scale.value = withSequence(withTiming(1.15, { duration: 90, easing: Easing.out(Easing.cubic) }), withSpring(1, { damping: 15, mass: 0.45, stiffness: 320 }));
  }, [reaction.count, reaction.mine, reduceMotion, scale]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={popStyle}><Pressable accessibilityLabel={`${reaction.count} reacciones ${reaction.emoji}`} onPress={() => onReaction(messageId, reaction.emoji)} style={[styles.reactionCount, { backgroundColor: colors.surfaceElevated, borderColor: reaction.mine ? colors.primary : colors.border }]}><AppText style={styles.reactionCountText}>{reaction.emoji} {reaction.count}</AppText></Pressable></Animated.View>;
}

export function ImageViewer({ image, onClose }: { image: number | string | null; onClose: () => void }) {
  const { height, width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const imageEntrance = reduceMotion ? FadeIn.duration(150) : ZoomIn.duration(240).easing(Easing.bezier(0.23, 1, 0.32, 1)).withInitialValues({ transform: [{ scale: 0.94 }] });
  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={image !== null}>
      <View style={styles.viewer}>
        {image !== null ? <Animated.View entering={imageEntrance} style={{ height, width }}><Image accessibilityLabel="Imagen ampliada" contentFit="contain" source={image} style={{ height, width }} transition={{ duration: 180, effect: 'cross-dissolve', timing: 'ease-out' }} /></Animated.View> : null}
        <Animated.View entering={FadeIn.delay(reduceMotion ? 0 : 100).duration(140)} style={styles.viewerCloseContainer}><Pressable accessibilityLabel="Cerrar imagen" onPress={onClose} style={({ pressed }) => [styles.viewerClose, pressed && styles.viewerClosePressed]}><Feather color="#FFFFFF" name="x" size={22} /></Pressable></Animated.View>
        <Animated.View entering={FadeIn.delay(reduceMotion ? 0 : 120).duration(140)} pointerEvents="none" style={styles.viewerCaption}><AppText style={styles.viewerCaptionText} variant="caption">Toca × para volver al chat</AppText></Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  typingRow: { alignItems: 'flex-start', gap: 4, marginTop: spacing.xs },
  typingBubble: { alignItems: 'center', borderBottomLeftRadius: 5, borderRadius: 18, flexDirection: 'row', gap: 4, height: 38, justifyContent: 'center', width: 62 },
  typingDot: { borderRadius: radii.pill, height: 6, width: 6 },
  messageRow: { alignItems: 'flex-start', width: '100%' },
  messageRowDeleting: { overflow: 'hidden' },
  messageRowGrouped: { marginTop: 2 },
  messageRowMine: { alignItems: 'flex-end', alignSelf: 'flex-end' },
  messageRowSeparated: { marginTop: 9 },
  messageLine: { alignItems: 'flex-end', flexDirection: 'row', gap: 6, width: '100%' },
  messageLineMine: { justifyContent: 'flex-end' },
  messageBlock: { alignItems: 'flex-start', flexShrink: 1, maxWidth: '82%', position: 'relative' },
  messageBlockMine: { alignItems: 'flex-end', maxWidth: '86%' },
  messagePressable: { alignItems: 'flex-start', gap: spacing.xs, maxWidth: '100%' },
  messagePressableMine: { alignItems: 'flex-end' },
  swipeReplyIcon: { alignItems: 'center', bottom: 0, justifyContent: 'center', left: 5, position: 'absolute', top: 0, width: 24 },
  bubble: { borderRadius: 18, maxWidth: '100%', overflow: 'hidden' },
  bubbleOther: { borderBottomLeftRadius: 5 },
  bubbleMine: { borderBottomRightRadius: 5 },
  bubbleOtherFirst: { borderBottomLeftRadius: 18 },
  bubbleOtherMiddle: { borderBottomLeftRadius: 8, borderTopLeftRadius: 8 },
  bubbleOtherLast: { borderTopLeftRadius: 8 },
  bubbleMineFirst: { borderBottomRightRadius: 18 },
  bubbleMineMiddle: { borderBottomRightRadius: 8, borderTopRightRadius: 8 },
  bubbleMineLast: { borderTopRightRadius: 8 },
  messageText: { paddingHorizontal: spacing.md, paddingVertical: 9 },
  replyQuote: { alignItems: 'center', borderLeftWidth: 2, flexDirection: 'row', gap: 6, marginHorizontal: spacing.md, marginTop: 8, maxWidth: 220, minHeight: 28, paddingLeft: spacing.sm },
  replyQuoteCopy: { flex: 1, gap: 1 },
  replyQuoteImage: { borderRadius: 5, height: 28, width: 28 },
  replyQuoteWaveform: { height: 20, width: 46 },
  replyQuoteAuthor: { fontFamily: typography.bodySemiBold, fontSize: 10, lineHeight: 13 },
  replyQuoteText: { fontSize: 11, lineHeight: 15 },
  standaloneImage: { borderCurve: 'continuous', borderRadius: 20, height: 168, maxWidth: '100%', overflow: 'hidden', width: 232 },
  imageBubbleMine: { borderBottomRightRadius: 4 },
  imageBubbleOther: { borderBottomLeftRadius: 4 },
  messageImage: { height: '100%', width: '100%' },
  messageImageUploading: { opacity: 0.72 },
  imageHint: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.42)', borderColor: 'rgba(255,255,255,0.2)', borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth, bottom: 7, height: 26, justifyContent: 'center', position: 'absolute', right: 7, width: 26 },
  imageUploadOverlay: { alignItems: 'center', backgroundColor: 'rgba(7,12,10,0.3)', bottom: 0, gap: 6, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 },
  imageUploadLabel: { color: '#FFFFFF', fontFamily: typography.bodyMedium, fontSize: 11, lineHeight: 14 },
  imageUploadTrack: { backgroundColor: 'rgba(255,255,255,0.28)', borderRadius: radii.pill, height: 3, overflow: 'hidden', width: 82 },
  imageUploadProgress: { backgroundColor: '#FFFFFF', borderRadius: radii.pill, height: '100%' },
  imageUploadComplete: { alignItems: 'center', backgroundColor: 'rgba(20,120,62,0.82)', borderRadius: radii.pill, height: 28, justifyContent: 'center', left: '50%', marginLeft: -14, marginTop: -14, position: 'absolute', top: '50%', width: 28 },
  messageActions: { borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, marginTop: spacing.xs, maxWidth: '86%', overflow: 'hidden', padding: 4, width: 250 },
  reactionTrigger: { alignItems: 'center', flexShrink: 0, height: 32, justifyContent: 'center', width: 24 },
  reactionTriggerPressed: { opacity: 0.42, transform: [{ scale: 0.92 }] },
  reactionPicker: { alignItems: 'center', borderCurve: 'continuous', borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginTop: spacing.xs, padding: 3 },
  reactionOption: { alignItems: 'center', borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 40 },
  reactionOptionPressed: { backgroundColor: 'rgba(128,128,128,0.16)', transform: [{ scale: 0.94 }] },
  reactionEmoji: { fontSize: 20, lineHeight: 25 },
  actionButtons: { flexDirection: 'row' },
  messageActionButton: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 42, paddingHorizontal: spacing.sm },
  messageActionPressed: { backgroundColor: 'rgba(128,128,128,0.12)' },
  messageActionLabel: { fontFamily: typography.bodyMedium, fontSize: 11, lineHeight: 14 },
  messageReactions: { alignItems: 'center', flexDirection: 'row', gap: 3, marginLeft: 9, marginTop: -5, zIndex: 2 },
  messageReactionsMine: { alignSelf: 'flex-end', marginLeft: 0, marginRight: 9 },
  messageMeta: { alignItems: 'center', flexDirection: 'row', gap: 2, marginHorizontal: 4, marginTop: 1 },
  messageMetaMine: { justifyContent: 'flex-end' },
  reactionCount: { alignItems: 'center', borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 26, paddingHorizontal: 7 },
  reactionCountText: { fontSize: 11, lineHeight: 15 },
  messageTime: { fontSize: 10, fontVariant: ['tabular-nums'], lineHeight: 13 },
  deliveryIcon: { alignItems: 'center', height: 14, justifyContent: 'center', width: 18 },
  viewer: { alignItems: 'center', backgroundColor: '#050505', flex: 1, justifyContent: 'center' },
  viewerCloseContainer: { position: 'absolute', right: spacing.lg, top: 52, zIndex: 2 },
  viewerClose: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.18)', borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth, height: 44, justifyContent: 'center', width: 44 },
  viewerClosePressed: { backgroundColor: 'rgba(255,255,255,0.26)', transform: [{ scale: 0.94 }] },
  viewerCaption: { bottom: 34, position: 'absolute' },
  viewerCaptionText: { color: 'rgba(255,255,255,0.68)' },
});
