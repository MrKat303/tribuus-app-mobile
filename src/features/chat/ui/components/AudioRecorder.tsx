import Feather from '@/components/ui/AppIcon';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { formatDuration } from '@/features/chat/domain/message';
import type { RecordingMode } from '@/features/chat/ui/hooks/useAudioRecording';
import { radii, type ThemeColors, typography } from '@/theme/tokens';

import { AudioMessage, AudioWaveform } from './AudioMessage';

export function AudioRecorder({
  audioDraft,
  colors,
  durationMillis,
  onCancel,
  onDeleteDraft,
  onFinish,
  onSendDraft,
  onTogglePause,
  ownBubbleBackground,
  recordingMode,
  waveform,
}: {
  audioDraft: { durationMs: number; uri: string; waveform: number[] } | null;
  colors: ThemeColors;
  durationMillis: number;
  onCancel: () => void;
  onDeleteDraft: () => void;
  onFinish: () => void;
  onSendDraft: () => void;
  onTogglePause: () => void;
  ownBubbleBackground: string;
  recordingMode: RecordingMode;
  waveform: readonly number[];
}) {
  const reduceMotion = useReducedMotion();

  if (recordingMode) {
    return (
      <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)} layout={reduceMotion ? undefined : LinearTransition.duration(160)} style={[styles.recordingComposer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable accessibilityLabel="Cancelar grabación" onPress={onCancel} style={({ pressed }) => [styles.recordingControl, pressed && styles.buttonPressed]}>
          <Feather color={colors.danger} name="trash-2" size={18} />
        </Pressable>
        <Pressable accessibilityLabel={recordingMode === 'recording' ? 'Pausar grabación' : 'Reanudar grabación'} onPress={onTogglePause} style={({ pressed }) => [styles.recordingControl, { backgroundColor: colors.primarySoft }, pressed && styles.buttonPressed]}>
          <Feather color={colors.primaryDark} name={recordingMode === 'recording' ? 'pause' : 'play'} size={17} />
        </Pressable>
        <View accessibilityLiveRegion="polite" style={styles.recordingBody}>
          <AudioWaveform activeColor={recordingMode === 'recording' ? colors.danger : colors.primaryDark} barCount={26} inactiveColor={colors.border} progress={1} samples={waveform} />
          <View style={styles.recordingMeta}>
            <Animated.View key={recordingMode} entering={FadeIn.duration(120)} style={[styles.recordingDot, { backgroundColor: recordingMode === 'recording' ? colors.danger : colors.textMuted }]} />
            <AppText style={[styles.recordingTime, { color: recordingMode === 'recording' ? colors.danger : colors.textMuted }]} variant="caption">
              {recordingMode === 'recording' ? 'Grabando' : 'En pausa'} · {formatDuration(durationMillis)}
            </AppText>
          </View>
        </View>
        <Pressable accessibilityLabel="Finalizar grabación" onPress={onFinish} style={({ pressed }) => [styles.finishRecordingButton, { backgroundColor: ownBubbleBackground }, pressed && styles.sendButtonPressed]}>
          <Feather color="#FFFFFF" name="check" size={19} />
        </Pressable>
      </Animated.View>
    );
  }

  if (audioDraft) {
    return (
      <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(100)} layout={reduceMotion ? undefined : LinearTransition.duration(160)} style={[styles.audioPreviewComposer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AudioMessage colors={colors} durationMs={audioDraft.durationMs} mine={false} onDelete={onDeleteDraft} onSend={onSendDraft} preview uri={audioDraft.uri} waveform={audioDraft.waveform} />
      </Animated.View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  audioPreviewComposer: { borderCurve: 'continuous', borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, minHeight: 62, padding: 5 },
  buttonPressed: { opacity: 0.55 },
  finishRecordingButton: { alignItems: 'center', borderRadius: radii.pill, height: 42, justifyContent: 'center', width: 42 },
  recordingBody: { flex: 1, gap: 1, minWidth: 96 },
  recordingComposer: { alignItems: 'center', borderCurve: 'continuous', borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 5, minHeight: 58, padding: 5 },
  recordingControl: { alignItems: 'center', borderRadius: radii.pill, height: 44, justifyContent: 'center', width: 40 },
  recordingDot: { borderRadius: radii.pill, height: 8, width: 8 },
  recordingMeta: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  recordingTime: { fontFamily: typography.bodyMedium, fontSize: 12, fontVariant: ['tabular-nums'] },
  sendButtonPressed: { transform: [{ scale: 0.94 }] },
});
