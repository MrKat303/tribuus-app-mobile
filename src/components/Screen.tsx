import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppAppearance } from '@/theme/AppearanceProvider';

import { SwipeableTabPage } from './SwipeableTabPage';

type ScreenProps = PropsWithChildren<{ scroll?: boolean; swipeTabs?: boolean }>;

export function Screen({ children, scroll = false, swipeTabs = true }: ScreenProps) {
  const { colors } = useAppAppearance();
  const content = <View style={[styles.content, !scroll && styles.flex]}>{children}</View>;

  const screen = (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );

  return swipeTabs ? <SwipeableTabPage>{screen}</SwipeableTabPage> : screen;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { alignSelf: 'center', maxWidth: 720, paddingHorizontal: 20, paddingVertical: 12, width: '100%' },
  flex: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: 112 },
});
