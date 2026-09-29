import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { createPostImageVariants } from '@/features/feed/media/createPostImageVariants';
import type { CommunityPostCategory, CommunityPostDraft, CommunityPostImageVariants } from '@/types/community';

export const POST_CONTENT_LIMIT = 350;
export const MAX_POLL_OPTIONS = 4;

const initialPollOptions = () => ['', ''];
const recordingOptions = { ...RecordingPresets.HIGH_QUALITY, directory: 'document' as const };

export function usePostComposer() {
  const audioRecorder = useAudioRecorder(recordingOptions);
  const recorderState = useAudioRecorderState(audioRecorder, 250);
  const imageRequestId = useRef(0);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<CommunityPostCategory>('comunidad');
  const [imageUri, setImageUriState] = useState<string | null>(null);
  const [imageVariants, setImageVariants] = useState<CommunityPostImageVariants | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(initialPollOptions);
  const [eventEnabled, setEventEnabled] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  const validPollOptions = pollOptions.map((option) => option.trim()).filter(Boolean);
  const hasPoll = pollEnabled && Boolean(pollQuestion.trim()) && validPollOptions.length >= 2;
  const hasEvent = eventEnabled && Boolean(eventTitle.trim() && eventDate.trim() && eventLocation.trim());
  const isRecording = recorderState.isRecording;
  const recordingMillis = recorderState.durationMillis;
  const canPublish = !isRecording && !isProcessingImage && Boolean(content.trim() || imageUri || audioUri || hasPoll || hasEvent);

  const restorePlaybackMode = useCallback(async () => {
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } catch {
      // The audio session may already be unavailable while the screen unmounts.
    }
  }, []);

  const stopActiveRecorder = useCallback(async () => {
    if (audioRecorder.isRecording) {
      try { await audioRecorder.stop(); } catch { /* It may already be stopped. */ }
    }
    await restorePlaybackMode();
  }, [audioRecorder, restorePlaybackMode]);

  useEffect(() => () => {
    imageRequestId.current += 1;
    if (audioRecorder.isRecording) void audioRecorder.stop();
    void restorePlaybackMode();
  }, [audioRecorder, restorePlaybackMode]);

  const reset = useCallback(() => {
    imageRequestId.current += 1;
    setContent('');
    setCategory('comunidad');
    setImageUriState(null);
    setImageVariants(null);
    setIsProcessingImage(false);
    setAudioUri(null);
    setAudioName(null);
    setPollEnabled(false);
    setPollQuestion('');
    setPollOptions(initialPollOptions());
    setEventEnabled(false);
    setEventTitle('');
    setEventDate('');
    setEventLocation('');
  }, []);

  const discard = useCallback(async () => {
    await stopActiveRecorder();
    reset();
  }, [reset, stopActiveRecorder]);

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      const requestId = ++imageRequestId.current;
      setImageUriState(asset.uri);
      setImageVariants(null);
      setIsProcessingImage(true);
      try {
        const variants = await createPostImageVariants({
          height: asset.height,
          uri: asset.uri,
          width: asset.width,
        });
        if (imageRequestId.current === requestId) {
          setImageVariants(variants);
          setImageUriState(variants.feed.uri);
        }
      } catch {
        if (imageRequestId.current === requestId) {
          setImageVariants(null);
          setImageUriState(asset.uri);
          Alert.alert('Imagen sin optimizar', 'La foto se adjuntó, pero no se pudieron crear sus versiones optimizadas.');
        }
      } finally {
        if (imageRequestId.current === requestId) setIsProcessingImage(false);
      }
    } catch {
      Alert.alert('Galería no disponible', 'Recompila la app para incluir el selector de imágenes en el development build.');
    }
  }, []);

  const setImageUri = useCallback((uri: string | null) => {
    imageRequestId.current += 1;
    setImageUriState(uri);
    setIsProcessingImage(false);
    if (!uri) setImageVariants(null);
  }, []);

  const toggleRecording = useCallback(async () => {
    try {
      if (isRecording) {
        const seconds = Math.max(1, Math.round(recordingMillis / 1000));
        await audioRecorder.stop();
        if (audioRecorder.uri) {
          setAudioUri(audioRecorder.uri);
          setAudioName(`Nota de voz · ${seconds} s`);
        }
        await restorePlaybackMode();
        return;
      }

      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso necesario', 'Activa el micrófono para grabar una nota de voz.');
        return;
      }
      setAudioUri(null);
      setAudioName(null);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch {
      Alert.alert('Grabación no disponible', 'Recompila la app para incluir Expo Audio en el development build.');
    }
  }, [audioRecorder, isRecording, recordingMillis, restorePlaybackMode]);

  const removeAudio = useCallback(() => {
    setAudioUri(null);
    setAudioName(null);
  }, []);

  const updatePollOption = useCallback((index: number, value: string) => {
    setPollOptions((current) => current.map((option, optionIndex) => optionIndex === index ? value : option));
  }, []);
  const addPollOption = useCallback(() => {
    setPollOptions((current) => current.length < MAX_POLL_OPTIONS ? [...current, ''] : current);
  }, []);
  const removePollOption = useCallback((index: number) => {
    setPollOptions((current) => current.length > 2 ? current.filter((_, optionIndex) => optionIndex !== index) : current);
  }, []);

  const submit = useCallback((onSubmit: (draft: CommunityPostDraft) => void) => {
    if (!canPublish) return false;
    if (pollEnabled && !hasPoll) {
      Alert.alert('Completa la encuesta', 'Escribe una pregunta y al menos dos opciones.');
      return false;
    }
    if (eventEnabled && !hasEvent) {
      Alert.alert('Completa el evento', 'Escribe el título, la fecha y el lugar.');
      return false;
    }

    onSubmit({
      audioName: audioName ?? undefined,
      audioUri: audioUri ?? undefined,
      category: eventEnabled ? 'evento' : category,
      content: eventEnabled
        ? [`📅 ${eventDate.trim()}`, content.trim()].filter(Boolean).join('\n')
        : content.trim(),
      imageVariants: imageVariants ?? undefined,
      imageUri: imageUri ?? undefined,
      location: eventEnabled ? eventLocation.trim() : undefined,
      poll: hasPoll ? {
        options: validPollOptions.map((label, index) => ({ id: `option-${index}`, label, votes: 0 })),
        question: pollQuestion.trim(),
      } : undefined,
      title: eventEnabled ? eventTitle.trim() : undefined,
    });
    reset();
    return true;
  }, [audioName, audioUri, canPublish, category, content, eventDate, eventEnabled, eventLocation, eventTitle, hasEvent, hasPoll, imageUri, imageVariants, pollEnabled, pollQuestion, reset, validPollOptions]);

  return {
    addPollOption, audioName, audioUri, canPublish, category, content, discard,
    eventDate, eventEnabled, eventLocation, eventTitle, imageUri, isProcessingImage, isRecording,
    pickImage, pollEnabled, pollOptions, pollQuestion, recordingMillis, removeAudio,
    removePollOption, reset, setCategory, setContent, setEventDate, setEventEnabled,
    setEventLocation, setEventTitle, setImageUri, setPollEnabled, setPollQuestion,
    submit, toggleRecording, updatePollOption,
  };
}
