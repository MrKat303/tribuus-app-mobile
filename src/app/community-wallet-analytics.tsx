import { Screen } from '@/components/Screen';
import { AppText } from '@/components/ui/AppText';
import Feather from '@/components/ui/AppIcon';
import { useThemeColors } from '@/context/AppearanceContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, typography } from '@/theme/tokens';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const categories = [
  { color: '#34C759', label: 'Espacios públicos', percent: 38, value: '$89.000' },
  { color: '#217D38', label: 'Mantención', percent: 27, value: '$63.000' },
  { color: '#78A8FF', label: 'Seguridad', percent: 21, value: '$49.000' },
  { color: '#FFB75D', label: 'Actividades', percent: 14, value: '$33.000' },
];

function ActivityCurve() {
  return (
    <Svg height="150" viewBox="0 0 340 150" width="100%">
      <Defs>
        <LinearGradient id="area" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor="#34C759" stopOpacity="0.36" />
          <Stop offset="1" stopColor="#34C759" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d="M0 116C32 100 42 120 68 95S106 70 132 87s36 0 58-31 49 18 75-4 43-30 75-39v137H0Z" fill="url(#area)" />
      <Path d="M0 116C32 100 42 120 68 95S106 70 132 87s36 0 58-31 49 18 75-4 43-30 75-39" fill="none" stroke="#34C759" strokeLinecap="round" strokeWidth="3" />
      <Circle cx="265" cy="52" fill="#15552A" r="8" stroke="#34C759" strokeWidth="3" />
    </Svg>
  );
}

export default function CommunityWalletAnalyticsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useStyles();

  return (
    <Screen scroll swipeTabs={false}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Volver" hitSlop={10} onPress={() => router.back()} style={styles.iconButton}><Feather color={colors.text} name="arrow-left" size={20} /></Pressable>
        <AppText style={styles.headerTitle} variant="bodyStrong">Estadísticas</AppText>
        <View style={styles.iconButton}><Feather color={colors.text} name="share-2" size={18} /></View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroTop}><View><AppText style={styles.heroKicker} variant="caption">MOVIMIENTO COMUNITARIO</AppText><AppText style={styles.heroTitle} variant="heading">El fondo está creciendo</AppText></View><View style={styles.growthBadge}><Feather color="#FFFFFF" name="trending-up" size={13} /><AppText style={styles.growthText} variant="caption">8,3%</AppText></View></View>
        <AppText style={styles.heroValue} variant="hero">$234.000</AppText>
        <AppText style={styles.heroMeta} variant="caption">movidos durante septiembre</AppText>
        <ActivityCurve />
        <View style={styles.months}><AppText style={styles.month} variant="caption">OCT</AppText><AppText style={styles.month} variant="caption">ENE</AppText><AppText style={styles.month} variant="caption">ABR</AppText><AppText style={styles.month} variant="caption">SEP</AppText></View>
      </View>

      <View style={styles.metrics}>
        <View style={[styles.metric, styles.metricLime]}><Feather color="#FFFFFF" name="arrow-down-left" size={18} /><AppText style={styles.metricValueDark} variant="heading">$150K</AppText><AppText style={styles.metricLabelDark} variant="caption">Aportes</AppText></View>
        <View style={styles.metric}><Feather color={colors.primaryDark} name="arrow-up-right" size={18} /><AppText style={styles.metricValue} variant="heading">$130K</AppText><AppText style={styles.metricLabel} variant="caption">Gastos</AppText></View>
        <View style={styles.metric}><Feather color={colors.primaryDark} name="users" size={18} /><AppText style={styles.metricValue} variant="heading">28</AppText><AppText style={styles.metricLabel} variant="caption">Participantes</AppText></View>
      </View>

      <View style={styles.sectionHeader}><View><AppText style={styles.sectionTitle} variant="heading">¿En qué se usa?</AppText><AppText style={styles.sectionSubtitle} variant="caption">Distribución de los últimos 30 días</AppText></View><View style={styles.period}><AppText style={styles.periodText} variant="caption">Este mes</AppText><Feather color={colors.textMuted} name="chevron-down" size={13} /></View></View>
      <View style={styles.categoryCard}>
        {categories.map((category, index) => (
          <View key={category.label} style={[styles.category, index === categories.length - 1 && styles.categoryLast]}>
            <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
            <View style={styles.categoryCopy}><View style={styles.categoryLine}><AppText style={styles.categoryLabel} variant="bodyStrong">{category.label}</AppText><AppText style={styles.categoryValue} variant="bodyStrong">{category.value}</AppText></View><View style={styles.track}><View style={[styles.fill, { backgroundColor: category.color, width: `${category.percent}%` }]} /></View></View>
            <AppText style={styles.percent} variant="caption">{category.percent}%</AppText>
          </View>
        ))}
      </View>

      <View style={styles.transparencyNote}><View style={styles.noteIcon}><Feather color={colors.primaryDark} name="shield" size={17} /></View><View style={styles.noteCopy}><AppText style={styles.noteTitle} variant="bodyStrong">Datos transparentes</AppText><AppText style={styles.noteText} variant="caption">Cada movimiento puede revisarse con su comprobante y aprobación comunitaria.</AppText></View></View>
    </Screen>
  );
}

const useStyles = makeThemedStyles((colors) => StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  iconButton: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 42, justifyContent: 'center', width: 42 },
  headerTitle: { fontSize: 16 },
  hero: { backgroundColor: '#15552A', borderRadius: 26, overflow: 'hidden', paddingHorizontal: 18, paddingTop: 19 },
  heroTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  heroKicker: { color: '#FFFFFF', fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.8 },
  heroTitle: { color: '#FFFFFF', fontSize: 22, lineHeight: 28, marginTop: 3 },
  growthBadge: { alignItems: 'center', backgroundColor: '#34C759', borderRadius: radii.pill, flexDirection: 'row', gap: 4, paddingHorizontal: 9, paddingVertical: 6 },
  growthText: { color: '#FFFFFF', fontFamily: typography.bodySemiBold, fontSize: 9 },
  heroValue: { color: '#FFFFFF', fontSize: 36, lineHeight: 43, marginTop: 26 },
  heroMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
  months: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -10, paddingBottom: 13 },
  month: { color: 'rgba(255,255,255,0.38)', fontSize: 7 },
  metrics: { flexDirection: 'row', gap: 8, marginTop: 12 },
  metric: { backgroundColor: colors.surfaceMuted, borderRadius: 18, flex: 1, minHeight: 128, padding: 13 },
  metricLime: { backgroundColor: '#34C759' },
  metricValue: { fontSize: 20, lineHeight: 25, marginTop: 19 },
  metricValueDark: { color: '#FFFFFF', fontSize: 20, lineHeight: 25, marginTop: 19 },
  metricLabel: { color: colors.textMuted, fontSize: 9, marginTop: 3 },
  metricLabelDark: { color: 'rgba(255,255,255,0.76)', fontSize: 9, marginTop: 3 },
  sectionHeader: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  sectionTitle: { fontSize: 22, lineHeight: 28 },
  sectionSubtitle: { color: colors.textMuted, fontSize: 9, marginTop: 2 },
  period: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, flexDirection: 'row', gap: 4, paddingHorizontal: 10, paddingVertical: 7 },
  periodText: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 9 },
  categoryCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, marginTop: 13, paddingHorizontal: 14 },
  category: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, minHeight: 70 },
  categoryLast: { borderBottomWidth: 0 },
  categoryDot: { borderRadius: radii.pill, height: 12, width: 12 },
  categoryCopy: { flex: 1 },
  categoryLine: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  categoryLabel: { fontSize: 11 },
  categoryValue: { fontSize: 10 },
  track: { backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 5, marginTop: 8, overflow: 'hidden' },
  fill: { borderRadius: radii.pill, height: '100%' },
  percent: { color: colors.textMuted, fontSize: 8, textAlign: 'right', width: 28 },
  transparencyNote: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 18, flexDirection: 'row', gap: 11, marginBottom: 22, marginTop: 14, padding: 14 },
  noteIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, height: 39, justifyContent: 'center', width: 39 },
  noteCopy: { flex: 1 },
  noteTitle: { color: colors.primaryDark, fontSize: 11 },
  noteText: { color: colors.textMuted, fontSize: 9, lineHeight: 13, marginTop: 2 },
}));
