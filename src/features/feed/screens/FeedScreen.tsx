import { FlashList, type FlashListRef, type ListRenderItemInfo } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, View } from 'react-native';
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
  const { addPost, error, isLoading, isLoadingMore, loadMore, posts, refresh } = usePosts();
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
  const createPost = useCallback(async (draft: CommunityPostDraft) => {
    const postId = await addPost(draft);
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
    <>
      <FeedHeader
        activeFilter={activeFilter}
        onChangeFilter={setActiveFilter}
        onCreatePost={createPost}
        onOpenNotifications={openNotifications}
        onOpenProfile={openProfile}
        onOpenWallet={openWallet}
      />
      {error && posts.length > 0 ? <View style={styles.errorBanner}><AppText style={styles.errorText} variant="caption">No pudimos actualizar el feed · desliza para reintentar</AppText></View> : null}
    </>
  ), [activeFilter, createPost, error, openNotifications, openProfile, openWallet, posts.length, styles.errorBanner, styles.errorText]);

  const empty = useMemo(() => {
    if (isLoading) {
      return (
        <View accessibilityLiveRegion="polite" style={styles.emptyState}>
          <ActivityIndicator color={colors.primaryDark} />
          <AppText style={styles.emptyCopy} variant="caption">Cargando publicaciones…</AppText>
        </View>
      );
    }

    if (error && posts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <AppIcon color={colors.textMuted} name="wifi-off" size={24} />
          <AppText variant="bodyStrong">No pudimos cargar el feed</AppText>
          <AppText style={styles.emptyCopy} variant="caption">Revisa tu conexión y desliza hacia abajo para reintentar.</AppText>
        </View>
      );
    }

    if (posts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <AppIcon color={colors.textMuted} name="message-square" size={24} />
          <AppText variant="bodyStrong">Aún no hay publicaciones</AppText>
          <AppText style={styles.emptyCopy} variant="caption">Sé la primera persona en compartir algo con tu comunidad.</AppText>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <AppIcon color={colors.textMuted} name="filter" size={24} />
        <AppText variant="bodyStrong">No hay publicaciones en esta categoría</AppText>
        <AppText style={styles.emptyCopy} variant="caption">Selecciona otra categoría para seguir explorando.</AppText>
      </View>
    );
  }, [colors.primaryDark, colors.textMuted, error, isLoading, posts.length, styles.emptyCopy, styles.emptyState]);

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
        ListFooterComponent={isLoadingMore ? <ActivityIndicator color={colors.primaryDark} style={styles.loadingMore} /> : null}
        ListHeaderComponent={header}
        maxItemsInRecyclePool={24}
        removeClippedSubviews={Platform.OS === 'android'}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl colors={[colors.primaryDark]} onRefresh={() => void refresh().catch(() => undefined)} refreshing={isLoading} tintColor={colors.primaryDark} />}
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
  errorBanner: { backgroundColor: colors.warmSoft, borderRadius: radii.sm, marginTop: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  errorText: { color: colors.text, textAlign: 'center' },
  loadingMore: { paddingVertical: spacing.lg },
}));
