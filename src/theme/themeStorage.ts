import { Platform, TurboModuleRegistry } from 'react-native';

export type AppThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = '@tribuus/theme-mode';

async function getOptionalStorage() {
  if (Platform.OS !== 'web' && !TurboModuleRegistry.get('RNCAsyncStorage')) return null;

  try {
    return (await import('@react-native-async-storage/async-storage')).default;
  } catch {
    return null;
  }
}

export async function readStoredThemeMode(): Promise<AppThemeMode | null> {
  const storage = await getOptionalStorage();
  if (!storage) return null;

  try {
    const storedThemeMode = await storage.getItem(THEME_STORAGE_KEY);
    return storedThemeMode === 'light' || storedThemeMode === 'dark' ? storedThemeMode : null;
  } catch {
    return null;
  }
}

export async function persistThemeMode(themeMode: AppThemeMode) {
  const storage = await getOptionalStorage();
  if (!storage) return;

  try {
    await storage.setItem(THEME_STORAGE_KEY, themeMode);
  } catch {
    // El tema sigue funcionando durante la sesión aunque el storage nativo no esté disponible.
  }
}
