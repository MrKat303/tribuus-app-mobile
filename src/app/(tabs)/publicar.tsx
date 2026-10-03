import Feather from '@/components/ui/AppIcon';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useThemeColors } from '@/context/AppearanceContext';
import { usePosts } from '@/context/PostsContext';
import { useProfile } from '@/context/ProfileContext';
import { MAX_POLL_OPTIONS, POST_CONTENT_LIMIT, usePostComposer } from '@/features/feed/hooks/usePostComposer';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';
import type { CommunityPostCategory } from '@/types/community';

type IconName = ComponentProps<typeof Feather>['name'];
const categories: { label: string; value: CommunityPostCategory }[] = [
  { label: 'Comunidad', value: 'comunidad' }, { label: 'Evento', value: 'evento' }, { label: 'Recomendación', value: 'recomendación' },
];

function ToolButton({ active, icon, label, onPress }: { active?: boolean; icon: IconName; label: string; onPress: () => void }) {
  const colors = useThemeColors();
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.tool, active && styles.toolActive, pressed && styles.pressed]}>
      <View style={[styles.toolIcon, active && styles.toolIconActive]}><Feather color={active ? colors.textOnPrimary : colors.primaryDark} name={icon} size={16} /></View>
      <AppText numberOfLines={1} style={styles.toolLabel} variant="caption">{label}</AppText>
    </Pressable>
  );
}

export default function PublishScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useStyles();
  const { addPost } = usePosts();
  const { profile } = useProfile();
  const initials = profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const {
    addPollOption, audioName, audioUri, canPublish, category, content, imageUri,
    isRecording, pickImage, pollEnabled, pollOptions, pollQuestion, recordingMillis,
    removeAudio, removePollOption, setCategory, setContent, setImageUri,
    setPollEnabled, setPollQuestion, submit, toggleRecording, updatePollOption,
  } = usePostComposer();

  async function publishPost() {
    try {
      if (await submit(addPost)) router.replace('/(tabs)/inicio');
    } catch (error) {
      Alert.alert('No se pudo publicar', error instanceof Error ? error.message : 'Intenta nuevamente.');
    }
  }

  return (
    <Screen scroll>
      <AppText variant="eyebrow">Comparte con tu comunidad</AppText>
      <AppText style={styles.title} variant="heading">Crear publicación</AppText>
      <AppText style={styles.subtitle}>Una idea, una foto, una encuesta o una nota de voz.</AppText>

      <Card style={styles.card}>
        <View style={styles.authorRow}>
          <View style={styles.avatar}><AppText style={styles.avatarText} variant="caption">{initials}</AppText></View>
          <View style={styles.authorCopy}><AppText variant="bodyStrong">{profile.name}</AppText><AppText variant="caption">Publicando en tu comunidad</AppText></View>
          <View style={styles.visibility}><Feather color={colors.primaryDark} name="users" size={12} /><AppText style={styles.visibilityText} variant="caption">Todos</AppText></View>
        </View>

        <TextInput accessibilityLabel="Contenido de la publicación" maxLength={POST_CONTENT_LIMIT} multiline onChangeText={setContent} placeholder="¿Qué quieres compartir?" placeholderTextColor={colors.textMuted} style={styles.contentInput} textAlignVertical="top" value={content} />
        <AppText style={[styles.counter, content.length >= POST_CONTENT_LIMIT - 20 && styles.counterWarning]} variant="caption">{content.length}/{POST_CONTENT_LIMIT}</AppText>

        {!audioUri && !isRecording ? (
          <Pressable accessibilityRole="button" onPress={() => void toggleRecording()} style={({ pressed }) => [styles.voiceRecord, pressed && styles.pressed]}>
            <View style={styles.voiceRecordIcon}><Feather color={colors.primaryDark} name="mic" size={16} /></View>
            <AppText style={styles.voiceRecordText} variant="caption">Grabar una nota de voz</AppText>
          </Pressable>
        ) : null}

        {imageUri ? <View style={styles.preview}><Image contentFit="cover" source={{ uri: imageUri }} style={styles.image} transition={180} /><Pressable accessibilityLabel="Quitar imagen" onPress={() => setImageUri(null)} style={styles.remove}><Feather color={colors.textOnDark} name="x" size={18} /></Pressable></View> : null}

        {pollEnabled ? (
          <View style={styles.pollEditor}>
            <View style={styles.editorHeading}><View style={styles.editorIcon}><Feather color={colors.primaryDark} name="bar-chart-2" size={17} /></View><AppText variant="bodyStrong">Encuesta</AppText><Pressable hitSlop={10} onPress={() => setPollEnabled(false)} style={styles.close}><Feather color={colors.textMuted} name="x" size={18} /></Pressable></View>
            <TextInput maxLength={100} onChangeText={setPollQuestion} placeholder="Haz una pregunta" placeholderTextColor={colors.textMuted} style={styles.pollQuestion} value={pollQuestion} />
            {pollOptions.map((option, index) => (
              <View key={index} style={styles.optionRow}>
                <View style={styles.optionNumber}><AppText style={styles.optionNumberText} variant="caption">{index + 1}</AppText></View>
                <TextInput maxLength={60} onChangeText={(value) => updatePollOption(index, value)} placeholder={`Opción ${index + 1}`} placeholderTextColor={colors.textMuted} style={styles.optionInput} value={option} />
                {pollOptions.length > 2 ? <Pressable hitSlop={8} onPress={() => removePollOption(index)}><Feather color={colors.textMuted} name="minus-circle" size={18} /></Pressable> : null}
              </View>
            ))}
            {pollOptions.length < MAX_POLL_OPTIONS ? <Pressable onPress={addPollOption} style={styles.addOption}><Feather color={colors.primaryDark} name="plus" size={16} /><AppText style={styles.addOptionText} variant="caption">Agregar opción</AppText></Pressable> : null}
          </View>
        ) : null}

        {audioUri || isRecording ? (
          <Pressable accessibilityRole="button" onPress={() => isRecording ? void toggleRecording() : undefined} style={[styles.audio, isRecording && styles.recording]}>
            <View style={[styles.audioIcon, isRecording && styles.recordingIcon]}><Feather color={isRecording ? colors.textOnDark : colors.primaryDark} name={isRecording ? 'mic' : 'volume-2'} size={18} /></View>
            <View style={styles.audioCopy}><AppText variant="bodyStrong">{isRecording ? 'Grabando…' : audioName ?? 'Audio adjunto'}</AppText><AppText variant="caption">{isRecording ? `${Math.round(recordingMillis / 1000)} s · toca detener` : 'Listo para publicar'}</AppText></View>
            {!isRecording ? <Pressable hitSlop={10} onPress={removeAudio}><Feather color={colors.textMuted} name="x" size={19} /></Pressable> : null}
          </Pressable>
        ) : null}

        <View style={styles.divider} />
        <AppText style={styles.addLabel} variant="caption">Añade algo a tu publicación</AppText>
        <View style={styles.tools}>
          <ToolButton active={Boolean(imageUri)} icon="image" label="Imagen" onPress={() => void pickImage()} />
          <ToolButton active={pollEnabled} icon="bar-chart-2" label="Encuesta" onPress={() => setPollEnabled((current) => !current)} />
          <ToolButton active={category === 'evento'} icon="calendar" label="Evento" onPress={() => setCategory('evento')} />
        </View>
        <View style={styles.categories}>{categories.map((item) => { const active = item.value === category; return <Pressable key={item.value} onPress={() => setCategory(item.value)} style={[styles.category, active && styles.categoryActive]}><AppText style={[styles.categoryText, active && styles.categoryTextActive]} variant="caption">{item.label}</AppText></Pressable>; })}</View>
        <AppButton disabled={!canPublish} icon="arrow-up-circle" label="Publicar ahora" onPress={() => void publishPost()} style={!canPublish ? styles.disabled : undefined} />
      </Card>
      <AppText style={styles.note} variant="caption">Tus publicaciones serán visibles para las personas de tu comunidad.</AppText>
    </Screen>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  title: { letterSpacing: -0.7, marginTop: spacing.xs }, subtitle: { color: colors.textMuted, marginTop: spacing.xs },
  card: { borderRadius: 20, marginTop: spacing.lg, padding: spacing.md, shadowOpacity: 0.06, shadowRadius: 12 },
  authorRow: { alignItems: 'center', flexDirection: 'row' }, avatar: { alignItems: 'center', backgroundColor: colors.text, borderRadius: radii.pill, height: 44, justifyContent: 'center', marginRight: spacing.md, width: 44 },
  avatarText: { color: colors.surface, fontFamily: typography.bodySemiBold, fontSize: 11 }, authorCopy: { flex: 1 }, visibility: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, flexDirection: 'row', gap: 4, minHeight: 30, paddingHorizontal: spacing.sm },
  visibilityText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 11 }, contentInput: { color: colors.text, fontFamily: typography.body, fontSize: 18, lineHeight: 26, minHeight: 128, paddingHorizontal: 0, paddingTop: spacing.xl },
  counter: { alignSelf: 'flex-end', color: colors.textMuted }, counterWarning: { color: colors.warning, fontFamily: typography.bodySemiBold }, preview: { marginTop: spacing.md, position: 'relative' }, image: { aspectRatio: 4 / 3, borderRadius: radii.md, width: '100%' },
  voiceRecord: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radii.pill, flexDirection: 'row', gap: 7, marginTop: spacing.sm, minHeight: 38, paddingHorizontal: 11 },
  voiceRecordIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.pill, height: 28, justifyContent: 'center', width: 28 },
  voiceRecordText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 10 },
  remove: { alignItems: 'center', backgroundColor: 'rgba(28,28,30,0.78)', borderRadius: radii.pill, height: 36, justifyContent: 'center', position: 'absolute', right: spacing.sm, top: spacing.sm, width: 36 },
  pollEditor: { backgroundColor: colors.surfaceMuted, borderRadius: radii.md, gap: spacing.sm, marginTop: spacing.md, padding: spacing.md }, editorHeading: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm }, editorIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 34, justifyContent: 'center', width: 34 }, close: { marginLeft: 'auto' },
  pollQuestion: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 14, minHeight: 44, paddingHorizontal: spacing.md },
  optionRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm }, optionNumber: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 26, justifyContent: 'center', width: 26 }, optionNumberText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold }, optionInput: { backgroundColor: colors.surface, borderRadius: radii.sm, color: colors.text, flex: 1, fontFamily: typography.body, fontSize: 14, minHeight: 44, paddingHorizontal: spacing.md },
  addOption: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.xs, minHeight: 36 }, addOptionText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold },
  audio: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.md, flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, padding: spacing.md }, recording: { backgroundColor: colors.dangerSoft }, audioIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.pill, height: 42, justifyContent: 'center', width: 42 }, recordingIcon: { backgroundColor: colors.danger }, audioCopy: { flex: 1 },
  divider: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth, marginTop: spacing.lg }, addLabel: { color: colors.textMuted, marginTop: spacing.md }, tools: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  tool: { alignItems: 'center', borderRadius: 14, flex: 1, gap: 4, minHeight: 62, paddingHorizontal: 2, paddingVertical: spacing.xs }, toolActive: { backgroundColor: colors.primarySoft }, toolIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 34, justifyContent: 'center', width: 34 }, toolIconActive: { backgroundColor: colors.primaryDark }, toolLabel: { color: colors.text, fontFamily: typography.bodyMedium, fontSize: 9 },
  categories: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg, marginTop: spacing.lg }, category: { backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, flex: 1, minHeight: 34, justifyContent: 'center', paddingHorizontal: spacing.xs }, categoryActive: { backgroundColor: colors.text }, categoryText: { fontFamily: typography.bodyMedium, fontSize: 10, textAlign: 'center' }, categoryTextActive: { color: colors.surface }, disabled: { opacity: 0.35 }, pressed: { opacity: 0.65, transform: [{ scale: 0.98 }] }, note: { marginTop: spacing.md, textAlign: 'center' },
}));
