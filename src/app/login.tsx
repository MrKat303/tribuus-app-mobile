import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAuth } from '@/context/AuthContext';
import { AuthField, AuthScaffold, AuthSubmitButton } from '@/features/auth/components/AuthScaffold';
import { makeThemedStyles } from '@/theme/themedStyles';
import { spacing, typography } from '@/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const styles = useStyles();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      eyebrow="Bienvenido de vuelta"
      subtitle="Entra para ver lo que está pasando cerca y participar en tu comunidad."
      title="Inicia sesión">
      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        inputMode="email"
        label="Correo electrónico"
        onChangeText={setEmail}
        placeholder="nombre@correo.com"
        returnKeyType="next"
        value={email}
      />
      <AuthField
        autoCapitalize="none"
        autoComplete="current-password"
        label="Contraseña"
        onChangeText={setPassword}
        onSubmitEditing={() => void submit()}
        placeholder="Tu contraseña"
        returnKeyType="done"
        secureTextEntry
        value={password}
      />
      {error ? <AppText accessibilityRole="alert" style={styles.error} variant="caption">{error}</AppText> : null}
      <AuthSubmitButton disabled={submitting} label={submitting ? 'Entrando…' : 'Entrar'} onPress={() => void submit()} />
      <View style={styles.secondaryRow}>
        <AppText style={styles.secondaryCopy} variant="caption">¿Todavía no tienes cuenta?</AppText>
        <Link asChild href="/signup">
          <Pressable accessibilityRole="link" style={styles.linkButton}>
            <AppText style={styles.link} variant="bodyStrong">Crear cuenta</AppText>
          </Pressable>
        </Link>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
        <AppText style={styles.backLabel} variant="caption">Volver</AppText>
      </Pressable>
    </AuthScaffold>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  error: { color: colors.danger, marginBottom: spacing.md },
  secondaryRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginTop: spacing.xl },
  secondaryCopy: { color: colors.textMuted },
  linkButton: { justifyContent: 'center', minHeight: 44, paddingHorizontal: 4 },
  link: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 13 },
  backButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, marginTop: spacing.md },
  backLabel: { color: colors.textMuted },
}));
