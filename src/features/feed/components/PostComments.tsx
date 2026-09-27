import { Pressable, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/context/AppearanceContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';
import type { CommunityComment } from '@/types/community';

type PostCommentsProps = {
  commentDraft: string;
  comments: CommunityComment[];
  isCommenting: boolean;
  onChangeDraft: (value: string) => void;
  onSubmit: () => void;
  showComments: boolean;
};

export function PostComments({ commentDraft, comments, isCommenting, onChangeDraft, onSubmit, showComments }: PostCommentsProps) {
  const { colors: themeColors } = useAppAppearance();
  const styles = useStyles();

  return (
    <>
      {showComments && comments.length > 0 ? (
        <View style={styles.comments}>
          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentRow}>
              <View style={[styles.avatar, { backgroundColor: themeColors.primarySoft }]}>
                <AppText style={[styles.initials, { color: themeColors.primaryDark }]} variant="caption">{comment.initials}</AppText>
              </View>
              <View style={[styles.bubble, { backgroundColor: themeColors.surfaceMuted }]}>
                <View style={[styles.tail, { backgroundColor: themeColors.surfaceMuted }]} />
                <AppText style={styles.author} variant="caption">{comment.author}</AppText>
                <AppText style={[styles.text, { color: themeColors.text }]} variant="caption">{comment.content}</AppText>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {isCommenting ? (
        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Comentario"
            autoFocus
            onChangeText={onChangeDraft}
            onSubmitEditing={onSubmit}
            placeholder="Escribe algo amable…"
            placeholderTextColor={themeColors.textMuted}
            returnKeyType="send"
            style={[styles.input, { backgroundColor: themeColors.input, color: themeColors.text }]}
            value={commentDraft}
          />
          <Pressable accessibilityLabel="Enviar comentario" accessibilityRole="button" disabled={!commentDraft.trim()} onPress={onSubmit} style={({ pressed }) => [styles.send, !commentDraft.trim() && styles.disabled, pressed && styles.pressed]}>
            <AppIcon color={themeColors.textOnPrimary} name="arrow-up" size={18} />
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  comments: { gap: spacing.sm, paddingTop: 7 },
  commentRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 9 },
  avatar: { alignItems: 'center', borderRadius: radii.pill, height: 28, justifyContent: 'center', width: 28 },
  initials: { fontFamily: typography.bodySemiBold, fontSize: 9, fontWeight: '600' },
  bubble: { borderRadius: 16, borderTopLeftRadius: 5, flex: 1, paddingHorizontal: 12, paddingVertical: 8, position: 'relative' },
  tail: { height: 9, left: -4, position: 'absolute', top: 8, transform: [{ rotate: '45deg' }], width: 9 },
  author: { color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 12, fontWeight: '600' },
  text: { fontFamily: typography.body, fontSize: 12, lineHeight: 16, marginTop: 1 },
  composer: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.sm },
  input: { borderRadius: radii.pill, flex: 1, fontFamily: typography.body, fontSize: 14, minHeight: 42, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  send: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: radii.pill, height: 42, justifyContent: 'center', width: 42 },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.65, transform: [{ scale: 0.98 }] },
}));
