import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/theme/AppearanceProvider';
import { makeThemedStyles } from '@/theme/themedStyles';
import { spacing } from '@/theme/tokens';

export default function AuthCallbackScreen() {
  const colors = useThemeColors();
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <ActivityIndicator color={colors.primaryDark} size="large" />
        <AppText variant="heading">Confirmando tu cuenta</AppText>
        <AppText style={styles.copy}>Esto tomará solo un momento.</AppText>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { alignItems: 'center', flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.xl },
  copy: { color: colors.textMuted },
}));
