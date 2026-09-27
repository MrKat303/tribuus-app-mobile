import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/context/AppearanceContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

import { type Coordinate, type EventCategory, type MapEvent } from '../model/map';

type PublishData = Pick<MapEvent, 'category' | 'date' | 'location' | 'title'>;
type MapComposerProps = {
  coordinate: Coordinate;
  onClose: () => void;
  onPublish: (data: PublishData) => void;
  visible: boolean;
};

const categories: EventCategory[] = ['Café', 'Restaurante', 'Evento', 'Servicio', 'Alerta'];

export function MapComposer({ coordinate, onClose, onPublish, visible }: MapComposerProps) {
  const colors = useThemeColors();
  const styles = useStyles();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('Mi ubicación');
  const [date, setDate] = useState('Hoy, 19:00');
  const [category, setCategory] = useState<EventCategory>('Evento');

  function submit() {
    if (!title.trim() || !location.trim() || !date.trim()) {
      Alert.alert('Faltan datos', 'Completa el título, la fecha y el lugar para publicar.');
      return;
    }
    onPublish({ category, date: date.trim(), location: location.trim(), title: title.trim() });
    setTitle('');
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={visible}>
      <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.modalPage}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalPage}>
          <View style={styles.modalHeader}>
            <Pressable accessibilityLabel="Cerrar" onPress={onClose} style={styles.modalIconButton}><AppIcon color={colors.text} name="x" size={22} /></Pressable>
            <AppText style={styles.modalTitle} variant="heading">Nueva publicación</AppText>
            <View style={styles.modalIconButton} />
          </View>
          <View style={styles.modalContent}>
            <View style={styles.modalIntroIcon}><AppIcon color={colors.textOnDark} name="map-pin" size={25} /></View>
            <AppText style={styles.modalLead} variant="heading">¿Qué está pasando cerca?</AppText>
            <AppText style={styles.modalSubtitle}>Tu publicación aparecerá en este punto: {coordinate[1].toFixed(4)}, {coordinate[0].toFixed(4)}</AppText>
            <AppText style={styles.inputLabel} variant="bodyStrong">Título</AppText>
            <TextInput maxLength={60} onChangeText={setTitle} placeholder="Ej. Picnic en la plaza" placeholderTextColor={colors.textMuted} style={styles.input} value={title} />
            <AppText style={styles.inputLabel} variant="bodyStrong">Categoría</AppText>
            <View style={styles.categoryRow}>
              {categories.map((item) => (
                <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryButton, category === item && styles.categoryButtonActive]}>
                  <AppText style={category === item ? styles.categoryTextActive : styles.categoryText} variant="caption">{item}</AppText>
                </Pressable>
              ))}
            </View>
            <AppText style={styles.inputLabel} variant="bodyStrong">Cuándo</AppText>
            <TextInput onChangeText={setDate} style={styles.input} value={date} />
            <AppText style={styles.inputLabel} variant="bodyStrong">Lugar</AppText>
            <TextInput onChangeText={setLocation} style={styles.input} value={location} />
            <Pressable accessibilityRole="button" onPress={submit} style={styles.submitButton}>
              <AppText style={styles.submitText} variant="bodyStrong">Publicar en el mapa</AppText><AppIcon color={colors.textOnPrimary} name="arrow-right" size={19} />
            </Pressable>
            <AppText style={styles.localNote} variant="caption">Demo frontend: la publicación se guarda durante esta sesión.</AppText>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  modalPage: { backgroundColor: colors.surface, flex: 1 },
  modalHeader: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  modalIconButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  modalTitle: { fontSize: 23 },
  modalContent: { alignSelf: 'center', maxWidth: 640, padding: spacing.xl, width: '100%' },
  modalIntroIcon: { alignItems: 'center', backgroundColor: '#7869E8', borderRadius: radii.pill, height: 52, justifyContent: 'center', width: 52 },
  modalLead: { fontSize: 30, marginTop: spacing.lg },
  modalSubtitle: { color: colors.textMuted, fontSize: 14, marginTop: spacing.sm },
  inputLabel: { fontSize: 14, marginBottom: spacing.sm, marginTop: spacing.xl },
  input: { backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, color: colors.text, fontFamily: typography.body, fontSize: 16, minHeight: 52, paddingHorizontal: spacing.lg },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryButton: { borderColor: colors.border, borderRadius: radii.pill, borderWidth: 1, flexBasis: '30%', flexGrow: 1, paddingHorizontal: spacing.sm, paddingVertical: 11 },
  categoryButtonActive: { backgroundColor: colors.text, borderColor: colors.text },
  categoryText: { color: colors.textMuted, textAlign: 'center' },
  categoryTextActive: { color: colors.background, textAlign: 'center' },
  submitButton: { alignItems: 'center', backgroundColor: colors.text, borderRadius: radii.pill, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.xl, minHeight: 54 },
  submitText: { color: colors.background },
  localNote: { marginTop: spacing.md, textAlign: 'center' },
}));
