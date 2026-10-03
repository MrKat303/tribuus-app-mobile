import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

import { minimumRuntimeConfiguration } from '@/config/runtime';

const supabaseConfiguration = minimumRuntimeConfiguration.configuration ?? {
  supabasePublishableKey: 'configuration-unavailable',
  supabaseUrl: 'http://127.0.0.1:54321',
};

export const supabase = createClient(supabaseConfiguration.supabaseUrl, supabaseConfiguration.supabasePublishableKey, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function registerSupabaseAuthAutoRefresh() {
  if (Platform.OS === 'web') return () => undefined;

  const handleAppStateChange = (state: AppStateStatus) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  };

  handleAppStateChange(AppState.currentState);
  const subscription = AppState.addEventListener('change', handleAppStateChange);

  return () => {
    subscription.remove();
    supabase.auth.stopAutoRefresh();
  };
}
