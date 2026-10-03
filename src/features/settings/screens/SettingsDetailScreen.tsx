import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppAppearance } from '@/theme/AppearanceProvider';
import { useAuth } from '@/features/auth/application/AuthProvider';
import { useProfile } from '@/features/profile/application/ProfileProvider';
import {
  SettingsAction,
  SettingsButton,
  SettingsCard,
  SettingsChoice,
  SettingsDetailLayout,
  SettingsDivider,
  SettingsField,
  SettingsToggle,
} from '@/features/settings/components/SettingsDetailUI';
import { makeThemedStyles } from '@/theme/themedStyles';

const sectionInfo: Record<string, { subtitle: string; title: string }> = {
  'acerca-de': { title: 'Acerca de Tribus', subtitle: 'Conoce la aplicación, su propósito y la versión que estás usando.' },
  accesibilidad: { title: 'Accesibilidad', subtitle: 'Adapta textos, movimiento, contraste y audio a tus necesidades.' },
  'ayuda-soporte': { title: 'Ayuda y soporte', subtitle: 'Encuentra respuestas y comunícate con el equipo de Tribus.' },
  apariencia: { title: 'Apariencia', subtitle: 'Ajusta el modo oscuro y la densidad de la interfaz.' },
  badges: { title: 'Badges', subtitle: 'Revisa tus reconocimientos y el progreso que has logrado en tu comunidad.' },
  'cambiar-contrasena': { title: 'Cambiar contraseña', subtitle: 'Actualiza tu contraseña para mantener protegida tu cuenta.' },
  'cuentas-bloqueadas': { title: 'Cuentas bloqueadas', subtitle: 'Administra las personas que no pueden interactuar contigo.' },
  cuenta: { title: 'Cuenta y perfil', subtitle: 'Administra la información que identifica tu perfil dentro de la comunidad.' },
  datos: { title: 'Datos y almacenamiento', subtitle: 'Controla el uso de red, archivos temporales y tus datos personales.' },
  'enviar-comentarios': { title: 'Enviar comentarios', subtitle: 'Cuéntanos qué funciona bien y qué podemos mejorar.' },
  'informacion-personal': { title: 'Información personal', subtitle: 'Administra tu nombre, correo y los datos visibles en tu perfil.' },
  mapa: { title: 'Ubicación y mapa', subtitle: 'Decide cómo usa la app tu ubicación y qué capas aparecen en el mapa.' },
  'normas-comunidad': { title: 'Normas de la comunidad', subtitle: 'Principios para mantener un espacio local seguro, útil y respetuoso.' },
  notificaciones: { title: 'Notificaciones', subtitle: 'Elige qué avisos quieres recibir y cuándo pueden interrumpirte.' },
  'permisos-datos': { title: 'Permisos y datos compartidos', subtitle: 'Revisa qué puede usar Tribus y para qué se utiliza cada dato.' },
  'politica-privacidad': { title: 'Política de privacidad', subtitle: 'Entiende cómo recopilamos, usamos y protegemos tu información.' },
  preferencias: { title: 'Preferencias de notificaciones', subtitle: 'Configura la frecuencia, los tipos de aviso y el horario silencioso.' },
  privacidad: { title: 'Privacidad', subtitle: 'Controla quién puede encontrarte y qué información compartes.' },
  seguridad: { title: 'Seguridad', subtitle: 'Protege el acceso a tu cuenta y revisa tus sesiones activas.' },
  'sesiones-activas': { title: 'Sesiones activas', subtitle: 'Revisa los dispositivos que tienen acceso a tu cuenta.' },
  soporte: { title: 'Soporte y legal', subtitle: 'Encuentra ayuda, envía comentarios y revisa las políticas de Tribus.' },
};

const initialToggles: Record<string, boolean> = {
  push: true, alerts: true, comments: true, events: true, messages: true, digest: false,
  visible: true, commune: true, activity: true, personalization: true, mentions: true,
  biometrics: false, loginAlerts: true, twoFactor: false,
  location: true, precise: true, poi: true, community: true, mapAlerts: true, clustering: true,
  largeText: false, contrast: false, reduceMotion: false, captions: true, screenReaderHints: true,
  dataSaver: false, autoplay: false, backgroundRefresh: true,
  camera: true, microphone: true, photos: true, analytics: false, crashReports: true,
};

function InformationBlock({ children, title }: { children: string; title: string }) {
  const detailStyles = useDetailStyles();
  return (
    <View style={detailStyles.informationBlock}>
      <AppText style={detailStyles.informationTitle} variant="bodyStrong">{title}</AppText>
      <AppText style={detailStyles.informationCopy}>{children}</AppText>
    </View>
  );
}

export function SettingsDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string | string[] }>();
  const section = Array.isArray(params.section) ? params.section[0] : params.section ?? 'cuenta';
  const info = sectionInfo[section] ?? sectionInfo.cuenta;
  const { isDark, setThemeMode, themeMode } = useAppAppearance();
  const { session } = useAuth();
  const { profile, updateProfile } = useProfile();
  const detailStyles = useDetailStyles();
  const [toggles, setToggles] = useState(initialToggles);
  const [choices, setChoices] = useState<Record<string, string>>({ commune: profile.location, frequency: 'Al instante', quiet: '22:00–08:00', visibility: 'Vecinos de mi comuna', zoom: 'Cerca', country: 'Chile', textSize: 'Normal', imageQuality: 'Automática', density: 'Cómoda' });
  const [fields, setFields] = useState<Record<string, string>>({ name: profile.name, username: profile.username, email: session?.user.email ?? '', bio: profile.bio, currentPassword: '', newPassword: '', feedback: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const setToggle = (key: string) => (value: boolean) => setToggles((current) => ({ ...current, [key]: value }));
  const setChoice = (key: string) => (value: string) => setChoices((current) => ({ ...current, [key]: value }));
  const setField = (key: string) => (value: string) => setFields((current) => ({ ...current, [key]: value }));
  const confirm = (title: string, message = 'Los cambios quedaron guardados en esta demostración frontend.') => Alert.alert(title, message);
  const saveProfile = async () => {
    if (!fields.name.trim()) {
      Alert.alert('Falta tu nombre', 'Escribe el nombre que quieres mostrar en tu perfil.');
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({ name: fields.name, username: fields.username, bio: fields.bio, location: choices.commune });
      Alert.alert('Perfil actualizado', 'Tu nombre y biografía se guardaron correctamente.');
    } catch {
      Alert.alert('No pudimos guardar los cambios', 'Inténtalo nuevamente en unos segundos.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <SettingsDetailLayout onBack={() => router.back()} subtitle={info.subtitle} title={info.title}>
      {section === 'informacion-personal' ? <>
        <SettingsCard label="DATOS DE LA CUENTA">
          <SettingsField label="Nombre visible" maxLength={50} onChange={setField('name')} value={fields.name} />
          <SettingsDivider />
          <SettingsField label="Usuario" maxLength={30} onChange={setField('username')} value={fields.username} />
          <SettingsDivider />
          <SettingsField label="Correo" onChange={setField('email')} value={fields.email} />
          <SettingsDivider />
          <SettingsField label="Biografía" maxLength={160} multiline onChange={setField('bio')} placeholder="Cuéntale a tu comunidad un poco sobre ti" value={fields.bio} />
        </SettingsCard>
        <SettingsCard footer="Mostramos tu comuna, nunca tu dirección exacta." label="COMUNIDAD">
          <SettingsChoice label="Comuna" onChange={setChoice('commune')} options={['Providencia', 'Ñuñoa', 'Santiago', 'Las Condes']} value={choices.commune} />
        </SettingsCard>
        <SettingsButton label={savingProfile ? 'Guardando…' : 'Guardar información'} onPress={() => { if (!savingProfile) void saveProfile(); }} />
      </> : null}

      {section === 'badges' ? <>
        <SettingsCard footer="Los badges reconocen acciones positivas; no cambian el alcance de tus publicaciones." label="OBTENIDOS">
          <SettingsAction icon="map" label="Explorador local" description="Visitaste y recomendaste 5 lugares del barrio." onPress={() => confirm('Explorador local', 'Badge obtenido el 8 de septiembre.')} value="Obtenido" />
          <SettingsDivider />
          <SettingsAction icon="heart" label="Buen vecino" description="Ayudaste a otras personas en la comunidad." onPress={() => confirm('Buen vecino', 'Badge obtenido el 10 de septiembre.')} value="Obtenido" />
        </SettingsCard>
        <SettingsCard label="EN PROGRESO">
          <SettingsAction icon="users" label="Conector de la comunidad" description="Participa en 3 eventos locales. Llevas 2 de 3." onPress={() => confirm('Progreso del badge', 'Te falta participar en un evento más.')} value="2/3" />
        </SettingsCard>
      </> : null}

      {section === 'cuentas-bloqueadas' ? <>
        <SettingsCard footer="Las cuentas bloqueadas no pueden ver tu perfil, enviarte mensajes ni comentar tus publicaciones." label="CUENTAS BLOQUEADAS">
          <InformationBlock title="No tienes cuentas bloqueadas">Cuando bloquees a alguien, aparecerá aquí y podrás desbloquearlo cuando quieras.</InformationBlock>
        </SettingsCard>
      </> : null}

      {section === 'preferencias' ? <>
        <SettingsCard label="FRECUENCIA">
          <SettingsChoice label="Recibir avisos" onChange={setChoice('frequency')} options={['Al instante', 'Resumen diario', 'Solo importantes']} value={choices.frequency} />
        </SettingsCard>
        <SettingsCard label="TIPOS DE AVISO">
          <SettingsToggle icon="alert-circle" label="Alertas cercanas" onChange={setToggle('alerts')} value={toggles.alerts} />
          <SettingsDivider /><SettingsToggle icon="message-circle" label="Comentarios y respuestas" onChange={setToggle('comments')} value={toggles.comments} />
          <SettingsDivider /><SettingsToggle icon="mail" label="Mensajes" onChange={setToggle('messages')} value={toggles.messages} />
          <SettingsDivider /><SettingsToggle icon="calendar" label="Eventos y recordatorios" onChange={setToggle('events')} value={toggles.events} />
        </SettingsCard>
        <SettingsCard footer="Durante este horario solo llegarán alertas críticas." label="HORARIO SILENCIOSO">
          <SettingsChoice label="No molestar" onChange={setChoice('quiet')} options={['Desactivado', '22:00–08:00', '23:00–07:00']} value={choices.quiet} />
        </SettingsCard>
        <SettingsButton label="Guardar preferencias" onPress={() => confirm('Preferencias guardadas')} />
      </> : null}

      {section === 'permisos-datos' ? <>
        <SettingsCard footer="Puedes cambiar los permisos del sistema en los ajustes de tu dispositivo." label="PERMISOS DEL DISPOSITIVO">
          <SettingsToggle description="Se usa para mostrar lugares y alertas cercanas." icon="navigation" label="Ubicación" onChange={setToggle('location')} value={toggles.location} />
          <SettingsDivider /><SettingsToggle description="Solo al tomar una foto desde la app." icon="camera" label="Cámara" onChange={setToggle('camera')} value={toggles.camera} />
          <SettingsDivider /><SettingsToggle description="Solo al grabar una publicación de audio." icon="mic" label="Micrófono" onChange={setToggle('microphone')} value={toggles.microphone} />
          <SettingsDivider /><SettingsToggle description="Para elegir imágenes que quieras publicar." icon="image" label="Fotos" onChange={setToggle('photos')} value={toggles.photos} />
        </SettingsCard>
        <SettingsCard label="DATOS COMPARTIDOS">
          <SettingsToggle description="Comparte métricas anónimas para mejorar la app." icon="bar-chart-2" label="Analítica de uso" onChange={setToggle('analytics')} value={toggles.analytics} />
          <SettingsDivider /><SettingsToggle description="Envía diagnósticos técnicos sin contenido personal." icon="activity" label="Informes de errores" onChange={setToggle('crashReports')} value={toggles.crashReports} />
        </SettingsCard>
      </> : null}

      {section === 'cambiar-contrasena' ? <>
        <SettingsCard footer="Usa al menos 8 caracteres, una mayúscula y un número." label="NUEVA CONTRASEÑA">
          <SettingsField label="Contraseña actual" onChange={setField('currentPassword')} secure value={fields.currentPassword} />
          <SettingsDivider /><SettingsField label="Nueva contraseña" onChange={setField('newPassword')} secure value={fields.newPassword} />
        </SettingsCard>
        <SettingsButton label="Actualizar contraseña" onPress={() => confirm('Contraseña actualizada')} />
      </> : null}

      {section === 'sesiones-activas' ? <>
        <SettingsCard footer="La sesión actual no se puede cerrar desde esta pantalla." label="ESTE DISPOSITIVO">
          <SettingsAction icon="smartphone" label="Este iPhone" description="Santiago, Chile · Activa ahora" onPress={() => confirm('Sesión actual', 'Esta es la sesión que estás usando.')} value="Actual" />
        </SettingsCard>
        <SettingsCard footer="Si no reconoces una sesión, ciérrala y cambia tu contraseña." label="OTROS DISPOSITIVOS">
          <SettingsAction danger icon="monitor" label="Chrome en Windows" description="Providencia · Hace 2 días" onPress={() => confirm('Cerrar sesión', 'Esta sesión se cerrará cuando conectemos el servicio de autenticación.')} value="Cerrar" />
        </SettingsCard>
      </> : null}

      {section === 'ayuda-soporte' ? <>
        <SettingsCard label="AYUDA">
          <SettingsAction icon="help-circle" label="Preguntas frecuentes" description="Cuenta, mapa, publicaciones y privacidad." onPress={() => confirm('Preguntas frecuentes', 'Selecciona una categoría para ver respuestas paso a paso.')} />
          <SettingsDivider /><SettingsAction icon="mail" label="Contactar soporte" description="Nuestro equipo responde en 24–48 horas." onPress={() => confirm('Contactar soporte', 'El formulario está listo para conectarse al servicio de soporte.')} />
          <SettingsDivider /><SettingsAction icon="alert-circle" label="Reportar un problema" description="Informa errores o comportamientos inesperados." onPress={() => confirm('Reportar un problema', 'Podrás adjuntar una descripción y una captura.')} />
        </SettingsCard>
      </> : null}

      {section === 'enviar-comentarios' ? <>
        <SettingsCard footer="No incluyas contraseñas ni datos sensibles." label="TU OPINIÓN">
          <SettingsChoice label="Tema" onChange={setChoice('feedbackType')} options={['Sugerencia', 'Experiencia', 'Otro']} value={choices.feedbackType ?? 'Sugerencia'} />
          <SettingsDivider /><SettingsField label="Mensaje" multiline onChange={setField('feedback')} placeholder="¿Qué podemos mejorar?" value={fields.feedback} />
        </SettingsCard>
        <SettingsButton label="Enviar comentario" onPress={() => { confirm('Comentario enviado', 'Gracias por ayudarnos a mejorar Tribus.'); setFields((current) => ({ ...current, feedback: '' })); }} />
      </> : null}

      {section === 'politica-privacidad' ? <SettingsCard label="POLÍTICA DE PRIVACIDAD">
        <InformationBlock title="La información que usamos">Tribus utiliza los datos de tu cuenta, tu comuna y la actividad que decides compartir para ofrecer funciones locales.</InformationBlock>
        <SettingsDivider /><InformationBlock title="Cómo protegemos tus datos">Tu ubicación exacta no se muestra públicamente. Puedes revisar permisos, solicitar una copia de tus datos o eliminar tu cuenta.</InformationBlock>
        <SettingsDivider /><InformationBlock title="Tus decisiones">Puedes cambiar preferencias, permisos y visibilidad cuando quieras desde Configuración.</InformationBlock>
      </SettingsCard> : null}

      {section === 'normas-comunidad' ? <SettingsCard label="NORMAS DE LA COMUNIDAD">
        <InformationBlock title="1. Trato respetuoso">Participa sin hostigar, discriminar ni amenazar a otras personas.</InformationBlock>
        <SettingsDivider /><InformationBlock title="2. Información útil y real">No publiques engaños, suplantaciones ni contenido que ponga a otros en riesgo.</InformationBlock>
        <SettingsDivider /><InformationBlock title="3. Privacidad y seguridad">No compartas datos personales de terceros sin su autorización.</InformationBlock>
        <SettingsDivider /><InformationBlock title="4. Cuidado del barrio">Promueve actividades legales, seguras y respetuosas con los espacios comunes.</InformationBlock>
      </SettingsCard> : null}

      {section === 'acerca-de' ? <>
        <View style={detailStyles.aboutHero}>
          <View style={detailStyles.aboutMark}><AppText style={detailStyles.aboutMarkText} variant="heading">T</AppText></View>
          <AppText style={detailStyles.aboutTitle} variant="heading">Tribus</AppText>
          <AppText style={detailStyles.aboutVersion} variant="caption">Versión 1.0.0</AppText>
        </View>
        <SettingsCard label="NUESTRA MISIÓN">
          <InformationBlock title="Comunidades más cercanas">Tribus conecta a las personas con quienes viven, crean y cuidan su barrio.</InformationBlock>
        </SettingsCard>
        <SettingsCard label="INFORMACIÓN">
          <SettingsAction icon="file-text" label="Licencias de código abierto" onPress={() => confirm('Licencias', 'Aquí se mostrarán las licencias de las dependencias utilizadas.')} />
          <SettingsDivider /><SettingsAction icon="mail" label="Contacto" onPress={() => confirm('Contacto', 'hola@tribus.app')} value="hola@tribus.app" />
        </SettingsCard>
      </> : null}

      {section === 'cuenta' ? <>
        <SettingsCard label="INFORMACIÓN PERSONAL">
          <SettingsField label="Nombre visible" maxLength={50} onChange={setField('name')} value={fields.name} />
          <SettingsDivider /><SettingsField label="Usuario" maxLength={30} onChange={setField('username')} value={fields.username} />
          <SettingsDivider /><SettingsField label="Correo" onChange={setField('email')} value={fields.email} />
          <SettingsDivider /><SettingsField label="Biografía" maxLength={160} multiline onChange={setField('bio')} placeholder="Cuéntale a tu comunidad un poco sobre ti" value={fields.bio} />
        </SettingsCard>
        <SettingsCard footer="Solo se muestra tu comuna; nunca tu dirección exacta." label="UBICACIÓN PÚBLICA">
          <SettingsChoice label="Comuna" onChange={setChoice('commune')} options={['Providencia', 'Ñuñoa', 'Santiago', 'Las Condes']} value={choices.commune} />
        </SettingsCard>
        <SettingsCard label="COMUNIDAD"><SettingsAction icon="award" label="Badges" onPress={() => confirm('Badges', 'Aquí aparecerán tus badges y progreso futuro.')} value="2 obtenidos" /><SettingsDivider /><SettingsAction icon="user-x" label="Cuentas bloqueadas" onPress={() => confirm('Cuentas bloqueadas', 'No tienes cuentas bloqueadas.')} value="0" /></SettingsCard>
        <SettingsButton label={savingProfile ? 'Guardando…' : 'Guardar cambios'} onPress={() => { if (!savingProfile) void saveProfile(); }} />
      </> : null}

      {section === 'notificaciones' ? <>
        <SettingsCard label="GENERAL"><SettingsToggle icon="bell" label="Permitir notificaciones" onChange={setToggle('push')} value={toggles.push} /><SettingsDivider /><SettingsChoice label="Frecuencia" onChange={setChoice('frequency')} options={['Al instante', 'Resumen diario', 'Solo importantes']} value={choices.frequency} /></SettingsCard>
        <SettingsCard label="ACTIVIDAD"><SettingsToggle icon="alert-circle" label="Alertas cercanas" onChange={setToggle('alerts')} value={toggles.alerts} /><SettingsDivider /><SettingsToggle icon="message-circle" label="Comentarios y respuestas" onChange={setToggle('comments')} value={toggles.comments} /><SettingsDivider /><SettingsToggle icon="mail" label="Mensajes" onChange={setToggle('messages')} value={toggles.messages} /><SettingsDivider /><SettingsToggle icon="calendar" label="Eventos y recordatorios" onChange={setToggle('events')} value={toggles.events} /><SettingsDivider /><SettingsToggle icon="file-text" label="Resumen semanal" onChange={setToggle('digest')} value={toggles.digest} /></SettingsCard>
        <SettingsCard footer="Durante este horario solo llegarán alertas críticas." label="HORARIO SILENCIOSO"><SettingsChoice label="No molestar" onChange={setChoice('quiet')} options={['Desactivado', '22:00–08:00', '23:00–07:00']} value={choices.quiet} /></SettingsCard>
        <SettingsButton label="Abrir centro de notificaciones" onPress={() => router.push('/notificaciones')} />
      </> : null}

      {section === 'privacidad' ? <>
        <SettingsCard label="QUIÉN PUEDE VERTE"><SettingsChoice label="Visibilidad del perfil" onChange={setChoice('visibility')} options={['Todos', 'Vecinos de mi comuna', 'Solo amigos']} value={choices.visibility} /><SettingsDivider /><SettingsToggle icon="eye" label="Perfil visible en búsquedas" onChange={setToggle('visible')} value={toggles.visible} /><SettingsDivider /><SettingsToggle icon="map-pin" label="Mostrar mi comuna" onChange={setToggle('commune')} value={toggles.commune} /></SettingsCard>
        <SettingsCard label="ACTIVIDAD Y PERSONALIZACIÓN"><SettingsToggle description="Ayuda a recomendar lugares y contenido local." icon="activity" label="Contenido personalizado" onChange={setToggle('personalization')} value={toggles.personalization} /><SettingsDivider /><SettingsToggle icon="at-sign" label="Permitir menciones" onChange={setToggle('mentions')} value={toggles.mentions} /><SettingsDivider /><SettingsToggle description="Guarda búsquedas recientes dentro de la app." icon="clock" label="Historial de actividad" onChange={setToggle('activity')} value={toggles.activity} /></SettingsCard>
        <SettingsCard label="CONTROL"><SettingsAction icon="shield" label="Permisos del dispositivo" onPress={() => confirm('Permisos', 'Ubicación: permitida\nCámara: al usar\nMicrófono: al usar\nFotos: selección limitada')} /><SettingsDivider /><SettingsAction icon="user-x" label="Cuentas bloqueadas" onPress={() => confirm('Cuentas bloqueadas', 'No tienes cuentas bloqueadas.')} value="0" /></SettingsCard>
      </> : null}

      {section === 'seguridad' ? <>
        <SettingsCard label="ACCESO"><SettingsToggle icon="lock" label="Face ID / huella" onChange={setToggle('biometrics')} value={toggles.biometrics} /><SettingsDivider /><SettingsToggle icon="shield" label="Verificación en dos pasos" onChange={setToggle('twoFactor')} value={toggles.twoFactor} /><SettingsDivider /><SettingsToggle icon="alert-triangle" label="Alertas de inicio de sesión" onChange={setToggle('loginAlerts')} value={toggles.loginAlerts} /></SettingsCard>
        <SettingsCard label="CONTRASEÑA"><SettingsField label="Contraseña actual" onChange={setField('currentPassword')} secure value={fields.currentPassword} /><SettingsDivider /><SettingsField label="Nueva contraseña" onChange={setField('newPassword')} secure value={fields.newPassword} /></SettingsCard>
        <SettingsCard footer="Si no reconoces un dispositivo, cierra esa sesión y cambia tu contraseña." label="SESIONES ACTIVAS"><SettingsAction icon="smartphone" label="Este iPhone" onPress={() => confirm('Sesión actual', 'Santiago, Chile · Activa ahora')} value="Actual" /><SettingsDivider /><SettingsAction icon="monitor" label="Chrome en Windows" onPress={() => confirm('Chrome en Windows', 'Providencia · Hace 2 días')} value="Hace 2 días" /></SettingsCard>
        <SettingsButton label="Actualizar contraseña" onPress={() => confirm('Contraseña actualizada')} />
      </> : null}

      {section === 'mapa' ? <>
        <SettingsCard label="UBICACIÓN"><SettingsToggle icon="navigation" label="Usar mi ubicación" onChange={setToggle('location')} value={toggles.location} /><SettingsDivider /><SettingsToggle description="Mejora el centrado y los resultados cercanos." icon="crosshair" label="Ubicación precisa" onChange={setToggle('precise')} value={toggles.precise} /><SettingsDivider /><SettingsChoice label="Área permitida" onChange={setChoice('country')} options={['Chile']} value={choices.country} /></SettingsCard>
        <SettingsCard label="VISTA INICIAL"><SettingsChoice label="Zoom predeterminado" onChange={setChoice('zoom')} options={['Cerca', 'Medio', 'Amplio']} value={choices.zoom} /></SettingsCard>
        <SettingsCard footer="Cada capa mantiene su propio presupuesto visual según el zoom." label="CAPAS DEL MAPA"><SettingsToggle icon="map" label="POI permanentes" description="Parques, cerros, cultura y monumentos." onChange={setToggle('poi')} value={toggles.poi} /><SettingsDivider /><SettingsToggle icon="heart" label="Lugares de la comunidad" onChange={setToggle('community')} value={toggles.community} /><SettingsDivider /><SettingsToggle icon="alert-circle" label="Alertas y actividad" onChange={setToggle('mapAlerts')} value={toggles.mapAlerts} /><SettingsDivider /><SettingsToggle icon="grid" label="Agrupar lugares al alejarse" onChange={setToggle('clustering')} value={toggles.clustering} /></SettingsCard>
      </> : null}

      {section === 'apariencia' ? <>
        <SettingsCard label="TEMA"><SettingsChoice label="Modo de color" onChange={(value) => setThemeMode(value === 'Oscuro' ? 'dark' : 'light')} options={['Claro', 'Oscuro']} value={themeMode === 'dark' ? 'Oscuro' : 'Claro'} /><SettingsDivider /><SettingsChoice label="Densidad" onChange={setChoice('density')} options={['Compacta', 'Cómoda', 'Amplia']} value={choices.density} /></SettingsCard>
        <SettingsCard footer="El cambio se guarda y se aplica inmediatamente en las superficies principales de la app." label="VISTA PREVIA"><SettingsAction icon={isDark ? 'moon' : 'sun'} label={isDark ? 'Tema oscuro activado' : 'Tema claro activado'} onPress={() => confirm('Apariencia', 'El tema se aplica inmediatamente en toda la app.')} /></SettingsCard>
      </> : null}

      {section === 'accesibilidad' ? <>
        <SettingsCard label="VISUAL"><SettingsChoice label="Tamaño del texto" onChange={setChoice('textSize')} options={['Pequeño', 'Normal', 'Grande']} value={choices.textSize} /><SettingsDivider /><SettingsToggle icon="sun" label="Mayor contraste" onChange={setToggle('contrast')} value={toggles.contrast} /><SettingsDivider /><SettingsToggle icon="minimize" label="Reducir movimiento" onChange={setToggle('reduceMotion')} value={toggles.reduceMotion} /></SettingsCard>
        <SettingsCard label="LECTURA Y AUDIO"><SettingsToggle icon="volume-2" label="Subtítulos automáticos" onChange={setToggle('captions')} value={toggles.captions} /><SettingsDivider /><SettingsToggle description="Agrega explicaciones en botones y acciones." icon="info" label="Ayudas para lector de pantalla" onChange={setToggle('screenReaderHints')} value={toggles.screenReaderHints} /></SettingsCard>
      </> : null}

      {section === 'datos' ? <>
        <SettingsCard label="USO DE DATOS"><SettingsToggle description="Reduce imágenes y actividad en segundo plano." icon="database" label="Ahorro de datos" onChange={setToggle('dataSaver')} value={toggles.dataSaver} /><SettingsDivider /><SettingsChoice label="Calidad de imágenes" onChange={setChoice('imageQuality')} options={['Automática', 'Alta', 'Baja']} value={choices.imageQuality} /><SettingsDivider /><SettingsToggle icon="refresh-cw" label="Actualizar en segundo plano" onChange={setToggle('backgroundRefresh')} value={toggles.backgroundRefresh} /><SettingsDivider /><SettingsToggle icon="play" label="Reproducir audio automáticamente" onChange={setToggle('autoplay')} value={toggles.autoplay} /></SettingsCard>
        <SettingsCard label="ALMACENAMIENTO"><SettingsAction icon="trash-2" label="Limpiar caché" onPress={() => confirm('Caché eliminada', 'Se liberaron 18 MB de archivos temporales.')} value="18 MB" /><SettingsDivider /><SettingsAction icon="download" label="Descargar mis datos" onPress={() => confirm('Solicitud creada', 'Prepararemos una copia de tus publicaciones, comentarios y actividad.')} /></SettingsCard>
        <SettingsCard label="ZONA DE RIESGO"><SettingsAction danger icon="trash-2" label="Eliminar cuenta" description="Borra permanentemente tu perfil y contenido." onPress={() => confirm('Eliminar cuenta', 'En producción, esta acción solicitará tu contraseña y una segunda confirmación.')} /></SettingsCard>
      </> : null}

      {section === 'soporte' ? <>
        <SettingsCard label="AYUDA"><SettingsAction icon="help-circle" label="Preguntas frecuentes" onPress={() => confirm('Preguntas frecuentes', 'Cuenta · Mapa · Publicaciones · Privacidad · Seguridad')} /><SettingsDivider /><SettingsAction icon="mail" label="Contactar soporte" onPress={() => confirm('Soporte', 'El formulario está listo para conectarse al servicio de soporte.')} value="24–48 h" /><SettingsDivider /><SettingsAction icon="alert-circle" label="Reportar un problema" onPress={() => confirm('Reportar problema', 'Adjunta una descripción y, opcionalmente, una captura de pantalla.')} /></SettingsCard>
        <SettingsCard label="ENVÍANOS TUS COMENTARIOS"><SettingsField label="Mensaje" multiline onChange={setField('feedback')} placeholder="¿Qué podemos mejorar?" value={fields.feedback} /></SettingsCard>
        <SettingsButton label="Enviar comentario" onPress={() => { confirm('Comentario enviado', 'Gracias por ayudarnos a mejorar Tribus.'); setFields((current) => ({ ...current, feedback: '' })); }} />
        <SettingsCard label="LEGAL"><SettingsAction icon="file-text" label="Política de privacidad" onPress={() => confirm('Política de privacidad', 'Contenido legal frontend preparado para conectar al documento definitivo.')} /><SettingsDivider /><SettingsAction icon="book-open" label="Normas de la comunidad" onPress={() => confirm('Normas de la comunidad', 'Respeto, seguridad, información veraz y cuidado de la comunidad.')} /><SettingsDivider /><SettingsAction icon="info" label="Acerca de Tribus" onPress={() => confirm('Tribus', 'Versión 1.0 · Hecho para comunidades locales.')} /></SettingsCard>
      </> : null}
    </SettingsDetailLayout>
  );
}

const useDetailStyles = makeThemedStyles((colors) => ({
  informationBlock: { paddingHorizontal: 14, paddingVertical: 13 },
  informationTitle: { fontSize: 14, lineHeight: 18 },
  informationCopy: { color: colors.textMuted, fontSize: 12.5, lineHeight: 18, marginTop: 4 },
  aboutHero: { alignItems: 'center', paddingBottom: 8, paddingTop: 28 },
  aboutMark: { alignItems: 'center', backgroundColor: '#174D2B', borderRadius: 22, height: 72, justifyContent: 'center', width: 72 },
  aboutMarkText: { color: '#FFFFFF', fontSize: 38, lineHeight: 44 },
  aboutTitle: { fontSize: 26, marginTop: 10 },
  aboutVersion: { color: colors.textMuted, marginTop: 2 },
}));
