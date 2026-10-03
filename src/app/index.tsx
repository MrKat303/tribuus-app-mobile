import Feather from '@/components/ui/AppIcon';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/BrandMark';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/context/AppearanceContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { spacing, typography } from '@/theme/tokens';

const welcomePoints = [
  { label: 'DESCUBRE', text: 'Lugares y panoramas recomendados por tus vecinos.' },
  { label: 'INFÓRMATE', text: 'Reportes y alertas relevantes cerca de ti.' },
  { label: 'PARTICIPA', text: 'Comparte lo que pasa y fortalece tu comunidad.' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useStyles();
  return (
    <SafeAreaView style={[styles.safeArea]}>
      <View style={styles.header}>
        <BrandMark />
        <View style={styles.location}>
          <Feather color={colors.primaryDark} name="map-pin" size={12} />
          <AppText style={styles.locationText} variant="caption">PROVIDENCIA</AppText>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={[styles.accentLine]} />
        <AppText style={styles.eyebrow} variant="eyebrow">TU BARRIO, MÁS CERCA</AppText>
        <AppText style={styles.title} variant="hero">
          Todo lo que importa en tu comunidad.
        </AppText>
        <AppText style={styles.subtitle}>
          Descubre, comparte y mantente al día con las personas y lugares que hacen barrio.
        </AppText>
      </View>

      <View style={[styles.points]}>
        {welcomePoints.map((point, index) => (
          <View key={point.label} style={[styles.point, index > 0 && styles.pointBorder]}>
            <AppText style={styles.pointNumber} variant="caption">0{index + 1}</AppText>
            <View style={styles.pointCopy}>
              <AppText style={styles.pointLabel} variant="caption">{point.label}</AppText>
              <AppText style={styles.pointText}>{point.text}</AppText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/signup')}
          style={({ pressed }) => [styles.enterButton, pressed && styles.pressed]}>
          <AppText style={[styles.enterLabel]} variant="bodyStrong">Crear mi cuenta</AppText>
          <Feather color={colors.textOnPrimary} name="arrow-right" size={17} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/login')}
          style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}>
          <AppText style={styles.loginLabel} variant="bodyStrong">Ya tengo una cuenta</AppText>
        </Pressable>
        <AppText style={styles.demoNote} variant="caption">
          Tu comunidad local, con identidad y privacidad
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  location: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  locationText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 9, letterSpacing: 0.6 },
  hero: { marginTop: spacing.xl },
  accentLine: { backgroundColor: colors.primaryDark, height: 3, marginBottom: spacing.lg, width: 38 },
  eyebrow: { marginBottom: spacing.md },
  title: { fontSize: 42, letterSpacing: -1.7, lineHeight: 46, maxWidth: 540 },
  subtitle: { color: colors.textMuted, fontSize: 16, lineHeight: 23, marginTop: spacing.lg, maxWidth: 500 },
  points: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.xl },
  point: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, minHeight: 68, paddingVertical: 12 },
  pointBorder: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
  pointNumber: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 9, marginTop: 2, width: 22 },
  pointCopy: { flex: 1 },
  pointLabel: { color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 9, letterSpacing: 0.75 },
  pointText: { color: colors.textMuted, fontSize: 12.5, lineHeight: 17, marginTop: 3 },
  footer: { gap: spacing.md, marginTop: spacing.xl },
  enterButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', minHeight: 54, paddingHorizontal: spacing.lg },
  enterLabel: { color: colors.textOnPrimary, fontFamily: typography.bodySemiBold, fontSize: 14 },
  loginButton: { alignItems: 'center', borderColor: colors.border, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 50, paddingHorizontal: spacing.lg },
  loginLabel: { color: colors.text, fontSize: 14 },
  demoNote: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 10, textAlign: 'center' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
}));
