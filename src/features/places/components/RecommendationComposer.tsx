import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/theme/AppearanceProvider';
import { PLACE_TAGS, type RecommendationDraft } from '@/features/places/model/place';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

export function RecommendationComposer({ onClose, onSubmit, placeName, visible }: { onClose: () => void; onSubmit: (draft: RecommendationDraft) => void; placeName: string; visible: boolean }) {
  const colors = useThemeColors();
  const styles = useStyles();
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const canSubmit = text.trim().length >= 12;

  async function pickPhoto() {
    try {
      const picker = await import('expo-image-picker');
      const result = await picker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], mediaTypes: ['images'], quality: 0.82 });
      if (!result.canceled) setPhotoUri(result.assets[0].uri);
    } catch { Alert.alert('Galería no disponible', 'Puedes continuar sin agregar una foto.'); }
  }

  return <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
      <Pressable accessibilityLabel="Cerrar recomendación" onPress={onClose} style={styles.backdrop} />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}><View><AppText style={styles.headerEyebrow} variant="caption">RECOMENDAR EN TRIBUUS</AppText><AppText numberOfLines={1} style={styles.headerTitle} variant="bodyStrong">{placeName}</AppText></View><Pressable accessibilityLabel="Cerrar" onPress={onClose} style={styles.closeButton}><AppIcon color={colors.text} name="x" size={18} /></Pressable></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AppText style={styles.title} variant="heading">¿Qué hace especial este lugar?</AppText><AppText style={styles.subtitle}>Compártelo con tu comunidad en pocas palabras.</AppText>
        <TextInput accessibilityLabel="Recomendación" maxLength={420} multiline onChangeText={setText} placeholder="Cuéntanos qué te gustó, qué pedir o por qué vale la pena ir…" placeholderTextColor={colors.textMuted} style={styles.input} textAlignVertical="top" value={text} />
        <AppText style={styles.label} variant="caption">ETIQUETAS DE LA COMUNIDAD</AppText><View style={styles.tags}>{PLACE_TAGS.map((tag) => { const selected = tags.includes(tag); return <Pressable key={tag} onPress={() => setTags((current) => selected ? current.filter((item) => item !== tag) : [...current, tag])} style={[styles.tag, selected && styles.tagSelected]}><AppText style={[styles.tagText, selected && styles.tagTextSelected]} variant="caption">{tag}</AppText></Pressable>; })}</View>
        {photoUri ? <View style={styles.preview}><Image contentFit="cover" source={{ uri: photoUri }} style={styles.image} /><Pressable onPress={() => setPhotoUri(undefined)} style={styles.remove}><AppIcon color={colors.textOnDark} name="x" size={16} /></Pressable></View> : <Pressable onPress={() => void pickPhoto()} style={styles.photoButton}><AppIcon color={colors.primaryDark} name="image" size={18} /><AppText style={styles.photoText} variant="bodyStrong">Agregar foto de la comunidad</AppText></Pressable>}
        <Pressable disabled={!canSubmit} onPress={() => onSubmit({ photoUri, tags, text: text.trim() })} style={[styles.submit, !canSubmit && styles.disabled]}><AppText style={styles.submitText} variant="bodyStrong">Publicar recomendación</AppText><AppIcon color={colors.textOnPrimary} name="arrow-right" size={18} /></Pressable>
        <AppText style={styles.note} variant="caption">Se guardará durante esta sesión.</AppText>
      </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  </Modal>;
}

const useStyles = makeThemedStyles((colors) => ({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.28)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '84%', overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000000', shadowOffset: { height: -5, width: 0 }, shadowOpacity: 0.2, shadowRadius: 20 }, android: { elevation: 18 } }) },
  handle: { alignSelf: 'center', backgroundColor: colors.border, borderRadius: 3, height: 5, marginBottom: 8, marginTop: 8, width: 36 },
  header: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 56, paddingBottom: 10, paddingHorizontal: spacing.lg },
  headerEyebrow: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 8, letterSpacing: 0.7 },
  headerTitle: { fontSize: 15, marginTop: 2, maxWidth: 260 },
  closeButton: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, height: 30, justifyContent: 'center', width: 30 },
  content: { alignSelf: 'center', maxWidth: 640, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, width: '100%' },
  title: { fontSize: 23, letterSpacing: -0.65, lineHeight: 28 },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, color: colors.text, fontFamily: typography.body, fontSize: 15, lineHeight: 21, marginTop: 15, minHeight: 108, padding: 14 },
  label: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 9, letterSpacing: 0.65, marginTop: 16 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  tag: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 8 },
  tagSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDark },
  tagText: { color: colors.textMuted, fontSize: 10 },
  tagTextSelected: { color: colors.primaryDark, fontFamily: typography.bodySemiBold },
  photoButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 14, minHeight: 48 },
  photoText: { color: colors.primaryDark, fontSize: 11 },
  preview: { marginTop: 14, position: 'relative' },
  image: { aspectRatio: 16 / 9, borderRadius: 16, width: '100%' },
  remove: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.68)', borderRadius: radii.pill, height: 32, justifyContent: 'center', position: 'absolute', right: 8, top: 8, width: 32 },
  submit: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 15, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 16, minHeight: 50 },
  submitText: { color: colors.textOnPrimary, fontSize: 13 },
  disabled: { opacity: 0.34 },
  note: { color: colors.textMuted, marginTop: 8, textAlign: 'center' },
}));
