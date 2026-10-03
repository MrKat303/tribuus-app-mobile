import Feather from '@/components/ui/AppIcon';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useMemo, useRef } from 'react';
import { type GestureResponderEvent, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { formatDuration, waveformBars } from '@/features/chat/domain/message';
import { radii, spacing, type ThemeColors } from '@/theme/tokens';

export function AudioWaveform({ activeColor, inactiveColor, onSeek, progress, samples, barCount = 30, height = 32 }: {
  activeColor: string;
  barCount?: number;
  height?: number;
  inactiveColor: string;
  onSeek?: (progress: number) => void;
  progress: number;
  samples: readonly number[];
}) {
  const waveformWidth = useRef(1);
  const bars = useMemo(() => waveformBars(samples, barCount), [barCount, samples]);
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const seekFromEvent = useCallback((event: GestureResponderEvent) => {
    if (!onSeek) return;
    onSeek(Math.max(0, Math.min(1, event.nativeEvent.locationX / waveformWidth.current)));
  }, [onSeek]);

  return (
    <View
      accessibilityLabel="Progreso del audio"
      accessibilityRole={onSeek ? 'adjustable' : undefined}
      onLayout={(event) => { waveformWidth.current = Math.max(1, event.nativeEvent.layout.width); }}
      onMoveShouldSetResponder={() => Boolean(onSeek)}
      onResponderGrant={seekFromEvent}
      onResponderMove={seekFromEvent}
      onStartShouldSetResponder={() => Boolean(onSeek)}
      style={[styles.waveform, { height }]}>
      {bars.map((level, index) => (
        <View
          key={index}
          style={[
            styles.waveformBar,
            {
              backgroundColor: (index + 0.5) / bars.length <= clampedProgress ? activeColor : inactiveColor,
              height: Math.min(height, Math.round(4 + level * Math.max(4, height - 7))),
            },
          ]}
        />
      ))}
      {onSeek ? <View pointerEvents="none" style={[styles.waveformPosition, { backgroundColor: activeColor, left: `${clampedProgress * 100}%` }]} /> : null}
    </View>
  );
}

export function AudioMessage({ colors, durationMs, mine, onDelete, onSend, preview = false, uri, waveform }: {
  colors: ThemeColors;
  durationMs: number;
  mine: boolean;
  onDelete?: () => void;
  onSend?: () => void;
  preview?: boolean;
  uri: string;
  waveform: readonly number[];
}) {
  const player = useAudioPlayer(uri, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const duration = status.duration > 0 ? status.duration * 1000 : durationMs;
  const progress = duration > 0 ? Math.min(1, (status.currentTime * 1000) / duration) : 0;

  const togglePlayback = useCallback(async () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) await player.seekTo(0);
    player.play();
  }, [player, status.currentTime, status.didJustFinish, status.duration, status.playing]);

  const seek = useCallback((nextProgress: number) => {
    if (duration <= 0) return;
    void player.seekTo((duration * nextProgress) / 1000);
  }, [duration, player]);

  const foreground = preview ? colors.text : mine ? '#FFFFFF' : colors.primaryDark;
  const inactiveColor = preview ? colors.border : mine ? 'rgba(255,255,255,0.28)' : colors.border;
  const activeColor = preview ? colors.primaryDark : foreground;

  return (
    <View style={[styles.audioMessage, preview && styles.audioPreview]}>
      {onDelete ? (
        <Pressable accessibilityLabel="Eliminar grabación" onPress={onDelete} style={({ pressed }) => [styles.audioActionButton, pressed && styles.buttonPressed]}>
          <Feather color={colors.danger} name="trash-2" size={18} />
        </Pressable>
      ) : null}
      <Pressable accessibilityLabel={status.playing ? 'Pausar audio' : 'Reproducir audio'} onPress={togglePlayback} style={({ pressed }) => [styles.audioPlayButton, { backgroundColor: preview || !mine ? colors.primarySoft : 'rgba(255,255,255,0.18)' }, pressed && styles.buttonPressed]}>
        <Feather color={foreground} name={status.playing ? 'pause' : 'play'} size={16} />
      </Pressable>
      <View style={styles.audioProgressArea}>
        <AudioWaveform activeColor={activeColor} barCount={preview ? 38 : 30} inactiveColor={inactiveColor} onSeek={seek} progress={progress} samples={waveform} />
        <View style={styles.audioMeta}>
          <Feather color={foreground} name="mic" size={11} />
          <AppText style={[styles.audioDuration, { color: foreground }]} variant="caption">
            {formatDuration(status.currentTime * 1000)} / {formatDuration(duration)}
          </AppText>
        </View>
      </View>
      {onSend ? (
        <Pressable accessibilityLabel="Enviar nota de voz" onPress={onSend} style={({ pressed }) => [styles.audioSendButton, { backgroundColor: colors.primaryDark }, pressed && styles.audioSendPressed]}>
          <Feather color="#FFFFFF" name="arrow-up" size={19} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  audioActionButton: { alignItems: 'center', borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 36 },
  audioDuration: { fontSize: 10, fontVariant: ['tabular-nums'], lineHeight: 12 },
  audioMessage: { alignItems: 'center', flexDirection: 'row', gap: 7, minWidth: 232, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  audioMeta: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  audioPlayButton: { alignItems: 'center', borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 40 },
  audioPreview: { minWidth: 0, paddingHorizontal: 0, paddingVertical: 0, width: '100%' },
  audioProgressArea: { flex: 1, gap: 3, minWidth: 100 },
  audioSendButton: { alignItems: 'center', borderRadius: radii.pill, height: 40, justifyContent: 'center', width: 40 },
  audioSendPressed: { transform: [{ scale: 0.94 }] },
  buttonPressed: { opacity: 0.55 },
  waveform: { alignItems: 'center', flexDirection: 'row', gap: 2, height: 32, overflow: 'hidden', position: 'relative', width: '100%' },
  waveformBar: { borderRadius: radii.pill, flex: 1, maxWidth: 4, minHeight: 5 },
  waveformPosition: { borderRadius: radii.pill, bottom: 1, position: 'absolute', top: 1, transform: [{ translateX: -1 }], width: 2 },
});
