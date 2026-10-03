import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { AuthScaffold, AuthSubmitButton } from '@/features/auth/components/AuthScaffold';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing } from '@/theme/tokens';

export default function CheckEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const styles = useStyles();
  return (
    <AuthScaffold
      eyebrow="Un paso más"
      subtitle="Protegemos cada cuenta verificando que el correo realmente te pertenece."
      title="Revisa tu correo">
      <View style={styles.notice}>
        <AppText variant="bodyStrong">Enviamos un enlace de confirmación</AppText>
        <AppText selectable style={styles.email}>{email ?? 'a tu correo'}</AppText>
        <AppText style={styles.copy} variant="caption">
          Ábrelo desde este dispositivo. Tribus continuará automáticamente con tu perfil y ubicación.
        </AppText>
      </View>
      <AuthSubmitButton label="Volver a iniciar sesión" onPress={() => router.replace('/login')} />
    </AuthScaffold>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  notice: { backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.md, gap: spacing.sm, marginBottom: spacing.xl, padding: spacing.lg },
  email: { color: colors.primaryDark },
  copy: { color: colors.textMuted },
}));
