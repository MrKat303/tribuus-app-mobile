import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useThemeColors } from '@/context/AppearanceContext';

import type { ThemeColors } from './tokens';

export function makeThemedStyles<T extends StyleSheet.NamedStyles<T>>(factory: (colors: ThemeColors) => T) {
  return function useThemedStyles() {
    const colors = useThemeColors();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
