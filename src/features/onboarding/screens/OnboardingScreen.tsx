import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/BrandMark';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/theme/AppearanceProvider';
import { useAuth } from '@/features/auth/application/AuthProvider';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

type CommunityOption = { id: string; location: string; name: string; slug: string };
type SavedLocation = {
  accuracyM?: number;
  countryCode?: string;
  label: string;
  latitude?: number;
  longitude?: number;
  region?: string;
  source: 'device' | 'manual';
};

const fallbackCommunities: CommunityOption[] = [
  { id: '00000000-0000-4000-8000-000000000001', location: 'Providencia', name: 'Comunidad Providencia', slug: 'providencia' },
  { id: '00000000-0000-4000-8000-000000000002', location: 'Ñuñoa', name: 'Comunidad Ñuñoa', slug: 'nunoa' },
  { id: '00000000-0000-4000-8000-000000000003', location: 'Santiago', name: 'Comunidad Santiago', slug: 'santiago' },
  { id: '00000000-0000-4000-8000-000000000004', location: 'Las Condes', name: 'Comunidad Las Condes', slug: 'las-condes' },
  { id: '00000000-0000-4000-8000-000000000005', location: 'Vitacura', name: 'Comunidad Vitacura', slug: 'vitacura' },
  { id: '00000000-0000-4000-8000-000000000006', location: 'La Reina', name: 'Comunidad La Reina', slug: 'la-reina' },
];

const interests = [
  { icon: 'map-pin' as const, label: 'Vida de barrio', value: 'barrio' },
  { icon: 'film' as const, label: 'Cultura', value: 'cultura' },
  { icon: 'activity' as const, label: 'Deporte', value: 'deporte' },
  { icon: 'shopping-bag' as const, label: 'Emprendimiento', value: 'emprendimiento' },
  { icon: 'users' as const, label: 'Familia', value: 'familia' },
  { icon: 'heart' as const, label: 'Mascotas', value: 'mascotas' },
  { icon: 'sun' as const, label: 'Medioambiente', value: 'medioambiente' },
  { icon: 'shield' as const, label: 'Seguridad', value: 'seguridad' },
  { icon: 'gift' as const, label: 'Voluntariado', value: 'voluntariado' },
];

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useStyles();
  const { completeOnboarding, profile, session, signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.displayName === 'Nuevo miembro' ? '' : profile?.displayName ?? '');
  const [username, setUsername] = useState(profile?.username.startsWith('tribu_') ? '' : profile?.username ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [communities, setCommunities] = useState<CommunityOption[]>(fallbackCommunities);
  const [communityId, setCommunityId] = useState(profile?.primaryCommunityId ?? fallbackCommunities[0].id);
  const [savedLocation, setSavedLocation] = useState<SavedLocation>({ label: profile?.location ?? 'Providencia', source: 'manual' });
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void supabase
      .from('communities')
      .select('id, slug, name, location')
      .eq('is_open', true)
      .order('name')
      .then(({ data }) => {
        if (active && data?.length) setCommunities(data as CommunityOption[]);
      });
    return () => { active = false; };
  }, []);

  const currentCommunity = useMemo(
    () => communities.find((community) => community.id === communityId) ?? communities[0],
    [communities, communityId],
  );

  const continueFromProfile = () => {
    const normalizedUsername = username.trim().toLowerCase();
    if (name.trim().length < 2) return setError('Escribe el nombre que verá tu comunidad.');
    if (!/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
      return setError('El usuario debe tener 3–30 caracteres: letras minúsculas, números o _.');
    }
    setUsername(normalizedUsername);
    setError(null);
    setStep(1);
  };

  const selectCommunity = (community: CommunityOption) => {
    setCommunityId(community.id);
    setSavedLocation((current) => current.source === 'device'
      ? { ...current, label: community.location }
      : { label: community.location, source: 'manual' });
    setError(null);
  };

  const requestCurrentLocation = async () => {
    if (process.env.EXPO_OS === 'web') {
      setError('En la versión web, elige tu comuna manualmente.');
      return;
    }
    setLocating(true);
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError('No diste acceso a la ubicación. Puedes elegir tu comuna manualmente.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const addresses = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const address = addresses[0];
      const candidates = [address?.district, address?.subregion, address?.city, address?.region]
        .filter((value): value is string => Boolean(value));
      const match = communities.find((community) => candidates.some((candidate) => {
        const normalizedCandidate = normalize(candidate);
        const normalizedCommunity = normalize(community.location);
        return normalizedCandidate.includes(normalizedCommunity) || normalizedCommunity.includes(normalizedCandidate);
      }));
      const selected = match ?? currentCommunity ?? fallbackCommunities[0];
      setCommunityId(selected.id);
      setSavedLocation({
        accuracyM: position.coords.accuracy ?? undefined,
        countryCode: address?.isoCountryCode?.toUpperCase(),
        label: selected.location,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        region: address?.region ?? undefined,
        source: 'device',
      });
      if (!match) setError('Ubicamos tu zona, pero elige la comunidad más cercana para continuar.');
    } catch {
      setError('No pudimos obtener tu ubicación. Puedes elegir tu comuna manualmente.');
    } finally {
      setLocating(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) => {
      if (current.includes(interest)) return current.filter((item) => item !== interest);
      if (current.length >= 5) {
        setError('Puedes elegir hasta cinco intereses.');
        return current;
      }
      setError(null);
      return [...current, interest];
    });
  };

  const finish = async () => {
    if (!currentCommunity) return setError('Elige una comunidad para continuar.');
    if (selectedInterests.length < 2) return setError('Elige al menos dos intereses.');
    setSubmitting(true);
    setError(null);
    try {
      await completeOnboarding({
        accuracyM: savedLocation.accuracyM,
        bio,
        communityId: currentCommunity.id,
        countryCode: savedLocation.countryCode,
        displayName: name,
        interests: selectedInterests,
        latitude: savedLocation.latitude,
        locationLabel: currentCommunity.location,
        locationSource: savedLocation.source,
        longitude: savedLocation.longitude,
        region: savedLocation.region,
        username,
      });
      router.replace('/(tabs)/inicio');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos guardar tu perfil.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.topBar}>
          <BrandMark />
          <Pressable accessibilityRole="button" onPress={() => void signOut()} style={styles.exitButton}>
            <AppText style={styles.exitLabel} variant="caption">Salir</AppText>
          </Pressable>
        </View>
        <View accessibilityLabel={`Paso ${step + 1} de 3`} style={styles.progressRow}>
          {[0, 1, 2].map((progressStep) => (
            <View key={progressStep} style={[styles.progressTrack, progressStep <= step && styles.progressActive]} />
          ))}
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {step === 0 ? (
            <View>
              <AppText style={styles.eyebrow} variant="eyebrow">Tu identidad</AppText>
              <AppText style={styles.title} variant="heading">¿Cómo te conocerá tu comunidad?</AppText>
              <AppText style={styles.subtitle}>Puedes cambiar estos datos después desde tu perfil.</AppText>
              <Field label="Nombre visible">
                <TextInput autoCapitalize="words" maxLength={80} onChangeText={setName} placeholder="Tu nombre" placeholderTextColor={colors.textMuted} style={styles.input} value={name} />
              </Field>
              <Field label="Nombre de usuario">
                <View style={styles.usernameInput}>
                  <AppText style={styles.at}>@</AppText>
                  <TextInput autoCapitalize="none" autoCorrect={false} maxLength={30} onChangeText={setUsername} placeholder="nombre_usuario" placeholderTextColor={colors.textMuted} style={styles.usernameTextInput} value={username} />
                </View>
              </Field>
              <Field label="Biografía (opcional)">
                <TextInput maxLength={160} multiline onChangeText={setBio} placeholder="Cuéntanos qué te conecta con tu barrio" placeholderTextColor={colors.textMuted} style={[styles.input, styles.bioInput]} textAlignVertical="top" value={bio} />
                <AppText style={styles.counter} variant="caption">{bio.length}/160</AppText>
              </Field>
            </View>
          ) : null}

          {step === 1 ? (
            <View>
              <AppText style={styles.eyebrow} variant="eyebrow">Tu zona</AppText>
              <AppText style={styles.title} variant="heading">Conecta con lo que pasa cerca.</AppText>
              <AppText style={styles.subtitle}>Usamos tu ubicación una vez para sugerir tu comunidad. La ubicación exacta nunca aparece en tu perfil.</AppText>
              <Pressable accessibilityRole="button" disabled={locating} onPress={() => void requestCurrentLocation()} style={({ pressed }) => [styles.locationButton, pressed && styles.pressed]}>
                {locating ? <ActivityIndicator color={colors.textOnPrimary} /> : <AppIcon color={colors.textOnPrimary} name="navigation" size={20} />}
                <View style={styles.locationButtonCopy}>
                  <AppText style={styles.locationButtonTitle} variant="bodyStrong">{locating ? 'Buscando tu ubicación…' : 'Usar mi ubicación actual'}</AppText>
                  <AppText style={styles.locationButtonCaption} variant="caption">Solo mientras usas la app</AppText>
                </View>
              </Pressable>
              <View style={styles.privacyCard}>
                <AppIcon color={colors.primaryDark} name="lock" size={18} />
                <AppText style={styles.privacyCopy} variant="caption">Las coordenadas se guardan en una tabla privada. Otros usuarios solo ven tu comuna.</AppText>
              </View>
              <AppText style={styles.sectionLabel} variant="caption">O ELIGE TU COMUNIDAD</AppText>
              <View style={styles.communityGrid}>
                {communities.map((community) => {
                  const selected = community.id === communityId;
                  return (
                    <Pressable key={community.id} onPress={() => selectCommunity(community)} style={[styles.communityChip, selected && styles.communityChipSelected]}>
                      <AppIcon color={selected ? colors.primaryDark : colors.textMuted} name={selected ? 'check-circle' : 'map-pin'} size={16} />
                      <AppText style={[styles.communityLabel, selected && styles.communityLabelSelected]} variant="caption">{community.location}</AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {step === 2 ? (
            <View>
              <AppText style={styles.eyebrow} variant="eyebrow">Tus intereses</AppText>
              <AppText style={styles.title} variant="heading">Haz que el inicio se sienta tuyo.</AppText>
              <AppText style={styles.subtitle}>Elige entre dos y cinco temas. Los usaremos para ordenar recomendaciones, nunca para limitar lo que puedes ver.</AppText>
              <View style={styles.interestGrid}>
                {interests.map((interest) => {
                  const selected = selectedInterests.includes(interest.value);
                  return (
                    <Pressable key={interest.value} onPress={() => toggleInterest(interest.value)} style={[styles.interestCard, selected && styles.interestCardSelected]}>
                      <AppIcon color={selected ? colors.primaryDark : colors.textMuted} name={interest.icon} size={21} />
                      <AppText style={[styles.interestLabel, selected && styles.interestLabelSelected]} variant="caption">{interest.label}</AppText>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}><AppIcon color={colors.primaryDark} name="user" size={17} /><AppText style={styles.summaryText}>@{username}</AppText></View>
                <View style={styles.summaryRow}><AppIcon color={colors.primaryDark} name="map-pin" size={17} /><AppText style={styles.summaryText}>{currentCommunity?.location ?? savedLocation.label}</AppText></View>
                <View style={styles.summaryRow}><AppIcon color={colors.primaryDark} name="mail" size={17} /><AppText numberOfLines={1} style={styles.summaryText}>{session?.user.email}</AppText></View>
              </View>
            </View>
          ) : null}
          {error ? <AppText accessibilityRole="alert" style={styles.error} variant="caption">{error}</AppText> : null}
        </ScrollView>
        <View style={styles.footer}>
          {step > 0 ? (
            <Pressable accessibilityRole="button" disabled={submitting} onPress={() => { setError(null); setStep((current) => current - 1); }} style={styles.backButton}>
              <AppIcon color={colors.text} name="arrow-left" size={18} />
              <AppText variant="bodyStrong">Atrás</AppText>
            </Pressable>
          ) : <View />}
          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            onPress={() => step === 0 ? continueFromProfile() : step === 1 ? (setError(null), setStep(2)) : void finish()}
            style={({ pressed }) => [styles.continueButton, submitting && styles.disabled, pressed && styles.pressed]}>
            {submitting ? <ActivityIndicator color={colors.textOnPrimary} /> : <AppText style={styles.continueLabel} variant="bodyStrong">{step === 2 ? 'Entrar a Tribus' : 'Continuar'}</AppText>}
            {!submitting ? <AppIcon color={colors.textOnPrimary} name="arrow-right" size={18} /> : null}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  const styles = useStyles();
  return <View style={styles.field}><AppText style={styles.fieldLabel} variant="caption">{label}</AppText>{children}</View>;
}

const useStyles = makeThemedStyles((colors) => ({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  flex: { flex: 1 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  exitButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  exitLabel: { color: colors.textMuted },
  progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  progressTrack: { backgroundColor: colors.border, borderRadius: radii.pill, flex: 1, height: 3 },
  progressActive: { backgroundColor: colors.primaryDark },
  content: { alignSelf: 'center', flexGrow: 1, maxWidth: 620, padding: spacing.xl, paddingBottom: 120, width: '100%' },
  eyebrow: { color: colors.primaryDark, marginBottom: spacing.sm },
  title: { fontSize: 33, letterSpacing: -1, lineHeight: 38, maxWidth: 540 },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginBottom: spacing.xl, marginTop: spacing.sm },
  field: { gap: 7, marginBottom: spacing.lg },
  fieldLabel: { color: colors.text, fontFamily: typography.bodySemiBold, fontSize: 12 },
  input: { backgroundColor: colors.input, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, color: colors.text, fontFamily: typography.body, fontSize: 16, minHeight: 52, paddingHorizontal: spacing.lg },
  bioInput: { minHeight: 104, paddingTop: spacing.md },
  counter: { color: colors.textMuted, fontSize: 10, textAlign: 'right' },
  usernameInput: { alignItems: 'center', backgroundColor: colors.input, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 52, paddingHorizontal: spacing.lg },
  at: { color: colors.textMuted, fontFamily: typography.bodySemiBold },
  usernameTextInput: { color: colors.text, flex: 1, fontFamily: typography.body, fontSize: 16, minHeight: 50, paddingHorizontal: 4 },
  locationButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderCurve: 'continuous', borderRadius: radii.md, flexDirection: 'row', gap: spacing.md, minHeight: 76, paddingHorizontal: spacing.lg },
  locationButtonCopy: { flex: 1 },
  locationButtonTitle: { color: colors.textOnPrimary },
  locationButtonCaption: { color: colors.textOnPrimary, opacity: 0.72 },
  privacyCard: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.sm, flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, padding: spacing.md },
  privacyCopy: { color: colors.textMuted, flex: 1 },
  sectionLabel: { color: colors.textMuted, fontFamily: typography.bodySemiBold, fontSize: 10, letterSpacing: 0.8, marginBottom: spacing.md, marginTop: spacing.xl },
  communityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  communityChip: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.pill, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 6, minHeight: 44, paddingHorizontal: spacing.md },
  communityChipSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDark },
  communityLabel: { color: colors.textMuted },
  communityLabelSelected: { color: colors.primaryDark, fontFamily: typography.bodySemiBold },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  interestCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, flexBasis: '31%', flexGrow: 1, gap: spacing.sm, justifyContent: 'center', minHeight: 92, padding: spacing.md },
  interestCardSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primaryDark },
  interestLabel: { color: colors.textMuted, textAlign: 'center' },
  interestLabelSelected: { color: colors.primaryDark, fontFamily: typography.bodySemiBold },
  summaryCard: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.md, gap: spacing.md, marginTop: spacing.xl, padding: spacing.lg },
  summaryRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  summaryText: { flex: 1, fontSize: 14 },
  error: { color: colors.danger, marginTop: spacing.lg },
  footer: { alignItems: 'center', backgroundColor: colors.overlay, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, bottom: 0, flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.md, paddingHorizontal: spacing.xl, paddingTop: spacing.md, position: 'absolute', width: '100%' },
  backButton: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 48, paddingHorizontal: spacing.sm },
  continueButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderCurve: 'continuous', borderRadius: radii.sm, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 52, minWidth: 150, paddingHorizontal: spacing.lg },
  continueLabel: { color: colors.textOnPrimary },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
}));
