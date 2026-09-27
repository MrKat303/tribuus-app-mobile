import Feather from '@/components/ui/AppIcon';
import { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/context/AppearanceContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

type Conversation = {
  accent: string;
  id: string;
  initials: string;
  lastMessage: string;
  name: string;
  online?: boolean;
  time: string;
  unread?: number;
};

type Message = { id: string; mine: boolean; text: string; time: string };

const conversations: Conversation[] = [
  { accent: '#DDF4E5', id: 'cami', initials: 'CA', lastMessage: 'Sí, nos vemos afuera del café ☕', name: 'Camila Andrade', online: true, time: '10:42', unread: 2 },
  { accent: '#E6EEFF', id: 'diego', initials: 'DM', lastMessage: 'Te envié la dirección del evento.', name: 'Diego Morales', time: 'Ayer' },
  { accent: '#F7E8EE', id: 'sofia', initials: 'SP', lastMessage: '¡Gracias por la recomendación!', name: 'Sofía Pérez', online: true, time: 'Lun' },
  { accent: '#F4EEDC', id: 'vecinos', initials: 'VP', lastMessage: 'Nicolás: puedo llevar bolsas.', name: 'Vecinos de Providencia', time: 'Dom', unread: 4 },
];

const initialMessages: Message[] = [
  { id: 'm1', mine: false, text: 'Hola, ¿vas al encuentro del sábado?', time: '10:35' },
  { id: 'm2', mine: true, text: 'Sí, pensaba llegar cerca de las once.', time: '10:38' },
  { id: 'm3', mine: false, text: 'Sí, nos vemos afuera del café ☕', time: '10:42' },
];

export default function ChatScreen() {
  const { colors: themeColors, isDark } = useAppAppearance();
  const styles = useStyles();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState(initialMessages);

  const visibleConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es');
    if (!normalizedQuery) return conversations;
    return conversations.filter((conversation) =>
      `${conversation.name} ${conversation.lastMessage}`.toLocaleLowerCase('es').includes(normalizedQuery),
    );
  }, [query]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [...current, { id: `local-${current.length}`, mine: true, text, time: 'Ahora' }]);
    setDraft('');
  };

  const ownBubbleBackground = isDark ? '#248A3D' : themeColors.primaryDark;
  const ownBubbleText = '#FFFFFF';

  if (selected) {
    return (
      <Screen swipeTabs={false}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.conversationScreen}>
          <View style={[styles.conversationHeader, { borderBottomColor: themeColors.border }]}>
            <Pressable accessibilityLabel="Volver a conversaciones" hitSlop={8} onPress={() => setSelected(null)} style={styles.headerButton}>
              <Feather color={themeColors.text} name="chevron-left" size={23} />
            </Pressable>
            <View style={styles.personHeading}>
              <View style={[styles.smallAvatar, { backgroundColor: selected.accent }]}>
                <AppText style={styles.smallInitials} variant="caption">{selected.initials}</AppText>
                {selected.online ? <View style={[styles.onlineDot, { borderColor: themeColors.surface }]} /> : null}
              </View>
              <View>
                <AppText variant="bodyStrong">{selected.name}</AppText>
                <AppText style={[styles.onlineText, { color: themeColors.primaryDark }]} variant="caption">{selected.online ? 'En línea' : 'Comunidad'}</AppText>
              </View>
            </View>
            <Pressable accessibilityLabel="Opciones de conversación" style={styles.headerButton}>
              <Feather color={themeColors.text} name="more-horizontal" size={21} />
            </Pressable>
          </View>

          <FlatList
            contentContainerStyle={styles.messages}
            data={messages}
            initialNumToRender={12}
            keyExtractor={(message) => message.id}
            renderItem={({ item }) => (
              <View style={[styles.messageRow, item.mine && styles.messageRowMine]}>
                <View style={[
                  styles.bubble,
                  item.mine ? [styles.bubbleMine, { backgroundColor: ownBubbleBackground }] : [styles.bubbleOther, { backgroundColor: themeColors.surfaceMuted }],
                ]}>
                  <AppText style={item.mine && { color: ownBubbleText }}>{item.text}</AppText>
                </View>
                <AppText style={[styles.messageTime, { color: themeColors.textMuted }]} variant="caption">{item.time}</AppText>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />

          <View style={[styles.composer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Pressable accessibilityLabel="Adjuntar" style={styles.composerButton}>
              <Feather color={themeColors.textMuted} name="paperclip" size={19} />
            </Pressable>
            <TextInput
              accessibilityLabel="Mensaje"
              multiline
              onChangeText={setDraft}
              placeholder="Escribe un mensaje"
              placeholderTextColor={themeColors.textMuted}
              style={[styles.input, { color: themeColors.text }]}
              value={draft}
            />
            <Pressable accessibilityLabel="Enviar mensaje" disabled={!draft.trim()} onPress={sendMessage} style={[styles.sendButton, { backgroundColor: ownBubbleBackground }, !draft.trim() && styles.sendButtonDisabled]}>
              <Feather color={ownBubbleText} name="send" size={17} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.inboxHeader}>
        <View>
          <AppText variant="eyebrow">Tu comunidad</AppText>
          <AppText style={styles.title} variant="heading">Chat</AppText>
        </View>
        <Pressable accessibilityLabel="Nuevo mensaje" style={[styles.newButton, { backgroundColor: themeColors.primarySoft }]}>
          <Feather color={themeColors.primaryDark} name="edit-2" size={18} />
        </Pressable>
      </View>

      <View style={[styles.search, { backgroundColor: themeColors.surfaceMuted }]}>
        <Feather color={themeColors.textMuted} name="search" size={16} />
        <TextInput
          accessibilityLabel="Buscar conversaciones"
          onChangeText={setQuery}
          placeholder="Buscar conversaciones"
          placeholderTextColor={themeColors.textMuted}
          style={[styles.searchInput, { color: themeColors.text }]}
          value={query}
        />
        {query ? (
          <Pressable accessibilityLabel="Limpiar búsqueda" hitSlop={8} onPress={() => setQuery('')}>
            <Feather color={themeColors.textMuted} name="x-circle" size={17} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        contentContainerStyle={styles.inbox}
        data={visibleConversations}
        initialNumToRender={10}
        keyExtractor={(conversation) => conversation.id}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Feather color={themeColors.textMuted} name="message-circle" size={28} />
            <AppText variant="bodyStrong">No encontramos conversaciones</AppText>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelected(item)} style={({ pressed }) => [styles.chatRow, pressed && styles.pressed]}>
            <View style={[styles.avatar, { backgroundColor: item.accent }]}>
              <AppText style={styles.initials} variant="caption">{item.initials}</AppText>
              {item.online ? <View style={[styles.onlineDot, { borderColor: themeColors.surface }]} /> : null}
            </View>
            <View style={[styles.chatCopy, { borderBottomColor: themeColors.border }]}>
              <View style={styles.chatTopLine}>
                <AppText numberOfLines={1} style={styles.chatName} variant="bodyStrong">{item.name}</AppText>
                <AppText style={[styles.chatTime, { color: themeColors.textMuted }]} variant="caption">{item.time}</AppText>
              </View>
              <View style={styles.chatBottomLine}>
                <AppText numberOfLines={1} style={[styles.preview, { color: Boolean(item.unread) ? themeColors.text : themeColors.textMuted }, Boolean(item.unread) && styles.previewUnread]} variant="caption">{item.lastMessage}</AppText>
                {item.unread ? <View style={[styles.unread, { backgroundColor: ownBubbleBackground }]}><AppText style={[styles.unreadText, { color: ownBubbleText }]} variant="caption">{item.unread}</AppText></View> : null}
              </View>
            </View>
          </Pressable>
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  inboxHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { letterSpacing: -0.6, marginTop: spacing.xs },
  newButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 44, justifyContent: 'center', width: 44 },
  search: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, minHeight: 44, paddingHorizontal: spacing.md },
  searchInput: { color: colors.text, flex: 1, fontFamily: typography.body, fontSize: 14, paddingVertical: 0 },
  inbox: { paddingBottom: 100, paddingTop: spacing.md },
  chatRow: { alignItems: 'center', flexDirection: 'row', minHeight: 76, paddingVertical: spacing.sm },
  avatar: { alignItems: 'center', borderRadius: radii.pill, height: 52, justifyContent: 'center', marginRight: spacing.md, position: 'relative', width: 52 },
  initials: { color: colors.text, fontFamily: typography.bodySemiBold },
  onlineDot: { backgroundColor: colors.primary, borderColor: colors.surface, borderRadius: radii.pill, borderWidth: 2, bottom: 0, height: 13, position: 'absolute', right: 0, width: 13 },
  chatCopy: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flex: 1, justifyContent: 'center', minHeight: 68 },
  chatTopLine: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  chatName: { flex: 1, fontSize: 15 },
  chatTime: { color: colors.textMuted, fontSize: 11 },
  chatBottomLine: { alignItems: 'center', flexDirection: 'row', marginTop: 3 },
  preview: { color: colors.textMuted, flex: 1 },
  previewUnread: { color: colors.text, fontFamily: typography.bodyMedium },
  unread: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: radii.pill, height: 20, justifyContent: 'center', marginLeft: spacing.sm, minWidth: 20, paddingHorizontal: 5 },
  unreadText: { color: colors.surface, fontFamily: typography.bodySemiBold, fontSize: 10, lineHeight: 14 },
  empty: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.hero },
  conversationScreen: { flex: 1 },
  conversationHeader: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 58, paddingBottom: spacing.sm },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 38 },
  personHeading: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.sm },
  smallAvatar: { alignItems: 'center', borderRadius: radii.pill, height: 38, justifyContent: 'center', position: 'relative', width: 38 },
  smallInitials: { color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 10 },
  onlineText: { color: colors.primaryDark, fontSize: 10, lineHeight: 13 },
  messages: { gap: spacing.sm, paddingBottom: spacing.md, paddingTop: spacing.lg },
  messageRow: { alignItems: 'flex-start', maxWidth: '82%' },
  messageRowMine: { alignItems: 'flex-end', alignSelf: 'flex-end' },
  bubble: { borderRadius: 18, paddingHorizontal: spacing.md, paddingVertical: 9 },
  bubbleOther: { backgroundColor: colors.surfaceMuted, borderBottomLeftRadius: 5 },
  bubbleMine: { backgroundColor: colors.primaryDark, borderBottomRightRadius: 5 },
  messageMine: { color: colors.surface },
  messageTime: { color: colors.textMuted, fontSize: 9, lineHeight: 12, marginHorizontal: 4, marginTop: 2 },
  composer: { alignItems: 'flex-end', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 4, marginBottom: 88, padding: 5 },
  composerButton: { alignItems: 'center', height: 38, justifyContent: 'center', width: 38 },
  input: { color: colors.text, flex: 1, fontFamily: typography.body, fontSize: 14, maxHeight: 90, minHeight: 38, paddingHorizontal: spacing.xs, paddingVertical: 8 },
  sendButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: radii.pill, height: 38, justifyContent: 'center', width: 38 },
  sendButtonDisabled: { opacity: 0.35 },
  outlined: { borderColor: colors.text, borderWidth: 1.2 },
  pressed: { opacity: 0.68 },
}));
