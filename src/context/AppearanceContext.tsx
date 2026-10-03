import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { darkColors, lightColors, type ThemeColors } from '@/theme/tokens';
import { type AppThemeMode, persistThemeMode } from '@/theme/themeStorage';

export type { AppThemeMode } from '@/theme/themeStorage';

type AppearanceContextValue = {
  colors: ThemeColors;
  themeMode: AppThemeMode;
  isDark: boolean;
  setThemeMode: (themeMode: AppThemeMode) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

type AppearanceProviderProps = PropsWithChildren<{
  initialThemeMode: AppThemeMode;
}>;

export function AppearanceProvider({ children, initialThemeMode }: AppearanceProviderProps) {
  const [themeMode, setThemeModeState] = useState<AppThemeMode>(initialThemeMode);

  const setThemeMode = useCallback((nextThemeMode: AppThemeMode) => {
    setThemeModeState(nextThemeMode);
    void persistThemeMode(nextThemeMode);
  }, []);

  const value = useMemo(
    () => ({ colors: themeMode === 'dark' ? darkColors : lightColors, themeMode, isDark: themeMode === 'dark', setThemeMode }),
    [setThemeMode, themeMode],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('useAppAppearance debe usarse dentro de AppearanceProvider');
  return context;
}

export function useThemeColors() {
  return useContext(AppearanceContext)?.colors ?? lightColors;
}
