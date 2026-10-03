import Feather from '@/components/ui/AppIcon';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import type { ComponentProps, PropsWithChildren } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/theme/AppearanceProvider';
import { getDiscoverItem, type DiscoverItem } from '@/features/discover/model/discover';
import { makeThemedStyles } from '@/theme/themedStyles';
import { radii, spacing, typography } from '@/theme/tokens';

type IconName = ComponentProps<typeof Feather>['name'];

const supplementaryPhotos = {
  food: [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=82',
  ],
  nightlife: [
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1571266028243-d220c9c3b2d2?auto=format&fit=crop&w=900&q=82',
  ],
  panorama: [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=82',
  ],
  place: [
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=82',
  ],
} as const;

function Section({ children, subtitle, title }: PropsWithChildren<{ subtitle?: string; title: string }>) {
  const styles = useStyles();
  return <View style={styles.section}><View style={styles.sectionHeader}><AppText style={styles.sectionTitle} variant="bodyStrong">{title}</AppText>{subtitle ? <AppText style={styles.muted} variant="caption">{subtitle}</AppText> : null}</View>{children}</View>;
}

function IconRow({ icon, label, value, valueTone }: { icon: IconName; label: string; value: string; valueTone?: 'positive' }) {
  const colors = useThemeColors();
  const styles = useStyles();
  return <View style={styles.iconRow}><View style={styles.rowIcon}><Feather color={colors.primaryDark} name={icon} size={16} /></View><View style={styles.rowCopy}><AppText style={styles.rowLabel} variant="caption">{label}</AppText><AppText selectable style={[styles.rowValue, valueTone === 'positive' && styles.positive]} variant="bodyStrong">{value}</AppText></View></View>;
}

function KeyValue({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return <View style={styles.keyValue}><AppText style={styles.keyLabel} variant="caption">{label}</AppText><AppText selectable style={styles.keyValueText} variant="bodyStrong">{value}</AppText></View>;
}

function TagCloud({ items }: { items: { icon: IconName; label: string }[] }) {
  const colors = useThemeColors();
  const styles = useStyles();
  return <View style={styles.tags}>{items.map((item) => <View key={item.label} style={styles.tag}><Feather color={colors.primaryDark} name={item.icon} size={14} /><AppText style={styles.tagText} variant="caption">{item.label}</AppText></View>)}</View>;
}

function PhotoGallery({ item }: { item: DiscoverItem }) {
  const colors = useThemeColors();
  const styles = useStyles();
  const [mainFailed, setMainFailed] = useState(false);
  const fallback = supplementaryPhotos[item.kind];
  const photos = [item.image, ...(item.gallery ?? fallback)].filter((photo): photo is string => Boolean(photo)).slice(0, 3);
  if (!photos.length) return null;
  return <View style={styles.gallery}><View style={styles.galleryMain}><Feather color={colors.primaryDark} name="image" size={28} /><Image accessibilityLabel={`Foto principal de ${item.name}`} cachePolicy="memory-disk" contentFit="cover" contentPosition={item.imagePosition ?? 'center'} onError={() => setMainFailed(true)} source={mainFailed ? fallback[0] : photos[0]} style={styles.galleryImage} transition={180} /></View><View style={styles.gallerySide}>{photos.slice(1).map((photo, index) => <View key={photo} style={styles.gallerySmall}><Feather color={colors.primaryDark} name="image" size={20} /><Image accessibilityLabel={`Foto ${index + 2} de ${item.name}`} cachePolicy="memory-disk" contentFit="cover" source={photo} style={styles.galleryImage} transition={180} /></View>)}</View></View>;
}

function Overview({ item }: { item: DiscoverItem }) {
  const styles = useStyles();
  if (item.kind === 'panorama') return <View style={styles.overview}>
    <IconRow icon="calendar" label="Fecha" value={item.detail} />
    <IconRow icon="map-pin" label="Lugar" value={`${item.location} · ${item.distance ?? '900 m'}`} />
    <IconRow icon="check-circle" label="Entradas" value={item.status ?? 'Disponible'} valueTone="positive" />
    <IconRow icon="dollar-sign" label="Precio" value={item.price ?? 'Gratis'} />
  </View>;

  const closingTime = item.kind === 'nightlife' ? '02:00' : item.kind === 'place' ? '19:00' : '20:30';
  return <View style={styles.overview}>
    <IconRow icon="star" label="Comunidad" value={`★ ${String(item.rating ?? 4.7).replace('.', ',')} · ${item.recommendations ?? 86} vecinos`} />
    <IconRow icon="map-pin" label="Ubicación" value={`${item.location} · ${item.distance ?? '1,4 km'}`} />
    <IconRow icon="clock" label="Estado" value={`${item.status ?? 'Abierto'} · hasta ${closingTime}`} valueTone="positive" />
    {item.price ? <IconRow icon="dollar-sign" label="Precio" value={item.price} /> : null}
  </View>;
}

function Favorite({ count, medal, name }: { count: number; medal: string; name: string }) {
  const styles = useStyles();
  return <View style={styles.favorite}><View style={styles.medal}><AppText style={styles.medalText} variant="bodyStrong">{medal}</AppText></View><View style={styles.favoriteCopy}><AppText variant="bodyStrong">{name}</AppText><AppText style={styles.muted} variant="caption">Recomendado por {count} vecinos</AppText></View></View>;
}

function Mood({ label, score }: { label: string; score: number }) {
  const styles = useStyles();
  return <View style={styles.mood}><AppText style={styles.moodLabel} variant="caption">{label}</AppText><View style={styles.dots}>{[1, 2, 3, 4, 5].map((dot) => <View key={dot} style={[styles.dot, dot <= score && styles.dotActive]} />)}</View></View>;
}

function PrepItem({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const colors = useThemeColors();
  const styles = useStyles();
  return <View style={styles.prepItem}><View style={styles.prepIcon}><Feather color={colors.primaryDark} name={icon} size={18} /></View><View style={styles.prepCopy}><AppText style={styles.prepLabel} variant="caption">{label}</AppText><AppText style={styles.prepValue} variant="bodyStrong">{value}</AppText></View></View>;
}

function PrepGrid({ items }: { items: { icon: IconName; label: string; value: string }[] }) {
  const styles = useStyles();
  return <View style={styles.prepGrid}>{items.map((item) => <PrepItem key={item.label} {...item} />)}</View>;
}

function MenuItem({ description, name, price }: { description: string; name: string; price: string }) {
  const styles = useStyles();
  return <View style={styles.menuItem}><View style={styles.menuCopy}><AppText variant="bodyStrong">{name}</AppText><AppText style={styles.muted} variant="caption">{description}</AppText></View><AppText style={styles.menuPrice} variant="bodyStrong">{price}</AppText></View>;
}

function ReviewComposer() {
  const colors = useThemeColors();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [sent, setSent] = useState(false);

  if (sent) return <View style={styles.reviewSuccess}><Feather color={colors.primaryDark} name="check-circle" size={22} /><View style={styles.reviewSuccessCopy}><AppText variant="bodyStrong">Reseña publicada</AppText><AppText style={styles.muted} variant="caption">Gracias por compartir tu experiencia con el barrio.</AppText></View></View>;

  if (!open) return <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={styles.reviewButton}><Feather color={colors.primaryDark} name="edit-3" size={17} /><AppText style={styles.reviewButtonText} variant="bodyStrong">Escribir una reseña</AppText></Pressable>;

  return <View style={styles.reviewComposer}>
    <AppText variant="bodyStrong">¿Cómo estuvo tu visita?</AppText>
    <View accessibilityLabel={`${rating} de 5 estrellas`} style={styles.stars}>{[1, 2, 3, 4, 5].map((star) => <Pressable accessibilityLabel={`${star} estrellas`} hitSlop={6} key={star} onPress={() => setRating(star)}><Feather color={star <= rating ? colors.primaryDark : colors.border} name="star" size={25} /></Pressable>)}</View>
    <TextInput multiline placeholder="Cuenta qué te gustó y qué debería saber la comunidad" placeholderTextColor={colors.textMuted} style={styles.reviewInput} textAlignVertical="top" />
    <View style={styles.reviewActions}><Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.cancelReview}><AppText variant="bodyStrong">Cancelar</AppText></Pressable><Pressable accessibilityRole="button" onPress={() => setSent(true)} style={styles.publishReview}><AppText style={styles.publishReviewText} variant="bodyStrong">Publicar</AppText></Pressable></View>
  </View>;
}

function AttendeeStrip() {
  const styles = useStyles();
  const avatars = [
    { initials: 'MC', uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80' },
    { initials: 'TS', uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80' },
    { initials: 'AV', uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' },
    { initials: 'JL', uri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80' },
  ];
  return <View style={styles.attendees}><View style={styles.avatarStack}>{avatars.map((avatar, index) => <View key={avatar.uri} style={[styles.avatar, index > 0 && styles.avatarOverlap]}><AppText style={styles.avatarInitials} variant="caption">{avatar.initials}</AppText><Image accessibilityLabel={`Asistente ${index + 1}`} contentFit="cover" source={avatar.uri} style={styles.avatarPhoto} /></View>)}<View style={[styles.avatar, styles.avatarCount, styles.avatarOverlap]}><AppText style={styles.avatarCountText} variant="caption">+30</AppText></View></View><View style={styles.attendeeCopy}><AppText variant="bodyStrong">34 vecinos asistirán</AppText><AppText style={styles.muted} variant="caption">Personas de tu comunidad</AppText></View></View>;
}

function FoodDetails({ item }: { item: DiscoverItem }) {
  const colors = useThemeColors();
  const styles = useStyles();
  const features: { icon: IconName; label: string }[] = [
    { icon: 'coffee', label: 'Specialty coffee' }, { icon: 'briefcase', label: 'Bueno para trabajar' }, { icon: 'zap', label: 'Enchufes' }, { icon: 'wifi', label: 'Wi-Fi' }, { icon: 'heart', label: 'Pet friendly' }, { icon: 'sun', label: 'Terraza' }, { icon: 'truck', label: 'Estacionamiento' }, { icon: 'users', label: 'Accesible' }, { icon: 'droplet', label: 'Leches vegetales' },
  ];
  return <>
    <Section subtitle="Lo más pedido" title="Favoritos de la comunidad"><View style={styles.card}><Favorite count={48} medal="1" name="Flat White" /><Favorite count={31} medal="2" name="Eggs Benedict" /><Favorite count={27} medal="3" name="Croissant de almendras" /></View></Section>
    <Section subtitle="Carta completa" title="Menú">
      <View style={styles.menuSection}><View style={styles.menuCategory}><Feather color={colors.primaryDark} name="coffee" size={17} /><AppText variant="bodyStrong">Café y bebidas</AppText></View><MenuItem description="Doble espresso · leche texturizada" name="Flat White" price="$3.500" /><MenuItem description="Frío · doble espresso · tónica" name="Espresso tonic" price="$4.200" /><MenuItem description="Matcha ceremonial · leche a elección" name="Matcha latte" price="$4.500" /></View>
      <View style={[styles.menuSection, styles.menuSectionSpacing]}><View style={styles.menuCategory}><Feather color={colors.primaryDark} name="shopping-bag" size={17} /><AppText variant="bodyStrong">Desayuno y brunch</AppText></View><MenuItem description="Pan brioche · huevos pochados · holandesa" name="Eggs Benedict" price="$8.900" /><MenuItem description="Masa madre · palta · huevo" name="Tostada de la casa" price="$6.900" /><MenuItem description="Horneado cada mañana" name="Croissant de almendras" price="$3.800" /></View>
    </Section>
    <Section title="Información útil"><TagCloud items={features} /></Section>
    <Section title="Ambiente"><View style={styles.card}><Mood label="Tranquilo" score={4} /><Mood label="Romántico" score={3} /><Mood label="Para trabajar" score={5} /><Mood label="Familias" score={3} /></View></Section>
    <Section title="Horarios"><View style={styles.card}><IconRow icon="clock" label="Hoy" value="08:00–20:30" valueTone="positive" /><KeyValue label="Lunes a viernes" value="08:00–20:30" /><KeyValue label="Sábado y domingo" value="09:00–19:30" /></View></Section>
    <Section title="Dirección y contacto"><View style={styles.card}><IconRow icon="map-pin" label="Dirección" value={item.address ?? 'Av. Vitacura 3215, Vitacura'} /><IconRow icon="instagram" label="Instagram" value="@cafelaesquina" /><IconRow icon="globe" label="Sitio web" value="cafelaesquina.cl" /><KeyValue label="Reservas" value="Disponibles" /><KeyValue label="Menú completo" value="Actualizado hoy" /></View></Section>
    <Section subtitle="86 opiniones" title="Comunidad"><View style={styles.quote}><AppText variant="body">“Buen café, servicio atento y un espacio cómodo para quedarse trabajando.”</AppText><AppText style={styles.muted} variant="caption">Camila · vecina de Vitacura</AppText></View><ReviewComposer /></Section>
  </>;
}

function NightlifeDetails({ item }: { item: DiscoverItem }) {
  return <>
    <Section title="Esta noche"><View style={useStyles().featurePanel}><AppText variant="eyebrow">MÚSICA EN VIVO</AppText><AppText style={useStyles().featureTitle} variant="heading">Sesión Candelaria</AppText><AppText style={useStyles().muted} variant="body">Puertas 21:00 · Show 23:00 · Último ingreso 01:00</AppText></View></Section>
    <Section title="Información principal"><View style={useStyles().card}><IconRow icon="clock" label="Horario de hoy" value="20:00–02:00" valueTone="positive" /><IconRow icon="map-pin" label="Dirección" value={item.address ?? 'Av. Italia 1439, Providencia'} /><IconRow icon="dollar-sign" label="Entrada" value={item.price ?? '$$ · cover $8.000'} /><KeyValue label="Edad" value="Solo mayores de 18" /><KeyValue label="Reservas" value="Mesas disponibles hasta las 22:30" /></View></Section>
    <Section title="Ambiente"><View style={useStyles().card}><Mood label="Conversación" score={2} /><Mood label="Baile" score={5} /><Mood label="Citas" score={4} /><Mood label="Grupos" score={5} /></View></Section>
    <Section title="Servicios"><TagCloud items={[{ icon: 'music', label: 'DJ y música en vivo' }, { icon: 'coffee', label: 'Coctelería de autor' }, { icon: 'shopping-bag', label: 'Comida hasta 00:30' }, { icon: 'truck', label: 'Valet parking' }, { icon: 'users', label: 'Acceso universal' }, { icon: 'instagram', label: '@clubcandelaria' }]} /></Section>
    <Section subtitle="67 opiniones" title="Comunidad"><View style={useStyles().quote}><AppText variant="body">“Buena música, carta acotada y ambiente animado después de medianoche.”</AppText><AppText style={useStyles().muted} variant="caption">Tomás · vecino de Ñuñoa</AppText></View></Section>
  </>;
}

function MapPreview({ item }: { item: DiscoverItem }) {
  const colors = useThemeColors();
  const styles = useStyles();
  return <View style={styles.mapPreview}><View style={styles.mapRoadA} /><View style={styles.mapRoadB} /><View style={styles.mapPin}><Feather color={colors.textOnPrimary} name="map-pin" size={18} /></View><View style={styles.mapCopy}><AppText variant="bodyStrong">{item.location}</AppText><AppText style={styles.muted} variant="caption">{item.address ?? 'Ubicación aproximada'}</AppText></View></View>;
}

function NatureDetails({ item }: { item: DiscoverItem }) {
  return <>
    <Section title="Ubicación"><MapPreview item={item} /></Section>
    <Section subtitle="Planifica tu visita" title="Antes de ir"><PrepGrid items={[{ icon: 'clock', label: 'Tiempo recomendado', value: '2–4 horas' }, { icon: 'trending-up', label: 'Dificultad', value: 'Baja a media' }, { icon: 'map', label: 'Terreno', value: 'Pavimento y sendero' }, { icon: 'navigation', label: 'Elevación', value: '880 m' }, { icon: 'activity', label: 'Recorrido', value: '5,6 km' }, { icon: 'sun', label: 'Sombra', value: 'Parcial' }, { icon: 'droplet', label: 'Agua', value: 'Disponible' }, { icon: 'check-circle', label: 'Baños', value: 'Disponibles' }, { icon: 'truck', label: 'Estacionamiento', value: '$1.500 por hora' }, { icon: 'wifi', label: 'Señal móvil', value: 'Buena' }]} /></Section>
    <Section title="Accesibilidad y seguridad"><TagCloud items={[{ icon: 'users', label: 'Acceso parcial' }, { icon: 'heart', label: 'Mascotas con correa' }, { icon: 'activity', label: 'Bicicletas' }, { icon: 'smile', label: 'Apto para niños' }, { icon: 'coffee', label: 'Áreas de descanso' }, { icon: 'sun', label: 'Iluminación parcial' }]} /><View style={useStyles().notice}><Feather color="#B06A16" name="alert-circle" size={18} /><AppText style={useStyles().noticeText} variant="caption">Evita senderos secundarios después del cierre y sigue siempre la señalética oficial.</AppText></View></Section>
    <Section title="Lugares dentro"><TagCloud items={[{ icon: 'eye', label: 'Miradores' }, { icon: 'navigation', label: 'Teleférico' }, { icon: 'activity', label: 'Funicular' }, { icon: 'sun', label: 'Jardines' }, { icon: 'map-pin', label: 'Santuario' }, { icon: 'coffee', label: 'Cafeterías' }, { icon: 'shopping-bag', label: 'Picnic' }, { icon: 'map', label: 'Senderos' }]} /></Section>
    <Section title="Qué llevar"><TagCloud items={[{ icon: 'droplet', label: 'Agua' }, { icon: 'sun', label: 'Protector solar' }, { icon: 'activity', label: 'Zapatillas' }, { icon: 'cloud', label: 'Abrigo' }, { icon: 'circle', label: 'Gorro' }]} /></Section>
    <Section subtitle="214 recomendaciones" title="Comunidad"><View style={useStyles().card}><IconRow icon="map" label="Ruta favorita" value="Pío Nono → Cumbre → Jardín Japonés" /><IconRow icon="clock" label="Mejor momento" value="Antes de las 10:00" /><IconRow icon="camera" label="Fotos de vecinos" value="128 fotos compartidas" /></View></Section>
  </>;
}

function CultureDetails({ item, visited, onToggleVisited }: { item: DiscoverItem; onToggleVisited: () => void; visited: boolean }) {
  const colors = useThemeColors();
  const styles = useStyles();
  return <>
    <Section title="Ubicación"><MapPreview item={item} /></Section>
    <Section subtitle="Hasta el 24 de noviembre" title="Qué hay ahora"><View style={styles.featurePanel}><AppText variant="eyebrow">EXPOSICIÓN TEMPORAL</AppText><AppText style={styles.featureTitle} variant="heading">Ciudad, materia y memoria</AppText><AppText style={styles.muted} variant="body">Obras de 12 artistas locales · Visita guiada sábados a las 12:00.</AppText></View></Section>
    <Section title="Horarios y entrada"><View style={styles.card}><IconRow icon="clock" label="Hoy" value="11:00–19:00" valueTone="positive" /><IconRow icon="dollar-sign" label="Entrada" value={item.price ?? '$4.000 general · $2.000 estudiantes'} /><KeyValue label="Martes a domingo" value="11:00–19:00" /><KeyValue label="Lunes" value="Cerrado" /></View></Section>
    <Section subtitle="Planifica tu visita" title="Antes de ir"><PrepGrid items={[{ icon: 'clock', label: 'Duración', value: '60–90 min' }, { icon: 'users', label: 'Accesibilidad', value: 'Acceso universal' }, { icon: 'check-circle', label: 'Baños', value: 'Disponibles' }, { icon: 'briefcase', label: 'Guardarropa', value: 'Sin costo' }, { icon: 'camera', label: 'Fotografías', value: 'Sin flash' }, { icon: 'truck', label: 'Estacionamiento', value: 'A 2 cuadras' }, { icon: 'activity', label: 'Transporte', value: 'Metro a 6 min' }, { icon: 'smile', label: 'Edad sugerida', value: 'Desde 8 años' }]} /></Section>
    <Section title="Servicios"><TagCloud items={[{ icon: 'users', label: 'Visitas guiadas' }, { icon: 'headphones', label: 'Audioguía' }, { icon: 'coffee', label: 'Cafetería' }, { icon: 'shopping-bag', label: 'Tienda' }, { icon: 'edit-3', label: 'Talleres' }, { icon: 'smile', label: 'Actividades infantiles' }]} /></Section>
    <Pressable accessibilityRole="button" onPress={onToggleVisited} style={[styles.visitedButton, visited && styles.visitedButtonActive]}><Feather color={visited ? colors.textOnPrimary : colors.primaryDark} name={visited ? 'check' : 'map-pin'} size={17} /><AppText style={[styles.visitedText, visited && styles.visitedTextActive]} variant="bodyStrong">{visited ? 'Visitado' : 'Marcar como visitado'}</AppText></Pressable>
  </>;
}

function PanoramaDetails({ item }: { item: DiscoverItem }) {
  const styles = useStyles();
  return <>
    <Section title="Fecha y disponibilidad"><View style={styles.card}><IconRow icon="calendar" label="Próxima fecha" value="Sábado 14 de octubre" /><IconRow icon="clock" label="Horario" value="12:00–20:00" /><IconRow icon="map-pin" label="Lugar" value={`${item.location} · ${item.distance ?? '900 m'}`} /><IconRow icon="dollar-sign" label="Entrada" value="Gratis" /><KeyValue label="Disponibilidad" value="Cupos disponibles" /><KeyValue label="Frecuencia" value="Evento único" /></View></Section>
    <Section title="Ubicación"><MapPreview item={item} /></Section>
    <Section title="Programa"><View style={styles.timeline}><Timeline time="12:00" title="Apertura" /><Timeline time="13:00" title="Taller abierto" /><Timeline time="15:00" title="Música en vivo" /><Timeline time="18:00" title="Artista principal" /></View></Section>
    <Section title="Qué encontrarás"><TagCloud items={[{ icon: 'coffee', label: 'Gastronomía' }, { icon: 'users', label: 'Emprendedores' }, { icon: 'aperture', label: 'Artesanía' }, { icon: 'shopping-bag', label: 'Ropa' }, { icon: 'music', label: 'Música' }, { icon: 'edit-3', label: 'Talleres' }, { icon: 'map-pin', label: 'Productos locales' }]} /></Section>
    <Section subtitle="Lo esencial para disfrutarlo" title="Antes de ir"><PrepGrid items={[{ icon: 'clock', label: 'Duración', value: '2–4 horas' }, { icon: 'users', label: 'Edad', value: 'Todo público' }, { icon: 'smile', label: 'Familiar', value: 'Sí' }, { icon: 'heart', label: 'Mascotas', value: 'Con correa' }, { icon: 'check-circle', label: 'Accesibilidad', value: 'Acceso universal' }, { icon: 'map-pin', label: 'Baños', value: 'Disponibles' }, { icon: 'coffee', label: 'Comida', value: 'Venta en el lugar' }, { icon: 'repeat', label: 'Reingreso', value: 'Permitido' }, { icon: 'sun', label: 'Mejor hora', value: 'Antes de las 14:00' }]} /></Section>
  </>;
}

function Timeline({ time, title }: { time: string; title: string }) {
  const styles = useStyles();
  return <View style={styles.timelineRow}><AppText style={styles.timelineTime} variant="bodyStrong">{time}</AppText><View style={styles.timelineDot} /><AppText style={styles.timelineTitle} variant="body">{title}</AppText></View>;
}

export default function DiscoverDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useStyles();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const item = getDiscoverItem(id);
  const [saved, setSaved] = useState(false);
  const [visited, setVisited] = useState(false);

  if (!item) return <Screen scroll swipeTabs={false}><Stack.Screen options={{ navigationBarHidden: true, statusBarHidden: true }} /><Pressable accessibilityLabel="Volver" onPress={() => router.back()} style={styles.roundButton}><Feather color={colors.text} name="chevron-left" size={23} /></Pressable><View style={styles.notFound}><Feather color={colors.textMuted} name="map-pin" size={28} /><AppText variant="bodyStrong">No encontramos esta ficha</AppText><AppText style={styles.muted} variant="caption">Puede que ya no esté disponible.</AppText></View></Screen>;

  return <Screen scroll swipeTabs={false}>
    <Stack.Screen options={{ navigationBarHidden: true, statusBarHidden: true }} />
    <View style={styles.topBar}><Pressable accessibilityLabel="Volver" hitSlop={8} onPress={() => router.back()} style={styles.roundButton}><Feather color={colors.text} name="chevron-left" size={23} /></Pressable><Pressable accessibilityLabel={saved ? 'Quitar de guardados' : 'Guardar'} onPress={() => setSaved((value) => !value)} style={[styles.roundButton, saved && styles.savedButton]}><Feather color={saved ? colors.textOnPrimary : colors.text} filled={saved} name="heart" size={19} /></Pressable></View>
    <PhotoGallery item={item} />
    <View style={styles.titleBlock}><View style={styles.titleMeta}><View style={styles.typePill}><AppText style={styles.typeText} variant="caption">{item.subtype ?? item.category}</AppText></View><View style={styles.status}><View style={styles.statusDot} /><AppText style={styles.statusText} variant="caption">{item.status ?? (item.kind === 'panorama' ? 'Disponible' : 'Abierto')}</AppText></View></View><AppText style={styles.itemTitle} variant="heading">{item.name}</AppText><AppText style={styles.description} variant="body">{item.description}</AppText></View>
    {item.kind === 'panorama' ? <AttendeeStrip /> : null}
    <Overview item={item} />
    {item.kind === 'food' ? <FoodDetails item={item} /> : null}
    {item.kind === 'nightlife' ? <NightlifeDetails item={item} /> : null}
    {item.kind === 'place' && item.placeVariant === 'nature' ? <NatureDetails item={item} /> : null}
    {item.kind === 'place' && item.placeVariant !== 'nature' ? <CultureDetails item={item} onToggleVisited={() => setVisited((value) => !value)} visited={visited} /> : null}
    {item.kind === 'panorama' ? <PanoramaDetails item={item} /> : null}
  </Screen>;
}

const useStyles = makeThemedStyles((colors) => ({
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  roundButton: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.pill, height: 44, justifyContent: 'center', width: 44 },
  savedButton: { backgroundColor: colors.primaryDark },
  gallery: { flexDirection: 'row', gap: spacing.xs, height: 248 },
  galleryMain: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.md, flex: 1.7, justifyContent: 'center', overflow: 'hidden' },
  gallerySide: { flex: 1, gap: spacing.xs },
  gallerySmall: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.sm, flex: 1, justifyContent: 'center', overflow: 'hidden', width: '100%' },
  galleryImage: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  titleBlock: { marginTop: spacing.xl },
  titleMeta: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  typePill: { backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 5 },
  typeText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 10 },
  status: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  statusDot: { backgroundColor: colors.primary, borderRadius: radii.pill, height: 7, width: 7 },
  statusText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold },
  itemTitle: { fontSize: 32, lineHeight: 37, marginTop: spacing.md },
  description: { color: colors.textMuted, marginTop: spacing.sm },
  overview: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.md, gap: spacing.md, marginTop: spacing.xl, padding: spacing.lg },
  section: { marginTop: spacing.xxl },
  sectionHeader: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { fontSize: 19, lineHeight: 24 },
  muted: { color: colors.textMuted },
  card: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.md, overflow: 'hidden', paddingHorizontal: spacing.lg },
  iconRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  rowIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.pill, height: 36, justifyContent: 'center', width: 36 },
  rowCopy: { flex: 1 },
  rowLabel: { color: colors.textMuted, fontSize: 10 },
  rowValue: { fontSize: 14, lineHeight: 19 },
  positive: { color: colors.primaryDark },
  keyValue: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flex: 1, gap: 2, minWidth: '46%', paddingVertical: spacing.md },
  keyLabel: { color: colors.textMuted, fontSize: 10 },
  keyValueText: { fontSize: 13, lineHeight: 18 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.pill, flexDirection: 'row', gap: 6, minHeight: 38, paddingHorizontal: spacing.md },
  tagText: { color: colors.text, fontFamily: typography.bodyMedium, fontSize: 11 },
  favorite: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.md, minHeight: 70 },
  medal: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 34, justifyContent: 'center', width: 34 },
  medalText: { color: colors.primaryDark },
  favoriteCopy: { flex: 1 },
  mood: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 50 },
  moodLabel: { color: colors.text },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { backgroundColor: colors.border, borderRadius: radii.pill, height: 8, width: 8 },
  dotActive: { backgroundColor: colors.primaryDark },
  menuSection: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.md, overflow: 'hidden', paddingHorizontal: spacing.lg },
  menuSectionSpacing: { marginTop: spacing.md },
  menuCategory: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.sm, minHeight: 50 },
  menuItem: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.md, minHeight: 70, paddingVertical: spacing.md },
  menuCopy: { flex: 1 },
  menuPrice: { color: colors.primaryDark, fontVariant: ['tabular-nums'] },
  reviewButton: { alignItems: 'center', borderColor: colors.primaryDark, borderCurve: 'continuous', borderRadius: radii.pill, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.md, minHeight: 48 },
  reviewButtonText: { color: colors.primaryDark },
  reviewComposer: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.md, gap: spacing.md, marginTop: spacing.md, padding: spacing.lg },
  stars: { flexDirection: 'row', gap: spacing.sm },
  reviewInput: { backgroundColor: colors.surface, borderColor: colors.border, borderCurve: 'continuous', borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, color: colors.text, fontFamily: typography.body, fontSize: 14, minHeight: 112, padding: spacing.md },
  reviewActions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  cancelReview: { alignItems: 'center', borderCurve: 'continuous', borderRadius: radii.pill, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.lg },
  publishReview: { alignItems: 'center', backgroundColor: colors.primaryDark, borderCurve: 'continuous', borderRadius: radii.pill, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.xl },
  publishReviewText: { color: colors.textOnPrimary },
  reviewSuccess: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.md, flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, padding: spacing.lg },
  reviewSuccessCopy: { flex: 1 },
  attendees: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.md, flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, padding: spacing.lg },
  avatarStack: { flexDirection: 'row' },
  avatar: { backgroundColor: colors.primarySoft, borderColor: colors.surfaceMuted, borderRadius: radii.pill, borderWidth: 2, height: 38, width: 38 },
  avatarOverlap: { marginLeft: -12 },
  avatarInitials: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 9, lineHeight: 34, textAlign: 'center' },
  avatarPhoto: { borderRadius: radii.pill, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  avatarCount: { alignItems: 'center', justifyContent: 'center' },
  avatarCountText: { color: colors.primaryDark, fontFamily: typography.bodySemiBold, fontSize: 10 },
  attendeeCopy: { flex: 1 },
  prepGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  prepItem: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.sm, flexDirection: 'row', gap: spacing.md, minHeight: 76, padding: spacing.md, width: '48%' },
  prepIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderCurve: 'continuous', borderRadius: radii.pill, height: 36, justifyContent: 'center', width: 36 },
  prepCopy: { flex: 1 },
  prepLabel: { color: colors.textMuted, fontSize: 9, lineHeight: 12 },
  prepValue: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  quote: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.md, gap: spacing.sm, padding: spacing.lg },
  featurePanel: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.md, gap: spacing.sm, padding: spacing.xl },
  featureTitle: { fontSize: 24, lineHeight: 29 },
  mapPreview: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.md, height: 164, justifyContent: 'flex-end', overflow: 'hidden', padding: spacing.lg, position: 'relative' },
  mapRoadA: { backgroundColor: colors.border, height: 18, left: -30, position: 'absolute', right: -30, top: 46, transform: [{ rotate: '-12deg' }] },
  mapRoadB: { backgroundColor: colors.border, bottom: 48, height: 14, left: 80, position: 'absolute', right: -40, transform: [{ rotate: '34deg' }] },
  mapPin: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.primaryDark, borderRadius: radii.pill, height: 42, justifyContent: 'center', position: 'absolute', top: 34, width: 42 },
  mapCopy: { backgroundColor: colors.overlay, borderCurve: 'continuous', borderRadius: radii.sm, gap: 2, padding: spacing.md },
  notice: { alignItems: 'flex-start', backgroundColor: colors.warmSoft, borderCurve: 'continuous', borderRadius: radii.sm, flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, padding: spacing.md },
  noticeText: { color: colors.text, flex: 1 },
  visitedButton: { alignItems: 'center', borderColor: colors.primaryDark, borderCurve: 'continuous', borderRadius: radii.pill, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.xxl, minHeight: 50 },
  visitedButtonActive: { backgroundColor: colors.primaryDark },
  visitedText: { color: colors.primaryDark },
  visitedTextActive: { color: colors.textOnPrimary },
  timeline: { backgroundColor: colors.surfaceMuted, borderCurve: 'continuous', borderRadius: radii.md, padding: spacing.lg },
  timelineRow: { alignItems: 'center', flexDirection: 'row', minHeight: 48 },
  timelineTime: { fontVariant: ['tabular-nums'], width: 56 },
  timelineDot: { backgroundColor: colors.primaryDark, borderRadius: radii.pill, height: 8, marginRight: spacing.md, width: 8 },
  timelineTitle: { flex: 1 },
  notFound: { alignItems: 'center', gap: spacing.sm, paddingVertical: 100 },
}));
