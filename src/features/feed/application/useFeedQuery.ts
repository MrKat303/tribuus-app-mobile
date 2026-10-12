import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

import { feedErrorMessage } from '@/features/feed/application/feedError';
import {
  ensureFeedIdentity,
  type FeedIdentity,
} from '@/features/feed/data/feedIdentityRepository';
import {
  type FeedCursor,
  getFeedPost,
  listFeedPosts,
} from '@/features/feed/data/feedRepository';
import type { CommunityPost } from '@/features/feed/model/community';
import type { FeedFilter } from '@/features/feed/model/feed';

export type FeedPostsSetter = Dispatch<SetStateAction<CommunityPost[]>>;
export type FeedErrorSetter = Dispatch<SetStateAction<string | null>>;

type FeedPageState = {
  cursor: FeedCursor | null;
  isLoaded: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  posts: CommunityPost[];
};

// The unfiltered page is last so its freshest copy wins when mutation state is
// deduplicated across category caches.
const FILTERS: FeedFilter[] = ['evento', 'recomendación', 'comunidad', 'todo'];

function emptyPage(): FeedPageState {
  return {
    cursor: null,
    isLoaded: false,
    isLoading: false,
    isLoadingMore: false,
    posts: [],
  };
}

function initialPages(): Record<FeedFilter, FeedPageState> {
  return {
    comunidad: emptyPage(),
    evento: emptyPage(),
    recomendación: emptyPage(),
    todo: emptyPage(),
  };
}

export function useFeedQuery(identity: FeedIdentity, activeFilter: FeedFilter) {
  const [pages, setPages] = useState(initialPages);
  const [error, setError] = useState<string | null>(null);
  const requestSequences = useRef<Record<FeedFilter, number>>({
    comunidad: 0,
    evento: 0,
    recomendación: 0,
    todo: 0,
  });
  const loadingMoreFilters = useRef(new Set<FeedFilter>());
  const activePage = pages[activeFilter];

  const loadFirstPage = useCallback(async (filter: FeedFilter, showLoading: boolean) => {
    const requestId = ++requestSequences.current[filter];
    if (showLoading) {
      setPages((current) => ({
        ...current,
        [filter]: { ...current[filter], isLoading: true },
      }));
    }

    try {
      await ensureFeedIdentity(identity);
      const page = await listFeedPosts(undefined, filter === 'todo' ? undefined : filter);
      if (requestId !== requestSequences.current[filter]) return;
      setPages((current) => ({
        ...current,
        [filter]: {
          cursor: page.cursor,
          isLoaded: true,
          isLoading: false,
          isLoadingMore: false,
          posts: page.posts,
        },
      }));
      setError(null);
    } catch (cause) {
      if (requestId === requestSequences.current[filter]) {
        setPages((current) => ({
          ...current,
          [filter]: { ...current[filter], isLoading: false },
        }));
        setError(feedErrorMessage(cause));
      }
      throw cause;
    }
  }, [identity]);

  // Publishing refreshes the canonical unfiltered page so switching back to
  // "todo" cannot briefly expose a stale category cache.
  const reloadFirstPage = useCallback(() => loadFirstPage('todo', false), [loadFirstPage]);
  const syncFirstPage = useCallback(
    () => loadFirstPage(activeFilter, false),
    [activeFilter, loadFirstPage],
  );
  const refresh = useCallback(
    () => loadFirstPage(activeFilter, true),
    [activeFilter, loadFirstPage],
  );

  const syncPost = useCallback(async (postId: string) => {
    try {
      const post = await getFeedPost(postId);
      setPages((current) => {
        let changed = false;
        const next = { ...current };
        for (const filter of FILTERS) {
          const currentPosts = current[filter].posts;
          const currentIndex = currentPosts.findIndex(({ id }) => id === postId);
          if (currentIndex === -1) continue;

          const belongsToPage = post && (filter === 'todo' || post.category === filter);
          const posts = belongsToPage
            ? currentPosts.map((currentPost) => currentPost.id === postId ? post : currentPost)
            : currentPosts.filter(({ id }) => id !== postId);
          next[filter] = { ...current[filter], posts };
          changed = true;
        }
        return changed ? next : current;
      });
      setError(null);
    } catch (cause) {
      setError(feedErrorMessage(cause));
      throw cause;
    }
  }, []);

  const loadMore = useCallback(async () => {
    const pageState = pages[activeFilter];
    if (!pageState.cursor || loadingMoreFilters.current.has(activeFilter)) return;
    loadingMoreFilters.current.add(activeFilter);
    const requestId = requestSequences.current[activeFilter];
    setPages((current) => ({
      ...current,
      [activeFilter]: { ...current[activeFilter], isLoadingMore: true },
    }));

    try {
      const page = await listFeedPosts(
        pageState.cursor,
        activeFilter === 'todo' ? undefined : activeFilter,
      );
      if (requestId !== requestSequences.current[activeFilter]) return;
      setPages((current) => {
        const existingIds = new Set(current[activeFilter].posts.map((post) => post.id));
        return {
          ...current,
          [activeFilter]: {
            ...current[activeFilter],
            cursor: page.cursor,
            isLoadingMore: false,
            posts: [
              ...current[activeFilter].posts,
              ...page.posts.filter((post) => !existingIds.has(post.id)),
            ],
          },
        };
      });
      setError(null);
    } catch (cause) {
      setError(feedErrorMessage(cause));
    } finally {
      loadingMoreFilters.current.delete(activeFilter);
      setPages((current) => ({
        ...current,
        [activeFilter]: { ...current[activeFilter], isLoadingMore: false },
      }));
    }
  }, [activeFilter, pages]);

  const setPosts = useCallback<FeedPostsSetter>((action) => {
    setPages((current) => {
      let changed = false;
      const next = { ...current };
      for (const filter of FILTERS) {
        const posts = typeof action === 'function' ? action(current[filter].posts) : action;
        if (posts !== current[filter].posts) {
          next[filter] = { ...current[filter], posts };
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, []);

  const mutationPosts = useMemo(() => {
    const uniquePosts = new Map<string, CommunityPost>();
    for (const filter of FILTERS) {
      for (const post of pages[filter].posts) uniquePosts.set(post.id, post);
    }
    return [...uniquePosts.values()];
  }, [pages]);

  useEffect(() => {
    // Filters own independent server-side pages. Switching category therefore
    // cannot mistake a partially loaded unfiltered page for a complete result.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFirstPage(activeFilter, !pages[activeFilter].isLoaded).catch(() => undefined);
    // Loading is intentionally keyed to identity/filter, not the mutable page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, identity, loadFirstPage]);

  return {
    allPosts: pages.todo.posts,
    cursor: activePage.cursor,
    error,
    isLoading: activePage.isLoading || !activePage.isLoaded,
    isLoadingMore: activePage.isLoadingMore,
    loadMore,
    mutationPosts,
    posts: activePage.posts,
    refresh,
    reloadFirstPage,
    setError,
    setPosts,
    syncFirstPage,
    syncPost,
  };
}
