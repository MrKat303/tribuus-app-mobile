import Feather from '@/components/ui/AppIcon';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/context/AppearanceContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

type IconName = ComponentProps<typeof Feather>['name'];
type Report = { accent: string; author: string; category: string; comments: number; description: string; icon: IconName; id: string; initials: string; location: string; resolved?: boolean; time: string; title: string; useful: number };

const reports: Report[] = [
  { accent: '#248A3D', author: 'Camila R.', category: 'Seguridad', comments: 5, description: 'Un árbol cayó en la intersección de Los Leones con Suecia. Ya fue reportado a la municipalidad.', icon: 'check-circle', id: 'tree', initials: 'CR', location: 'Los Leones', resolved: true, time: 'Hace 2 horas', title: 'Árbol caído en la calle', useful: 24 },
  { accent: '#E9822B', author: 'Diego L.', category: 'Infraestructura', comments: 3, description: 'Hay un hoyo grande en la vereda, frente al colegio. Cuidado al pasar.', icon: 'alert-triangle', id: 'sidewalk', initials: 'DL', location: 'Villa Frei', time: 'Hace 4 horas', title: 'Hoyo en la vereda', useful: 9 },
  { accent: '#4D6FB8', author: 'María V.', category: 'Servicios', comments: 4, description: 'Los contenedores están llenos desde ayer. Algunos ya están ocupando parte del camino.', icon: 'tool', id: 'trash', initials: 'MV', location: 'Las Lilas', time: 'Hace 6 horas', title: 'Basura acumulada', useful: 12 },
];

function MiniMap() {
  const { colors: themeColors, isDark } = useAppAppearance();
  const styles = useStyles();

  return (
    <View style={[styles.miniMap, { backgroundColor: isDark ? '#182331' : '#EAF2FF' }]}>
      <View style={[styles.mapStreet, styles.mapStreetOne, { backgroundColor: isDark ? '#314257' : '#FFFFFF' }]} />
      <View style={[styles.mapStreet, styles.mapStreetTwo, { backgroundColor: isDark ? '#314257' : '#FFFFFF' }]} />
      <View style={[styles.mapBlock, { backgroundColor: isDark ? '#223326' : '#DDEBDF' }]} />
      <View style={[styles.mapAlert, { backgroundColor: themeColors.accent }]}><Feather color="#FFFFFF" name="alert-triangle" size={14} /></View>
    </View>
  );
}

function ReportVisual({ accent, icon }: { accent: string; icon: IconName }) {
  const styles = useStyles();
  return (
    <View style={[styles.reportVisual, { backgroundColor: `${accent}17` }]}>
      <View style={[styles.visualBlob, { backgroundColor: `${accent}20` }]} />
      <View style={[styles.visualIcon, { backgroundColor: accent }]}><Feather color="#FFFFFF" name={icon} size={20} /></View>
    </View>
  );
}

export default function NewsScreen() {
  const router = useRouter();
  const { colors: themeColors, isDark } = useAppAppearance();
  const styles = useStyles();
  const notificationColor = isDark ? '#88B8FF' : '#245FD6';
  const alertBackground = isDark ? '#102033' : '#EAF2FF';
  const alertBorder = isDark ? '#254565' : '#CFE0FF';

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View><AppText variant="eyebrow">INFORMACIÓN LOCAL</AppText><AppText style={styles.title} variant="heading">News</AppText></View>
        <Pressable accessibilityLabel="Notificaciones" onPress={() => router.push('/notificaciones')} style={[styles.notification, { backgroundColor: notificationColor }]}><Feather color="#FFFFFF" name="bell" size={18} /><View style={[styles.notificationDot, { backgroundColor: themeColors.warning, borderColor: themeColors.surface }]} /></Pressable>
      </View>

      <Pressable accessibilityRole="button" onPress={() => Alert.alert('Corte de agua', 'Revisa el detalle y las actualizaciones del corte programado.')} style={({ pressed }) => [styles.alertCard, { backgroundColor: alertBackground, borderColor: alertBorder }, pressed && styles.pressed]}>
        <View style={styles.alertCopy}>
          <View style={styles.alertLabel}><Feather color={notificationColor} name="alert-circle" size={12} /><AppText style={[styles.alertLabelText, { color: notificationColor }]} variant="caption">Alerta en tu zona</AppText></View>
          <AppText style={styles.alertTitle} variant="bodyStrong">Corte de agua</AppText>
          <View style={styles.alertMeta}><Feather color={themeColors.textMuted} name="map-pin" size={10} /><AppText style={[styles.alertMetaText, { color: themeColors.textMuted }]} variant="caption">Villa El Refugio · Hace 20 min</AppText></View>
          <AppText numberOfLines={3} style={[styles.alertDescription, { color: themeColors.text }]} variant="caption">Aguas Andinas informa un corte programado por trabajos en la red. Se estima reposición a las 18:00.</AppText>
        </View>
        <MiniMap />
        <View style={[styles.alertAction, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.58)' }]}><Feather color={themeColors.textMuted} name="info" size={12} /><AppText style={[styles.alertActionText, { color: themeColors.textMuted }]} variant="caption">Ver detalles</AppText><Feather color={themeColors.textMuted} name="chevron-right" size={13} /></View>
      </Pressable>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitle}><Feather color={themeColors.primaryDark} name="message-circle" size={17} /><AppText variant="bodyStrong">Reportes de la comunidad</AppText></View>
        <Pressable hitSlop={8}><AppText style={styles.seeAll} variant="caption">Ver todos  ›</AppText></Pressable>
      </View>

      <View style={[styles.reportList, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        {reports.map((report, index) => (
          <Pressable key={report.id} onPress={() => Alert.alert(report.title, report.description)} style={({ pressed }) => [styles.report, index > 0 && { borderTopColor: themeColors.border, borderTopWidth: StyleSheet.hairlineWidth }, pressed && styles.pressed]}>
            <ReportVisual accent={report.accent} icon={report.icon} />
            <View style={styles.reportBody}>
              <View style={styles.authorRow}>
                <View style={[styles.avatar, { backgroundColor: `${report.accent}1F` }]}><AppText style={[styles.avatarText, { color: report.accent }]} variant="caption">{report.initials}</AppText></View>
                <View style={styles.authorCopy}><AppText style={styles.author} variant="caption">{report.author}</AppText><AppText style={styles.reportTime} variant="caption">{report.location} · {report.time}</AppText></View>
                <View style={[styles.tag, { backgroundColor: `${report.accent}16` }]}><Feather color={report.accent} name={report.icon} size={9} /><AppText style={[styles.tagText, { color: report.accent }]} variant="caption">{report.resolved ? 'Resuelto' : report.category}</AppText></View>
                <Feather color={themeColors.textMuted} name="more-horizontal" size={15} />
              </View>
              <AppText style={styles.reportTitle} variant="bodyStrong">{report.title}</AppText>
              <AppText numberOfLines={2} style={[styles.reportDescription, { color: themeColors.textMuted }]} variant="caption">{report.description}</AppText>
              <View style={styles.metrics}><Feather color={themeColors.textMuted} name="heart" size={13} /><AppText style={[styles.metricText, { color: themeColors.textMuted }]} variant="caption">{report.useful}</AppText><Feather color={themeColors.textMuted} name="message-circle" size={13} /><AppText style={[styles.metricText, { color: themeColors.textMuted }]} variant="caption">{report.comments}</AppText><Feather color={themeColors.textMuted} name="send" size={13} /></View>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { letterSpacing: -0.7, marginTop: 2 },
  notification: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 40, justifyContent: 'center', position: 'relative', width: 40 },
  notificationDot: { backgroundColor: colors.danger, borderColor: colors.surface, borderRadius: radii.pill, borderWidth: 2, height: 9, position: 'absolute', right: 7, top: 7, width: 9 },
  outlined: { borderColor: colors.text, borderRadius: 12, borderWidth: 1.2 },
  alertCard: { backgroundColor: '#FFF0F1', borderColor: '#FFD9DD', borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.lg, overflow: 'hidden', padding: 13 },
  alertCopy: { flex: 1, paddingRight: 10 },
  alertLabel: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  alertLabelText: { color: colors.danger, fontFamily: typography.bodySemiBold, fontSize: 9 },
  alertTitle: { fontSize: 16, marginTop: 4 },
  alertMeta: { alignItems: 'center', flexDirection: 'row', gap: 3, marginTop: 2 },
  alertMetaText: { color: colors.textMuted, fontSize: 9 },
  alertDescription: { color: colors.text, fontSize: 10, lineHeight: 14, marginTop: 6 },
  miniMap: { backgroundColor: '#F4E6E7', borderRadius: 12, height: 92, overflow: 'hidden', position: 'relative', width: 92 },
  mapStreet: { backgroundColor: '#FFFFFF', height: 130, opacity: 0.86, position: 'absolute', width: 9 },
  mapStreetOne: { left: 38, top: -18, transform: [{ rotate: '18deg' }] },
  mapStreetTwo: { left: 60, top: -12, transform: [{ rotate: '-48deg' }] },
  mapBlock: { backgroundColor: '#E2E8DF', borderRadius: 5, height: 27, left: 7, position: 'absolute', top: 9, transform: [{ rotate: '-8deg' }], width: 25 },
  mapAlert: { alignItems: 'center', backgroundColor: colors.danger, borderColor: '#FFFFFF', borderRadius: radii.pill, borderWidth: 2, height: 30, justifyContent: 'center', left: 38, position: 'absolute', top: 31, width: 30 },
  alertAction: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.58)', borderRadius: radii.pill, flexDirection: 'row', gap: 4, marginTop: 10, minHeight: 25, paddingHorizontal: 9, width: '100%' },
  alertActionText: { color: colors.textMuted, flex: 1, fontFamily: typography.bodyMedium, fontSize: 9 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm, marginTop: spacing.xl },
  sectionTitle: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  seeAll: { color: colors.textMuted, fontSize: 10 },
  reportList: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  report: { flexDirection: 'row', gap: 10, minHeight: 138, padding: 10 },
  reportBorder: { borderTopColor: 'rgba(60,60,67,0.11)', borderTopWidth: StyleSheet.hairlineWidth },
  reportVisual: { alignItems: 'center', borderRadius: 12, height: 102, justifyContent: 'center', overflow: 'hidden', position: 'relative', width: 86 },
  visualBlob: { borderRadius: radii.pill, height: 78, position: 'absolute', right: -22, top: -18, width: 78 },
  visualIcon: { alignItems: 'center', borderColor: '#FFFFFF', borderRadius: radii.pill, borderWidth: 2, height: 38, justifyContent: 'center', width: 38 },
  reportBody: { flex: 1 },
  authorRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  avatar: { alignItems: 'center', borderRadius: radii.pill, height: 25, justifyContent: 'center', width: 25 },
  avatarText: { fontFamily: typography.bodySemiBold, fontSize: 8 },
  authorCopy: { flex: 1 },
  author: { color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 9 },
  reportTime: { color: colors.textMuted, fontSize: 7.5, marginTop: 1 },
  tag: { alignItems: 'center', borderRadius: radii.pill, flexDirection: 'row', gap: 3, minHeight: 20, paddingHorizontal: 6 },
  tagText: { fontFamily: typography.bodySemiBold, fontSize: 7 },
  reportTitle: { fontSize: 12, lineHeight: 15, marginTop: 6 },
  reportDescription: { color: colors.textMuted, fontSize: 9, lineHeight: 12, marginTop: 2 },
  metrics: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 7 },
  metricText: { color: colors.textMuted, fontSize: 8, marginRight: 4 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
}));
