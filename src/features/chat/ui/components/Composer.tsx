import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import Feather from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import type { AudioDraft, Message, PendingImage } from '@/features/chat/domain/message';
import { replyLabel } from '@/features/chat/domain/message';
import { AudioWaveform } from '@/features/chat/ui/components/AudioMessage';
import { AudioRecorder } from '@/features/chat/ui/components/AudioRecorder';
import { useAudioRecording } from '@/features/chat/ui/hooks/useAudioRecording';
import { radii, spacing, typography, type ThemeColors } from '@/theme/tokens';

const emojiCategories = [
  { label: 'Caras', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '🙂', '🙃', '😉', '😍', '🥰', '😘', '😋', '😎', '🤩', '🥳', '😏', '😔', '🥺', '😢', '😭', '😤', '😡', '🤯', '😱', '🤗', '🤔', '🫡', '🤭'] },
  { label: 'Gestos', emojis: ['👋', '🤚', '🖐️', '✋', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '👏', '🙌', '🫶', '🙏', '💪', '🤝'] },
  { label: 'Corazones', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'] },
  { label: 'Momentos', emojis: ['✨', '⭐', '🌟', '🔥', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '⚽', '🎵', '🎶', '☀️', '🌈', '🌙', '🌱', '🌻', '☕', '🍕', '🍻', '🚀', '💡', '✅'] },
] as const;

function impactHaptic() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

function selectionHaptic() {
  void Haptics.selectionAsync().catch(() => undefined);
}

export function Composer({
  colors,
  onCancelReply,
  onSendAudio,
  onSendText,
  ownBubbleBackground,
  participantName,
  replyingTo,
}: {
  colors: ThemeColors;
  onCancelReply: () => void;
  onSendAudio: (audio: AudioDraft) => void;
  onSendText: (text: string, image: PendingImage | null) => void;
  ownBubbleBackground: string;
  participantName: string;
  replyingTo: Message | null;
}) {
  const inputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState('');
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const recording = useAudioRecording(impactHaptic, selectionHaptic);

  useEffect(() => {
    if (replyingTo) requestAnimationFrame(() => inputRef.current?.focus());
  }, [replyingTo]);

  const sendText = useCallback(() => {
    const text = draft.trim();
    if (!text && !pendingImage) return;
    impactHaptic();
    onSendText(text, pendingImage);
    setDraft('');
    setPendingImage(null);
    setShowEmojiPicker(false);
  }, [draft, onSendText, pendingImage]);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, mediaTypes: ['images'], quality: 0.82, selectionLimit: 1 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setShowEmojiPicker(false);
    setPendingImage({
      aspectRatio: asset.width && asset.height ? asset.width / asset.height : 4 / 3,
      uri: asset.uri,
    });
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const insertEmoji = useCallback((emoji: string) => {
    setDraft((current) => `${current}${emoji}`);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const startRecording = useCallback(() => {
    setShowEmojiPicker(false);
    void recording.start();
  }, [recording]);

  const sendAudio = useCallback(() => {
    const audio = recording.consumeDraft();
    if (!audio) return;
    impactHaptic();
    onSendAudio(audio);
  }, [onSendAudio, recording]);

  const hasAudioUi = Boolean(recording.recordingMode || recording.audioDraft);

  return (
    <View style={styles.composerArea}>
      {replyingTo ? (
        <Animated.View entering={FadeInDown.duration(160)} exiting={FadeOut.duration(100)} style={[styles.replyComposer, { backgroundColor: colors.surfaceMuted }]}>
          <View style={[styles.replyComposerBar, { backgroundColor: colors.primary }]} />
          <View style={[styles.replyComposerIcon, { backgroundColor: colors.primarySoft }]}><Feather color={colors.primaryDark} name="corner-up-left" size={15} /></View>
          {replyingTo.image ? <Image contentFit="cover" source={replyingTo.image} style={styles.replyComposerImage} /> : null}
          {replyingTo.audioUri ? <View style={styles.replyComposerWaveform}><AudioWaveform activeColor={colors.primaryDark} barCount={10} height={20} inactiveColor={colors.border} progress={1} samples={replyingTo.audioWaveform ?? []} /></View> : null}
          <View style={styles.replyComposerCopy}>
            <AppText style={[styles.replyComposerTitle, { color: colors.primaryDark }]} variant="caption">Respondiendo a {replyingTo.mine ? 'tu mensaje' : participantName}</AppText>
            {!replyingTo.image ? <AppText numberOfLines={1} style={{ color: colors.textMuted }} variant="caption">{replyLabel(replyingTo)}</AppText> : null}
          </View>
          <Pressable accessibilityLabel="Cancelar respuesta" hitSlop={8} onPress={onCancelReply} style={({ pressed }) => [styles.cancelReplyButton, pressed && styles.buttonPressed]}><Feather color={colors.textMuted} name="x" size={18} /></Pressable>
        </Animated.View>
      ) : null}

      {showEmojiPicker && !hasAudioUi ? (
        <Animated.View entering={FadeInDown.duration(160)} exiting={FadeOut.duration(100)} style={[styles.emojiPicker, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={styles.emojiPickerHeader}><AppText variant="bodyStrong">Emojis</AppText><Pressable accessibilityLabel="Cerrar emojis" hitSlop={8} onPress={() => setShowEmojiPicker(false)} style={styles.emojiCloseButton}><Feather color={colors.textMuted} name="x" size={17} /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled showsVerticalScrollIndicator={false} style={styles.emojiScroll}>
            {emojiCategories.map((category) => (
              <View key={category.label} style={styles.emojiSection}>
                <AppText style={[styles.emojiSectionLabel, { color: colors.textMuted }]} variant="caption">{category.label}</AppText>
                <View style={styles.emojiGrid}>{category.emojis.map((emoji) => <Pressable accessibilityLabel={`Insertar ${emoji}`} key={emoji} onPress={() => insertEmoji(emoji)} style={({ pressed }) => [styles.composerEmoji, pressed && { backgroundColor: colors.surfaceMuted }]}><AppText style={styles.composerEmojiText}>{emoji}</AppText></Pressable>)}</View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      ) : null}

      {pendingImage && !hasAudioUi ? (
        <Animated.View entering={FadeInDown.duration(160)} exiting={FadeOut.duration(100)} style={styles.pendingAttachment}>
          <Image contentFit="cover" source={pendingImage.uri} style={styles.pendingAttachmentImage} transition={120} />
          <Pressable accessibilityLabel="Quitar imagen adjunta" hitSlop={6} onPress={() => setPendingImage(null)} style={({ pressed }) => [styles.pendingAttachmentRemove, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, pressed && styles.buttonPressed]}><Feather color={colors.text} name="x" size={12} /></Pressable>
        </Animated.View>
      ) : null}

      {hasAudioUi ? (
        <AudioRecorder
          audioDraft={recording.audioDraft}
          colors={colors}
          durationMillis={recording.durationMillis}
          onCancel={() => { void recording.cancel(); }}
          onDeleteDraft={recording.deleteDraft}
          onFinish={() => { void recording.finish(); }}
          onSendDraft={sendAudio}
          onTogglePause={recording.togglePause}
          ownBubbleBackground={ownBubbleBackground}
          recordingMode={recording.recordingMode}
          liveWaveform={recording.liveWaveform}
        />
      ) : (
        <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable accessibilityLabel="Adjuntar imagen" hitSlop={4} onPress={pickImage} style={({ pressed }) => [styles.composerButton, pressed && styles.buttonPressed]}><Feather color={colors.textMuted} name="image" size={19} /></Pressable>
          <Pressable accessibilityLabel="Agregar emoji" hitSlop={4} onPress={() => setShowEmojiPicker((current) => !current)} style={({ pressed }) => [styles.composerButton, showEmojiPicker && { backgroundColor: colors.primarySoft }, pressed && styles.buttonPressed]}><Feather color={showEmojiPicker ? colors.primaryDark : colors.textMuted} name="smile" size={19} /></Pressable>
          <Pressable accessibilityLabel="Grabar audio" disabled={Boolean(draft.trim() || pendingImage)} hitSlop={4} onPress={startRecording} style={({ pressed }) => [styles.composerButton, Boolean(draft.trim() || pendingImage) && styles.composerButtonDisabled, pressed && styles.buttonPressed]}><Feather color={colors.textMuted} name="mic" size={19} /></Pressable>
          <TextInput accessibilityLabel="Mensaje" blurOnSubmit={false} multiline onChangeText={setDraft} onSubmitEditing={sendText} placeholder="Escribe un mensaje" placeholderTextColor={colors.textMuted} ref={inputRef} returnKeyType="send" style={[styles.input, { color: colors.text }]} value={draft} />
          <Animated.View layout={LinearTransition.duration(140)}>
            <Pressable accessibilityLabel={pendingImage && !draft.trim() ? 'Enviar imagen' : 'Enviar mensaje'} disabled={!draft.trim() && !pendingImage} onPress={sendText} style={({ pressed }) => [styles.sendButton, { backgroundColor: ownBubbleBackground }, (!draft.trim() && !pendingImage) && styles.sendButtonDisabled, pressed && (draft.trim() || pendingImage) && styles.sendButtonPressed]}><Feather color="#FFFFFF" name="arrow-up" size={19} /></Pressable>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonPressed: { opacity: 0.55 },
  cancelReplyButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  composer: { alignItems: 'flex-end', borderCurve: 'continuous', borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 4, padding: 5 },
  composerArea: { paddingTop: spacing.xs },
  composerButton: { alignItems: 'center', borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 36 },
  composerButtonDisabled: { opacity: 0.32 },
  composerEmoji: { alignItems: 'center', borderRadius: radii.pill, height: 44, justifyContent: 'center', width: '16.666%' },
  composerEmojiText: { fontSize: 20, lineHeight: 25 },
  emojiCloseButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  emojiPicker: { borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, marginBottom: spacing.xs, maxHeight: 236, overflow: 'hidden', padding: spacing.sm },
  emojiPickerHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 32, paddingLeft: spacing.xs },
  emojiScroll: { maxHeight: 188 },
  emojiSection: { gap: spacing.xs, paddingBottom: spacing.sm },
  emojiSectionLabel: { fontFamily: typography.bodySemiBold, fontSize: 10, letterSpacing: 0.4, paddingHorizontal: spacing.xs, textTransform: 'uppercase' },
  input: { flex: 1, fontFamily: typography.body, fontSize: 15, lineHeight: 20, maxHeight: 104, minHeight: 40, paddingHorizontal: spacing.xs, paddingVertical: 9 },
  pendingAttachment: { alignSelf: 'flex-start', marginBottom: spacing.xs, marginLeft: spacing.xs, position: 'relative' },
  pendingAttachmentImage: { borderCurve: 'continuous', borderRadius: 9, height: 48, width: 48 },
  pendingAttachmentRemove: { alignItems: 'center', borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth, height: 22, justifyContent: 'center', position: 'absolute', right: -7, top: -7, width: 22 },
  replyComposer: { alignItems: 'center', borderCurve: 'continuous', borderRadius: radii.sm, flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs, minHeight: 48, overflow: 'hidden', paddingRight: spacing.xs },
  replyComposerBar: { alignSelf: 'stretch', width: 3 },
  replyComposerCopy: { flex: 1, gap: 1, paddingVertical: spacing.sm },
  replyComposerIcon: { alignItems: 'center', borderRadius: radii.pill, height: 30, justifyContent: 'center', width: 30 },
  replyComposerImage: { borderRadius: 6, height: 30, width: 30 },
  replyComposerTitle: { fontFamily: typography.bodySemiBold, fontSize: 11, lineHeight: 14 },
  replyComposerWaveform: { height: 20, width: 48 },
  sendButton: { alignItems: 'center', borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 40 },
  sendButtonDisabled: { opacity: 0.28 },
  sendButtonPressed: { transform: [{ scale: 0.94 }] },
});
