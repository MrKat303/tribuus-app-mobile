import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommunityPostCard } from '@/components/CommunityPostCard';
import { Screen } from '@/components/Screen';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/context/AppearanceContext';
import { usePosts } from '@/context/PostsContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing } from '@/theme/tokens';
import type { CommunityPost, CommunityPostDraft } from '@/types/community';

import { FeedHeader } from '../components/FeedHeader';
import type { FeedFilter } from '../model/feed';

const PostSeparator = () => { const styles = useStyles(); return <View style={styles.separator} />; };

export function FeedScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { addPost, posts } = usePosts();
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('todo');
  const visiblePosts = useMemo(
    () => posts.filter((post) => activeFilter === 'todo' || post.category === activeFilter),
    [activeFilter, posts],
  );

  const openProfile = useCallback(() => router.push('/(tabs)/perfil'), [router]);
  const openNotifications = useCallback(() => router.push('/notificaciones'), [router]);
  const openWallet = useCallback(() => router.push('/community-wallet'), [router]);
  const createPost = useCallback((draft: CommunityPostDraft) => {
    addPost(draft);
    setActiveFilter('todo');
  }, [addPost]);
  const renderPost = useCallback(({ item }: { item: CommunityPost }) => (
    <View style={styles.post}><CommunityPostCard post={item} /></View>
  ), [styles.post]);

  const header = useMemo(() => (
    <FeedHeader
      activeFilter={activeFilter}
      onChangeFilter={setActiveFilter}
      onCreatePost={createPost}
      onOpenNotifications={openNotifications}
      onOpenProfile={openProfile}
      onOpenWallet={openWallet}
    />
  ), [activeFilter, createPost, openNotifications, openProfile]);

  const empty = useMemo(() => (
    <View style={styles.emptyState}>
      <AppIcon color={colors.textMuted} name="search" size={24} />
      <AppText variant="bodyStrong">No encontramos publicaciones</AppText>
      <AppText style={styles.emptyCopy} variant="caption">Prueba con otra búsqueda o categoría.</AppText>
    </View>
  ), [colors.textMuted, styles.emptyCopy, styles.emptyState]);

  return (
    <Screen>
      <FlatList
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 12) + 92 }]}
        data={visiblePosts}
        initialNumToRender={6}
        ItemSeparatorComponent={PostSeparator}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(post) => post.id}
        ListEmptyComponent={empty}
        ListHeaderComponent={header}
        maxToRenderPerBatch={6}
        removeClippedSubviews={false}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        updateCellsBatchingPeriod={50}
        windowSize={7}
      />
    </Screen>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  list: { flex: 1, width: '100%' },
  content: { flexGrow: 1 },
  post: { width: '100%' },
  separator: { height: 6 },
  emptyState: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.lg, gap: spacing.sm, marginTop: spacing.sm, padding: spacing.xxl },
  emptyCopy: { textAlign: 'center' },
}));
