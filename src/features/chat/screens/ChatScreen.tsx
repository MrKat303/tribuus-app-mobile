import Feather from '@/components/ui/AppIcon';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  type GestureResponderEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Screen } from '@/components/Screen';
import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/context/AppearanceContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography, type ThemeColors } from '@/theme/tokens';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type Conversation = {
  accent: string;
  id: string;
  initials: string;
  kind: 'friend' | 'group';
  lastMessage: string;
  name: string;
  online?: boolean;
  time: string;
  unread?: number;
};
type InboxFilter = 'all' | 'friends' | 'groups' | 'unread';

type Reaction = { count: number; emoji: string; mine?: boolean };
type AudioDraft = { durationMs: number; uri: string; waveform: number[] };
type RecordingMode = 'paused' | 'recording' | null;
type DeliveryStatus = 'delivered' | 'error' | 'read' | 'sending' | 'sent';
type Message = {
  aspectRatio?: number;
  audioDurationMs?: number;
  audioUri?: string;
  audioWaveform?: number[];
  deliveryStatus?: DeliveryStatus;
  id: string;
  image?: number | string;
  mine: boolean;
  reactions?: Reaction[];
  replyTo?: {
    audioDurationMs?: number;
    audioWaveform?: number[];
    author: string;
    id: string;
    image?: number | string;
    text: string;
  };
  text?: string;
  time: string;
  uploadProgress?: number;
};

const reactionOptions = ['❤️', '😂', '🙌', '👍'];
const emojiCategories = [
  { label: 'Caras', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '🙂', '🙃', '😉', '😍', '🥰', '😘', '😋', '😎', '🤩', '🥳', '😏', '😔', '🥺', '😢', '😭', '😤', '😡', '🤯', '😱', '🤗', '🤔', '🫡', '🤭'] },
  { label: 'Gestos', emojis: ['👋', '🤚', '🖐️', '✋', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '👏', '🙌', '🫶', '🙏', '💪', '🤝'] },
  { label: 'Corazones', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'] },
  { label: 'Momentos', emojis: ['✨', '⭐', '🌟', '🔥', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '⚽', '🎵', '🎶', '☀️', '🌈', '🌙', '🌱', '🌻', '☕', '🍕', '🍻', '🚀', '💡', '✅'] },
] as const;
const demoImage = require('../../../../assets/images/tutorial-web.png');

const conversations: Conversation[] = [
  { accent: '#DDF4E5', id: 'cami', initials: 'CA', kind: 'friend', lastMessage: 'Sí, nos vemos afuera del café ☕', name: 'Camila Andrade', online: true, time: '10:42', unread: 2 },
  { accent: '#E6EEFF', id: 'diego', initials: 'DM', kind: 'friend', lastMessage: 'Te envié la dirección del evento.', name: 'Diego Morales', time: 'Ayer' },
  { accent: '#F7E8EE', id: 'sofia', initials: 'SP', kind: 'friend', lastMessage: '¡Gracias por la recomendación!', name: 'Sofía Pérez', online: true, time: 'Lun' },
  { accent: '#F4EEDC', id: 'vecinos', initials: 'VP', kind: 'group', lastMessage: 'Nicolás: puedo llevar bolsas.', name: 'Vecinos de Providencia', time: 'Dom', unread: 4 },
];
const inboxFilters: { id: InboxFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'unread', label: 'No leídos' },
  { id: 'groups', label: 'Grupos' },
  { id: 'friends', label: 'Amigos' },
];

const initialMessages: Message[] = [
  { id: 'm1', mine: false, text: 'Hola, ¿vas al encuentro del sábado?', time: '10:35' },
  { deliveryStatus: 'read', id: 'm2', mine: true, text: 'Sí, pensaba llegar cerca de las once.', time: '10:38' },
  { aspectRatio: 1480 / 855, id: 'm3', image: demoImage, mine: false, text: 'Este es el punto de encuentro.', time: '10:40' },
  { id: 'm4', mine: false, reactions: [{ count: 1, emoji: '🙌' }], text: 'Sí, nos vemos afuera del café ☕', time: '10:42' },
];

function selectionHaptic() {
  void Haptics.selectionAsync().catch(() => undefined);
}

function impactHaptic() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

function notificationPermissionGranted(permission: Notifications.NotificationPermissionsStatus) {
  if (permission.granted) return true;
  const iosStatus = permission.ios?.status;
  return iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED
    || iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL
    || iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL;
}

function deleteLocalAudio(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // The OS may already have removed a temporary or interrupted recording.
  }
}

function TypingIndicator({ colors }: { colors: ThemeColors }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotion) progress.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1, false);
  }, [progress, reduceMotion]);

  return (
    <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={staticStyles.typingRow}>
      <View accessibilityLabel="Camila está escribiendo" style={[staticStyles.typingBubble, { backgroundColor: colors.surfaceMuted }]}>
        {[0, 1, 2].map((index) => <TypingDot colors={colors} index={index} key={index} progress={progress} reduceMotion={reduceMotion} />)}
      </View>
      <AppText style={{ color: colors.textMuted, fontSize: 11 }} variant="caption">Camila está escribiendo</AppText>
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
  return <Animated.View style={[staticStyles.typingDot, { backgroundColor: colors.textMuted }, animatedStyle]} />;
}

type MessageBubbleProps = {
  colors: ThemeColors;
  deleting: boolean;
  highlighted: boolean;
  groupedWithNext: boolean;
  groupedWithPrevious: boolean;
  isActionOpen: boolean;
  isReactionOpen: boolean;
  message: Message;
  onImagePress: (image: number | string) => void;
  onDelete: (message: Message) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onRetry: (message: Message) => void;
  onReply: (message: Message) => void;
  onReplyPress: (messageId: string) => void;
  onToggleActions: (messageId: string) => void;
  onToggleReactions: (messageId: string) => void;
  ownBubbleBackground: string;
  showMeta: boolean;
};

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function replyLabel(message: Message) {
  if (message.audioUri) return `Audio · ${formatDuration(message.audioDurationMs ?? 0)}`;
  if (message.image) return 'Imagen';
  return message.text ?? 'Mensaje';
}

function normalizeMetering(decibels: number) {
  return Math.max(0.06, Math.min(1, Math.pow(10, decibels / 40)));
}

function waveformBars(samples: number[], count: number) {
  if (!samples.length) return Array.from({ length: count }, () => 0.12);
  if (samples.length <= count) {
    return Array.from({ length: count }, (_, index) => {
      const position = count === 1 ? 0 : (index / (count - 1)) * (samples.length - 1);
      const lower = Math.floor(position);
      const upper = Math.min(samples.length - 1, Math.ceil(position));
      const mix = position - lower;
      return samples[lower] * (1 - mix) + samples[upper] * mix;
    });
  }
  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor((index / count) * samples.length);
    const end = Math.max(start + 1, Math.floor(((index + 1) / count) * samples.length));
    return Math.max(...samples.slice(start, end));
  });
}

function AudioWaveform({ activeColor, inactiveColor, onSeek, progress, samples, barCount = 30, height = 32 }: {
  activeColor: string;
  barCount?: number;
  height?: number;
  inactiveColor: string;
  onSeek?: (progress: number) => void;
  progress: number;
  samples: number[];
}) {
  const waveformWidth = useRef(1);
  const bars = useMemo(() => waveformBars(samples, barCount), [barCount, samples]);
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const seekFromEvent = useCallback((event: GestureResponderEvent) => {
    if (!onSeek) return;
    onSeek(Math.max(0, Math.min(1, event.nativeEvent.locationX / waveformWidth.current)));
  }, [onSeek]);

  return (
    <View
      accessibilityLabel="Progreso del audio"
      accessibilityRole={onSeek ? 'adjustable' : undefined}
      onLayout={(event) => { waveformWidth.current = Math.max(1, event.nativeEvent.layout.width); }}
      onMoveShouldSetResponder={() => Boolean(onSeek)}
      onResponderGrant={seekFromEvent}
      onResponderMove={seekFromEvent}
      onStartShouldSetResponder={() => Boolean(onSeek)}
      style={[staticStyles.waveform, { height }]}>
      {bars.map((level, index) => (
        <View
          key={index}
          style={[
            staticStyles.waveformBar,
            {
              backgroundColor: (index + 0.5) / bars.length <= clampedProgress ? activeColor : inactiveColor,
              height: Math.min(height, Math.round(4 + level * Math.max(4, height - 7))),
            },
          ]}
        />
      ))}
      {onSeek ? <View pointerEvents="none" style={[staticStyles.waveformPosition, { backgroundColor: activeColor, left: `${clampedProgress * 100}%` }]} /> : null}
    </View>
  );
}

function AudioMessage({ colors, durationMs, mine, onDelete, onSend, preview = false, uri, waveform }: {
  colors: ThemeColors;
  durationMs: number;
  mine: boolean;
  onDelete?: () => void;
  onSend?: () => void;
  preview?: boolean;
  uri: string;
  waveform: number[];
}) {
  const player = useAudioPlayer(uri, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const duration = status.duration > 0 ? status.duration * 1000 : durationMs;
  const progress = duration > 0 ? Math.min(1, (status.currentTime * 1000) / duration) : 0;

  const togglePlayback = useCallback(async () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) await player.seekTo(0);
    player.play();
  }, [player, status.currentTime, status.didJustFinish, status.duration, status.playing]);

  const seek = useCallback((nextProgress: number) => {
    if (duration <= 0) return;
    void player.seekTo((duration * nextProgress) / 1000);
  }, [duration, player]);

  const foreground = preview ? colors.text : mine ? '#FFFFFF' : colors.primaryDark;
  const inactiveColor = preview ? colors.border : mine ? 'rgba(255,255,255,0.28)' : colors.border;
  const activeColor = preview ? colors.primaryDark : foreground;

  return (
    <View style={[staticStyles.audioMessage, preview && staticStyles.audioPreview]}>
      {onDelete ? (
        <Pressable accessibilityLabel="Eliminar grabación" onPress={onDelete} style={({ pressed }) => [staticStyles.audioActionButton, pressed && staticStyles.buttonPressed]}>
          <Feather color={colors.danger} name="trash-2" size={18} />
        </Pressable>
      ) : null}
      <Pressable accessibilityLabel={status.playing ? 'Pausar audio' : 'Reproducir audio'} onPress={togglePlayback} style={({ pressed }) => [staticStyles.audioPlayButton, { backgroundColor: preview || !mine ? colors.primarySoft : 'rgba(255,255,255,0.18)' }, pressed && staticStyles.buttonPressed]}>
        <Feather color={foreground} name={status.playing ? 'pause' : 'play'} size={16} />
      </Pressable>
      <View style={staticStyles.audioProgressArea}>
        <AudioWaveform activeColor={activeColor} barCount={preview ? 38 : 30} inactiveColor={inactiveColor} onSeek={seek} progress={progress} samples={waveform} />
        <View style={staticStyles.audioMeta}>
          <Feather color={foreground} name="mic" size={11} />
          <AppText style={[staticStyles.audioDuration, { color: foreground }]} variant="caption">
            {formatDuration(status.currentTime * 1000)} / {formatDuration(duration)}
          </AppText>
        </View>
      </View>
      {onSend ? (
        <Pressable accessibilityLabel="Enviar nota de voz" onPress={onSend} style={({ pressed }) => [staticStyles.audioSendButton, { backgroundColor: colors.primaryDark }, pressed && staticStyles.audioSendPressed]}>
          <Feather color="#FFFFFF" name="arrow-up" size={19} />
        </Pressable>
      ) : null}
    </View>
  );
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
      <Animated.View accessibilityLabel="Enviado" entering={FadeIn.duration(120)} key={status} style={staticStyles.deliveryIcon}>
        <Ionicons color={colors.textMuted} name="checkmark" size={15} />
      </Animated.View>
    );
  }

  const checkColor = status === 'read' ? colors.primary : colors.textMuted;
  return (
    <Animated.View accessibilityLabel={status === 'read' ? 'Leído' : 'Entregado'} entering={reduceMotion ? FadeIn.duration(120) : ZoomIn.duration(160)} key={status} style={staticStyles.deliveryIcon}>
      <Ionicons color={checkColor} name="checkmark-done" size={16} />
    </Animated.View>
  );
}

const MessageBubble = memo(function MessageBubble({ colors, deleting, groupedWithNext, groupedWithPrevious, highlighted, isActionOpen, isReactionOpen, message, onDelete, onImagePress, onReaction, onReply, onReplyPress, onRetry, onToggleActions, onToggleReactions, ownBubbleBackground, showMeta }: MessageBubbleProps) {
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
    ? message.mine ? staticStyles.bubbleMineMiddle : staticStyles.bubbleOtherMiddle
    : groupedWithPrevious
      ? message.mine ? staticStyles.bubbleMineLast : staticStyles.bubbleOtherLast
      : groupedWithNext
        ? message.mine ? staticStyles.bubbleMineFirst : staticStyles.bubbleOtherFirst
        : null;
  const bubbleShape = [staticStyles.bubble, message.mine ? staticStyles.bubbleMine : staticStyles.bubbleOther, groupedBubbleStyle, { backgroundColor: bubbleBackground }];
  const imageBubbleShape = [
    staticStyles.standaloneImage,
    message.mine ? staticStyles.imageBubbleMine : staticStyles.imageBubbleOther,
    groupedBubbleStyle,
    { backgroundColor: colors.surfaceMuted },
  ];
  const isUploadingImage = Boolean(message.image && message.mine && message.deliveryStatus === 'sending');
  const replyQuoteContent = message.replyTo ? (
    <Pressable accessibilityLabel="Ir al mensaje original" onPress={() => onReplyPress(message.replyTo!.id)} style={[staticStyles.replyQuote, { borderLeftColor: message.mine ? 'rgba(255,255,255,0.72)' : colors.primary }]}>
      {message.replyTo.image ? <Image contentFit="cover" source={message.replyTo.image} style={staticStyles.replyQuoteImage} /> : null}
      {message.replyTo.audioDurationMs !== undefined ? (
        <View style={staticStyles.replyQuoteWaveform}>
          <AudioWaveform
            activeColor={message.mine ? 'rgba(255,255,255,0.78)' : colors.primaryDark}
            barCount={10}
            height={20}
            inactiveColor={message.mine ? 'rgba(255,255,255,0.3)' : colors.border}
            progress={1}
            samples={message.replyTo.audioWaveform ?? []}
          />
        </View>
      ) : null}
      <View style={staticStyles.replyQuoteCopy}>
        <AppText style={[staticStyles.replyQuoteAuthor, { color: message.mine ? '#FFFFFF' : colors.primaryDark }]} variant="caption">{message.replyTo.author}</AppText>
        <AppText numberOfLines={1} style={[staticStyles.replyQuoteText, { color: message.mine ? 'rgba(255,255,255,0.78)' : colors.textMuted }]} variant="caption">
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
      : withSequence(
        withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 350, easing: Easing.inOut(Easing.cubic) }),
      );
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
        replyIconScale.value = withSequence(
          withSpring(1.2, { damping: 12, mass: 0.45, stiffness: 360 }),
          withSpring(1, { damping: 15, mass: 0.5, stiffness: 300 }),
        );
        scheduleOnRN(selectionHaptic);
      }
    })
    .onEnd(() => {
      if (swipeArmed.value) scheduleOnRN(completeSwipeReply);
      swipeX.value = reduceMotion
        ? withTiming(0, { duration: 100 })
        : withSpring(0, { damping: 18, mass: 0.65, stiffness: 260 });
    })
    .onFinalize(() => {
      swipeX.value = reduceMotion
        ? withTiming(0, { duration: 100 })
        : withSpring(0, { damping: 18, mass: 0.65, stiffness: 260 });
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
  const swipeIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, swipeX.value / 28),
    transform: [{ translateX: -swipeX.value }, { scale: replyIconScale.value }],
  }));

  return (
    <Animated.View
      entering={entrance}
      layout={rowLayout}
      onLayout={(event) => {
        if (!deleting) measuredHeight.value = event.nativeEvent.layout.height;
      }}
      style={[staticStyles.messageRow, groupedWithPrevious ? staticStyles.messageRowGrouped : staticStyles.messageRowSeparated, message.mine && staticStyles.messageRowMine, deleting && staticStyles.messageRowDeleting, rowAnimatedStyle]}>
      <View style={[staticStyles.messageLine, message.mine && staticStyles.messageLineMine]}>
        {!message.mine ? <ReactionTrigger colors={colors} messageId={message.id} onPress={onToggleReactions} /> : null}
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[staticStyles.messageBlock, message.mine && staticStyles.messageBlockMine, swipeAnimatedStyle]}>
            <Animated.View pointerEvents="none" style={[staticStyles.swipeReplyIcon, swipeIconAnimatedStyle]}>
              <Feather color={colors.primaryDark} name="corner-up-left" size={17} />
            </Animated.View>
            <Pressable
              accessibilityHint="Mantén presionado para ver acciones o desliza a la derecha para responder"
              accessibilityLabel={message.text ?? (message.audioUri ? 'Nota de voz' : 'Imagen compartida')}
              delayLongPress={260}
              onLongPress={() => {
                longPressTriggered.current = true;
                onToggleActions(message.id);
              }}
              onPress={message.image ? () => {
                if (longPressTriggered.current) return;
                onImagePress(message.image!);
              } : undefined}
              onPressOut={() => setTimeout(() => { longPressTriggered.current = false; }, 0)}
              style={[staticStyles.messagePressable, message.mine && staticStyles.messagePressableMine]}>
          {message.image ? (
            <View style={imageBubbleShape}>
              <Image
                accessibilityLabel="Imagen compartida en el chat"
                blurRadius={isUploadingImage ? 2.5 : 0}
                contentFit="cover"
                recyclingKey={message.id}
                source={message.image}
                style={[staticStyles.messageImage, isUploadingImage && staticStyles.messageImageUploading]}
                transition={160}
              />
              {isUploadingImage ? (
                <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(160)} pointerEvents="none" style={staticStyles.imageUploadOverlay}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <AppText style={staticStyles.imageUploadLabel} variant="caption">Enviando…</AppText>
                  <View style={staticStyles.imageUploadTrack}>
                    <View style={[staticStyles.imageUploadProgress, { width: `${Math.round((message.uploadProgress ?? 0) * 100)}%` }]} />
                  </View>
                </Animated.View>
              ) : message.deliveryStatus === 'sent' ? (
                <Animated.View entering={reduceMotion ? FadeIn.duration(120) : ZoomIn.duration(180)} pointerEvents="none" style={staticStyles.imageUploadComplete}>
                  <Feather color="#FFFFFF" name="check" size={14} />
                </Animated.View>
              ) : (
                <View pointerEvents="none" style={staticStyles.imageHint}>
                  <Feather color="#FFFFFF" name="maximize-2" size={12} />
                </View>
              )}
            </View>
          ) : null}
          {message.audioUri ? (
            <View style={bubbleShape}>
              {replyQuoteContent}
              <AudioMessage colors={colors} durationMs={message.audioDurationMs ?? 0} mine={message.mine} uri={message.audioUri} waveform={message.audioWaveform ?? []} />
            </View>
          ) : null}
          {message.text || (message.replyTo && !message.audioUri) ? (
            <View style={bubbleShape}>
              {!message.audioUri ? replyQuoteContent : null}
              {message.text ? <AppText style={[staticStyles.messageText, { color: textColor }]}>{message.text}</AppText> : null}
            </View>
          ) : null}
            </Pressable>
          </Animated.View>
        </GestureDetector>
      </View>

      {isActionOpen ? (
        <Animated.View
          entering={reduceMotion ? FadeIn.duration(120) : FadeInDown.duration(180)}
          exiting={FadeOut.duration(100)}
          onTouchStart={(event) => event.stopPropagation()}
          style={[
            staticStyles.messageActions,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          ]}>
          <View style={staticStyles.actionButtons}>
            <Pressable accessibilityLabel="Responder al mensaje" onPress={() => onReply(message)} style={({ pressed }) => [staticStyles.messageActionButton, pressed && staticStyles.messageActionPressed]}>
              <Feather color={colors.text} name="corner-up-left" size={16} />
              <AppText style={staticStyles.messageActionLabel} variant="caption">Responder</AppText>
            </Pressable>
            <Pressable accessibilityLabel={message.mine ? 'Eliminar mensaje' : 'Eliminar para mí'} onPress={() => onDelete(message)} style={({ pressed }) => [staticStyles.messageActionButton, pressed && staticStyles.messageActionPressed]}>
              <Feather color={colors.danger} name="trash-2" size={16} />
              <AppText numberOfLines={1} style={[staticStyles.messageActionLabel, { color: colors.danger }]} variant="caption">
                {message.mine ? 'Eliminar mensaje' : 'Eliminar para mí'}
              </AppText>
            </Pressable>
          </View>
        </Animated.View>
      ) : null}

      {isReactionOpen ? (
        <Animated.View entering={reduceMotion ? FadeIn.duration(120) : FadeInDown.duration(160)} exiting={FadeOut.duration(90)} onTouchStart={(event) => event.stopPropagation()} style={[staticStyles.reactionPicker, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          {reactionOptions.map((emoji) => (
            <Pressable accessibilityLabel={`Reaccionar con ${emoji}`} key={emoji} onPress={() => onReaction(message.id, emoji)} style={({ pressed }) => [staticStyles.reactionOption, pressed && staticStyles.reactionOptionPressed]}>
              <AppText style={staticStyles.reactionEmoji}>{emoji}</AppText>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}

      {message.reactions?.length ? (
        <View style={[staticStyles.messageReactions, message.mine && staticStyles.messageReactionsMine]}>
          {message.reactions.map((reaction) => (
            <ReactionChip colors={colors} key={reaction.emoji} messageId={message.id} onReaction={onReaction} reaction={reaction} />
          ))}
        </View>
      ) : null}

      {showMeta ? (
        <View style={[staticStyles.messageMeta, message.mine && staticStyles.messageMetaMine]}>
          <AppText style={[staticStyles.messageTime, { color: colors.textMuted }]} variant="caption">{message.time}</AppText>
          {message.mine ? <DeliveryIndicator colors={colors} message={message} onRetry={onRetry} /> : null}
        </View>
      ) : null}
    </Animated.View>
  );
});

function ReactionTrigger({ colors, messageId, onPress }: { colors: ThemeColors; messageId: string; onPress: (id: string) => void }) {
  return (
    <Pressable accessibilityLabel="Reaccionar al mensaje" hitSlop={8} onPress={() => onPress(messageId)} style={({ pressed }) => [staticStyles.reactionTrigger, pressed && staticStyles.reactionTriggerPressed]}>
      <Feather color={colors.textMuted} name="smile" size={14} />
    </Pressable>
  );
}

function ReactionChip({ colors, messageId, onReaction, reaction }: { colors: ThemeColors; messageId: string; onReaction: (messageId: string, emoji: string) => void; reaction: Reaction }) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 0.8);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      return;
    }
    scale.value = 0.8;
    scale.value = withSequence(
      withTiming(1.15, { duration: 90, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 15, mass: 0.45, stiffness: 320 }),
    );
  }, [reaction.count, reaction.mine, reduceMotion, scale]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={popStyle}>
      <Pressable
        accessibilityLabel={`${reaction.count} reacciones ${reaction.emoji}`}
        onPress={() => onReaction(messageId, reaction.emoji)}
        style={[staticStyles.reactionCount, { backgroundColor: colors.surfaceElevated, borderColor: reaction.mine ? colors.primary : colors.border }]}>
        <AppText style={staticStyles.reactionCountText}>{reaction.emoji} {reaction.count}</AppText>
      </Pressable>
    </Animated.View>
  );
}

function ImageViewer({ image, onClose }: { image: number | string | null; onClose: () => void }) {
  const { height, width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const imageEntrance = reduceMotion
    ? FadeIn.duration(150)
    : ZoomIn.duration(240)
      .easing(Easing.bezier(0.23, 1, 0.32, 1))
      .withInitialValues({ transform: [{ scale: 0.94 }] });

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={image !== null}>
      <View style={staticStyles.viewer}>
        {image !== null ? (
          <Animated.View entering={imageEntrance} style={{ height, width }}>
            <Image
              accessibilityLabel="Imagen ampliada"
              contentFit="contain"
              source={image}
              style={{ height, width }}
              transition={{ duration: 180, effect: 'cross-dissolve', timing: 'ease-out' }}
            />
          </Animated.View>
        ) : null}
        <Animated.View entering={FadeIn.delay(reduceMotion ? 0 : 100).duration(140)} style={staticStyles.viewerCloseContainer}>
          <Pressable accessibilityLabel="Cerrar imagen" onPress={onClose} style={({ pressed }) => [staticStyles.viewerClose, pressed && staticStyles.viewerClosePressed]}>
            <Feather color="#FFFFFF" name="x" size={22} />
          </Pressable>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(reduceMotion ? 0 : 120).duration(140)} pointerEvents="none" style={staticStyles.viewerCaption}>
          <AppText style={staticStyles.viewerCaptionText} variant="caption">Toca × para volver al chat</AppText>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function ChatScreen({ conversationId }: { conversationId?: string } = {}) {
  const { colors: themeColors, isDark } = useAppAppearance();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const listRef = useRef<FlatList<Message>>(null);
  const inputRef = useRef<TextInput>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deliveryTimers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const shouldScrollToEnd = useRef(true);
  const recorderMetering = useRef<number | undefined>(undefined);
  const audioRecorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: 'document', isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(audioRecorder, 100);
  const [query, setQuery] = useState('');
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all');
  const [testNotificationPending, setTestNotificationPending] = useState(false);
  const [draft, setDraft] = useState('');
  const [pendingImage, setPendingImage] = useState<{ aspectRatio: number; uri: string } | null>(null);
  const [audioDraft, setAudioDraft] = useState<AudioDraft | null>(null);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>(null);
  const [recordingWaveform, setRecordingWaveform] = useState<number[]>([]);
  const [messages, setMessages] = useState(initialMessages);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [keyboardTop, setKeyboardTop] = useState<number | null>(null);
  const [typing, setTyping] = useState(false);
  const [actionTarget, setActionTarget] = useState<string | null>(null);
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [viewerImage, setViewerImage] = useState<number | string | null>(null);
  const selected = useMemo(
    () => conversations.find((conversation) => conversation.id === conversationId) ?? null,
    [conversationId],
  );

  useEffect(() => () => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    deliveryTimers.current.forEach(clearTimeout);
    deliveryTimers.current.clear();
  }, []);

  useEffect(() => {
    recorderMetering.current = recorderState.metering;
  }, [recorderState.metering]);

  useEffect(() => {
    if (recordingMode !== 'recording') return;
    const meterInterval = setInterval(() => {
      const metering = recorderMetering.current;
      if (typeof metering === 'number') setRecordingWaveform((current) => [...current, normalizeMetering(metering)]);
    }, 100);
    return () => clearInterval(meterInterval);
  }, [recordingMode]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, (event) => setKeyboardTop(event.endCoordinates.screenY));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardTop(null));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const keyboardOverlap = Platform.OS === 'android' && keyboardTop !== null
    ? Math.max(0, windowHeight - keyboardTop)
    : 0;

  const visibleConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es');
    return conversations.filter((conversation) => {
      const matchesCategory = inboxFilter === 'all'
        || (inboxFilter === 'unread' && Boolean(conversation.unread))
        || (inboxFilter === 'groups' && conversation.kind === 'group')
        || (inboxFilter === 'friends' && conversation.kind === 'friend');
      const matchesQuery = !normalizedQuery
        || `${conversation.name} ${conversation.lastMessage}`.toLocaleLowerCase('es').includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [inboxFilter, query]);

  const scheduleTestNotification = useCallback(async () => {
    if (testNotificationPending) return;
    setTestNotificationPending(true);
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('tests', {
          importance: Notifications.AndroidImportance.HIGH,
          name: 'Notificaciones de prueba',
          sound: 'default',
          vibrationPattern: [0, 180, 120, 180],
        });
      }

      let permission = await Notifications.getPermissionsAsync();
      if (!notificationPermissionGranted(permission)) {
        permission = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: true, allowSound: true } });
      }
      if (!notificationPermissionGranted(permission)) {
        Alert.alert('Notificaciones desactivadas', 'Actívalas en los ajustes del celular para recibir la prueba.');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          body: 'Las notificaciones están funcionando correctamente en este dispositivo.',
          data: { source: 'chat-test' },
          sound: 'default',
          title: 'Notificación de prueba',
        },
        trigger: {
          channelId: Platform.OS === 'android' ? 'tests' : undefined,
          repeats: false,
          seconds: 3,
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        },
      });
      impactHaptic();
      Alert.alert('Prueba programada', 'Recibirás una notificación en aproximadamente 3 segundos.');
    } catch {
      Alert.alert('No se pudo programar', 'Revisa los permisos de notificaciones e inténtalo nuevamente.');
    } finally {
      setTestNotificationPending(false);
    }
  }, [testNotificationPending]);

  const simulateReply = useCallback(() => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setTyping(true);
    replyTimer.current = setTimeout(() => {
      setTyping(false);
      shouldScrollToEnd.current = true;
      setMessages((current) => [...current, { id: `reply-${Date.now()}`, mine: false, text: '¡Perfecto! Te leo 🙌', time: 'Ahora' }]);
      replyTimer.current = null;
    }, 1400);
  }, []);

  const updateMessageDelivery = useCallback((messageId: string, patch: Pick<Message, 'deliveryStatus' | 'uploadProgress'>) => {
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, ...patch } : message));
  }, []);

  const scheduleDeliveryLifecycle = useCallback((messageId: string, includesImage: boolean) => {
    const schedule = (delay: number, patch: Pick<Message, 'deliveryStatus' | 'uploadProgress'>) => {
      const timer = setTimeout(() => {
        deliveryTimers.current.delete(timer);
        updateMessageDelivery(messageId, patch);
      }, delay);
      deliveryTimers.current.add(timer);
    };

    if (includesImage) {
      schedule(180, { deliveryStatus: 'sending', uploadProgress: 0.28 });
      schedule(420, { deliveryStatus: 'sending', uploadProgress: 0.56 });
      schedule(700, { deliveryStatus: 'sending', uploadProgress: 0.82 });
      schedule(980, { deliveryStatus: 'sent', uploadProgress: 1 });
      schedule(1480, { deliveryStatus: 'delivered', uploadProgress: 1 });
      schedule(2280, { deliveryStatus: 'read', uploadProgress: 1 });
      return;
    }

    schedule(260, { deliveryStatus: 'sent' });
    schedule(720, { deliveryStatus: 'delivered' });
    schedule(1380, { deliveryStatus: 'read' });
  }, [updateMessageDelivery]);

  const sendMessage = useCallback(() => {
    const text = draft.trim();
    if (!text && !pendingImage) return;
    const messageId = `local-${Date.now()}`;
    impactHaptic();
    shouldScrollToEnd.current = true;
    setMessages((current) => [...current, {
      aspectRatio: pendingImage?.aspectRatio,
      deliveryStatus: 'sending',
      id: messageId,
      image: pendingImage?.uri,
      mine: true,
      replyTo: replyingTo ? {
        audioDurationMs: replyingTo.audioDurationMs,
        audioWaveform: replyingTo.audioWaveform,
        author: replyingTo.mine ? 'Tú' : selected?.name ?? 'Mensaje',
        id: replyingTo.id,
        image: replyingTo.image,
        text: replyLabel(replyingTo),
      } : undefined,
      text: text || undefined,
      time: 'Ahora',
      uploadProgress: pendingImage ? 0.08 : undefined,
    }]);
    scheduleDeliveryLifecycle(messageId, Boolean(pendingImage));
    setDraft('');
    setPendingImage(null);
    setReplyingTo(null);
    setShowEmojiPicker(false);
    simulateReply();
  }, [draft, pendingImage, replyingTo, scheduleDeliveryLifecycle, selected?.name, simulateReply]);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, mediaTypes: ['images'], quality: 0.82, selectionLimit: 1 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setShowEmojiPicker(false);
    setPendingImage({
      aspectRatio: asset.width && asset.height ? asset.width / asset.height : 4 / 3,
      uri: asset.uri,
    });
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const toggleActions = useCallback((messageId: string) => {
    setReactionTarget(null);
    setActionTarget((current) => current === messageId ? null : messageId);
  }, []);

  const toggleReactions = useCallback((messageId: string) => {
    setActionTarget(null);
    setReactionTarget((current) => current === messageId ? null : messageId);
  }, []);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    selectionHaptic();
    setMessages((current) => current.map((message) => {
      if (message.id !== messageId) return message;
      const existing = message.reactions?.find((reaction) => reaction.emoji === emoji);
      const otherReactions = message.reactions?.filter((reaction) => reaction.emoji !== emoji) ?? [];
      if (existing?.mine) {
        return { ...message, reactions: existing.count > 1 ? [...otherReactions, { ...existing, count: existing.count - 1, mine: false }] : otherReactions };
      }
      return { ...message, reactions: [...otherReactions, { count: (existing?.count ?? 0) + 1, emoji, mine: true }] };
    }));
    setReactionTarget(null);
  }, []);

  const replyToMessage = useCallback((message: Message) => {
    selectionHaptic();
    setActionTarget(null);
    setReactionTarget(null);
    setReplyingTo(message);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const deleteMessage = useCallback((message: Message) => {
    if (deleteTimer.current || deletingMessageId) return;
    setActionTarget(null);
    setReactionTarget(null);
    setReplyingTo((current) => current?.id === message.id ? null : current);
    setDeletingMessageId(message.id);
    deleteTimer.current = setTimeout(() => {
      setMessages((current) => current.filter((item) => item.id !== message.id));
      setDeletingMessageId(null);
      deleteTimer.current = null;
    }, reduceMotion ? 110 : 190);
  }, [deletingMessageId, reduceMotion]);

  const retryMessage = useCallback((message: Message) => {
    updateMessageDelivery(message.id, { deliveryStatus: 'sending', uploadProgress: message.image ? 0.08 : undefined });
    scheduleDeliveryLifecycle(message.id, Boolean(message.image));
  }, [scheduleDeliveryLifecycle, updateMessageDelivery]);

  const scrollToOriginalMessage = useCallback((messageId: string) => {
    const index = messages.findIndex((message) => message.id === messageId);
    if (index < 0) return;
    setActionTarget(null);
    setReactionTarget(null);
    shouldScrollToEnd.current = false;
    listRef.current?.scrollToIndex({ animated: !reduceMotion, index, viewPosition: 0.5 });
    setHighlightedMessageId(messageId);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => {
      setHighlightedMessageId(null);
      highlightTimer.current = null;
    }, reduceMotion ? 300 : 620);
  }, [messages, reduceMotion]);

  const dismissMessageMenus = useCallback(() => {
    setActionTarget(null);
    setReactionTarget(null);
  }, []);

  const insertEmoji = useCallback((emoji: string) => {
    setDraft((current) => `${current}${emoji}`);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso de micrófono', 'Activa el micrófono para enviar notas de voz.');
        return;
      }

      setShowEmojiPicker(false);
      Keyboard.dismiss();
      setRecordingWaveform([]);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setRecordingMode('recording');
      impactHaptic();
    } catch {
      setRecordingMode(null);
      await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
      Alert.alert('No pudimos grabar', 'Intenta nuevamente en unos segundos.');
    }
  }, [audioRecorder]);

  const toggleRecordingPause = useCallback(() => {
    if (recordingMode === 'recording') {
      audioRecorder.pause();
      setRecordingMode('paused');
    } else if (recordingMode === 'paused') {
      audioRecorder.record();
      setRecordingMode('recording');
    }
    selectionHaptic();
  }, [audioRecorder, recordingMode]);

  const cancelRecording = useCallback(async () => {
    try {
      if (recorderState.canRecord) await audioRecorder.stop();
      const discardedUri = audioRecorder.uri;
      if (discardedUri) deleteLocalAudio(discardedUri);
    } finally {
      setRecordingMode(null);
      setRecordingWaveform([]);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    }
  }, [audioRecorder, recorderState.canRecord]);

  const finishRecording = useCallback(async () => {
    try {
      const durationMs = recorderState.durationMillis;
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      setRecordingMode(null);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (!uri || durationMs < 250) {
        if (uri) deleteLocalAudio(uri);
        setRecordingWaveform([]);
        return;
      }
      setAudioDraft({ durationMs, uri, waveform: recordingWaveform.length ? recordingWaveform : [0.12] });
      setRecordingWaveform([]);
      impactHaptic();
    } catch {
      setRecordingMode(null);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
      Alert.alert('No pudimos guardar el audio', 'Intenta grabarlo nuevamente.');
    }
  }, [audioRecorder, recorderState.durationMillis, recordingWaveform]);

  const deleteAudioDraft = useCallback(() => {
    if (!audioDraft) return;
    const discardedUri = audioDraft.uri;
    setAudioDraft(null);
    setTimeout(() => deleteLocalAudio(discardedUri), 0);
  }, [audioDraft]);

  const sendAudioDraft = useCallback(() => {
    if (!audioDraft) return;
    const messageId = `audio-${Date.now()}`;
    impactHaptic();
    shouldScrollToEnd.current = true;
    setMessages((current) => [...current, {
      audioDurationMs: audioDraft.durationMs,
      audioUri: audioDraft.uri,
      audioWaveform: audioDraft.waveform,
      deliveryStatus: 'sending',
      id: messageId,
      mine: true,
      replyTo: replyingTo ? {
        audioDurationMs: replyingTo.audioDurationMs,
        audioWaveform: replyingTo.audioWaveform,
        author: replyingTo.mine ? 'Tú' : selected?.name ?? 'Mensaje',
        id: replyingTo.id,
        image: replyingTo.image,
        text: replyLabel(replyingTo),
      } : undefined,
      time: 'Ahora',
    }]);
    scheduleDeliveryLifecycle(messageId, false);
    setAudioDraft(null);
    setReplyingTo(null);
    simulateReply();
  }, [audioDraft, replyingTo, scheduleDeliveryLifecycle, selected?.name, simulateReply]);

  const ownBubbleBackground = isDark ? '#248A3D' : themeColors.primaryDark;

  if (selected) {
    return (
      <Screen swipeTabs={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
          onTouchStart={dismissMessageMenus}
          style={styles.conversationScreen}>
          <View style={[styles.conversationHeader, { borderBottomColor: themeColors.border }]}>
            <Pressable accessibilityLabel="Volver a conversaciones" hitSlop={8} onPress={() => router.back()} style={({ pressed }) => [styles.headerButton, pressed && styles.buttonPressed]}>
              <Feather color={themeColors.text} name="chevron-left" size={23} />
            </Pressable>
            <View style={styles.personHeading}>
              <View style={[styles.smallAvatar, { backgroundColor: selected.accent }]}>
                <AppText style={styles.smallInitials} variant="caption">{selected.initials}</AppText>
                {selected.online ? <View style={[styles.onlineDot, { borderColor: themeColors.surface }]} /> : null}
              </View>
              <View style={styles.personCopy}>
                <AppText numberOfLines={1} variant="bodyStrong">{selected.name}</AppText>
                <AppText style={[styles.onlineText, { color: themeColors.primaryDark }]} variant="caption">{typing ? 'Escribiendo…' : selected.online ? 'En línea' : 'Comunidad'}</AppText>
              </View>
            </View>
            <Pressable accessibilityLabel="Opciones de conversación" style={({ pressed }) => [styles.headerButton, pressed && styles.buttonPressed]}>
              <Feather color={themeColors.text} name="more-horizontal" size={21} />
            </Pressable>
          </View>

          <FlatList
            contentContainerStyle={styles.messages}
            data={messages}
            initialNumToRender={12}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            keyExtractor={(message) => message.id}
            ListHeaderComponent={<View style={[styles.dayPill, { backgroundColor: themeColors.surfaceMuted }]}><AppText style={styles.dayPillText} variant="caption">HOY</AppText></View>}
            ListFooterComponent={typing ? <TypingIndicator colors={themeColors} /> : null}
            onContentSizeChange={() => {
              if (!shouldScrollToEnd.current) return;
              listRef.current?.scrollToEnd({ animated: !reduceMotion });
              shouldScrollToEnd.current = false;
            }}
            onScrollToIndexFailed={({ averageItemLength, index }) => {
              listRef.current?.scrollToOffset({ animated: !reduceMotion, offset: Math.max(0, averageItemLength * index) });
            }}
            ref={listRef}
            renderItem={({ index, item }) => {
              const groupedWithPrevious = index > 0 && messages[index - 1]?.mine === item.mine;
              const groupedWithNext = index < messages.length - 1 && messages[index + 1]?.mine === item.mine;
              return (
                <MessageBubble
                  colors={themeColors}
                  deleting={deletingMessageId === item.id}
                  groupedWithNext={groupedWithNext}
                  groupedWithPrevious={groupedWithPrevious}
                  highlighted={highlightedMessageId === item.id}
                  isActionOpen={actionTarget === item.id}
                  isReactionOpen={reactionTarget === item.id}
                  message={item}
                  onDelete={deleteMessage}
                  onImagePress={setViewerImage}
                  onReaction={addReaction}
                  onReply={replyToMessage}
                  onReplyPress={scrollToOriginalMessage}
                  onRetry={retryMessage}
                  onToggleActions={toggleActions}
                  onToggleReactions={toggleReactions}
                  ownBubbleBackground={ownBubbleBackground}
                  showMeta={!groupedWithNext}
                />
              );
            }}
            showsVerticalScrollIndicator={false}
          />

          <View style={[styles.composerArea, { marginBottom: keyboardOverlap, paddingBottom: keyboardTop !== null ? spacing.xs : Math.max(insets.bottom, spacing.sm) }]}>
            {replyingTo ? (
              <Animated.View entering={FadeInDown.duration(160)} exiting={FadeOut.duration(100)} style={[styles.replyComposer, { backgroundColor: themeColors.surfaceMuted }]}>
                <View style={[styles.replyComposerBar, { backgroundColor: themeColors.primary }]} />
                <View style={[styles.replyComposerIcon, { backgroundColor: themeColors.primarySoft }]}>
                  <Feather color={themeColors.primaryDark} name="corner-up-left" size={15} />
                </View>
                {replyingTo.image ? <Image contentFit="cover" source={replyingTo.image} style={styles.replyComposerImage} /> : null}
                {replyingTo.audioUri ? (
                  <View style={styles.replyComposerWaveform}>
                    <AudioWaveform activeColor={themeColors.primaryDark} barCount={10} height={20} inactiveColor={themeColors.border} progress={1} samples={replyingTo.audioWaveform ?? []} />
                  </View>
                ) : null}
                <View style={styles.replyComposerCopy}>
                  <AppText style={[styles.replyComposerTitle, { color: themeColors.primaryDark }]} variant="caption">
                    Respondiendo a {replyingTo.mine ? 'tu mensaje' : selected.name}
                  </AppText>
                  {!replyingTo.image ? <AppText numberOfLines={1} style={{ color: themeColors.textMuted }} variant="caption">{replyLabel(replyingTo)}</AppText> : null}
                </View>
                <Pressable accessibilityLabel="Cancelar respuesta" hitSlop={8} onPress={() => setReplyingTo(null)} style={({ pressed }) => [styles.cancelReplyButton, pressed && styles.buttonPressed]}>
                  <Feather color={themeColors.textMuted} name="x" size={18} />
                </Pressable>
              </Animated.View>
            ) : null}
            {showEmojiPicker ? (
              <Animated.View entering={FadeInDown.duration(160)} exiting={FadeOut.duration(100)} style={[styles.emojiPicker, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
                <View style={styles.emojiPickerHeader}>
                  <AppText variant="bodyStrong">Emojis</AppText>
                  <Pressable accessibilityLabel="Cerrar emojis" hitSlop={8} onPress={() => setShowEmojiPicker(false)} style={styles.emojiCloseButton}>
                    <Feather color={themeColors.textMuted} name="x" size={17} />
                  </Pressable>
                </View>
                <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled showsVerticalScrollIndicator={false} style={styles.emojiScroll}>
                  {emojiCategories.map((category) => (
                    <View key={category.label} style={styles.emojiSection}>
                      <AppText style={[styles.emojiSectionLabel, { color: themeColors.textMuted }]} variant="caption">{category.label}</AppText>
                      <View style={styles.emojiGrid}>
                        {category.emojis.map((emoji) => (
                          <Pressable accessibilityLabel={`Insertar ${emoji}`} key={emoji} onPress={() => insertEmoji(emoji)} style={({ pressed }) => [styles.composerEmoji, pressed && styles.composerEmojiPressed]}>
                            <AppText style={styles.composerEmojiText}>{emoji}</AppText>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </Animated.View>
            ) : null}
            {pendingImage && !recordingMode && !audioDraft ? (
              <Animated.View entering={FadeInDown.duration(160)} exiting={FadeOut.duration(100)} style={styles.pendingAttachment}>
                <Image contentFit="cover" source={pendingImage.uri} style={styles.pendingAttachmentImage} transition={120} />
                <Pressable accessibilityLabel="Quitar imagen adjunta" hitSlop={6} onPress={() => setPendingImage(null)} style={({ pressed }) => [styles.pendingAttachmentRemove, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }, pressed && styles.buttonPressed]}>
                  <Feather color={themeColors.text} name="x" size={12} />
                </Pressable>
              </Animated.View>
            ) : null}
            {recordingMode ? (
              <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)} layout={reduceMotion ? undefined : LinearTransition.duration(160)} style={[styles.recordingComposer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <Pressable accessibilityLabel="Cancelar grabación" onPress={cancelRecording} style={({ pressed }) => [styles.recordingControl, pressed && styles.buttonPressed]}>
                  <Feather color={themeColors.danger} name="trash-2" size={18} />
                </Pressable>
                <Pressable accessibilityLabel={recordingMode === 'recording' ? 'Pausar grabación' : 'Reanudar grabación'} onPress={toggleRecordingPause} style={({ pressed }) => [styles.recordingControl, { backgroundColor: themeColors.primarySoft }, pressed && styles.buttonPressed]}>
                  <Feather color={themeColors.primaryDark} name={recordingMode === 'recording' ? 'pause' : 'play'} size={17} />
                </Pressable>
                <View accessibilityLiveRegion="polite" style={styles.recordingBody}>
                  <AudioWaveform activeColor={recordingMode === 'recording' ? themeColors.danger : themeColors.primaryDark} barCount={26} inactiveColor={themeColors.border} progress={1} samples={recordingWaveform} />
                  <View style={styles.recordingMeta}>
                    <Animated.View key={recordingMode} entering={FadeIn.duration(120)} style={[styles.recordingDot, { backgroundColor: recordingMode === 'recording' ? themeColors.danger : themeColors.textMuted }]} />
                    <AppText style={[styles.recordingTime, { color: recordingMode === 'recording' ? themeColors.danger : themeColors.textMuted }]} variant="caption">
                      {recordingMode === 'recording' ? 'Grabando' : 'En pausa'} · {formatDuration(recorderState.durationMillis)}
                    </AppText>
                  </View>
                </View>
                <Pressable accessibilityLabel="Finalizar grabación" onPress={finishRecording} style={({ pressed }) => [styles.finishRecordingButton, { backgroundColor: ownBubbleBackground }, pressed && styles.sendButtonPressed]}>
                  <Feather color="#FFFFFF" name="check" size={19} />
                </Pressable>
              </Animated.View>
            ) : audioDraft ? (
              <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(100)} layout={reduceMotion ? undefined : LinearTransition.duration(160)} style={[styles.audioPreviewComposer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <AudioMessage colors={themeColors} durationMs={audioDraft.durationMs} mine={false} onDelete={deleteAudioDraft} onSend={sendAudioDraft} preview uri={audioDraft.uri} waveform={audioDraft.waveform} />
              </Animated.View>
            ) : (
              <View style={[styles.composer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <Pressable accessibilityLabel="Adjuntar imagen" hitSlop={4} onPress={pickImage} style={({ pressed }) => [styles.composerButton, pressed && styles.buttonPressed]}>
                  <Feather color={themeColors.textMuted} name="image" size={19} />
                </Pressable>
                <Pressable accessibilityLabel="Agregar emoji" hitSlop={4} onPress={() => setShowEmojiPicker((current) => !current)} style={({ pressed }) => [styles.composerButton, showEmojiPicker && { backgroundColor: themeColors.primarySoft }, pressed && styles.buttonPressed]}>
                  <Feather color={showEmojiPicker ? themeColors.primaryDark : themeColors.textMuted} name="smile" size={19} />
                </Pressable>
                <Pressable accessibilityLabel="Grabar audio" disabled={Boolean(draft.trim() || pendingImage)} hitSlop={4} onPress={startRecording} style={({ pressed }) => [styles.composerButton, Boolean(draft.trim() || pendingImage) && styles.composerButtonDisabled, pressed && styles.buttonPressed]}>
                  <Feather color={themeColors.textMuted} name="mic" size={19} />
                </Pressable>
                <TextInput
                  accessibilityLabel="Mensaje"
                  blurOnSubmit={false}
                  multiline
                  onChangeText={setDraft}
                  onSubmitEditing={sendMessage}
                  placeholder="Escribe un mensaje"
                  placeholderTextColor={themeColors.textMuted}
                  ref={inputRef}
                  returnKeyType="send"
                  style={[styles.input, { color: themeColors.text }]}
                  value={draft}
                />
                <Animated.View layout={LinearTransition.duration(140)}>
                  <Pressable
                    accessibilityLabel={pendingImage && !draft.trim() ? 'Enviar imagen' : 'Enviar mensaje'}
                    disabled={!draft.trim() && !pendingImage}
                    onPress={sendMessage}
                    style={({ pressed }) => [styles.sendButton, { backgroundColor: ownBubbleBackground }, (!draft.trim() && !pendingImage) && styles.sendButtonDisabled, pressed && (draft.trim() || pendingImage) && styles.sendButtonPressed]}>
                    <Feather color="#FFFFFF" name="arrow-up" size={19} />
                  </Pressable>
                </Animated.View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
        <ImageViewer image={viewerImage} onClose={() => setViewerImage(null)} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.inboxHeader}>
        <View><AppText variant="eyebrow">Tu comunidad</AppText><AppText style={styles.title} variant="heading">Chat</AppText></View>
        <View style={styles.inboxHeaderActions}>
          <Pressable accessibilityLabel="Enviar notificación de prueba" disabled={testNotificationPending} onPress={scheduleTestNotification} style={({ pressed }) => [styles.newButton, { backgroundColor: themeColors.surfaceMuted }, pressed && styles.buttonPressed]}>
            {testNotificationPending ? <ActivityIndicator color={themeColors.primaryDark} size="small" /> : <Feather color={themeColors.primaryDark} name="bell" size={17} />}
          </Pressable>
          <Pressable accessibilityLabel="Nuevo mensaje" style={({ pressed }) => [styles.newButton, { backgroundColor: themeColors.primarySoft }, pressed && styles.buttonPressed]}>
            <Feather color={themeColors.primaryDark} name="edit-2" size={18} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.search, { backgroundColor: themeColors.surfaceMuted }]}>
        <Feather color={themeColors.textMuted} name="search" size={16} />
        <TextInput accessibilityLabel="Buscar conversaciones" onChangeText={setQuery} placeholder="Buscar conversaciones" placeholderTextColor={themeColors.textMuted} returnKeyType="search" style={[styles.searchInput, { color: themeColors.text }]} value={query} />
        {query ? <Pressable accessibilityLabel="Limpiar búsqueda" hitSlop={8} onPress={() => setQuery('')}><Feather color={themeColors.textMuted} name="x-circle" size={17} /></Pressable> : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.inboxFilters}
        horizontal
        keyboardShouldPersistTaps="handled"
        style={styles.inboxFiltersScroll}
        showsHorizontalScrollIndicator={false}>
        {inboxFilters.map((filter) => {
          const selectedFilter = inboxFilter === filter.id;
          return (
            <Pressable
              accessibilityLabel={`Mostrar ${filter.label.toLocaleLowerCase('es')}`}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedFilter }}
              hitSlop={{ bottom: 6, top: 6 }}
              key={filter.id}
              onPress={() => {
                if (filter.id === inboxFilter) return;
                selectionHaptic();
                setInboxFilter(filter.id);
              }}
              style={({ pressed }) => [
                styles.inboxFilter,
                { backgroundColor: selectedFilter ? themeColors.primarySoft : 'transparent', borderColor: selectedFilter ? themeColors.primary : themeColors.border },
                pressed && styles.inboxFilterPressed,
              ]}>
              <AppText style={[styles.inboxFilterLabel, { color: selectedFilter ? themeColors.primaryDark : themeColors.textMuted }]} variant="caption">{filter.label}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        contentContainerStyle={styles.inbox}
        data={visibleConversations}
        initialNumToRender={10}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(conversation) => conversation.id}
        ListEmptyComponent={<View style={styles.empty}><Feather color={themeColors.textMuted} name="message-circle" size={28} /><AppText variant="bodyStrong">No hay conversaciones aquí</AppText><AppText style={{ color: themeColors.textMuted, textAlign: 'center' }} variant="caption">Prueba otra categoría o cambia la búsqueda.</AppText></View>}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 35).duration(200)}>
            <Pressable accessibilityLabel={`Conversación con ${item.name}`} onPress={() => router.push({ pathname: '/chat/[conversationId]', params: { conversationId: item.id } })} style={({ pressed }) => [styles.chatRow, pressed && styles.rowPressed]}>
              <View style={[styles.avatar, { backgroundColor: item.accent }]}>
                <AppText style={styles.initials} variant="caption">{item.initials}</AppText>
                {item.online ? <View style={[styles.onlineDot, { borderColor: themeColors.surface }]} /> : null}
              </View>
              <View style={[styles.chatCopy, { borderBottomColor: themeColors.border }]}>
                <View style={styles.chatTopLine}><AppText numberOfLines={1} style={styles.chatName} variant="bodyStrong">{item.name}</AppText><AppText style={[styles.chatTime, { color: themeColors.textMuted }]} variant="caption">{item.time}</AppText></View>
                <View style={styles.chatBottomLine}>
                  <AppText numberOfLines={1} style={[styles.preview, { color: item.unread ? themeColors.text : themeColors.textMuted }, Boolean(item.unread) && styles.previewUnread]} variant="caption">{item.lastMessage}</AppText>
                  {item.unread ? <View style={[styles.unread, { backgroundColor: ownBubbleBackground }]}><AppText style={styles.unreadText} variant="caption">{item.unread}</AppText></View> : null}
                </View>
              </View>
            </Pressable>
          </Animated.View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const staticStyles = StyleSheet.create({
  buttonPressed: { opacity: 0.55 },
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
  audioMessage: { alignItems: 'center', flexDirection: 'row', gap: 7, minWidth: 232, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  audioPreview: { minWidth: 0, paddingHorizontal: 0, paddingVertical: 0, width: '100%' },
  audioActionButton: { alignItems: 'center', borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 36 },
  audioPlayButton: { alignItems: 'center', borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 40 },
  audioSendButton: { alignItems: 'center', borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 40 },
  audioSendPressed: { transform: [{ scale: 0.94 }] },
  audioProgressArea: { flex: 1, gap: 3, minWidth: 100 },
  waveform: { alignItems: 'center', flexDirection: 'row', gap: 2, height: 32, overflow: 'hidden', position: 'relative', width: '100%' },
  waveformBar: { borderRadius: radii.pill, flex: 1, maxWidth: 4, minHeight: 5 },
  waveformPosition: { borderRadius: radii.pill, bottom: 1, position: 'absolute', top: 1, transform: [{ translateX: -1 }], width: 2 },
  audioMeta: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  audioDuration: { fontSize: 10, fontVariant: ['tabular-nums'], lineHeight: 12 },
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

const useStyles = makeThemedStyles((colors) => ({
  inboxHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  inboxHeaderActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  title: { letterSpacing: -0.6, marginTop: spacing.xs },
  newButton: { alignItems: 'center', borderCurve: 'continuous', borderRadius: radii.pill, height: 44, justifyContent: 'center', width: 44 },
  search: { alignItems: 'center', borderCurve: 'continuous', borderRadius: radii.pill, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, minHeight: 44, paddingHorizontal: spacing.md },
  searchInput: { color: colors.text, flex: 1, fontFamily: typography.body, fontSize: 14, paddingVertical: 0 },
  inboxFilters: { gap: 6, paddingRight: spacing.sm, paddingVertical: 6 },
  inboxFiltersScroll: { flexGrow: 0, marginTop: 6 },
  inboxFilter: { alignItems: 'center', borderCurve: 'continuous', borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 30, paddingHorizontal: 11 },
  inboxFilterPressed: { opacity: 0.62 },
  inboxFilterLabel: { fontFamily: typography.bodyMedium, fontSize: 11, lineHeight: 14 },
  inbox: { paddingBottom: 100, paddingTop: spacing.sm },
  chatRow: { alignItems: 'center', flexDirection: 'row', minHeight: 76, paddingVertical: spacing.sm },
  rowPressed: { backgroundColor: colors.surfaceMuted },
  buttonPressed: { opacity: 0.55 },
  avatar: { alignItems: 'center', borderCurve: 'continuous', borderRadius: radii.pill, height: 52, justifyContent: 'center', marginRight: spacing.md, position: 'relative', width: 52 },
  initials: { color: colors.text, fontFamily: typography.bodySemiBold },
  onlineDot: { backgroundColor: colors.primary, borderColor: colors.surface, borderRadius: radii.pill, borderWidth: 2, bottom: 0, height: 13, position: 'absolute', right: 0, width: 13 },
  chatCopy: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flex: 1, justifyContent: 'center', minHeight: 68 },
  chatTopLine: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  chatName: { flex: 1, fontSize: 15 },
  chatTime: { color: colors.textMuted, fontSize: 11, fontVariant: ['tabular-nums'] },
  chatBottomLine: { alignItems: 'center', flexDirection: 'row', marginTop: 3 },
  preview: { color: colors.textMuted, flex: 1 },
  previewUnread: { color: colors.text, fontFamily: typography.bodyMedium },
  unread: { alignItems: 'center', borderRadius: radii.pill, height: 20, justifyContent: 'center', marginLeft: spacing.sm, minWidth: 20, paddingHorizontal: 5 },
  unreadText: { color: '#FFFFFF', fontFamily: typography.bodySemiBold, fontSize: 10, fontVariant: ['tabular-nums'], lineHeight: 14 },
  empty: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingTop: spacing.hero },
  conversationScreen: { flex: 1 },
  conversationHeader: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 58, paddingBottom: spacing.sm },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 40 },
  personHeading: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.sm },
  personCopy: { flex: 1 },
  smallAvatar: { alignItems: 'center', borderCurve: 'continuous', borderRadius: radii.pill, height: 38, justifyContent: 'center', position: 'relative', width: 38 },
  smallInitials: { color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 10 },
  onlineText: { color: colors.primaryDark, fontSize: 10, lineHeight: 13 },
  messages: { paddingBottom: spacing.md, paddingTop: spacing.xs },
  dayPill: { alignSelf: 'center', borderRadius: radii.pill, marginBottom: spacing.sm, paddingHorizontal: 9, paddingVertical: 3 },
  dayPillText: { fontFamily: typography.bodySemiBold, fontSize: 9, letterSpacing: 0.8, lineHeight: 13 },
  composerArea: { paddingTop: spacing.xs },
  replyComposer: { alignItems: 'center', borderCurve: 'continuous', borderRadius: radii.sm, flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs, minHeight: 48, overflow: 'hidden', paddingRight: spacing.xs },
  replyComposerBar: { alignSelf: 'stretch', width: 3 },
  replyComposerIcon: { alignItems: 'center', borderRadius: radii.pill, height: 30, justifyContent: 'center', width: 30 },
  replyComposerImage: { borderRadius: 6, height: 30, width: 30 },
  replyComposerWaveform: { height: 20, width: 48 },
  replyComposerCopy: { flex: 1, gap: 1, paddingVertical: spacing.sm },
  replyComposerTitle: { fontFamily: typography.bodySemiBold, fontSize: 11, lineHeight: 14 },
  cancelReplyButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  emojiPicker: { borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, marginBottom: spacing.xs, maxHeight: 236, overflow: 'hidden', padding: spacing.sm },
  emojiPickerHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 32, paddingLeft: spacing.xs },
  emojiCloseButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  emojiScroll: { maxHeight: 188 },
  emojiSection: { gap: spacing.xs, paddingBottom: spacing.sm },
  emojiSectionLabel: { fontFamily: typography.bodySemiBold, fontSize: 10, letterSpacing: 0.4, paddingHorizontal: spacing.xs, textTransform: 'uppercase' },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  composerEmoji: { alignItems: 'center', borderRadius: radii.pill, height: 44, justifyContent: 'center', width: '16.666%' },
  composerEmojiPressed: { backgroundColor: colors.surfaceMuted, transform: [{ scale: 0.94 }] },
  composerEmojiText: { fontSize: 20, lineHeight: 25 },
  pendingAttachment: { alignSelf: 'flex-start', marginBottom: spacing.xs, marginLeft: spacing.xs, position: 'relative' },
  pendingAttachmentImage: { borderCurve: 'continuous', borderRadius: 9, height: 48, width: 48 },
  pendingAttachmentRemove: { alignItems: 'center', borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth, height: 22, justifyContent: 'center', position: 'absolute', right: -7, top: -7, width: 22 },
  recordingComposer: { alignItems: 'center', borderCurve: 'continuous', borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 5, minHeight: 58, padding: 5 },
  recordingControl: { alignItems: 'center', borderRadius: radii.pill, height: 44, justifyContent: 'center', width: 40 },
  recordingBody: { flex: 1, gap: 1, minWidth: 96 },
  recordingMeta: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  finishRecordingButton: { alignItems: 'center', borderRadius: radii.pill, height: 42, justifyContent: 'center', width: 42 },
  audioPreviewComposer: { borderCurve: 'continuous', borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, minHeight: 62, padding: 5 },
  composer: { alignItems: 'flex-end', borderCurve: 'continuous', borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 4, padding: 5 },
  composerButton: { alignItems: 'center', borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 36 },
  composerButtonDisabled: { opacity: 0.32 },
  input: { color: colors.text, flex: 1, fontFamily: typography.body, fontSize: 15, lineHeight: 20, maxHeight: 104, minHeight: 40, paddingHorizontal: spacing.xs, paddingVertical: 9 },
  recordingDot: { borderRadius: radii.pill, height: 8, width: 8 },
  recordingTime: { fontFamily: typography.bodyMedium, fontSize: 12, fontVariant: ['tabular-nums'] },
  sendButton: { alignItems: 'center', borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 40 },
  sendButtonDisabled: { opacity: 0.28 },
  sendButtonPressed: { transform: [{ scale: 0.94 }] },
}));
