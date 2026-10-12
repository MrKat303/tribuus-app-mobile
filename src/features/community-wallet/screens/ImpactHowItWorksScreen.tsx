import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useCommunityWallet } from '@/features/community-wallet/application/CommunityWalletProvider';
import { useAppAppearance } from '@/theme/AppearanceProvider';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, typography } from '@/theme/tokens';

const steps = [
  { icon: 'file-text' as const, number: '1', title: 'Revisa la caja', text: 'Consulta el monto disponible y cada donación o gasto registrado en pesos chilenos.' },
  { icon: 'users' as const, number: '2', title: 'Súmate a iniciativas', text: 'Encuentra proyectos de tu barrio y colabora con objetos, tiempo o ayuda práctica.' },
  { icon: 'award' as const, number: '3', title: 'Suma puntos', text: 'Cuando una persona responsable confirme tu aporte, recibirás puntos comunitarios.' },
];

export function ImpactHowItWorksScreen() {
  const router = useRouter();
  const { colors } = useAppAppearance();
  const { rules } = useCommunityWallet();
  const styles = useStyles();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Volver" hitSlop={8} onPress={() => router.back()} style={styles.headerButton}><AppIcon color={colors.text} name="chevron-left" size={24} /></Pressable>
        <AppText style={styles.headerTitle} variant="bodyStrong">Cómo funciona</AppText>
        <View style={styles.headerButton} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><AppIcon color={colors.primaryDark} name="award" size={26} /></View>
          <AppText style={styles.heroTitle} variant="heading">Community Wallet para apoyar tu barrio</AppText>
          <AppText style={styles.heroText} variant="caption">Consulta la caja comunitaria, revisa en qué se usan los fondos y sigue lo que el barrio logra en conjunto.</AppText>
        </View>

        <AppText style={styles.sectionLabel} variant="eyebrow">Proceso</AppText>
        <View style={styles.steps}>
          {steps.map((step, index) => (
            <View key={step.number} style={styles.stepRow}>
              <View style={styles.stepRail}>
                <View style={styles.stepIcon}><AppIcon color={colors.primaryDark} name={step.icon} size={17} /></View>
                {index < steps.length - 1 ? <View style={styles.railLine} /> : null}
              </View>
              <View style={styles.stepCopy}>
                <AppText style={styles.stepNumber} variant="caption">PASO {step.number}</AppText>
                <AppText style={styles.stepTitle} variant="bodyStrong">{step.title}</AppText>
                <AppText style={styles.stepText} variant="caption">{step.text}</AppText>
              </View>
            </View>
          ))}
        </View>

        <AppText style={styles.sectionLabel} variant="eyebrow">Formas de aportar</AppText>
        <View style={styles.rulesCard}>
          {rules.map((rule, index) => (
            <View key={rule.code} style={[styles.ruleRow, index > 0 && styles.ruleDivider]}>
              <View style={styles.ruleCopy}>
                <AppText style={styles.ruleTitle} variant="bodyStrong">{rule.label}</AppText>
                <AppText style={styles.rulePolicy} variant="caption">{rule.verificationPolicy}</AppText>
              </View>
              <AppText style={styles.rulePoints} variant="bodyStrong">+{rule.points}</AppText>
            </View>
          ))}
        </View>
        <AppText style={styles.rulesFootnote} variant="caption">Los puntos reconocen tu participación y se asignan después de que la comunidad confirme cada aporte.</AppText>

        <AppText style={styles.sectionLabel} variant="eyebrow">Transparencia de la caja</AppText>
        <View style={styles.storageGrid}>
          <View style={styles.storageCard}>
            <View style={styles.storageIcon}><AppIcon color={colors.primaryDark} name="arrow-down-left" size={18} /></View>
            <AppText style={styles.storageTitle} variant="bodyStrong">Donaciones</AppText>
            <AppText style={styles.storageText} variant="caption">Cada aporte en CLP aumenta el monto disponible y queda visible en el historial.</AppText>
          </View>
          <View style={styles.storageCard}>
            <View style={styles.storageIcon}><AppIcon color={colors.danger} name="arrow-up-right" size={18} /></View>
            <AppText style={styles.storageTitle} variant="bodyStrong">Gastos</AppText>
            <AppText style={styles.storageText} variant="caption">Cada uso de fondos descuenta del monto en caja y conserva su concepto y fecha.</AppText>
          </View>
        </View>

        <View style={styles.boundaryCard}>
          <AppIcon color={colors.primaryDark} name="shield" size={19} />
          <View style={styles.boundaryCopy}>
            <AppText variant="bodyStrong">Un registro transparente</AppText>
            <AppText style={styles.boundaryText} variant="caption">Community Wallet informa movimientos ya realizados. Los moderadores registran la caja; la app no procesa pagos.</AppText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) => StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 54, paddingHorizontal: 8 },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  headerTitle: { flex: 1, fontSize: 16, textAlign: 'center' },
  content: { alignSelf: 'center', maxWidth: 720, paddingBottom: 48, paddingHorizontal: 16, width: '100%' },
  hero: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 28 },
  heroIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 20, height: 56, justifyContent: 'center', width: 56 },
  heroTitle: { fontSize: 25, lineHeight: 31, marginTop: 14, maxWidth: 440, textAlign: 'center' },
  heroText: { lineHeight: 19, marginTop: 8, maxWidth: 480, textAlign: 'center' },
  sectionLabel: { fontSize: 10, marginBottom: 10, marginTop: 28 },
  steps: { gap: 0 },
  stepRow: { flexDirection: 'row' },
  stepRail: { alignItems: 'center', width: 44 },
  stepIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 14, height: 38, justifyContent: 'center', width: 38 },
  railLine: { backgroundColor: colors.border, flex: 1, marginVertical: 4, width: 1 },
  stepCopy: { flex: 1, minHeight: 94, paddingBottom: 16, paddingLeft: 10, paddingTop: 1 },
  stepNumber: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.6 },
  stepTitle: { fontSize: 14, marginTop: 2 },
  stepText: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  rulesCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  ruleRow: { alignItems: 'center', flexDirection: 'row', minHeight: 64, padding: 12 },
  ruleDivider: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
  ruleCopy: { flex: 1, paddingRight: 12 },
  ruleTitle: { fontSize: 13 },
  rulePolicy: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  rulePoints: { color: colors.primaryDark, fontSize: 15, fontVariant: ['tabular-nums'] },
  rulesFootnote: { fontSize: 10, lineHeight: 15, marginHorizontal: 4, marginTop: 7 },
  storageGrid: { flexDirection: 'row', gap: 8 },
  storageCard: { backgroundColor: colors.surfaceMuted, borderRadius: radii.sm, flex: 1, padding: 13 },
  storageIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, height: 34, justifyContent: 'center', marginBottom: 9, width: 34 },
  storageTitle: { fontSize: 13 },
  storageText: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  boundaryCard: { alignItems: 'flex-start', backgroundColor: colors.warmSoft, borderRadius: radii.sm, flexDirection: 'row', gap: 10, marginTop: 24, padding: 14 },
  boundaryCopy: { flex: 1 },
  boundaryText: { fontSize: 10, lineHeight: 15, marginTop: 3 },
}));
