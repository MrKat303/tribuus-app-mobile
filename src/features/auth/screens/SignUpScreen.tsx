import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAuth } from '@/features/auth/application/AuthProvider';
import { AuthField, AuthScaffold, AuthSubmitButton } from '@/features/auth/components/AuthScaffold';
import { makeThemedStyles } from '@/theme/themedStyles';
import { spacing, typography } from '@/theme/tokens';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const styles = useStyles();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (name.trim().length < 2) return setError('Escribe el nombre que verá tu comunidad.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Escribe un correo válido.');
    if (password.length < 8 || !/[A-ZÁÉÍÓÚÑ]/.test(password) || !/\d/.test(password)) {
      return setError('Usa al menos 8 caracteres, una mayúscula y un número.');
    }
    if (password !== confirmation) return setError('Las contraseñas no coinciden.');

    setSubmitting(true);
    setError(null);
    try {
      const result = await signUp(name, email, password);
      if (result.needsEmailConfirmation) {
        router.replace({ pathname: '/check-email', params: { email: email.trim().toLowerCase() } });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible crear la cuenta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      eyebrow="Únete a tu comunidad"
      subtitle="Crea una identidad local para publicar, conversar y guardar tus lugares favoritos."
      title="Crea tu cuenta">
      <AuthField
        autoCapitalize="words"
        autoComplete="name"
        label="Nombre visible"
        maxLength={80}
        onChangeText={setName}
        placeholder="Tu nombre"
        value={name}
      />
      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        inputMode="email"
        label="Correo electrónico"
        onChangeText={setEmail}
        placeholder="nombre@correo.com"
        value={email}
      />
      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        label="Contraseña"
        onChangeText={setPassword}
        placeholder="8+ caracteres, mayúscula y número"
        secureTextEntry
        value={password}
      />
      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        label="Repite la contraseña"
        onChangeText={setConfirmation}
        onSubmitEditing={() => void submit()}
        placeholder="Repite tu contraseña"
        secureTextEntry
        value={confirmation}
      />
      {error ? <AppText accessibilityRole="alert" style={styles.error} variant="caption">{error}</AppText> : null}
      <AuthSubmitButton disabled={submitting} label={submitting ? 'Creando cuenta…' : 'Crear cuenta'} onPress={() => void submit()} />
      <AppText style={styles.legal} variant="caption">
        Al continuar aceptas las normas de la comunidad y el uso de tus datos para operar tu cuenta.
      </AppText>
      <View style={styles.secondaryRow}>
        <AppText style={styles.secondaryCopy} variant="caption">¿Ya tienes cuenta?</AppText>
        <Link asChild href="/login">
          <Pressable accessibilityRole="link" style={styles.linkButton}>
            <AppText style={styles.link} variant="bodyStrong">Iniciar sesión</AppText>
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
  legal: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: spacing.md, textAlign: 'center' },
  secondaryRow: { alignItems: 'center', flexDirection: 'row', gap: 4, justifyContent: 'center', marginTop: spacing.lg },
  secondaryCopy: { color: colors.textMuted },
  linkButton: { justifyContent: 'center', minHeight: 44, paddingHorizontal: 4 },
  link: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 13 },
  backButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  backLabel: { color: colors.textMuted },
}));
