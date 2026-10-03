import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/theme/AppearanceProvider';
import { useCommunityWallet } from '@/features/community-wallet/application/CommunityWalletProvider';
import { useProfile } from '@/features/profile/application/ProfileProvider';
import type { InitiativeCategory } from '@/features/community-wallet/model/communityWallet';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

const categories: { icon: 'calendar' | 'map-pin' | 'shield' | 'sun'; label: InitiativeCategory }[] = [
  { icon: 'map-pin', label: 'Espacios públicos' },
  { icon: 'sun', label: 'Medioambiente' },
  { icon: 'calendar', label: 'Actividades' },
  { icon: 'shield', label: 'Seguridad' },
];

export function CommunityWalletProposeScreen() {
  const router = useRouter();
  const { colors } = useAppAppearance();
  const styles = useStyles();
  const { createInitiative } = useCommunityWallet();
  const { profile } = useProfile();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [target, setTarget] = useState('');
  const [category, setCategory] = useState<InitiativeCategory>('Espacios públicos');
  const [attempted, setAttempted] = useState(false);
  const costClp = Number(target.replace(/\D/g, ''));
  const valid = title.trim().length >= 6 && summary.trim().length >= 20 && Number.isFinite(costClp) && costClp > 0;

  const submit = () => {
    setAttempted(true);
    if (!valid) return;
    createInitiative({ category, costClp, summary: summary.trim(), title: title.trim() }, profile.name);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    Alert.alert('Propuesta enviada', 'La iniciativa quedó en revisión comunitaria.', [{ text: 'Listo', onPress: () => router.back() }]);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable accessibilityLabel="Cancelar propuesta" hitSlop={8} onPress={() => router.back()} style={styles.headerButton}>
              <AppText style={styles.cancelText}>Cancelar</AppText>
            </Pressable>
            <AppText style={styles.headerTitle} variant="bodyStrong">Nueva iniciativa</AppText>
            <View style={styles.headerButton} />
          </View>

          <View style={styles.intro}>
            <View style={styles.introIcon}><AppIcon color={colors.primaryDark} name="users" size={22} /></View>
            <View style={styles.introCopy}><AppText variant="bodyStrong">Propón algo para tu barrio</AppText><AppText style={styles.introText} variant="caption">La comunidad podrá apoyarlo y, tras la revisión, aportar desde Stellar.</AppText></View>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <AppText style={styles.label} variant="caption">TÍTULO</AppText>
              <TextInput
                accessibilityLabel="Título de la iniciativa"
                autoCapitalize="sentences"
                maxLength={70}
                onChangeText={setTitle}
                placeholder="Ej. Iluminación para la plaza"
                placeholderTextColor={colors.textMuted}
                returnKeyType="next"
                selectionColor={colors.primaryDark}
                style={styles.input}
                value={title}
              />
              <AppText style={styles.counter} variant="caption">{title.length}/70</AppText>
              {attempted && title.trim().length < 6 ? <AppText style={styles.error} variant="caption">Escribe un título más descriptivo.</AppText> : null}
            </View>

            <View style={styles.field}>
              <AppText style={styles.label} variant="caption">DESCRIPCIÓN</AppText>
              <TextInput
                accessibilityLabel="Descripción de la iniciativa"
                maxLength={360}
                multiline
                onChangeText={setSummary}
                placeholder="Explica qué se hará, a quién beneficia y por qué es importante."
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.primaryDark}
                style={[styles.input, styles.textArea]}
                textAlignVertical="top"
                value={summary}
              />
              <AppText style={styles.counter} variant="caption">{summary.length}/360</AppText>
              {attempted && summary.trim().length < 20 ? <AppText style={styles.error} variant="caption">Agrega al menos 20 caracteres.</AppText> : null}
            </View>

            <View style={styles.field}>
              <AppText style={styles.label} variant="caption">CATEGORÍA</AppText>
              <View style={styles.categories}>
                {categories.map((item) => {
                  const selected = category === item.label;
                  return (
                    <Pressable accessibilityState={{ selected }} key={item.label} onPress={() => { setCategory(item.label); void Haptics.selectionAsync().catch(() => undefined); }} style={[styles.category, selected && styles.categorySelected]}>
                      <AppIcon color={selected ? colors.primaryDark : colors.textMuted} name={item.icon} size={15} />
                      <AppText style={[styles.categoryText, selected && styles.categoryTextSelected]} variant="caption">{item.label}</AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <AppText style={styles.label} variant="caption">COSTO ESTIMADO</AppText>
              <View style={styles.targetField}>
                <TextInput
                  accessibilityLabel="Costo estimado en pesos chilenos"
                  keyboardType="number-pad"
                  maxLength={12}
                  onChangeText={(value) => setTarget(value.replace(/\D/g, ''))}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  selectionColor={colors.primaryDark}
                  style={styles.targetInput}
                  value={target}
                />
                <AppText style={styles.targetCurrency} variant="bodyStrong">CLP</AppText>
              </View>
              <AppText style={styles.helper} variant="caption">Define una meta clara; podrá ajustarse durante la revisión.</AppText>
              {attempted && !(costClp > 0) ? <AppText style={styles.error} variant="caption">Ingresa un costo mayor que cero.</AppText> : null}
            </View>
          </View>

          <View style={styles.reviewNote}>
            <AppIcon color={colors.textMuted} name="check-circle" size={17} />
            <AppText style={styles.reviewText} variant="caption">Las propuestas se publican como “En revisión”. El apoyo no mueve fondos hasta que la iniciativa sea aprobada.</AppText>
          </View>

          <Pressable accessibilityRole="button" onPress={submit} style={({ pressed }) => [styles.submit, pressed && styles.pressed]}>
            <AppText style={styles.submitText} variant="bodyStrong">Enviar propuesta</AppText>
            <AppIcon color={colors.textOnPrimary} name="arrow-right" size={17} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) => StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  flex: { flex: 1 },
  content: { alignSelf: 'center', maxWidth: 620, paddingBottom: 28, paddingHorizontal: 18, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 52 },
  headerButton: { justifyContent: 'center', minHeight: 44, minWidth: 74 },
  cancelText: { color: colors.primaryDark, fontSize: 14 },
  headerTitle: { fontSize: 16 },
  intro: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.md, flexDirection: 'row', gap: 12, marginTop: 12, padding: 15 },
  introIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.sm, height: 46, justifyContent: 'center', width: 46 },
  introCopy: { flex: 1 },
  introText: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  form: { gap: 25, marginTop: 27 },
  field: {},
  label: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 9, letterSpacing: 0.72, marginBottom: 7 },
  input: { backgroundColor: colors.input, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, color: colors.text, fontFamily: typography.body, fontSize: 15, minHeight: 50, paddingHorizontal: 13, paddingVertical: 11 },
  textArea: { minHeight: 124 },
  counter: { color: colors.textMuted, fontSize: 9, marginTop: 4, textAlign: 'right' },
  error: { color: colors.danger, fontSize: 10, marginTop: 4 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  category: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderColor: 'transparent', borderRadius: radii.pill, borderWidth: 1, flexDirection: 'row', gap: 6, minHeight: 40, paddingHorizontal: 12 },
  categorySelected: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDark },
  categoryText: { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: 10 },
  categoryTextSelected: { color: colors.primaryDark, fontFamily: typography.bodySemiBold },
  targetField: { alignItems: 'center', backgroundColor: colors.input, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 54, paddingHorizontal: 13 },
  targetInput: { color: colors.text, flex: 1, fontFamily: typography.title, fontSize: 22, fontVariant: ['tabular-nums'], padding: 0 },
  targetCurrency: { color: colors.textMuted },
  helper: { color: colors.textMuted, fontSize: 10, marginTop: 5 },
  reviewNote: { alignItems: 'flex-start', backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.sm, flexDirection: 'row', gap: 8, marginTop: 27, padding: 13 },
  reviewText: { color: colors.textMuted, flex: 1, fontSize: 10, lineHeight: 15 },
  submit: { alignItems: 'center', backgroundColor: colors.primaryDark, borderCurve: 'continuous', borderRadius: 14, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: spacing.lg, minHeight: 54 },
  submitText: { color: colors.textOnPrimary },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
}));
