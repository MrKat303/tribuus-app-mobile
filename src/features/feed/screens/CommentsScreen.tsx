import { FlashList, type FlashListRef, type ListRenderItemInfo } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useAuth } from '@/features/auth/application/AuthProvider';
import { useFeed } from '@/features/feed/application/FeedProvider';
import { usePostCommentsRealtime } from '@/features/feed/hooks/usePostCommentsRealtime';
import type { CommunityComment } from '@/features/feed/model/community';
import { useAppAppearance } from '@/theme/AppearanceProvider';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

type ThreadedComment = {
  comment: CommunityComment;
  depth: number;
};

function buildThread(comments: CommunityComment[]): ThreadedComment[] {
  const commentIds = new Set(comments.map(({ id }) => id));
  const children = new Map<string, CommunityComment[]>();
  const roots: CommunityComment[] = [];

  comments.forEach((comment) => {
    if (!comment.replyToCommentId || !commentIds.has(comment.replyToCommentId)) {
      roots.push(comment);
      return;
    }
    const current = children.get(comment.replyToCommentId) ?? [];
    current.push(comment);
    children.set(comment.replyToCommentId, current);
  });

  const result: ThreadedComment[] = [];
  const append = (comment: CommunityComment, depth: number) => {
    result.push({ comment, depth: Math.min(depth, 1) });
    children.get(comment.id)?.forEach((reply) => append(reply, depth + 1));
  };
  roots.forEach((comment) => append(comment, 0));
  return result;
}

const CommentRow = memo(function CommentRow({ item, onLike, onMenu, onReply }: {
  item: ThreadedComment;
  onLike: (commentId: string) => void;
  onMenu: (comment: CommunityComment) => void;
  onReply: (comment: CommunityComment) => void;
}) {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  const { comment, depth } = item;
  const likes = comment.likes ?? 0;
  const liked = comment.isLiked ?? false;

  return (
    <View style={[styles.commentRow, depth > 0 && styles.replyRow]}>
      <View style={[styles.avatar, depth > 0 && styles.replyAvatar, { backgroundColor: colors.primarySoft }]}>
        <AppText style={[styles.initials, { color: colors.primaryDark }]} variant="caption">{comment.initials}</AppText>
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentHeading}>
          <AppText style={styles.author} variant="bodyStrong">{comment.author}</AppText>
          <AppText style={styles.time} variant="caption">{comment.timeLabel ?? 'Ahora'}</AppText>
        </View>
        <AppText selectable style={styles.commentText}>{comment.content}</AppText>
        <View style={styles.commentActions}>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => onReply(comment)}>
            <AppText style={styles.replyLabel} variant="caption">Responder</AppText>
          </Pressable>
          {likes > 0 ? <AppText style={styles.likeCount} variant="caption">{likes} {likes === 1 ? 'Me gusta' : 'Me gusta'}</AppText> : null}
        </View>
      </View>
      <View style={styles.trailing}>
        <Pressable accessibilityLabel="Más opciones del comentario" accessibilityRole="button" hitSlop={10} onPress={() => onMenu(comment)} style={styles.iconButton}>
          <AppIcon color={colors.textMuted} name="more-horizontal" size={16} />
        </Pressable>
        <Pressable accessibilityLabel={liked ? 'Quitar Me gusta' : 'Me gusta'} accessibilityRole="button" accessibilityState={{ selected: liked }} hitSlop={10} onPress={() => onLike(comment.id)} style={styles.iconButton}>
          <AppIcon color={liked ? colors.danger : colors.textMuted} filled={liked} name="heart" size={15} />
        </Pressable>
      </View>
    </View>
  );
});

export function CommentsScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const { colors } = useAppAppearance();
  const styles = useStyles();
  const { profile } = useAuth();
  const { addComment, invalidatePost, posts, toggleCommentLike } = useFeed();
  const listRef = useRef<FlashListRef<ThreadedComment>>(null);
  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommunityComment | null>(null);
  const post = posts.find(({ id }) => id === postId);
  const threadedComments = useMemo(() => buildThread(post?.comments ?? []), [post?.comments]);
  const initials = profile?.initials || 'V';
  usePostCommentsRealtime(postId, invalidatePost);

  const submitComment = useCallback(async () => {
    const content = draft.trim();
    if (!content || !postId) return;
    try {
      await addComment(postId, content, replyingTo?.id);
      setDraft('');
      setReplyingTo(null);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (error) {
      Alert.alert('No se pudo comentar', error instanceof Error ? error.message : 'Intenta nuevamente.');
    }
  }, [addComment, draft, postId, replyingTo]);

  const openCommentMenu = useCallback((comment: CommunityComment) => {
    const copy = () => void Clipboard.setStringAsync(comment.content);
    const report = () => Alert.alert('Comentario reportado', 'Revisaremos este comentario.');
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { cancelButtonIndex: 2, destructiveButtonIndex: 1, options: ['Copiar', 'Reportar', 'Cancelar'] },
        (buttonIndex) => {
          if (buttonIndex === 0) copy();
          if (buttonIndex === 1) report();
        },
      );
      return;
    }
    Alert.alert('Comentario', undefined, [
      { text: 'Copiar', onPress: copy },
      { text: 'Reportar', onPress: report, style: 'destructive' },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, []);

  const renderComment = useCallback(({ item }: ListRenderItemInfo<ThreadedComment>) => (
    <CommentRow
      item={item}
      onLike={(commentId) => { if (postId) void toggleCommentLike(postId, commentId).catch(() => undefined); }}
      onMenu={openCommentMenu}
      onReply={setReplyingTo}
    />
  ), [openCommentMenu, postId, toggleCommentLike]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.screen, { backgroundColor: colors.surface }]}>
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerSpacer} />
          <View style={styles.headerTitle}>
            <AppText style={styles.title} variant="bodyStrong">Comentarios</AppText>
            <AppText style={styles.subtitle} variant="caption">{threadedComments.length}</AppText>
          </View>
          <Pressable accessibilityLabel="Cerrar comentarios" accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.closeButton, { backgroundColor: colors.surfaceMuted }, pressed && styles.pressed]}>
            <AppIcon color={colors.text} name="x" size={20} />
          </Pressable>
        </View>

        {post ? (
          <FlashList
            contentContainerStyle={styles.listContent}
            data={threadedComments}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            keyExtractor={({ comment }) => comment.id}
            ListEmptyComponent={<View style={styles.empty}><AppIcon color={colors.textMuted} name="message-circle" size={28} /><AppText variant="bodyStrong">Sé la primera persona en comentar</AppText><AppText style={styles.emptyCopy} variant="caption">Comparte algo útil o amable con la comunidad.</AppText></View>}
            ref={listRef}
            renderItem={renderComment}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.empty}><AppIcon color={colors.textMuted} name="alert-circle" size={28} /><AppText variant="bodyStrong">Publicación no disponible</AppText></View>
        )}

        {post ? (
          <View style={[styles.composerShell, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            {replyingTo ? (
              <View style={[styles.replyingBanner, { backgroundColor: colors.surfaceMuted }]}>
                <AppText numberOfLines={1} style={styles.replyingText} variant="caption">Respondiendo a {replyingTo.author}</AppText>
                <Pressable accessibilityLabel="Cancelar respuesta" hitSlop={8} onPress={() => setReplyingTo(null)}><AppIcon color={colors.textMuted} name="x" size={15} /></Pressable>
              </View>
            ) : null}
            <View style={styles.composer}>
              <View style={[styles.myAvatar, { backgroundColor: colors.primarySoft }]}><AppText style={[styles.initials, { color: colors.primaryDark }]} variant="caption">{initials}</AppText></View>
              <TextInput
                accessibilityLabel={replyingTo ? `Responder a ${replyingTo.author}` : 'Agregar comentario'}
                maxLength={500}
                multiline
                onChangeText={setDraft}
                placeholder={replyingTo ? `Responder a ${replyingTo.author}…` : 'Agregar un comentario…'}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
                value={draft}
              />
              <Pressable accessibilityLabel="Enviar comentario" accessibilityRole="button" disabled={!draft.trim()} onPress={submitComment} style={({ pressed }) => [styles.sendButton, { backgroundColor: colors.primaryDark }, !draft.trim() && styles.disabled, pressed && styles.pressed]}>
                <AppIcon color={colors.textOnPrimary} name="arrow-up" size={18} />
              </Pressable>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  screen: { backgroundColor: colors.surface, flex: 1 },
  safeArea: { flex: 1 },
  header: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 58, paddingHorizontal: spacing.md },
  headerSpacer: { width: 44 },
  headerTitle: { alignItems: 'center', flex: 1 },
  title: { fontFamily: typography.bodySemiBold, fontSize: 16 },
  subtitle: { color: colors.textMuted, fontSize: 10, lineHeight: 13 },
  closeButton: { alignItems: 'center', borderRadius: radii.pill, height: 44, justifyContent: 'center', width: 44 },
  listContent: { paddingBottom: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  commentRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm, minHeight: 82, paddingVertical: spacing.sm },
  replyRow: { marginLeft: 34 },
  avatar: { alignItems: 'center', borderRadius: radii.pill, height: 36, justifyContent: 'center', width: 36 },
  replyAvatar: { height: 30, width: 30 },
  initials: { fontFamily: typography.bodySemiBold, fontSize: 9, fontWeight: '600' },
  commentBody: { flex: 1, minWidth: 0 },
  commentHeading: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  author: { fontFamily: typography.bodySemiBold, fontSize: 13, lineHeight: 18 },
  time: { color: colors.textMuted, fontSize: 10, lineHeight: 14 },
  commentText: { color: colors.text, fontSize: 14, lineHeight: 19, marginTop: 2 },
  commentActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: 30 },
  replyLabel: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 11 },
  likeCount: { color: colors.textMuted, fontSize: 10 },
  trailing: { alignItems: 'center', gap: 2 },
  iconButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  empty: { alignItems: 'center', flex: 1, gap: spacing.sm, justifyContent: 'center', padding: spacing.xxl },
  emptyCopy: { color: colors.textMuted, maxWidth: 260, textAlign: 'center' },
  composerShell: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  replyingBanner: { alignItems: 'center', borderRadius: radii.sm, flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs, minHeight: 34, paddingHorizontal: spacing.md },
  replyingText: { flex: 1, fontFamily: typography.bodyMedium, fontSize: 11 },
  composer: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.sm, paddingBottom: spacing.sm },
  myAvatar: { alignItems: 'center', borderRadius: radii.pill, height: 36, justifyContent: 'center', marginBottom: 4, width: 36 },
  input: { borderRadius: 20, flex: 1, fontFamily: typography.body, fontSize: 14, lineHeight: 19, maxHeight: 112, minHeight: 44, paddingHorizontal: 14, paddingVertical: 11 },
  sendButton: { alignItems: 'center', borderRadius: radii.pill, height: 44, justifyContent: 'center', width: 44 },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.65 },
}));
