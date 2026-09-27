import Feather from '@/components/ui/AppIcon';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppAppearance } from '@/context/AppearanceContext';
import { radii, spacing, typography } from '@/theme/tokens';

type IconName = ComponentProps<typeof Feather>['name'];

function TabIcon({ color, focused, label, name }: { color: ColorValue; focused: boolean; label: string; name: IconName }) {
  return (
    <View style={styles.tabItem}>
      <View style={styles.iconFrame}>
        <Feather color={color} name={name} size={19} />
      </View>
      <Text numberOfLines={1} style={[styles.label, { color }, focused && styles.labelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors: themeColors, isDark } = useAppAppearance();
  const insets = useSafeAreaInsets();
  const navigationInset = Math.max(insets.bottom, 12) + spacing.sm;

  return (
    <Tabs
      initialRouteName="inicio"
      screenOptions={{
        animation: 'none',
        headerShown: false,
        sceneStyle: { backgroundColor: themeColors.background },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.68)',
        tabBarHideOnKeyboard: true,
        tabBarIconStyle: { alignItems: 'center', alignSelf: 'center', height: 46, justifyContent: 'center', margin: 0, width: '100%' },
        tabBarItemStyle: { alignItems: 'center', borderRadius: radii.pill, flexBasis: 0, flexGrow: 1, height: 56, justifyContent: 'center', paddingHorizontal: 0 },
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: isDark ? themeColors.surfaceElevated : themeColors.primaryDark,
          borderColor: isDark ? themeColors.border : 'rgba(0,0,0,0.08)',
          borderRadius: 24,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderWidth: StyleSheet.hairlineWidth,
          bottom: navigationInset,
          end: spacing.xl,
          elevation: 7,
          height: 56,
          overflow: 'visible',
          paddingBottom: 0,
          paddingHorizontal: 0,
          paddingTop: 0,
          position: 'absolute',
          shadowColor: themeColors.shadow,
          shadowOffset: { height: 5, width: 0 },
          shadowOpacity: 0.08,
          shadowRadius: 14,
          start: spacing.xl,
        },
      }}>
      <Tabs.Screen name="inicio" options={{ tabBarAccessibilityLabel: 'Home', tabBarIcon: (props) => <TabIcon {...props} label="Home" name="home" />, title: 'Home' }} />
      <Tabs.Screen name="chat" options={{ tabBarAccessibilityLabel: 'Chat', tabBarIcon: (props) => <TabIcon {...props} label="Chat" name="message-circle" />, title: 'Chat' }} />
      <Tabs.Screen name="mapa" options={{ tabBarAccessibilityLabel: 'Maps', tabBarIcon: (props) => <TabIcon {...props} label="Maps" name="map" />, title: 'Maps' }} />
      <Tabs.Screen name="comunidad" options={{ tabBarAccessibilityLabel: 'Discover', tabBarIcon: (props) => <TabIcon {...props} label="Discover" name="compass" />, title: 'Discover' }} />
      <Tabs.Screen name="news" options={{ tabBarAccessibilityLabel: 'News', tabBarIcon: (props) => <TabIcon {...props} label="News" name="file-text" />, title: 'News' }} />
      <Tabs.Screen name="shop" options={{ href: null }} />
      <Tabs.Screen name="publicar" options={{ href: null }} />
      <Tabs.Screen name="perfil" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: 'center', alignSelf: 'center', height: 46, justifyContent: 'center', width: '100%' },
  iconFrame: { alignItems: 'center', alignSelf: 'center', height: 24, justifyContent: 'center', width: 40 },
  label: { fontFamily: typography.bodyMedium, fontSize: 9, lineHeight: 11, textAlign: 'center', width: '100%' },
  labelFocused: { fontFamily: typography.bodySemiBold },
});
