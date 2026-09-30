import Feather from '@/components/ui/AppIcon';
import { useRouter } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/context/AppearanceContext';
import { useProfile } from '@/context/ProfileContext';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

type IconName = ComponentProps<typeof Feather>['name'];

function SettingsRow({ destructive = false, icon, label, onPress, right, subtitle, value }: { destructive?: boolean; icon: IconName; label: string; onPress?: () => void; right?: ReactNode; subtitle?: string; value?: string }) {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  const content = (
    <>
      <View style={[styles.rowIcon, { backgroundColor: destructive ? colors.dangerSoft : colors.surfaceMuted }]}><Feather color={destructive ? colors.danger : colors.textMuted} name={icon} size={17} /></View>
      <View style={styles.rowCopy}>
        <AppText style={[styles.rowLabel, destructive && styles.rowLabelDanger]}>{label}</AppText>
        {subtitle ? <AppText style={[styles.rowSubtitle, { color: colors.textMuted }]} variant="caption">{subtitle}</AppText> : null}
      </View>
      {value ? <AppText numberOfLines={1} style={[styles.rowValue, { color: colors.textMuted }]} variant="caption">{value}</AppText> : null}
      {right ?? (onPress ? <Feather color={colors.textMuted} name="chevron-right" size={17} /> : null)}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>{content}</Pressable>;
}

function SettingsDivider() {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

function SettingsSection({ children, footer, label }: { children: ReactNode; footer?: string; label: string }) {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  return (
    <View>
      <AppText style={[styles.groupLabel, { color: colors.textMuted }]} variant="caption">{label}</AppText>
      <View style={[styles.group, { backgroundColor: colors.surface }]}>{children}</View>
      {footer ? <AppText style={[styles.groupFooter, { color: colors.textMuted }]} variant="caption">{footer}</AppText> : null}
    </View>
  );
}

function SettingSwitch({ label, onValueChange, value }: { label: string; onValueChange: (value: boolean) => void; value: boolean }) {
  const { colors } = useAppAppearance();
  const styles = useStyles();
  return <Switch accessibilityLabel={label} onValueChange={onValueChange} style={styles.switch} trackColor={{ false: colors.surfaceMuted, true: colors.primary }} thumbColor={colors.surface} value={value} />;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, setThemeMode, themeMode } = useAppAppearance();
  const { profile } = useProfile();
  const styles = useStyles();
  const initials = profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [nearbyAlerts, setNearbyAlerts] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [discoverableProfile, setDiscoverableProfile] = useState(true);
  const [showCommune, setShowCommune] = useState(true);
  const [personalizedContent, setPersonalizedContent] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [preciseLocation, setPreciseLocation] = useState(true);
  const [largerText, setLargerText] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);

  const openSection = (section: string) => router.push({ pathname: '/ajustes/[section]', params: { section } });

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Pressable accessibilityLabel="Volver al perfil" hitSlop={8} onPress={() => router.back()} style={styles.headerButton}><Feather color={colors.text} name="chevron-left" size={25} /></Pressable>
        <AppText style={styles.headerTitle} variant="bodyStrong">Configuración</AppText>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => openSection('informacion-personal')} style={({ pressed }) => [styles.account, { backgroundColor: colors.surface }, pressed && styles.pressed]}>
          <View style={[styles.accountAvatar, { backgroundColor: colors.surfaceMuted }]}><AppText style={[styles.accountInitials, { color: colors.text }]}>{initials}</AppText></View>
          <View style={styles.accountCopy}><AppText variant="bodyStrong">{profile.name}</AppText><View style={styles.accountLocation}><Feather color={colors.textMuted} name="edit-2" size={12} /><AppText style={[styles.accountMeta, { color: colors.textMuted }]} variant="caption">Editar nombre y biografía</AppText></View></View>
          <Feather color="#A8A8AD" name="chevron-right" size={17} />
        </Pressable>

        <SettingsSection label="CUENTA Y PERFIL">
          <SettingsRow icon="map-pin" label="Comuna" onPress={() => openSection('informacion-personal')} value="Providencia" />
          <SettingsDivider />
          <SettingsRow icon="briefcase" label="Community Wallet" onPress={() => router.push('/community-wallet')} subtitle="Iniciativas y fondo transparente en Stellar" />
          <SettingsDivider />
          <SettingsRow icon="award" label="Badges" onPress={() => openSection('badges')} subtitle="2 obtenidos" />
          <SettingsDivider />
          <SettingsRow icon="user-x" label="Cuentas bloqueadas" onPress={() => openSection('cuentas-bloqueadas')} value="0" />
        </SettingsSection>

        <SettingsSection footer="Elige qué actividad quieres recibir. Las alertas críticas de tu zona pueden mostrarse por seguridad." label="NOTIFICACIONES">
          <SettingsRow icon="bell" label="Permitir notificaciones" right={<SettingSwitch label="Permitir notificaciones" onValueChange={setPushEnabled} value={pushEnabled} />} />
          <SettingsDivider />
          <SettingsRow icon="alert-circle" label="Alertas cercanas" right={<SettingSwitch label="Alertas cercanas" onValueChange={setNearbyAlerts} value={nearbyAlerts} />} />
          <SettingsDivider />
          <SettingsRow icon="message-circle" label="Comentarios y respuestas" right={<SettingSwitch label="Comentarios y respuestas" onValueChange={setCommentNotifications} value={commentNotifications} />} />
          <SettingsDivider />
          <SettingsRow icon="calendar" label="Recordatorios de eventos" right={<SettingSwitch label="Recordatorios de eventos" onValueChange={setEventReminders} value={eventReminders} />} />
          <SettingsDivider />
          <SettingsRow icon="inbox" label="Centro de notificaciones" onPress={() => router.push('/notificaciones')} subtitle="Revisa tu actividad reciente" />
          <SettingsDivider />
          <SettingsRow icon="sliders" label="Preferencias de notificaciones" onPress={() => openSection('preferencias')} subtitle="Frecuencia, tipos y horario silencioso" />
        </SettingsSection>

        <SettingsSection footer="Tu nombre y comuna nunca muestran tu ubicación exacta." label="PRIVACIDAD">
          <SettingsRow icon="eye" label="Perfil visible" right={<SettingSwitch label="Perfil visible" onValueChange={setDiscoverableProfile} value={discoverableProfile} />} subtitle="Permite que vecinos te encuentren" />
          <SettingsDivider />
          <SettingsRow icon="map-pin" label="Mostrar mi comuna" right={<SettingSwitch label="Mostrar mi comuna" onValueChange={setShowCommune} value={showCommune} />} />
          <SettingsDivider />
          <SettingsRow icon="activity" label="Contenido personalizado" right={<SettingSwitch label="Contenido personalizado" onValueChange={setPersonalizedContent} value={personalizedContent} />} subtitle="Usa tu actividad para mejorar recomendaciones" />
          <SettingsDivider />
          <SettingsRow icon="shield" label="Permisos y datos compartidos" onPress={() => openSection('permisos-datos')} />
        </SettingsSection>

        <SettingsSection footer="Protege el acceso a tu cuenta y revisa dónde está iniciada tu sesión." label="SEGURIDAD">
          <SettingsRow icon="lock" label="Face ID / huella" right={<SettingSwitch label="Face ID o huella" onValueChange={setBiometrics} value={biometrics} />} />
          <SettingsDivider />
          <SettingsRow icon="alert-triangle" label="Alertas de inicio de sesión" right={<SettingSwitch label="Alertas de inicio de sesión" onValueChange={setLoginAlerts} value={loginAlerts} />} />
          <SettingsDivider />
          <SettingsRow icon="key" label="Cambiar contraseña" onPress={() => openSection('cambiar-contrasena')} />
          <SettingsDivider />
          <SettingsRow icon="smartphone" label="Sesiones activas" onPress={() => openSection('sesiones-activas')} value="2 dispositivos" />
        </SettingsSection>

        <SettingsSection footer="Tu ubicación precisa no se comparte públicamente." label="UBICACIÓN">
          <SettingsRow icon="navigation" label="Usar mi ubicación" right={<SettingSwitch label="Usar mi ubicación" onValueChange={setLocationEnabled} value={locationEnabled} />} />
          <SettingsDivider />
          <SettingsRow icon="crosshair" label="Ubicación precisa" right={<SettingSwitch label="Ubicación precisa" onValueChange={setPreciseLocation} value={preciseLocation} />} />
        </SettingsSection>

        <SettingsSection label="APARIENCIA">
          <SettingsRow icon={isDark ? 'moon' : 'sun'} label="Tema de la app" onPress={() => openSection('apariencia')} subtitle={isDark ? 'Oscuro' : 'Claro'} />
          <View style={styles.appearanceSelector}>
            {([{ icon: 'sun', label: 'Claro', value: 'light' }, { icon: 'moon', label: 'Oscuro', value: 'dark' }] as const).map((option) => {
              const selected = themeMode === option.value;
              return (
                <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={option.value} onPress={() => setThemeMode(option.value)} style={({ pressed }) => [styles.appearanceOption, { backgroundColor: colors.surfaceMuted }, selected && { backgroundColor: colors.primaryDark }, pressed && styles.pressed]}>
                  <Feather color={selected ? colors.background : colors.textMuted} name={option.icon} size={17} />
                  <AppText style={[styles.appearanceOptionText, selected && { color: colors.background }]} variant="caption">{option.label}</AppText>
                </Pressable>
              );
            })}
          </View>
        </SettingsSection>

        <SettingsSection label="ACCESIBILIDAD">
          <SettingsRow icon="type" label="Texto más grande" right={<SettingSwitch label="Texto más grande" onValueChange={setLargerText} value={largerText} />} />
          <SettingsDivider />
          <SettingsRow icon="minimize" label="Reducir movimiento" right={<SettingSwitch label="Reducir movimiento" onValueChange={setReduceMotion} value={reduceMotion} />} />
          <SettingsDivider />
          <SettingsRow icon="volume-2" label="Audio y subtítulos" onPress={() => openSection('accesibilidad')} />
        </SettingsSection>

        <SettingsSection label="DATOS Y ALMACENAMIENTO">
          <SettingsRow icon="database" label="Ahorro de datos" right={<SettingSwitch label="Ahorro de datos" onValueChange={setDataSaver} value={dataSaver} />} subtitle="Reduce imágenes y contenido en segundo plano" />
          <SettingsDivider />
          <SettingsRow icon="download" label="Descargar mis datos" onPress={() => openSection('datos')} />
          <SettingsDivider />
          <SettingsRow icon="trash-2" label="Limpiar caché" onPress={() => openSection('datos')} value="18 MB" />
        </SettingsSection>

        <SettingsSection label="SOPORTE Y LEGAL">
          <SettingsRow icon="help-circle" label="Ayuda y soporte" onPress={() => openSection('ayuda-soporte')} />
          <SettingsDivider />
          <SettingsRow icon="message-square" label="Enviar comentarios" onPress={() => openSection('enviar-comentarios')} />
          <SettingsDivider />
          <SettingsRow icon="file-text" label="Política de privacidad" onPress={() => openSection('politica-privacidad')} />
          <SettingsDivider />
          <SettingsRow icon="book-open" label="Normas de la comunidad" onPress={() => openSection('normas-comunidad')} />
          <SettingsDivider />
          <SettingsRow icon="info" label="Acerca de Tribus" onPress={() => openSection('acerca-de')} />
        </SettingsSection>

        <SettingsSection label="CUENTA">
          <SettingsRow destructive icon="trash-2" label="Eliminar cuenta" onPress={() => openSection('datos')} />
        </SettingsSection>

        <Pressable onPress={() => Alert.alert('Cerrar sesión', 'El cierre de sesión se conectará al servicio de autenticación.')} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}><Feather color={colors.danger} name="log-out" size={17} /><AppText style={styles.logoutText}>Cerrar sesión</AppText></Pressable>
        <AppText style={[styles.version, { color: colors.textMuted }]} variant="caption">Tribus · versión 1.0</AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const systemFont = Platform.select({ ios: 'System', default: typography.body });
const systemMedium = Platform.select({ ios: 'System', default: typography.bodySemiBold });
const useStyles = makeThemedStyles((colors) => ({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', backgroundColor: colors.background, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 4 },  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  headerTitle: { fontFamily: systemMedium, fontSize: 16, fontWeight: '600', letterSpacing: -0.25 },
  content: { alignSelf: 'center', maxWidth: 720, paddingBottom: spacing.xxl, paddingHorizontal: 16, width: '100%' },
  account: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 13, flexDirection: 'row', marginTop: 10, minHeight: 68, paddingHorizontal: 14, paddingVertical: 10 },  accountAvatar: { alignItems: 'center', backgroundColor: '#E5E5EA', borderRadius: radii.pill, height: 42, justifyContent: 'center', marginRight: 11, width: 42 },  accountInitials: { color: '#3A3A3C', fontFamily: systemMedium, fontSize: 13, fontWeight: '600' },
  accountCopy: { flex: 1 },
  accountLocation: { alignItems: 'center', flexDirection: 'row', gap: 3, marginTop: 2 },
  accountMeta: { color: '#8E8E93', fontFamily: systemFont, fontSize: 11 },
  profileLinkText: { color: colors.accent, fontFamily: systemFont, fontSize: 11, marginRight: 2 },
  groupLabel: { color: '#6D6D72', fontFamily: systemFont, fontSize: 11, letterSpacing: 0.25, marginBottom: 6, marginLeft: 12, marginTop: 22 },
  groupFooter: { color: '#7C7C80', fontFamily: systemFont, fontSize: 10.5, lineHeight: 14, marginHorizontal: 12, marginTop: 6 },
  group: { backgroundColor: colors.surface, borderRadius: 13, overflow: 'hidden' },  row: { alignItems: 'center', flexDirection: 'row', minHeight: 54, paddingHorizontal: 13, paddingVertical: 7 },  rowIcon: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 8, height: 29, justifyContent: 'center', marginRight: 10, width: 29 },
  rowIconDanger: { backgroundColor: '#3A1E1E' },
  rowCopy: { flex: 1 },
  rowLabel: { fontFamily: systemFont, fontSize: 14.5, letterSpacing: -0.12, lineHeight: 19 },
  rowLabelDanger: { color: colors.danger },
  rowSubtitle: { color: '#8E8E93', fontFamily: systemFont, fontSize: 10.5, lineHeight: 14, marginTop: 1 },
  rowValue: { color: '#8E8E93', fontFamily: systemFont, fontSize: 11, marginLeft: spacing.sm, maxWidth: 100 },
  divider: { backgroundColor: '#C6C6C8', height: StyleSheet.hairlineWidth, marginLeft: 52, opacity: 0.62 },  switch: { transform: [{ scale: 0.8 }] },
  appearanceSelector: { flexDirection: 'row', gap: 8, paddingBottom: 12, paddingHorizontal: 13 },
  appearanceOption: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 9, flex: 1, flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 40 },
  appearanceOptionSelected: { backgroundColor: colors.primaryDark },  appearanceOptionText: { color: colors.textMuted, fontSize: 12 },
  appearanceOptionTextSelected: { color: colors.background, fontFamily: systemMedium, fontWeight: '600' },
  logout: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.xl, minHeight: 48 },
  logoutText: { color: colors.danger, fontFamily: systemFont, fontSize: 15 },
  version: { color: '#8E8E93', fontFamily: systemFont, fontSize: 11, marginTop: spacing.sm, textAlign: 'center' },
  pressed: { opacity: 0.62 },
}));
