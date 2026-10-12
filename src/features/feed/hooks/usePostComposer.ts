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

import { createPostFeedImage } from '@/features/feed/media/createPostFeedImage';
import type { CommunityPostCategory, CommunityPostDraft, CommunityPostImage } from '@/features/feed/model/community';
import { mapWithConcurrency } from '@/shared/utils/mapWithConcurrency';

export const POST_CONTENT_LIMIT = 350;
export const MAX_POLL_OPTIONS = 4;
export const MAX_POST_IMAGES = 12;
const POST_IMAGE_PROCESSING_CONCURRENCY = 3;

const initialPollOptions = () => ['', ''];
const recordingOptions = { ...RecordingPresets.HIGH_QUALITY, directory: 'document' as const };

export function usePostComposer() {
  const audioRecorder = useAudioRecorder(recordingOptions);
  const recorderState = useAudioRecorderState(audioRecorder, 250);
  const imageRequestId = useRef(0);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<CommunityPostCategory>('comunidad');
  const [images, setImages] = useState<CommunityPostImage[]>([]);
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
  const imageUri = images[0]?.uri ?? null;
  const canPublish = !isRecording
    && !isProcessingImage
    && (!pollEnabled || hasPoll)
    && (!eventEnabled || hasEvent)
    && Boolean(content.trim() || images.length || audioUri || hasPoll || hasEvent);

  const restorePlaybackMode = useCallback(async () => {
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } catch {
      // The audio session may already be unavailable while the screen unmounts.
    }
  }, []);

  const stopActiveRecorder = useCallback(async () => {
    if (isRecording) {
      try { await audioRecorder.stop(); } catch { /* It may already be stopped. */ }
    }
    await restorePlaybackMode();
  }, [audioRecorder, isRecording, restorePlaybackMode]);

  useEffect(() => () => {
    imageRequestId.current += 1;
    // useAudioRecorder owns and releases the native recorder during unmount.
    // Accessing it from this cleanup can race with that release on Android.
    void restorePlaybackMode();
  }, [restorePlaybackMode]);

  const reset = useCallback(() => {
    imageRequestId.current += 1;
    setContent('');
    setCategory('comunidad');
    setImages([]);
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
    let requestId: number | null = null;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ['images'],
        quality: 1,
        selectionLimit: MAX_POST_IMAGES,
      });
      if (result.canceled) return;

      requestId = ++imageRequestId.current;
      const selectedAssets = result.assets.slice(0, MAX_POST_IMAGES);
      const selectedImages = selectedAssets.map((asset, index) => ({
        id: asset.assetId ?? `image-${requestId}-${index}`,
        uri: asset.uri,
      }));
      setImages(selectedImages);
      setIsProcessingImage(true);
      let optimizationFailed = false;

      const optimizedImages = await mapWithConcurrency(
        selectedAssets,
        POST_IMAGE_PROCESSING_CONCURRENCY,
        async (asset) => {
          if (imageRequestId.current !== requestId) return null;
          try {
            return await createPostFeedImage({
              height: asset.height,
              uri: asset.uri,
              width: asset.width,
            });
          } catch {
            optimizationFailed = true;
            return null;
          }
        },
      );

      if (imageRequestId.current !== requestId) return;
      setImages(selectedImages.map((image, index) => {
        const optimizedImage = optimizedImages[index];
        return optimizedImage ? { ...image, uri: optimizedImage.uri } : image;
      }));
      setIsProcessingImage(false);
      if (optimizationFailed) Alert.alert('Imagen sin optimizar', 'Algunas fotos se adjuntaron sin su versión optimizada.');
    } catch {
      if (requestId === imageRequestId.current) setIsProcessingImage(false);
      Alert.alert('Galería no disponible', 'Recompila la app para incluir el selector de imágenes en el development build.');
    }
  }, []);

  const setImageUri = useCallback((uri: string | null) => {
    imageRequestId.current += 1;
    setImages(uri ? [{ id: `image-${Date.now()}`, uri }] : []);
    setIsProcessingImage(false);
  }, []);

  const removeImage = useCallback((imageId: string) => {
    setImages((current) => current.filter((image) => image.id !== imageId));
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

  const submit = useCallback(async (onSubmit: (draft: CommunityPostDraft) => unknown | Promise<unknown>) => {
    if (!canPublish) return false;
    if (pollEnabled && !hasPoll) {
      Alert.alert('Completa la encuesta', 'Escribe una pregunta y al menos dos opciones.');
      return false;
    }
    if (eventEnabled && !hasEvent) {
      Alert.alert('Completa el evento', 'Escribe el título, la fecha y el lugar.');
      return false;
    }

    await onSubmit({
      audioName: audioName ?? undefined,
      audioUri: audioUri ?? undefined,
      category: eventEnabled ? 'evento' : category,
      content: eventEnabled
        ? [`📅 ${eventDate.trim()}`, content.trim()].filter(Boolean).join('\n')
        : content.trim(),
      images: images.length ? images : undefined,
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
  }, [audioName, audioUri, canPublish, category, content, eventDate, eventEnabled, eventLocation, eventTitle, hasEvent, hasPoll, imageUri, images, pollEnabled, pollQuestion, reset, validPollOptions]);

  return {
    addPollOption, audioName, audioUri, canPublish, category, content, discard,
    eventDate, eventEnabled, eventLocation, eventTitle, images, imageUri, isProcessingImage, isRecording,
    pickImage, pollEnabled, pollOptions, pollQuestion, recordingMillis, removeAudio,
    removeImage, removePollOption, reset, setCategory, setContent, setEventDate, setEventEnabled,
    setEventLocation, setEventTitle, setImageUri, setPollEnabled, setPollQuestion,
    submit, toggleRecording, updatePollOption,
  };
}
