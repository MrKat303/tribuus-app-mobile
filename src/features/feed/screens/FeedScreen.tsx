import { FlashList, type FlashListRef, type ListRenderItemInfo } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
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
  const listRef = useRef<FlashListRef<CommunityPost>>(null);
  const newPostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('todo');
  const [newPostId, setNewPostId] = useState<string | null>(null);
  const visiblePosts = useMemo(
    () => posts.filter((post) => activeFilter === 'todo' || post.category === activeFilter),
    [activeFilter, posts],
  );

  const openProfile = useCallback(() => router.push('/(tabs)/perfil'), [router]);
  const openNotifications = useCallback(() => router.push('/notificaciones'), [router]);
  const openWallet = useCallback(() => router.push('/community-wallet'), [router]);
  const createPost = useCallback((draft: CommunityPostDraft) => {
    const postId = addPost(draft);
    setNewPostId(postId);
    setActiveFilter('todo');
    requestAnimationFrame(() => listRef.current?.scrollToOffset({ animated: true, offset: 0 }));
    if (newPostTimerRef.current) clearTimeout(newPostTimerRef.current);
    newPostTimerRef.current = setTimeout(() => setNewPostId(null), 900);
  }, [addPost]);
  const renderPost = useCallback(({ item }: ListRenderItemInfo<CommunityPost>) => (
    <View style={styles.post}><CommunityPostCard isNew={item.id === newPostId} post={item} /></View>
  ), [newPostId, styles.post]);
  const getPostType = useCallback((post: CommunityPost) => {
    if (post.images?.length || post.imageVariants || post.imageUri) return 'image';
    if (post.poll) return 'poll';
    if (post.audioUri) return 'audio';
    return 'text';
  }, []);

  useEffect(() => () => {
    if (newPostTimerRef.current) clearTimeout(newPostTimerRef.current);
  }, []);

  const header = useMemo(() => (
    <FeedHeader
      activeFilter={activeFilter}
      onChangeFilter={setActiveFilter}
      onCreatePost={createPost}
      onOpenNotifications={openNotifications}
      onOpenProfile={openProfile}
      onOpenWallet={openWallet}
    />
  ), [activeFilter, createPost, openNotifications, openProfile, openWallet]);

  const empty = useMemo(() => (
    <View style={styles.emptyState}>
      <AppIcon color={colors.textMuted} name="search" size={24} />
      <AppText variant="bodyStrong">No encontramos publicaciones</AppText>
      <AppText style={styles.emptyCopy} variant="caption">Prueba con otra búsqueda o categoría.</AppText>
    </View>
  ), [colors.textMuted, styles.emptyCopy, styles.emptyState]);

  return (
    <Screen>
      <FlashList
        ref={listRef}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 12) + 92 }]}
        data={visiblePosts}
        drawDistance={900}
        getItemType={getPostType}
        ItemSeparatorComponent={PostSeparator}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(post) => post.id}
        ListEmptyComponent={empty}
        ListHeaderComponent={header}
        maxItemsInRecyclePool={24}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        style={styles.list}
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
