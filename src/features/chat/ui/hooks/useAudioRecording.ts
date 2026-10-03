import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard } from 'react-native';

import { appendWaveformSample } from '@/features/chat/application/record-audio';
import type { AudioDraft } from '@/features/chat/domain/message';

export type RecordingMode = 'paused' | 'recording' | null;

function deleteLocalAudio(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // The OS may already have removed a temporary or interrupted recording.
  }
}

export function useAudioRecording(onImpact: () => void, onSelection: () => void) {
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    directory: 'document',
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(recorder, 100);
  const latestMetering = useRef<number | undefined>(undefined);
  const canRecord = useRef(false);
  const draftUri = useRef<string | null>(null);
  const [audioDraft, setAudioDraft] = useState<AudioDraft | null>(null);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>(null);
  const [waveform, setWaveform] = useState<number[]>([]);

  useEffect(() => {
    latestMetering.current = recorderState.metering;
  }, [recorderState.metering]);

  useEffect(() => {
    canRecord.current = recorderState.canRecord;
  }, [recorderState.canRecord]);

  useEffect(() => () => {
    if (canRecord.current) void recorder.stop().catch(() => undefined);
    if (draftUri.current) deleteLocalAudio(draftUri.current);
    void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
  }, [recorder]);

  useEffect(() => {
    if (recordingMode !== 'recording') return;

    const meterInterval = setInterval(() => {
      const metering = latestMetering.current;
      if (typeof metering === 'number') {
        setWaveform((current) => appendWaveformSample(current, metering));
      }
    }, 100);

    return () => clearInterval(meterInterval);
  }, [recordingMode]);

  const start = useCallback(async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso de micrófono', 'Activa el micrófono para enviar notas de voz.');
        return;
      }

      Keyboard.dismiss();
      setWaveform([]);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordingMode('recording');
      onImpact();
    } catch {
      setRecordingMode(null);
      await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
      Alert.alert('No pudimos grabar', 'Intenta nuevamente en unos segundos.');
    }
  }, [onImpact, recorder]);

  const togglePause = useCallback(() => {
    if (recordingMode === 'recording') {
      recorder.pause();
      setRecordingMode('paused');
    } else if (recordingMode === 'paused') {
      recorder.record();
      setRecordingMode('recording');
    }
    onSelection();
  }, [onSelection, recorder, recordingMode]);

  const cancel = useCallback(async () => {
    try {
      if (recorderState.canRecord) await recorder.stop();
      const discardedUri = recorder.uri;
      if (discardedUri) deleteLocalAudio(discardedUri);
    } finally {
      setRecordingMode(null);
      setWaveform([]);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    }
  }, [recorder, recorderState.canRecord]);

  const finish = useCallback(async () => {
    try {
      const durationMs = recorderState.durationMillis;
      await recorder.stop();
      const uri = recorder.uri;
      setRecordingMode(null);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });

      if (!uri || durationMs < 250) {
        if (uri) deleteLocalAudio(uri);
        setWaveform([]);
        return;
      }

      draftUri.current = uri;
      setAudioDraft({ durationMs, uri, waveform: waveform.length ? waveform : [0.12] });
      setWaveform([]);
      onImpact();
    } catch {
      setRecordingMode(null);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
      Alert.alert('No pudimos guardar el audio', 'Intenta grabarlo nuevamente.');
    }
  }, [onImpact, recorder, recorderState.durationMillis, waveform]);

  const deleteDraft = useCallback(() => {
    if (!audioDraft) return;
    const discardedUri = audioDraft.uri;
    draftUri.current = null;
    setAudioDraft(null);
    setTimeout(() => deleteLocalAudio(discardedUri), 0);
  }, [audioDraft]);

  const consumeDraft = useCallback(() => {
    const draft = audioDraft;
    draftUri.current = null;
    setAudioDraft(null);
    return draft;
  }, [audioDraft]);

  return {
    audioDraft,
    cancel,
    consumeDraft,
    deleteDraft,
    durationMillis: recorderState.durationMillis,
    finish,
    recordingMode,
    start,
    togglePause,
    waveform,
  };
}
