import AsyncStorage from '@react-native-async-storage/async-storage';

import { THEME_STORAGE_KEY } from '@/theme/themeStorage';

const LOCAL_SCHEMA_VERSION_KEY = '@tribuus/local-schema-version';
const CURRENT_LOCAL_SCHEMA_VERSION = 1;

type LocalMigration = () => Promise<void>;

async function moveStorageValue(legacyKey: string, currentKey: string) {
  const [legacyValue, currentValue] = await Promise.all([
    AsyncStorage.getItem(legacyKey),
    AsyncStorage.getItem(currentKey),
  ]);

  if (legacyValue !== null && currentValue === null) {
    await AsyncStorage.setItem(currentKey, legacyValue);
  }

  if (legacyValue !== null) await AsyncStorage.removeItem(legacyKey);
}

const migrations: Record<number, LocalMigration> = {
  1: async () => {
    await Promise.all([
      moveStorageValue('@tribuus/theme', THEME_STORAGE_KEY),
      moveStorageValue('@tribuus/community-wallet', '@tribuus/community-wallet-v2'),
    ]);
  },
};

function parseStoredVersion(value: string | null) {
  if (value === null) return 0;

  const parsedVersion = Number.parseInt(value, 10);
  return Number.isInteger(parsedVersion) && parsedVersion >= 0 ? parsedVersion : 0;
}

export async function runLocalMigrations() {
  const storedVersion = parseStoredVersion(await AsyncStorage.getItem(LOCAL_SCHEMA_VERSION_KEY));

  if (storedVersion > CURRENT_LOCAL_SCHEMA_VERSION) {
    // Nunca intentar degradar datos escritos por una versión más nueva de la app.
    return;
  }

  for (let version = storedVersion + 1; version <= CURRENT_LOCAL_SCHEMA_VERSION; version += 1) {
    const migration = migrations[version];
    if (!migration) throw new Error(`No existe la migración local ${version}.`);

    await migration();
    await AsyncStorage.setItem(LOCAL_SCHEMA_VERSION_KEY, String(version));
  }
}
