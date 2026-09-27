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

import { AppearanceProvider, useAppAppearance } from '@/context/AppearanceContext';
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

  return <AppearanceProvider><AppNavigator /></AppearanceProvider>;
}

function AppNavigator() {
  const { colors, isDark } = useAppAppearance();
  const appBackground = colors.background;
  const navigationTheme = createTribuusNavigationTheme(colors, isDark);

  return (
    <ThemeProvider value={navigationTheme}>
      <ProfileProvider><PlacesProvider><PostsProvider>
        <Stack
          screenOptions={{
            animation: 'fade',
            contentStyle: { backgroundColor: appBackground },
            headerShown: false,
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="discover/[category]" />
          <Stack.Screen name="configuracion" />
          <Stack.Screen name="ajustes/[section]" />
          <Stack.Screen name="notificaciones" />
          <Stack.Screen name="community-wallet" />
        </Stack>
      </PostsProvider></PlacesProvider></ProfileProvider>
      <StatusBar hidden style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
