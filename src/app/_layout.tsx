import 'react-native-reanimated';

import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { Newsreader_600SemiBold, Newsreader_600SemiBold_Italic } from '@expo-google-fonts/newsreader';
import { useFonts } from 'expo-font';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { bootstrapApplication, type ApplicationBootstrapResult } from '@/bootstrap/applicationBootstrap';
import { AppearanceProvider, useAppAppearance } from '@/context/AppearanceContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CommunityWalletProvider } from '@/context/CommunityWalletContext';
import { PostsProvider } from '@/context/PostsContext';
import { PlacesProvider } from '@/context/PlacesContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { registerSupabaseAuthAutoRefresh } from '@/services/supabase';
import { createTribuusNavigationTheme } from '@/theme/navigation';

void SplashScreen.preventAutoHideAsync();

type BootstrapState =
  | { status: 'loading' }
  | { result: ApplicationBootstrapResult; status: 'ready' }
  | { error: Error; status: 'error' };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Newsreader_600SemiBold,
    Newsreader_600SemiBold_Italic,
  });
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    void bootstrapApplication()
      .then((result) => {
        if (active) setBootstrapState({ result, status: 'ready' });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const error = cause instanceof Error ? cause : new Error(String(cause));
        setBootstrapState({ error, status: 'error' });
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (bootstrapState.status !== 'ready') return undefined;
    return registerSupabaseAuthAutoRefresh();
  }, [bootstrapState.status]);

  if (bootstrapState.status === 'loading') return null;
  if (bootstrapState.status === 'error') return <BootstrapFailureScreen error={bootstrapState.error} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppearanceProvider initialThemeMode={bootstrapState.result.themeMode}>
        <AuthProvider>
          <AppNavigator fontsReady={fontsLoaded || Boolean(fontError)} />
        </AuthProvider>
      </AppearanceProvider>
    </GestureHandlerRootView>
  );
}

type AppNavigatorProps = {
  fontsReady: boolean;
};

function AppNavigator({ fontsReady }: AppNavigatorProps) {
  const { colors, isDark } = useAppAppearance();
  const { isLoading, isOnboarded, session } = useAuth();
  const appBackground = colors.background;
  const navigationTheme = createTribuusNavigationTheme(colors, isDark);
  const appReady = fontsReady && !isLoading;
  const hasHiddenSplash = useRef(false);

  useEffect(() => {
    if (!appReady || hasHiddenSplash.current) return;

    hasHiddenSplash.current = true;
    void SplashScreen.hideAsync();
  }, [appReady]);

  if (!appReady) return null;

  const navigator = (
    <Stack
      screenOptions={{
        animation: 'default',
        contentStyle: { backgroundColor: appBackground },
        headerShown: false,
      }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="check-email" />
        <Stack.Screen name="auth/callback" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session) && !isOnboarded}>
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session) && isOnboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[conversationId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="discover/[category]" />
        <Stack.Screen name="discover/item/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="configuracion" />
        <Stack.Screen name="ajustes/[section]" />
        <Stack.Screen name="notificaciones" />
        <Stack.Screen name="community-wallet" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="community-wallet/donate"
          options={{
            animation: 'default',
            presentation: 'formSheet',
            sheetAllowedDetents: [0.92],
            sheetCornerRadius: 24,
            sheetGrabberVisible: true,
            sheetInitialDetentIndex: 0,
          }}
        />
        <Stack.Screen name="community-wallet/propose" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen
          name="comments/[postId]"
          options={{
            animation: 'default',
            presentation: 'formSheet',
            sheetAllowedDetents: [0.92],
            sheetCornerRadius: 24,
            sheetGrabberVisible: true,
            sheetInitialDetentIndex: 0,
          }}
        />
      </Stack.Protected>
    </Stack>
  );

  return (
    <ThemeProvider value={navigationTheme}>
      {session && isOnboarded
        ? <ProfileProvider><PlacesProvider><PostsProvider><CommunityWalletProvider>{navigator}</CommunityWalletProvider></PostsProvider></PlacesProvider></ProfileProvider>
        : navigator}
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

function BootstrapFailureScreen({ error }: { error: Error }) {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <View style={styles.bootstrapError}>
      <Text style={styles.bootstrapErrorTitle}>No pudimos iniciar Tribuus</Text>
      <Text style={styles.bootstrapErrorMessage}>
        Revisa la configuración de la app y vuelve a abrirla.
      </Text>
      {__DEV__ ? <Text style={styles.bootstrapErrorDetail}>{error.message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bootstrapError: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  bootstrapErrorDetail: {
    color: '#6C6C70',
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
  bootstrapErrorMessage: {
    color: '#6C6C70',
    fontSize: 16,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  bootstrapErrorTitle: {
    color: '#1C1C1E',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
});
