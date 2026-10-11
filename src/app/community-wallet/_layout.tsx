import { Stack } from 'expo-router';

import { CommunityWalletProvider } from '@/features/community-wallet/application/CommunityWalletProvider';

export default function CommunityWalletLayout() {
  return (
    <CommunityWalletProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="submit-action"
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
          name="how-it-works"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen name="history" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="donate-preview"
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
          name="add-fund-entry"
          options={{
            animation: 'default',
            presentation: 'formSheet',
            sheetAllowedDetents: [0.92],
            sheetCornerRadius: 24,
            sheetGrabberVisible: true,
            sheetInitialDetentIndex: 0,
          }}
        />
        <Stack.Screen name="review" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </CommunityWalletProvider>
  );
}
