import * as Haptics from 'expo-haptics';
import { memo, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/context/AppearanceContext';
import { POST_CONTENT_LIMIT, usePostComposer } from '@/features/feed/hooks/usePostComposer';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';
import type { CommunityPostDraft } from '@/types/community';

import { PostMediaGrid } from './PostMediaGrid';

export type InlinePostDraft = CommunityPostDraft;
type PublishPhase = 'idle' | 'publishing' | 'success';

type InlineFeedComposerProps = {
  onCreatePost: (draft: InlinePostDraft) => Promise<void>;
};

export const InlineFeedComposer = memo(function InlineFeedComposer({ onCreatePost }: InlineFeedComposerProps) {
  const { colors: themeColors } = useAppAppearance();
  const styles = useStyles();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [publishPhase, setPublishPhase] = useState<PublishPhase>('idle');
  const composerOpacity = useSharedValue(1);
  const composerScale = useSharedValue(1);
  const {
    audioName, audioUri, canPublish, content, discard, eventDate, eventEnabled,
    eventLocation, eventTitle, images, imageUri, isRecording, pickImage, pollEnabled,
    pollOptions, pollQuestion, recordingMillis, removeAudio, removeImage, setContent,
    setEventDate, setEventEnabled, setEventLocation, setEventTitle,
    setPollEnabled, setPollQuestion, submit, toggleRecording, updatePollOption,
  } = usePostComposer();
  const composerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: composerOpacity.get(),
    transform: [{ scale: composerScale.get() }],
  }));

  async function closeComposer() {
    await discard();
    setOpen(false);
    Keyboard.dismiss();
  }

  async function publish() {
    if (!canPublish || publishPhase !== 'idle') return;

    setPublishPhase('publishing');
    if (!reduceMotion) composerScale.set(withTiming(0.98, { duration: 180 }));
    composerOpacity.set(withTiming(0.88, { duration: 180 }));
    try {
      if (await submit(onCreatePost)) {
        setPublishPhase('success');
        composerOpacity.set(withTiming(1, { duration: 140 }));
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        await new Promise((resolve) => setTimeout(resolve, 420));
        composerOpacity.set(withTiming(0, { duration: 160 }));
        await new Promise((resolve) => setTimeout(resolve, 165));
        setOpen(false);
        Keyboard.dismiss();
      }
    } catch (error) {
      Alert.alert('No se pudo publicar', error instanceof Error ? error.message : 'Intenta nuevamente.');
    }
    setPublishPhase('idle');
    composerScale.set(1);
    composerOpacity.set(1);
  }

  return (
    <Animated.View pointerEvents={publishPhase === 'idle' ? 'auto' : 'none'} style={[styles.composer, { backgroundColor: themeColors.surface, borderColor: open ? themeColors.primarySoft : themeColors.border }, open && styles.composerOpen, composerAnimatedStyle]}>
      <View style={[styles.inputRow, open && styles.inputRowOpen]}>
        <View style={[styles.avatar, { backgroundColor: themeColors.successSoft }]}><AppText style={[styles.initials, { color: themeColors.text }]} variant="caption">JM</AppText></View>
        <View style={[styles.inputShell, { backgroundColor: themeColors.input }, open && styles.inputShellOpen]}>
          <TextInput accessibilityLabel="Contenido de la publicación" maxLength={POST_CONTENT_LIMIT} multiline onChangeText={setContent} onFocus={() => setOpen(true)} placeholder="Comparte algo con tu comunidad..." placeholderTextColor={themeColors.textMuted} style={[styles.input, { color: themeColors.text }, open && styles.inputOpen]} textAlignVertical="top" value={content} />
          {open ? <Pressable accessibilityLabel="Cerrar" disabled={publishPhase !== 'idle'} hitSlop={8} onPress={() => void closeComposer()} style={styles.close}><AppIcon color={themeColors.textMuted} name="x" size={17} /></Pressable> : null}
        </View>
      </View>

      {open && images.length ? <View style={styles.imagePreview}><PostMediaGrid images={images} onRemove={removeImage} recyclingKey="composer" /></View> : null}

      {open && (isRecording || audioUri) ? <View style={[styles.audio, { backgroundColor: isRecording ? themeColors.dangerSoft : themeColors.primarySoft }]}><AppIcon color={isRecording ? themeColors.danger : themeColors.primaryDark} name={isRecording ? 'mic' : 'volume-2'} size={17} /><AppText style={[styles.audioText, { color: themeColors.text }]} variant="caption">{isRecording ? `Grabando · ${Math.round(recordingMillis / 1000)} s` : audioName}</AppText>{!isRecording ? <Pressable accessibilityLabel="Quitar audio" hitSlop={8} onPress={removeAudio}><AppIcon color={themeColors.textMuted} name="x" size={16} /></Pressable> : null}</View> : null}

      {open && pollEnabled ? (
        <View style={[styles.poll, { backgroundColor: themeColors.surfaceMuted }]}>
          <View style={styles.pollHeading}><AppText variant="bodyStrong">Encuesta</AppText><Pressable accessibilityLabel="Quitar encuesta" hitSlop={8} onPress={() => setPollEnabled(false)}><AppIcon color={themeColors.textMuted} name="x" size={17} /></Pressable></View>
          <TextInput maxLength={90} onChangeText={setPollQuestion} placeholder="Haz una pregunta" placeholderTextColor={themeColors.textMuted} style={[styles.pollInput, { backgroundColor: themeColors.input, borderColor: themeColors.border, color: themeColors.text }]} value={pollQuestion} />
          {pollOptions.map((option, index) => <TextInput key={index} maxLength={50} onChangeText={(value) => updatePollOption(index, value)} placeholder={`Opción ${index + 1}`} placeholderTextColor={themeColors.textMuted} style={[styles.pollInput, { backgroundColor: themeColors.input, borderColor: themeColors.border, color: themeColors.text }]} value={option} />)}
        </View>
      ) : null}

      {open && eventEnabled ? (
        <View style={[styles.poll, styles.eventEditor, { backgroundColor: themeColors.successSoft, borderColor: themeColors.border }]}>
          <View style={styles.pollHeading}>
            <View style={styles.editorHeadingCopy}><AppIcon color={themeColors.primaryDark} name="calendar" size={17} /><AppText variant="bodyStrong">Crear evento</AppText></View>
            <Pressable accessibilityLabel="Quitar evento" hitSlop={8} onPress={() => setEventEnabled(false)}><AppIcon color={themeColors.textMuted} name="x" size={17} /></Pressable>
          </View>
          <TextInput maxLength={80} onChangeText={setEventTitle} placeholder="Nombre del evento" placeholderTextColor={themeColors.textMuted} style={[styles.pollInput, { backgroundColor: themeColors.input, borderColor: themeColors.border, color: themeColors.text }]} value={eventTitle} />
          <TextInput maxLength={60} onChangeText={setEventDate} placeholder="Fecha y hora · Ej: Sáb 14, 10:00" placeholderTextColor={themeColors.textMuted} style={[styles.pollInput, { backgroundColor: themeColors.input, borderColor: themeColors.border, color: themeColors.text }]} value={eventDate} />
          <TextInput maxLength={80} onChangeText={setEventLocation} placeholder="Lugar" placeholderTextColor={themeColors.textMuted} style={[styles.pollInput, { backgroundColor: themeColors.input, borderColor: themeColors.border, color: themeColors.text }]} value={eventLocation} />
        </View>
      ) : null}

      <View style={[styles.footer, { borderTopColor: themeColors.border }, !open && styles.footerClosed]}>
        {open ? (
          <>
            <View style={styles.openTools}>
              <Pressable accessibilityLabel="Subir imágenes" disabled={publishPhase !== 'idle'} onPress={() => void pickImage()} style={[styles.openTool, imageUri && { backgroundColor: themeColors.primarySoft }]}><AppIcon color={imageUri ? themeColors.primaryDark : themeColors.textMuted} name="image" size={18} /><AppText style={[styles.openToolText, { color: imageUri ? themeColors.primaryDark : themeColors.textMuted }, imageUri && styles.openToolTextActive]} variant="caption">{images.length ? `${images.length} fotos` : 'Fotos'}</AppText></Pressable>
              <Pressable accessibilityLabel={isRecording ? 'Detener grabación' : 'Grabar audio'} onPress={() => void toggleRecording()} style={[styles.openTool, isRecording && { backgroundColor: themeColors.dangerSoft }]}><AppIcon color={isRecording ? themeColors.danger : themeColors.textMuted} name={isRecording ? 'square' : 'mic'} size={17} /><AppText style={[styles.openToolText, { color: isRecording ? themeColors.danger : themeColors.textMuted }, isRecording && styles.recordToolText]} variant="caption">{isRecording ? 'Detener' : 'Grabar'}</AppText></Pressable>
              <Pressable accessibilityLabel="Crear encuesta" onPress={() => setPollEnabled((current) => !current)} style={[styles.openTool, pollEnabled && { backgroundColor: themeColors.primarySoft }]}><AppIcon color={pollEnabled ? themeColors.primaryDark : themeColors.textMuted} name="bar-chart-2" size={18} /><AppText style={[styles.openToolText, { color: pollEnabled ? themeColors.primaryDark : themeColors.textMuted }, pollEnabled && styles.openToolTextActive]} variant="caption">Encuesta</AppText></Pressable>
              <Pressable accessibilityLabel="Crear evento" onPress={() => setEventEnabled((current) => !current)} style={[styles.openTool, eventEnabled && { backgroundColor: themeColors.primarySoft }]}><AppIcon color={eventEnabled ? themeColors.primaryDark : themeColors.textMuted} name="calendar" size={18} /><AppText style={[styles.openToolText, { color: eventEnabled ? themeColors.primaryDark : themeColors.textMuted }, eventEnabled && styles.openToolTextActive]} variant="caption">Evento</AppText></Pressable>
            </View>
            <View style={styles.publishRow}>
              <AppText style={styles.counter} variant="caption">Máximo {POST_CONTENT_LIMIT} caracteres · {content.length}/{POST_CONTENT_LIMIT}</AppText>
              <Pressable accessibilityRole="button" disabled={!canPublish || publishPhase !== 'idle'} onPress={() => void publish()} style={({ pressed }) => [styles.publish, { backgroundColor: themeColors.primaryDark }, (!canPublish || publishPhase !== 'idle') && styles.publishDisabled, publishPhase === 'success' && styles.publishSuccess, pressed && canPublish && publishPhase === 'idle' && styles.pressed]}>
                {publishPhase === 'publishing' ? <ActivityIndicator color={themeColors.textOnPrimary} size="small" /> : <AppIcon color={themeColors.textOnPrimary} name={publishPhase === 'success' ? 'check' : 'arrow-up'} size={15} />}
                <AppText style={[styles.publishText, { color: themeColors.textOnPrimary }]} variant="caption">{publishPhase === 'publishing' ? 'Publicando' : publishPhase === 'success' ? 'Publicado' : 'Publicar'}</AppText>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.quickTools}>
             <Pressable accessibilityLabel="Subir imágenes" onPress={() => { setOpen(true); void pickImage(); }} style={styles.quickTool}><AppIcon color={themeColors.textMuted} name="image" size={18} /><AppText style={[styles.quickToolText, { color: themeColors.textMuted }]} variant="caption">Fotos</AppText></Pressable>
            <View style={[styles.toolDivider, { backgroundColor: themeColors.border }]} />
            <Pressable accessibilityLabel="Crear encuesta" onPress={() => { setOpen(true); setPollEnabled(true); }} style={styles.quickTool}><AppIcon color={themeColors.textMuted} name="bar-chart-2" size={18} /><AppText style={[styles.quickToolText, { color: themeColors.textMuted }]} variant="caption">Encuesta</AppText></Pressable>
            <View style={[styles.toolDivider, { backgroundColor: themeColors.border }]} />
            <Pressable accessibilityLabel="Crear evento" onPress={() => { setOpen(true); setEventEnabled(true); }} style={styles.quickTool}><AppIcon color={themeColors.textMuted} name="calendar" size={18} /><AppText style={[styles.quickToolText, { color: themeColors.textMuted }]} variant="caption">Evento</AppText></Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
});

const useStyles = makeThemedStyles((colors) => ({
  composer: { backgroundColor: colors.surface, borderColor: 'rgba(60,60,67,0.12)', borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, elevation: 0, marginTop: spacing.md, overflow: 'hidden', padding: 11, shadowOpacity: 0 },
  composerOpen: { borderColor: 'rgba(23,77,43,0.20)' },
  inputRow: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 50 },
  inputRowOpen: { alignItems: 'flex-start' },
  avatar: { alignItems: 'center', backgroundColor: colors.successSoft, borderRadius: radii.pill, height: 42, justifyContent: 'center', width: 42 },
  initials: { color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 10 },
  inputShell: { alignItems: 'center', backgroundColor: colors.input, borderRadius: 16, flex: 1, flexDirection: 'row', minHeight: 48, paddingHorizontal: 14 },
  inputShellOpen: { alignItems: 'flex-start', minHeight: 92, paddingRight: 4 },
  input: { color: colors.text, flex: 1, fontFamily: typography.body, fontSize: 14, lineHeight: 20, maxHeight: 140, minHeight: 46, paddingHorizontal: 0, paddingVertical: 11 },
  inputOpen: { minHeight: 88, paddingTop: 12 },
  close: { alignItems: 'center', height: 34, justifyContent: 'center', marginTop: 4, width: 34 },
  imagePreview: { marginTop: 10, position: 'relative' },
  audio: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 10, flexDirection: 'row', gap: 8, marginTop: 9, minHeight: 40, paddingHorizontal: 11 },
  audioRecording: { backgroundColor: colors.dangerSoft },
  audioText: { color: colors.text, flex: 1, fontFamily: typography.bodyMedium },
  poll: { backgroundColor: colors.surfaceMuted, borderRadius: 12, gap: 7, marginTop: 9, padding: 10 },
  pollHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  editorHeadingCopy: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  eventEditor: { backgroundColor: colors.successSoft, borderColor: colors.border, borderWidth: 1 },
  pollInput: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 9, borderWidth: StyleSheet.hairlineWidth, color: colors.text, fontFamily: typography.body, fontSize: 13, minHeight: 40, paddingHorizontal: 11, paddingVertical: 7 },
  footer: { borderTopColor: 'rgba(60,60,67,0.10)', borderTopWidth: StyleSheet.hairlineWidth, gap: 5, marginTop: 9, paddingTop: 7 },
  footerClosed: { marginTop: 9, minHeight: 42, paddingTop: 7 },
  openTools: { alignItems: 'center', flexDirection: 'row', minHeight: 40, width: '100%' },
  openTool: { alignItems: 'center', borderRadius: 9, flex: 1, gap: 2, justifyContent: 'center', minHeight: 46, minWidth: 0, paddingHorizontal: 2 },
  openToolText: { flexShrink: 1, fontFamily: typography.bodyMedium, fontSize: 8.5 },
  openToolTextActive: { color: colors.primaryDark, fontFamily: typography.bodySemiBold },
  toolActive: { backgroundColor: colors.primarySoft },
  recordTool: { backgroundColor: colors.dangerSoft },
  recordToolText: { color: colors.danger, fontFamily: typography.bodySemiBold },
  publishRow: { alignItems: 'center', flexDirection: 'row', gap: 8, minHeight: 42 },
  counter: { color: colors.textMuted, flex: 1, fontSize: 9 },
  publish: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: radii.pill, flexDirection: 'row', gap: 5, minHeight: 36, paddingHorizontal: 12 },
  publishSuccess: { opacity: 1 },
  publishText: { fontFamily: typography.bodySemiBold, fontSize: 10 },
  publishDisabled: { opacity: 0.3 },
  quickTools: { alignItems: 'center', flex: 1, flexDirection: 'row' },
  quickTool: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 38 },
  quickToolText: { fontFamily: typography.bodyMedium, fontSize: 11 },
  toolDivider: { backgroundColor: colors.border, height: 22, width: StyleSheet.hairlineWidth },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
}));
