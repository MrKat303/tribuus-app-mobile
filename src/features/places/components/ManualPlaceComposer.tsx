import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/theme/AppearanceProvider';
import type { Coordinate } from '@/shared/geo';
import { PLACE_CATEGORIES, PLACE_TAGS, type CommunityPlaceDraft, type PlaceCategory, type RecommendationDraft, type TribuusPlace } from '@/features/places/model/place';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

type Step = 'place' | 'duplicates' | 'recommendation';

export function ManualPlaceComposer({ findDuplicates, initialCoordinate, onClose, onCreate, onRecommendExisting, visible }: {
  findDuplicates: (name: string, coordinate: Coordinate) => TribuusPlace[];
  initialCoordinate: Coordinate;
  onClose: () => void;
  onCreate: (draft: CommunityPlaceDraft, recommendation: RecommendationDraft) => void;
  onRecommendExisting: (place: TribuusPlace) => void;
  visible: boolean;
}) {
  const colors = useThemeColors();
  const styles = useStyles();
  const [step, setStep] = useState<Step>('place');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('Cafetería');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('Providencia');
  const [coordinate, setCoordinate] = useState<Coordinate>(initialCoordinate);
  const [duplicates, setDuplicates] = useState<TribuusPlace[]>([]);
  const [recommendation, setRecommendation] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  function continueFlow() {
    if (!name.trim() || !address.trim() || !neighborhood.trim()) { Alert.alert('Faltan datos', 'Completa el nombre, la comuna o barrio y la dirección.'); return; }
    const matches = findDuplicates(name, coordinate);
    setDuplicates(matches);
    setStep(matches.length ? 'duplicates' : 'recommendation');
  }

  function submit() {
    if (recommendation.trim().length < 12) { Alert.alert('Cuéntanos un poco más', 'La recomendación debe tener al menos 12 caracteres.'); return; }
    onCreate({ address: address.trim(), category, coordinate, name: name.trim(), neighborhood: neighborhood.trim(), rawCategory: 'community' }, { tags, text: recommendation.trim() });
  }

  return <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={visible}>
    <SafeAreaView edges={['top', 'bottom']} style={styles.page}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.page}>
      <View style={styles.header}><Pressable accessibilityLabel="Cerrar" onPress={onClose} style={styles.headerButton}><AppIcon name="x" size={21} /></Pressable><AppText variant="bodyStrong">Agregar lugar</AppText><View style={styles.headerButton} /></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'place' ? <>
          <AppText style={styles.eyebrow} variant="caption">LUGAR DE LA COMUNIDAD</AppText><AppText style={styles.title} variant="heading">Cuéntanos dónde está</AppText><AppText style={styles.subtitle}>Lo compararemos con lugares cercanos antes de crearlo.</AppText>
          <Field label="Nombre" onChange={setName} placeholder="Ej. Café La Plaza" value={name} />
          <AppText style={styles.fieldLabel} variant="caption">CATEGORÍA</AppText><View style={styles.categories}>{PLACE_CATEGORIES.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.categorySelected]}><AppText style={[styles.categoryText, category === item && styles.categoryTextSelected]} variant="caption">{item}</AppText></Pressable>)}</View>
          <Field label="Comuna o barrio" onChange={setNeighborhood} placeholder="Providencia" value={neighborhood} /><Field label="Dirección" onChange={setAddress} placeholder="Calle y número" value={address} />
          <View style={styles.locationBox}><View style={styles.locationIcon}><AppIcon color={colors.textOnPrimary} name="crosshair" size={18} /></View><View style={styles.locationCopy}><AppText variant="bodyStrong">Punto seleccionado en el mapa</AppText><AppText style={styles.coordinate} variant="caption">{coordinate[1].toFixed(5)}, {coordinate[0].toFixed(5)}</AppText></View><Pressable onPress={() => setCoordinate(initialCoordinate)} style={styles.useCenter}><AppText style={styles.useCenterText} variant="caption">Usar centro</AppText></Pressable></View>
          <PrimaryButton label="Continuar" onPress={continueFlow} />
        </> : null}
        {step === 'duplicates' ? <>
          <AppText style={styles.eyebrow} variant="caption">EVITEMOS DUPLICADOS</AppText><AppText style={styles.title} variant="heading">¿Es alguno de estos?</AppText><AppText style={styles.subtitle}>Encontramos lugares con nombres parecidos cerca del punto elegido.</AppText>
          <View style={styles.matches}>{duplicates.map((place) => <Pressable key={place.id} onPress={() => onRecommendExisting(place)} style={styles.match}><View style={styles.matchIcon}><AppIcon color={colors.primaryDark} name="map-pin" size={18} /></View><View style={styles.matchCopy}><AppText variant="bodyStrong">{place.providerData.name}</AppText><AppText style={styles.matchMeta} variant="caption">{place.providerData.address}</AppText></View><AppIcon color={colors.textMuted} name="chevron-right" size={18} /></Pressable>)}</View>
          <Pressable onPress={() => setStep('recommendation')} style={styles.noneButton}><AppIcon color={colors.primaryDark} name="plus" size={17} /><AppText style={styles.noneText} variant="bodyStrong">Ninguno, crear nuevo</AppText></Pressable>
        </> : null}
        {step === 'recommendation' ? <>
          <AppText style={styles.eyebrow} variant="caption">ÚLTIMO PASO</AppText><AppText style={styles.title} variant="heading">Recomienda {name}</AppText><AppText style={styles.subtitle}>El lugar aparecerá en el mapa cuando publiques esta recomendación.</AppText>
          <TextInput maxLength={420} multiline onChangeText={setRecommendation} placeholder="¿Qué te gustó y por qué otras personas deberían conocerlo?" placeholderTextColor={colors.textMuted} style={styles.recommendationInput} textAlignVertical="top" value={recommendation} />
          <AppText style={styles.fieldLabel} variant="caption">ETIQUETAS</AppText><View style={styles.categories}>{PLACE_TAGS.map((tag) => { const selected = tags.includes(tag); return <Pressable key={tag} onPress={() => setTags((current) => selected ? current.filter((item) => item !== tag) : [...current, tag])} style={[styles.category, selected && styles.categorySelected]}><AppText style={[styles.categoryText, selected && styles.categoryTextSelected]} variant="caption">{tag}</AppText></Pressable>; })}</View>
          <PrimaryButton label="Crear y recomendar" onPress={submit} />
        </> : null}
      </ScrollView>
    </KeyboardAvoidingView></SafeAreaView>
  </Modal>;
}

function Field({ label, onChange, placeholder, value }: { label: string; onChange: (value: string) => void; placeholder: string; value: string }) { const colors = useThemeColors(); const styles = useStyles(); return <View style={styles.field}><AppText style={styles.fieldLabel} variant="caption">{label.toLocaleUpperCase('es')}</AppText><TextInput onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textMuted} style={styles.input} value={value} /></View>; }
function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) { const colors = useThemeColors(); const styles = useStyles(); return <Pressable onPress={onPress} style={styles.primaryButton}><AppText style={styles.primaryText} variant="bodyStrong">{label}</AppText><AppIcon color={colors.textOnPrimary} name="arrow-right" size={18} /></Pressable>; }

const useStyles = makeThemedStyles((colors) => ({ page: { backgroundColor: colors.background, flex: 1 }, header: { alignItems: 'center', backgroundColor: colors.primarySoft, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 58, paddingHorizontal: 12 }, headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 }, content: { alignSelf: 'center', maxWidth: 640, padding: spacing.xl, width: '100%' }, eyebrow: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 9, letterSpacing: 0.8 }, title: { fontSize: 28, letterSpacing: -0.8, lineHeight: 33, marginTop: 5 }, subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 5 }, field: { marginTop: 18 }, fieldLabel: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 9, letterSpacing: 0.65, marginBottom: 7, marginTop: 18 }, input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, fontFamily: typography.body, fontSize: 14, minHeight: 48, paddingHorizontal: 13 }, categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, category: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 }, categorySelected: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDark }, categoryText: { color: colors.textMuted, fontSize: 10 }, categoryTextSelected: { color: colors.primaryDark, fontFamily: typography.bodySemiBold }, locationBox: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 14, flexDirection: 'row', gap: 10, marginTop: 18, padding: 11 }, locationIcon: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 10, height: 38, justifyContent: 'center', width: 38 }, locationCopy: { flex: 1 }, coordinate: { color: colors.textMuted, fontSize: 9, marginTop: 1 }, useCenter: { backgroundColor: colors.surface, borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 7 }, useCenterText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 8.5 }, primaryButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 13, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 22, minHeight: 52 }, primaryText: { color: colors.textOnPrimary, fontSize: 13 }, matches: { gap: 8, marginTop: 18 }, match: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 12 }, matchIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 10, height: 38, justifyContent: 'center', width: 38 }, matchCopy: { flex: 1 }, matchMeta: { color: colors.textMuted, fontSize: 9, marginTop: 2 }, noneButton: { alignItems: 'center', borderColor: colors.primaryDark, borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 7, justifyContent: 'center', marginTop: 14, minHeight: 50 }, noneText: { color: colors.primaryDark, fontSize: 12 }, recommendationInput: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, fontFamily: typography.body, fontSize: 14, lineHeight: 20, marginTop: 18, minHeight: 140, padding: 13 } }));
