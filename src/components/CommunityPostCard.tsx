import Feather from '@/components/ui/AppIcon';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRecyclingState } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { memo, useEffect, useRef } from 'react';
import { Alert, Platform, Pressable, Share, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOutUp,
  LinearTransition,
  ZoomInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useAppAppearance } from '@/context/AppearanceContext';
import { usePosts } from '@/context/PostsContext';
import { PostComments } from '@/features/feed/components/PostComments';
import { PostMediaGrid } from '@/features/feed/components/PostMediaGrid';
import { PostPoll } from '@/features/feed/components/PostPoll';
import type { CommunityPost, CommunityPostCategory } from '@/types/community';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

import { AppText } from './ui/AppText';

type CommunityPostCardProps = {
  isNew?: boolean;
  post: CommunityPost;
};

const categoryStyle: Record<CommunityPostCategory, { background: string; border: string; color: string; icon: React.ComponentProps<typeof Feather>['name']; label: string; surface: string }> = {
  comunidad: { background: '#E3F6E9', border: '#D6EBDD', color: '#248A3D', icon: 'users', label: 'Comunidad', surface: '#FCFEFC' },
  evento: { background: '#E8F3FF', border: '#D8E7F5', color: '#3975A8', icon: 'calendar', label: 'Evento', surface: '#FCFDFF' },
  recomendación: { background: '#FFF1DB', border: '#F2DFC0', color: '#B06B19', icon: 'star', label: 'Recomendación', surface: '#FFFEFA' },
};

export const CommunityPostCard = memo(function CommunityPostCard({ isNew = false, post }: CommunityPostCardProps) {
  const { colors: themeColors, isDark } = useAppAppearance();
  const styles = useStyles();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { selectPollOption, toggleBookmark: togglePostBookmark, toggleLike: togglePostLike } = usePosts();
  const audioPlayerRef = useRef<import('expo-audio').AudioPlayer | null>(null);
  const visiblePostIdRef = useRef(post.id);
  visiblePostIdRef.current = post.id;
  const [isAudioPlaying, setIsAudioPlaying] = useRecyclingState(false, [post.id]);
  const likeScale = useSharedValue(1);
  const saveScale = useSharedValue(1);

  const animatedLikeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));
  const animatedSaveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }],
  }));

  const isBookmarked = post.isBookmarked ?? false;
  const isLiked = post.isLiked;
  const comments = post.comments;
  const selectedPollOption = post.selectedPollOptionId;
  const likeCount = post.likes;
  const postCategory = categoryStyle[post.category];
  const feedImageUri = post.imageVariants?.feed.uri ?? post.imageUri;
  const mediaImages = post.images?.length
    ? post.images
    : feedImageUri
      ? [{ id: `${post.id}-legacy-image`, uri: feedImageUri, variants: post.imageVariants }]
      : [];
  const postEntrance = isNew
    ? reduceMotion
      ? FadeIn.duration(180)
      : ZoomInDown.springify().damping(26).withInitialValues({ transform: [{ translateY: -24 }, { scale: 0.98 }] })
    : undefined;

  useEffect(() => () => {
    audioPlayerRef.current?.release();
    audioPlayerRef.current = null;
  }, [post.id]);

  function toggleLike() {
    void togglePostLike(post.id).catch((error) => {
      Alert.alert('No se pudo registrar tu voto', error instanceof Error ? error.message : 'Intenta nuevamente.');
    });
    likeScale.set(withTiming(0.94, { duration: 70 }, () => {
      likeScale.set(withTiming(1, { duration: 110 }));
    }));
  }

  function toggleBookmark() {
    void togglePostBookmark(post.id).catch((error) => {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Intenta nuevamente.');
    });
    saveScale.set(withTiming(0.94, { duration: 70 }, () => {
      saveScale.set(withTiming(1, { duration: 110 }));
    }));
  }

  function openComments() {
    router.push({ pathname: '/comments/[postId]', params: { postId: post.id } });
  }

  async function sharePost() {
    await Share.share({ message: [post.title, post.content, `— ${post.author}`].filter(Boolean).join('\n\n') });
  }

  async function toggleAudio() {
    try {
      if (audioPlayerRef.current) {
        if (isAudioPlaying) audioPlayerRef.current.pause();
        else audioPlayerRef.current.play();
        setIsAudioPlaying((current) => !current);
        return;
      }
      const audioPostId = post.id;
      const { createAudioPlayer } = await import('expo-audio');
      if (visiblePostIdRef.current !== audioPostId) return;
      audioPlayerRef.current = createAudioPlayer(post.audioUri ?? null);
      audioPlayerRef.current.play();
      setIsAudioPlaying(true);
    } catch {
      Alert.alert('Audio no disponible', 'Tu app instalada aún no incluye el módulo de audio. El resto del feed seguirá funcionando normalmente.');
    }
  }

  return (
    <Animated.View entering={postEntrance} layout={LinearTransition.duration(240)} style={[styles.post, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.authorRow}>
        <View style={[styles.avatar, { backgroundColor: themeColors.successSoft }]}>
          <AppText style={[styles.avatarText, { color: themeColors.text }]} variant="caption">{post.initials}</AppText>
        </View>
        <View style={styles.authorCopy}>
          <AppText style={styles.authorName} variant="bodyStrong">{post.author}</AppText>
          <View style={styles.metadata}>
            <Feather color={themeColors.textMuted} name="map-pin" size={10} />
            <AppText numberOfLines={1} style={[styles.locationLabel, { color: themeColors.textMuted }]} variant="caption">{post.location ?? 'Providencia'}</AppText>
            <View style={[styles.metadataDot, { backgroundColor: themeColors.textMuted }]} />
            <AppText style={[styles.timeLabel, { color: themeColors.textMuted }]} variant="caption">{post.timeLabel}</AppText>
          </View>
        </View>
        {(
          <View style={[styles.category, { backgroundColor: postCategory.background }]}>
            <AppText style={[styles.categoryText, { color: postCategory.color }]} variant="caption">{postCategory.label}</AppText>
          </View>
        )}
        <Pressable accessibilityLabel="Más opciones" accessibilityRole="button" hitSlop={10}>
          <Feather color={themeColors.textMuted} name="more-horizontal" size={17} />
        </Pressable>
      </View>

      {post.title ? <AppText style={[styles.postTitle]} variant="bodyStrong">{post.title}</AppText> : null}
      {post.content ? <AppText style={[styles.postContent, { color: themeColors.text }]}>{post.content}</AppText> : null}

      {mediaImages.length ? (
        <View style={[styles.media]}>
          <PostMediaGrid images={mediaImages} recyclingKey={post.id} />
          <View style={[styles.mediaLocation, { backgroundColor: isDark ? 'rgba(20,27,23,0.88)' : 'rgba(255,255,255,0.88)' }]}><Feather color={themeColors.text} name="map-pin" size={12} /><AppText numberOfLines={1} style={[styles.mediaLocationText, { color: themeColors.text }]} variant="caption">{post.location ?? 'Providencia'}</AppText></View>
        </View>
      ) : null}

      {post.poll ? <PostPoll onSelect={(optionId) => { void selectPollOption(post.id, optionId).catch((error) => { Alert.alert('No se pudo votar', error instanceof Error ? error.message : 'Intenta nuevamente.'); }); }} poll={post.poll} selectedOptionId={selectedPollOption} /> : null}

      {post.audioUri ? (
        <Pressable accessibilityRole="button" onPress={() => void toggleAudio()} style={({ pressed }) => [styles.audioPlayer, pressed && styles.pressed]}>
          <View style={styles.audioPlay}><Feather color={themeColors.textOnPrimary} name={isAudioPlaying ? 'pause' : 'play'} size={17} /></View>
          <View style={styles.audioInfo}>
            <AppText variant="bodyStrong">{post.audioName ?? 'Nota de voz'}</AppText>
            <View style={styles.waveform}>{[8, 14, 20, 11, 17, 8, 15, 22, 12, 18, 9, 14].map((height, index) => <View key={index} style={[styles.waveBar, { height }]} />)}</View>
          </View>
          <AppText variant="caption">Audio</AppText>
        </Pressable>
      ) : null}

      <View style={[styles.actions]}>
        <Pressable
          accessibilityLabel={isLiked ? 'Quitar voto positivo' : 'Dar voto positivo'}
          accessibilityRole="button"
          accessibilityState={{ selected: isLiked }}
          onPress={toggleLike}
          style={({ pressed }) => [styles.action, isLiked && styles.actionLiked, pressed && styles.pressed]}>
          <Animated.View style={[styles.actionIcon, animatedLikeStyle]}>
            <MaterialCommunityIcons color={isLiked ? themeColors.primaryDark : themeColors.textMuted} name={isLiked ? 'arrow-up-bold' : 'arrow-up-bold-outline'} size={22} />
          </Animated.View>
          <AppText style={[isLiked ? styles.actionLabelLiked : styles.actionLabel, { color: isLiked ? themeColors.primaryDark : themeColors.textMuted }]} variant="caption">
            {likeCount}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityLabel="Escribir un comentario"
          accessibilityRole="button"
          onPress={openComments}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Feather color={themeColors.textMuted} name="message-circle" size={17} />
          <View style={styles.countViewport}>
            <Animated.View entering={reduceMotion ? FadeIn.duration(120) : FadeInUp.duration(180)} exiting={FadeOutUp.duration(120)} key={comments.length}>
              <AppText style={styles.actionLabel} variant="caption">{comments.length}</AppText>
            </Animated.View>
          </View>
        </Pressable>
        <Pressable
          accessibilityLabel="Compartir publicación"
          accessibilityRole="button"
          onPress={() => void sharePost()}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Feather color={themeColors.textMuted} name="send" size={17} />
          {<AppText style={styles.shareLabel} variant="caption">Compartir</AppText>}
        </Pressable>
        <View style={styles.actionSpacer} />
        <Pressable
          accessibilityLabel={isBookmarked ? 'Quitar de guardados' : 'Guardar publicación'}
          accessibilityRole="button"
          accessibilityState={{ selected: isBookmarked }}
          onPress={toggleBookmark}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Animated.View style={[styles.actionIcon, animatedSaveStyle]}>
            <Ionicons color={isBookmarked ? themeColors.primaryDark : themeColors.textMuted} name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={18} />
          </Animated.View>
          {null}
        </Pressable>
      </View>

      <PostComments comments={comments} />

      {comments.length > 2 ? (
        <Pressable accessibilityRole="button" onPress={openComments} style={({ pressed }) => [styles.commentsToggle, pressed && styles.pressed]}>
          <AppText style={styles.commentsToggleText} variant="caption">
            Ver los {comments.length} comentarios
          </AppText>
        </Pressable>
      ) : null}
    </Animated.View>
  );
});

const useStyles = makeThemedStyles((colors) => ({
  post: { alignSelf: 'stretch', backgroundColor: colors.surface, borderColor: 'rgba(60,60,67,0.12)', borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, elevation: 0, padding: 12, shadowOpacity: 0, width: '100%' },
  authorRow: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  avatar: { alignItems: 'center', backgroundColor: colors.successSoft, borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 40 },
  avatarText: { color: colors.text, fontFamily: Platform.select({ ios: 'System', default: typography.bodySemiBold }), fontWeight: '600' },
  authorCopy: { flex: 1 },
  authorName: { fontFamily: Platform.select({ ios: 'System', default: typography.bodySemiBold }), fontSize: 14, fontWeight: '600', lineHeight: 18 },
  metadata: { alignItems: 'center', flexDirection: 'row', gap: 3, marginTop: 1 },
  locationLabel: { color: colors.textMuted, flexShrink: 1, fontFamily: Platform.select({ ios: 'System', default: typography.body }), fontSize: 9, lineHeight: 12 },
  metadataDot: { backgroundColor: colors.textMuted, borderRadius: radii.pill, height: 2, marginHorizontal: 1, width: 2 },
  timeLabel: { color: colors.textMuted, fontFamily: Platform.select({ ios: 'System', default: typography.body }), fontSize: 9, lineHeight: 12 },
  category: { alignItems: 'center', borderRadius: radii.pill, justifyContent: 'center', minHeight: 22, paddingHorizontal: 8, paddingVertical: 2 },
  categoryText: { fontFamily: Platform.select({ ios: 'System', default: typography.bodySemiBold }), fontSize: 8, fontWeight: '600', letterSpacing: 0.35, lineHeight: 11, textTransform: 'uppercase' },
  postTitle: { fontFamily: Platform.select({ ios: 'System', default: typography.bodySemiBold }), fontSize: 15, fontWeight: '600', lineHeight: 20, marginTop: 13 },
  postContent: { color: colors.text, fontFamily: Platform.select({ ios: 'System', default: typography.body }), fontSize: 14, lineHeight: 20, marginTop: 5 },
  media: { marginTop: 12, position: 'relative' },
  mediaLocation: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: radii.pill, bottom: 10, flexDirection: 'row', gap: 4, left: 10, maxWidth: '76%', minHeight: 29, paddingHorizontal: 10, position: 'absolute' },
  mediaLocationText: { color: colors.text, fontFamily: typography.bodyMedium, fontSize: 9 },
  audioPlayer: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.sm, flexDirection: 'row', gap: spacing.md, marginHorizontal: 10, marginTop: 10, minHeight: 60, padding: spacing.md },
  audioPlay: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 40 },
  audioInfo: { flex: 1 },
  waveform: { alignItems: 'center', flexDirection: 'row', gap: 3, height: 23, marginTop: 2 },
  waveBar: { backgroundColor: colors.primary, borderRadius: radii.pill, width: 2 },
  actions: { alignItems: 'center', borderTopColor: 'rgba(60,60,67,0.10)', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 1, marginTop: 12, paddingTop: 2 },
  action: { alignItems: 'center', borderRadius: radii.pill, flexDirection: 'row', gap: 5, minHeight: 44, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  actionIcon: { alignItems: 'center', height: 30, justifyContent: 'center', width: 30 },
  actionLiked: { backgroundColor: 'transparent' },
  actionLabel: { color: colors.textMuted, fontFamily: Platform.select({ ios: 'System', default: typography.bodyMedium }), fontWeight: '500' },
  actionLabelLiked: { color: colors.danger, fontFamily: Platform.select({ ios: 'System', default: typography.bodySemiBold }), fontWeight: '600' },
  countViewport: { alignItems: 'center', height: 20, justifyContent: 'center', minWidth: 12, overflow: 'hidden' },
  shareLabel: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 10 },
  actionSpacer: { flex: 1 },
  commentsToggle: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 3, minHeight: 36, paddingHorizontal: 3 },
  commentsToggleText: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 11 },
  pressed: { opacity: 0.65, transform: [{ scale: 0.98 }] },
}));
