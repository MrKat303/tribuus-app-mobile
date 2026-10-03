import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/theme/AppearanceProvider';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';
import type { CommunityComment } from '@/features/feed/model/community';

const MAX_FEED_COMMENTS = 2;

export function PostComments({ comments }: { comments: CommunityComment[] }) {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  const previewComments = comments.slice(-MAX_FEED_COMMENTS);

  if (!previewComments.length) return null;

  return (
    <View accessibilityLabel="Comentarios recientes" style={styles.comments}>
      {previewComments.map((comment) => (
        <View key={comment.id} style={styles.commentRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
            <AppText style={[styles.initials, { color: colors.primaryDark }]} variant="caption">{comment.initials}</AppText>
          </View>
          <View style={[styles.commentBubble, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <AppText numberOfLines={1} style={styles.author} variant="caption">{comment.author}</AppText>
            <AppText numberOfLines={2} style={[styles.content, { color: colors.text }]} variant="caption">{comment.content}</AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  comments: { gap: spacing.sm, paddingTop: spacing.sm },
  commentRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm, minHeight: 30 },
  avatar: { alignItems: 'center', borderRadius: radii.pill, height: 28, justifyContent: 'center', width: 28 },
  initials: { fontFamily: typography.bodySemiBold, fontSize: 8, fontWeight: '600' },
  commentBubble: {
    borderCurve: 'continuous',
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: 1,
    minWidth: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  author: { color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 11, fontWeight: '600', lineHeight: 15 },
  content: { fontFamily: typography.body, fontSize: 12, lineHeight: 17 },
}));
