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
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppearanceProvider, useAppAppearance } from '@/context/AppearanceContext';
import { CommunityWalletProvider } from '@/context/CommunityWalletContext';
import { PostsProvider } from '@/context/PostsContext';
import { PlacesProvider } from '@/context/PlacesContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { registerSupabaseAuthAutoRefresh } from '@/services/supabase';
import { createTribuusNavigationTheme } from '@/theme/navigation';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Newsreader_600SemiBold,
    Newsreader_600SemiBold_Italic,
  });

  useEffect(() => registerSupabaseAuthAutoRefresh(), []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;

  return <GestureHandlerRootView style={{ flex: 1 }}><AppearanceProvider><AppNavigator /></AppearanceProvider></GestureHandlerRootView>;
}

function AppNavigator() {
  const { colors, isDark } = useAppAppearance();
  const appBackground = colors.background;
  const navigationTheme = createTribuusNavigationTheme(colors, isDark);

  return (
    <ThemeProvider value={navigationTheme}>
      <ProfileProvider><PlacesProvider><PostsProvider><CommunityWalletProvider>
        <Stack
          screenOptions={{
            animation: 'fade',
            contentStyle: { backgroundColor: appBackground },
            headerShown: false,
          }}>
          <Stack.Screen name="index" />
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
        </Stack>
      </CommunityWalletProvider></PostsProvider></PlacesProvider></ProfileProvider>
      <StatusBar hidden style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
