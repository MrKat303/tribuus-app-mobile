import { requireMinimumRuntimeConfiguration } from '@/config/runtime';
import { type AppThemeMode, readStoredThemeMode } from '@/theme/themeStorage';

import { runLocalMigrations } from './localMigrations';

export type ApplicationBootstrapResult = {
  themeMode: AppThemeMode;
};

let bootstrapPromise: Promise<ApplicationBootstrapResult> | null = null;

async function executeApplicationBootstrap(): Promise<ApplicationBootstrapResult> {
  requireMinimumRuntimeConfiguration();
  await runLocalMigrations();

  return {
    themeMode: await readStoredThemeMode() ?? 'light',
  };
}

export function bootstrapApplication() {
  bootstrapPromise ??= executeApplicationBootstrap();
  return bootstrapPromise;
}
