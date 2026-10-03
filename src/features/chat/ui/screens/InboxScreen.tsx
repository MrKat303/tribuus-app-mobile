import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen } from '@/components/Screen';
import Feather from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/theme/AppearanceProvider';
import { chatRepository } from '@/features/chat/data/chat-repository';
import type { Conversation, InboxFilter } from '@/features/chat/domain/conversation';
import { filterConversations, inboxFilters } from '@/features/chat/domain/conversation';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function notificationPermissionGranted(permission: Notifications.NotificationPermissionsStatus) {
  if (permission.granted) return true;
  const iosStatus = permission.ios?.status;
  return iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED
    || iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL
    || iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL;
}

export default function InboxScreen() {
  const { colors, isDark } = useAppAppearance();
  const router = useRouter();
  const styles = useStyles();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all');
  const [testNotificationPending, setTestNotificationPending] = useState(false);

  useEffect(() => {
    let active = true;
    chatRepository.listConversations()
      .then((items) => { if (active) setConversations(items); })
      .catch(() => { if (active) Alert.alert('No pudimos cargar los chats', 'Inténtalo nuevamente en unos segundos.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleConversations = useMemo(
    () => filterConversations(conversations, inboxFilter, query),
    [conversations, inboxFilter, query],
  );
  const ownBubbleBackground = isDark ? '#248A3D' : colors.primaryDark;

  const scheduleTestNotification = async () => {
    if (testNotificationPending) return;
    setTestNotificationPending(true);
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('tests', {
          importance: Notifications.AndroidImportance.HIGH,
          name: 'Notificaciones de prueba',
          sound: 'default',
          vibrationPattern: [0, 180, 120, 180],
        });
      }
      let permission = await Notifications.getPermissionsAsync();
      if (!notificationPermissionGranted(permission)) {
        permission = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: true, allowSound: true } });
      }
      if (!notificationPermissionGranted(permission)) {
        Alert.alert('Notificaciones desactivadas', 'Actívalas en los ajustes del celular para recibir la prueba.');
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: { body: 'Las notificaciones están funcionando correctamente en este dispositivo.', data: { source: 'chat-test' }, sound: 'default', title: 'Notificación de prueba' },
        trigger: { channelId: Platform.OS === 'android' ? 'tests' : undefined, repeats: false, seconds: 3, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
      });
      Alert.alert('Prueba programada', 'Recibirás una notificación en aproximadamente 3 segundos.');
    } catch {
      Alert.alert('No se pudo programar', 'Revisa los permisos de notificaciones e inténtalo nuevamente.');
    } finally {
      setTestNotificationPending(false);
    }
  };

  return (
    <Screen>
      <View style={styles.inboxHeader}>
        <View><AppText variant="eyebrow">Tu comunidad</AppText><AppText style={styles.title} variant="heading">Chat</AppText></View>
        <View style={styles.inboxHeaderActions}>
          <Pressable accessibilityLabel="Enviar notificación de prueba" disabled={testNotificationPending} onPress={scheduleTestNotification} style={({ pressed }) => [styles.newButton, { backgroundColor: colors.surfaceMuted }, pressed && styles.buttonPressed]}>
            {testNotificationPending ? <ActivityIndicator color={colors.primaryDark} size="small" /> : <Feather color={colors.primaryDark} name="bell" size={17} />}
          </Pressable>
          <Pressable accessibilityLabel="Nuevo mensaje" style={({ pressed }) => [styles.newButton, { backgroundColor: colors.primarySoft }, pressed && styles.buttonPressed]}><Feather color={colors.primaryDark} name="edit-2" size={18} /></Pressable>
        </View>
      </View>

      <View style={[styles.search, { backgroundColor: colors.surfaceMuted }]}>
        <Feather color={colors.textMuted} name="search" size={16} />
        <TextInput accessibilityLabel="Buscar conversaciones" onChangeText={setQuery} placeholder="Buscar conversaciones" placeholderTextColor={colors.textMuted} returnKeyType="search" style={[styles.searchInput, { color: colors.text }]} value={query} />
        {query ? <Pressable accessibilityLabel="Limpiar búsqueda" hitSlop={8} onPress={() => setQuery('')}><Feather color={colors.textMuted} name="x-circle" size={17} /></Pressable> : null}
      </View>

      <ScrollView contentContainerStyle={styles.inboxFilters} horizontal keyboardShouldPersistTaps="handled" style={styles.inboxFiltersScroll} showsHorizontalScrollIndicator={false}>
        {inboxFilters.map((filter) => {
          const selected = inboxFilter === filter.id;
          return (
            <Pressable accessibilityLabel={`Mostrar ${filter.label.toLocaleLowerCase('es')}`} accessibilityRole="button" accessibilityState={{ selected }} hitSlop={{ bottom: 6, top: 6 }} key={filter.id} onPress={() => setInboxFilter(filter.id)} style={({ pressed }) => [styles.inboxFilter, { backgroundColor: selected ? colors.primarySoft : 'transparent', borderColor: selected ? colors.primary : colors.border }, pressed && styles.inboxFilterPressed]}>
              <AppText style={[styles.inboxFilterLabel, { color: selected ? colors.primaryDark : colors.textMuted }]} variant="caption">{filter.label}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        contentContainerStyle={styles.inbox}
        data={visibleConversations}
        initialNumToRender={10}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(conversation) => conversation.id}
        ListEmptyComponent={loading ? <ActivityIndicator color={colors.primaryDark} style={styles.loading} /> : <View style={styles.empty}><Feather color={colors.textMuted} name="message-circle" size={28} /><AppText variant="bodyStrong">No hay conversaciones aquí</AppText><AppText style={{ color: colors.textMuted, textAlign: 'center' }} variant="caption">Prueba otra categoría o cambia la búsqueda.</AppText></View>}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 35).duration(200)}>
            <Pressable accessibilityLabel={`Conversación con ${item.name}`} onPress={() => router.push({ pathname: '/chat/[conversationId]', params: { conversationId: item.id } })} style={({ pressed }) => [styles.chatRow, pressed && styles.rowPressed]}>
              <View style={[styles.avatar, { backgroundColor: item.accent }]}><AppText style={styles.initials} variant="caption">{item.initials}</AppText>{item.online ? <View style={[styles.onlineDot, { borderColor: colors.surface }]} /> : null}</View>
              <View style={[styles.chatCopy, { borderBottomColor: colors.border }]}>
                <View style={styles.chatTopLine}><AppText numberOfLines={1} style={styles.chatName} variant="bodyStrong">{item.name}</AppText><AppText style={[styles.chatTime, { color: colors.textMuted }]} variant="caption">{item.time}</AppText></View>
                <View style={styles.chatBottomLine}><AppText numberOfLines={1} style={[styles.preview, { color: item.unread ? colors.text : colors.textMuted }, Boolean(item.unread) && styles.previewUnread]} variant="caption">{item.lastMessage}</AppText>{item.unread ? <View style={[styles.unread, { backgroundColor: ownBubbleBackground }]}><AppText style={styles.unreadText} variant="caption">{item.unread}</AppText></View> : null}</View>
              </View>
            </Pressable>
          </Animated.View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  avatar: { alignItems: 'center', borderCurve: 'continuous', borderRadius: radii.pill, height: 52, justifyContent: 'center', marginRight: spacing.md, position: 'relative', width: 52 },
  buttonPressed: { opacity: 0.55 },
  chatBottomLine: { alignItems: 'center', flexDirection: 'row', marginTop: 3 },
  chatCopy: { borderBottomWidth: StyleSheet.hairlineWidth, flex: 1, justifyContent: 'center', minHeight: 68 },
  chatName: { flex: 1, fontSize: 15 },
  chatRow: { alignItems: 'center', flexDirection: 'row', minHeight: 76, paddingVertical: spacing.sm },
  chatTime: { fontSize: 11, fontVariant: ['tabular-nums'] },
  chatTopLine: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  empty: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingTop: spacing.hero },
  inbox: { paddingBottom: 100, paddingTop: spacing.sm },
  inboxFilter: { alignItems: 'center', borderCurve: 'continuous', borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 30, paddingHorizontal: 11 },
  inboxFilterLabel: { fontFamily: typography.bodyMedium, fontSize: 11, lineHeight: 14 },
  inboxFilterPressed: { opacity: 0.62 },
  inboxFilters: { gap: 6, paddingRight: spacing.sm, paddingVertical: 6 },
  inboxFiltersScroll: { flexGrow: 0, marginTop: 6 },
  inboxHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  inboxHeaderActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  initials: { color: colors.text, fontFamily: typography.bodySemiBold },
  loading: { marginTop: spacing.hero },
  newButton: { alignItems: 'center', borderCurve: 'continuous', borderRadius: radii.pill, height: 44, justifyContent: 'center', width: 44 },
  onlineDot: { backgroundColor: colors.primary, borderRadius: radii.pill, borderWidth: 2, bottom: 0, height: 13, position: 'absolute', right: 0, width: 13 },
  preview: { flex: 1 },
  previewUnread: { fontFamily: typography.bodyMedium },
  rowPressed: { backgroundColor: colors.surfaceMuted },
  search: { alignItems: 'center', borderCurve: 'continuous', borderRadius: radii.pill, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, minHeight: 44, paddingHorizontal: spacing.md },
  searchInput: { flex: 1, fontFamily: typography.body, fontSize: 14, paddingVertical: 0 },
  title: { letterSpacing: -0.6, marginTop: spacing.xs },
  unread: { alignItems: 'center', borderRadius: radii.pill, height: 20, justifyContent: 'center', marginLeft: spacing.sm, minWidth: 20, paddingHorizontal: 5 },
  unreadText: { color: '#FFFFFF', fontFamily: typography.bodySemiBold, fontSize: 10, fontVariant: ['tabular-nums'], lineHeight: 14 },
}));
