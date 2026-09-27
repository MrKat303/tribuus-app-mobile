import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, TurboModuleRegistry } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from '@/theme/tokens';

export type AppThemeMode = 'light' | 'dark';

type AppearanceContextValue = {
  colors: ThemeColors;
  themeMode: AppThemeMode;
  isDark: boolean;
  setThemeMode: (themeMode: AppThemeMode) => void;
};

const STORAGE_KEY = '@tribuus/theme-mode';
const AppearanceContext = createContext<AppearanceContextValue | null>(null);
let sessionThemeMode: AppThemeMode = 'light';

async function getOptionalStorage() {
  if (Platform.OS !== 'web' && !TurboModuleRegistry.get('RNCAsyncStorage')) return null;

  try {
    return (await import('@react-native-async-storage/async-storage')).default;
  } catch {
    return null;
  }
}

async function readStoredThemeMode() {
  const storage = await getOptionalStorage();
  if (!storage) return null;

  try {
    return await storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

async function persistThemeMode(themeMode: AppThemeMode) {
  const storage = await getOptionalStorage();
  if (!storage) return;

  try {
    await storage.setItem(STORAGE_KEY, themeMode);
  } catch {
    // El modo oscuro sigue funcionando en memoria si el build aún no incluye el módulo nativo.
  }
}

export function AppearanceProvider({ children }: PropsWithChildren) {
  const [themeMode, setThemeModeState] = useState<AppThemeMode>(sessionThemeMode);

  useEffect(() => {
    void readStoredThemeMode()
      .then((storedThemeMode) => {
        if (storedThemeMode === 'light' || storedThemeMode === 'dark') {
          sessionThemeMode = storedThemeMode;
          setThemeModeState(storedThemeMode);
        }
      })
      .catch(() => undefined);
  }, []);

  const setThemeMode = useCallback((nextThemeMode: AppThemeMode) => {
    sessionThemeMode = nextThemeMode;
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
