import Feather from '@/components/ui/AppIcon';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback, useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/context/AppearanceContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

type IconName = ComponentProps<typeof Feather>['name'];
type NotificationItem = {
  accent: string;
  body: string;
  icon: IconName;
  id: string;
  time: string;
  title: string;
  unread?: boolean;
};

const sections: { data: NotificationItem[]; title: string }[] = [
  {
    title: 'Hoy',
    data: [
      { accent: '#2F9E5B', body: 'Aguas Andinas informa corte programado en Villa El Refugio. Se estima reposición a las 18:00.', icon: 'alert-triangle', id: 'water', time: 'Hace 10 min', title: 'Corte de agua en tu zona', unread: true },
      { accent: '#4B8060', body: 'Camila R. comentó en “Árbol caído en la calle”: “Gracias por avisar, ya lo reporté también”.', icon: 'message-circle', id: 'comment', time: 'Hace 25 min', title: 'Nuevo comentario en tu publicación', unread: true },
      { accent: '#47A85A', body: 'Gracias por participar en “¿Qué medida ayudaría más a la seguridad vial en nuestro barrio?”.', icon: 'check-circle', id: 'poll', time: 'Hace 1 hora', title: 'Tu voto fue registrado' },
      { accent: '#F59E0B', body: 'Mañana es la jornada de limpieza del parque, de 10:00 a 13:00 · Parque Inés de Suárez.', icon: 'calendar', id: 'event', time: 'Hace 2 horas', title: 'Recordatorio de evento' },
    ],
  },
  {
    title: 'Ayer',
    data: [
      { accent: '#6366F1', body: 'Se publicó “Alimento para el refugio” en Los Leones. ¡Súmate y ayuda!', icon: 'users', id: 'initiative', time: 'Ayer, 18:24', title: 'Nueva iniciativa cerca de ti' },
      { accent: '#EC4899', body: 'Gracias por donar a “Biblioteca comunitaria”. Ya llevamos un 80% del objetivo.', icon: 'heart', id: 'donation', time: 'Ayer, 14:03', title: 'Tu donación hizo la diferencia' },
    ],
  },
  {
    title: 'Esta semana',
    data: [
      { accent: '#0EA5E9', body: 'Carabineros informa mayor patrullaje en el sector durante esta semana.', icon: 'shield', id: 'security', time: 'Lun, 2 de sep', title: 'Actualización de seguridad' },
      { accent: '#94A3B8', body: 'Gracias por ser parte de la comunidad. Juntos hacemos barrios más fuertes.', icon: 'settings', id: 'welcome', time: 'Lun, 2 de sep', title: 'Bienvenido a Tribus' },
    ],
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors: themeColors, isDark } = useAppAppearance();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const markRead = useCallback((id: string) => {
    setReadIds((current) => new Set(current).add(id));
  }, []);
  const markAllRead = useCallback(() => {
    setReadIds(new Set(sections.flatMap((section) => section.data.map((item) => item.id))));
  }, []);

  const renderItem = useCallback(({ item }: { item: NotificationItem }) => {
    const unread = Boolean(item.unread && !readIds.has(item.id));
    const unreadBackground = isDark ? themeColors.surfaceElevated : '#FBFFFC';
    const unreadBorder = isDark ? themeColors.border : '#DDEEE2';
    return (
      <Pressable
        accessibilityHint={unread ? 'Marca la notificación como leída' : undefined}
        accessibilityRole="button"
        onPress={() => markRead(item.id)}
        style={({ pressed }) => [styles.item, { backgroundColor: unread ? unreadBackground : themeColors.surface, borderColor: unread ? unreadBorder : themeColors.border }, pressed && styles.pressed]}>
        <View style={[styles.icon, { backgroundColor: `${item.accent}18` }]}><Feather color={item.accent} name={item.icon} size={19} /></View>
        <View style={styles.copy}>
          <View style={styles.itemTop}>
            <AppText numberOfLines={1} style={styles.itemTitle} variant="bodyStrong">{item.title}</AppText>
            <AppText style={styles.time} variant="caption">{item.time}</AppText>
            {unread ? <View style={styles.unreadDot} /> : null}
          </View>
          <AppText numberOfLines={2} style={styles.body} variant="caption">{item.body}</AppText>
        </View>
        <Feather color={themeColors.textMuted} name="chevron-right" size={15} />
      </Pressable>
    );
  }, [isDark, markRead, readIds, styles, themeColors]);

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Volver" hitSlop={8} onPress={() => router.back()} style={[styles.headerButton, { backgroundColor: themeColors.surfaceMuted }]}><Feather color={themeColors.text} name="chevron-left" size={21} /></Pressable>
        <AppText style={styles.headerTitle} variant="heading">Notificaciones</AppText>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={markAllRead} style={styles.markAll}><AppText style={styles.markAllText} variant="caption">Marcar todo</AppText></Pressable>
      </View>
      <SectionList
        contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 16) + spacing.lg }]}
        initialNumToRender={8}
        keyExtractor={(item) => item.id}
        maxToRenderPerBatch={8}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => <AppText style={styles.sectionTitle} variant="caption">{section.title}</AppText>}
        sections={sections}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        windowSize={6}
      />
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 54, paddingHorizontal: 16 },
  headerButton: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 38, justifyContent: 'center', width: 38 },  headerTitle: { flex: 1, fontSize: 20, letterSpacing: -0.4, marginLeft: 11 },
  markAll: { alignItems: 'flex-end', justifyContent: 'center', minHeight: 44, minWidth: 72 },
  markAllText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 10 },
  listContent: { alignSelf: 'center', maxWidth: 720, paddingHorizontal: 16, width: '100%' },
  sectionTitle: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 10, marginBottom: 7, marginTop: 15 },
  item: { alignItems: 'center', backgroundColor: colors.surface, borderColor: 'rgba(60,60,67,0.09)', borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10, marginBottom: 7, minHeight: 78, paddingHorizontal: 11, paddingVertical: 10 },
  itemUnread: { backgroundColor: '#FBFFFC', borderColor: '#DDEEE2' },  icon: { alignItems: 'center', borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 40 },  copy: { flex: 1 },
  itemTop: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  itemTitle: { flex: 1, fontSize: 11.5, lineHeight: 15 },
  time: { color: colors.textMuted, fontSize: 8 },
  unreadDot: { backgroundColor: colors.danger, borderRadius: radii.pill, height: 6, width: 6 },
  body: { color: colors.textMuted, fontSize: 9, lineHeight: 12.5, marginTop: 3 },
  pressed: { opacity: 0.66, transform: [{ scale: 0.99 }] },
}));
