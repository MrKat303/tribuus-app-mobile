import { Stack } from 'expo-router';

import { CommunityWalletProvider } from '@/features/community-wallet/application/CommunityWalletProvider';

export default function CommunityWalletLayout() {
  return (
    <CommunityWalletProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="donate"
          options={{
            animation: 'default',
            presentation: 'formSheet',
            sheetAllowedDetents: [0.92],
            sheetCornerRadius: 24,
            sheetGrabberVisible: true,
            sheetInitialDetentIndex: 0,
          }}
        />
        <Stack.Screen
          name="propose"
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
      </Stack>
    </CommunityWalletProvider>
  );
}
