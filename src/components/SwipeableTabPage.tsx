import { usePathname, useRouter } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { useCallback, useMemo } from 'react';
import { PanResponder, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const TAB_ROUTES = [
  { href: '/(tabs)/inicio', name: 'inicio' },
  { href: '/(tabs)/chat', name: 'chat' },
  { href: '/(tabs)/mapa', name: 'mapa' },
  { href: '/(tabs)/comunidad', name: 'comunidad' },
  { href: '/(tabs)/news', name: 'news' },
] as const;

const SWIPE_DISTANCE = 48;
const SWIPE_VELOCITY = 0.5;

type SwipeableTabPageProps = PropsWithChildren<{
  edgeOnly?: boolean;
}>;

export function SwipeableTabPage({ children, edgeOnly = false }: SwipeableTabPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const routeName = pathname.split('/').filter(Boolean).at(-1);
  const currentIndex = TAB_ROUTES.findIndex((route) => route.name === routeName);

  const navigateByDirection = useCallback((direction: -1 | 1) => {
    const destination = TAB_ROUTES[currentIndex + direction];
    if (destination) router.replace(destination.href);
  }, [currentIndex, router]);

  const resetPosition = useCallback(() => {
    translateX.set(withSpring(0, { damping: 21, mass: 0.72, stiffness: 240 }));
  }, [translateX]);

  const updatePosition = useCallback((distance: number) => {
    const direction = distance < 0 ? 1 : -1;
    const canNavigate = Boolean(TAB_ROUTES[currentIndex + direction]);
    translateX.set(canNavigate ? distance : distance * 0.16);
  }, [currentIndex, translateX]);

  const finishGesture = useCallback((distance: number, velocity: number) => {
    const direction: -1 | 1 = distance < 0 ? 1 : -1;
    const canNavigate = Boolean(TAB_ROUTES[currentIndex + direction]);
    const passedThreshold = Math.abs(distance) >= SWIPE_DISTANCE || Math.abs(velocity) >= SWIPE_VELOCITY;

    if (!canNavigate || !passedThreshold) {
      resetPosition();
      return;
    }

    translateX.set(0);
    navigateByDirection(direction);
  }, [currentIndex, navigateByDirection, resetPosition, translateX]);

  const animatedPageStyle = useAnimatedStyle(() => {
    const currentTranslateX = translateX.get();
    const progress = Math.min(Math.abs(currentTranslateX) / Math.max(width, 1), 1);

    return {
      opacity: interpolate(progress, [0, 1], [1, 0.82], Extrapolation.CLAMP),
      transform: [
        { translateX: currentTranslateX },
        { scale: interpolate(progress, [0, 1], [1, 0.985], Extrapolation.CLAMP) },
      ],
    };
  }, [width]);

  const pagePanResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => currentIndex >= 0
      && !edgeOnly
      && Math.abs(gesture.dx) > 18
      && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.7,
    onPanResponderMove: (_, gesture) => updatePosition(gesture.dx),
    onPanResponderRelease: (_, gesture) => finishGesture(gesture.dx, gesture.vx),
    onPanResponderTerminate: resetPosition,
  }), [currentIndex, edgeOnly, finishGesture, resetPosition, updatePosition]);

  const previousEdgeResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => edgeOnly && gesture.dx > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4,
    onPanResponderMove: (_, gesture) => updatePosition(Math.max(0, gesture.dx)),
    onPanResponderRelease: (_, gesture) => finishGesture(gesture.dx, gesture.vx),
    onPanResponderTerminate: resetPosition,
  }), [edgeOnly, finishGesture, resetPosition, updatePosition]);

  const nextEdgeResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => edgeOnly && gesture.dx < -12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4,
    onPanResponderMove: (_, gesture) => updatePosition(Math.min(0, gesture.dx)),
    onPanResponderRelease: (_, gesture) => finishGesture(gesture.dx, gesture.vx),
    onPanResponderTerminate: resetPosition,
  }), [edgeOnly, finishGesture, resetPosition, updatePosition]);

  return (
    <View {...(!edgeOnly ? pagePanResponder.panHandlers : {})} style={styles.page}>
      <Animated.View style={[styles.animatedPage, animatedPageStyle]}>{children}</Animated.View>
      {edgeOnly && currentIndex > 0 ? <View {...previousEdgeResponder.panHandlers} style={[styles.edge, styles.leftEdge]} /> : null}
      {edgeOnly && currentIndex < TAB_ROUTES.length - 1 ? <View {...nextEdgeResponder.panHandlers} style={[styles.edge, styles.rightEdge]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  animatedPage: { flex: 1 },
  edge: { bottom: 76, position: 'absolute', top: 0, width: 24, zIndex: 40 },
  leftEdge: { left: 0 },
  rightEdge: { right: 0 },
});
