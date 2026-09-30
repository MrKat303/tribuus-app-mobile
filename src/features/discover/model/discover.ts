import type { ComponentProps } from 'react';

import type { AppIcon as AppIconComponent } from '@/components/ui/AppIcon';

export type DiscoverKind = 'food' | 'nightlife' | 'panorama' | 'place';
export type DiscoverIcon = ComponentProps<typeof AppIconComponent>['name'];

export type DiscoverItem = {
  address?: string;
  category: string;
  description: string;
  detail: string;
  distance?: string;
  gallery?: string[];
  id: string;
  image?: string;
  imagePosition?: 'center' | 'top';
  kind: DiscoverKind;
  location: string;
  name: string;
  placeVariant?: 'culture' | 'nature';
  price?: string;
  rating?: number;
  recommendations?: number;
  status?: 'Abierto' | 'Cerrado' | 'Disponible' | 'Últimos cupos';
  subtype?: string;
  tag: string;
};

const IMAGES = {
  cafe: 'https://www.lanacion.cl/wp-content/uploads/2026/03/alicia-pais-convertido-a-960x688-1.jpeg',
  cinema: 'https://www.culture.si/images/thumb/3/3a/Kino_Otok_-_Isola_Cinema_Festival_2020_Screening_at_Arrigoni_open-air_cinema.jpg/1280px-Kino_Otok_-_Isola_Cinema_Festival_2020_Screening_at_Arrigoni_open-air_cinema.jpg',
  cleanup: 'https://meridiancity.org/media/teqlcrai/community-service.jpg?format=webp&height=600&v=1dbbb5b3934a0d0&width=800',
  gallery: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1200&q=82',
  hill: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Santuario_de_la_Inmaculada_Concepci%C3%B3n%2C_Cerro_San_Crist%C3%B3bal_%2825059260397%29.jpg',
  market: 'https://www.santiagoturismo.cl/wp-content/uploads/2023/12/WhatsApp-Image-2023-12-20-at-11.10.46-1.jpeg',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=82',
  trekking: 'https://cdn.andeshandbook.org/media/route_gallery/16925571881216564914.JPG',
} as const;

export const discoverItems: DiscoverItem[] = [
  {
    category: 'Eventos',
    description: 'Una función gratuita al aire libre para encontrarse con el barrio. Trae una manta y llega con tiempo para elegir un buen lugar.',
    detail: 'Vie 12 de sep · 19:00',
    id: 'cinema',
    image: IMAGES.cinema,
    address: 'Av. Eliodoro Yáñez 2087, Providencia',
    distance: '1,1 km',
    kind: 'panorama',
    location: 'Plaza Las Lilas',
    name: 'Cine bajo las estrellas',
    tag: 'EVENTO',
  },
  {
    category: 'Naturaleza',
    description: 'Un clásico de Santiago para caminar, mirar la ciudad y desconectarse sin salir del barrio.',
    detail: 'Ideal para caminar',
    id: 'hill',
    image: IMAGES.hill,
    imagePosition: 'top',
    address: 'Pío Nono 450, Recoleta',
    distance: '2,8 km',
    kind: 'place',
    location: 'Providencia',
    name: 'Cerro San Cristóbal',
    placeVariant: 'nature',
    price: 'Entrada libre',
    rating: 4.8,
    recommendations: 214,
    status: 'Abierto',
    subtype: 'Cerro · Parque urbano',
    tag: 'NATURALEZA',
  },
  {
    category: 'Cafés',
    description: 'Café de barrio, cocina sencilla y una terraza tranquila para una pausa durante el día.',
    detail: '4.8 · 24 vecinos',
    id: 'cafe',
    image: IMAGES.cafe,
    address: 'Av. Vitacura 3215, Vitacura',
    distance: '1,4 km',
    kind: 'food',
    location: 'Vitacura',
    name: 'Café La Esquina',
    price: '$$ · $6.000–$15.000 pp',
    rating: 4.7,
    recommendations: 86,
    status: 'Abierto',
    subtype: 'Cafetería · Specialty coffee',
    tag: 'CAFÉ',
  },
  {
    category: 'Panoramas',
    description: 'Productores, oficios y sabores del barrio reunidos durante la mañana.',
    detail: 'Sáb 14 · 10:00',
    id: 'market',
    image: IMAGES.market,
    address: 'Av. Francisco Bilbao 1519, Providencia',
    distance: '900 m',
    kind: 'panorama',
    location: 'Plaza Inés de Suárez',
    name: 'Feria local',
    tag: 'SÁB 14',
  },
  {
    category: 'Panoramas',
    description: 'Una jornada vecinal para cuidar el parque. La organización entrega guantes, bolsas y herramientas.',
    detail: 'Sáb 14 · 11:00',
    id: 'clean',
    image: IMAGES.cleanup,
    address: 'Av. Francisco Bilbao 1519, Providencia',
    distance: '900 m',
    kind: 'panorama',
    location: 'Parque Inés de Suárez',
    name: 'Limpieza del barrio',
    tag: 'SÁB 14',
  },
  {
    category: 'Naturaleza',
    description: 'Una caminata de dificultad baja con vistas abiertas de Santiago y sendero accesible.',
    detail: 'Dom 15 · 09:00',
    id: 'trekking',
    image: IMAGES.trekking,
    address: 'Camino El Observatorio 1515, Las Condes',
    distance: '5,2 km',
    kind: 'place',
    location: 'Cerro Calán',
    name: 'Trekking al cerro',
    placeVariant: 'nature',
    price: 'Entrada libre',
    rating: 4.6,
    recommendations: 74,
    status: 'Abierto',
    subtype: 'Sendero · Mirador',
    tag: 'DOM 15',
  },
  {
    category: 'Cafés',
    description: 'Café de especialidad y repostería de temporada en una casa restaurada de Barrio Italia.',
    detail: 'Recomendado por 24 vecinos',
    id: 'garden-cafe',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=82',
    kind: 'food',
    location: 'Barrio Italia',
    name: 'Café Jardín',
    price: '$$ · $7.000–$16.000 pp',
    rating: 4.8,
    recommendations: 112,
    status: 'Abierto',
    subtype: 'Cafetería · Brunch',
    tag: 'POPULAR',
  },
  {
    category: 'Cultura',
    description: 'Una sala independiente con exposiciones de artistas y diseñadores locales.',
    detail: 'A 8 min de ti',
    id: 'gallery',
    image: IMAGES.gallery,
    address: 'Av. Manuel Montt 948, Providencia',
    distance: '8 min',
    kind: 'place',
    location: 'Manuel Montt',
    name: 'Galería Local',
    placeVariant: 'culture',
    price: '$4.000 general',
    rating: 4.6,
    recommendations: 43,
    status: 'Abierto',
    subtype: 'Galería · Centro cultural',
    tag: 'CERCA DE TI',
  },
  {
    category: 'Cafés',
    description: 'Pan de masa madre, bollería recién horneada y productos hechos en el barrio.',
    detail: 'Nuevo en el barrio',
    id: 'bakery',
    image: IMAGES.bakery,
    kind: 'food',
    location: 'Los Leones',
    name: 'Panadería Norte',
    price: '$ · $3.000–$9.000 pp',
    rating: 4.5,
    recommendations: 39,
    status: 'Abierto',
    subtype: 'Panadería · Cafetería',
    tag: 'NUEVO',
  },
  { category: 'Restaurantes', description: 'Cocina de temporada con ingredientes de productores cercanos.', detail: 'Recomendado por 18 vecinos', id: 'bistro-local', kind: 'food', location: 'Providencia', name: 'Bistró del Barrio', price: '$$ · $14.000–$24.000 pp', rating: 4.6, recommendations: 58, status: 'Abierto', subtype: 'Restaurante · Cocina de autor', tag: 'RECOMENDADO' },
  { category: 'Panoramas', description: 'Una función comunitaria para disfrutar cine al aire libre.', detail: 'Hoy · 19:30', id: 'cine-plaza', image: IMAGES.cinema, kind: 'panorama', location: 'Plaza Las Lilas', name: 'Cine bajo las estrellas', tag: 'HOY' },
  { category: 'Naturaleza', description: 'Sendero accesible y vistas abiertas de la ciudad.', detail: 'Dom 15 · 09:00', id: 'trekking-calan', image: IMAGES.trekking, kind: 'place', location: 'Cerro Calán', name: 'Trekking al cerro', placeVariant: 'nature', status: 'Abierto', subtype: 'Sendero · Mirador', tag: 'DOM 15' },
  { category: 'Panoramas', description: 'Entrenamiento abierto para correr acompañado por el parque.', detail: 'Este sábado · 10:00', id: 'running-parque', kind: 'panorama', location: 'Parque Inés de Suárez', name: 'Running vecinal', tag: 'SÁBADO' },
  { category: 'Panoramas', description: 'Una clase suave para comenzar el día en movimiento.', detail: 'Cupos disponibles', id: 'yoga-plaza', kind: 'panorama', location: 'Plaza Las Lilas', name: 'Yoga al aire libre', tag: 'ACTIVIDAD' },
  { category: 'Cultura', description: 'Selección de libros, editoriales independientes y actividades para lectores.', detail: 'Beneficio para vecinos', id: 'libreria-barrio', kind: 'place', location: 'Pedro de Valdivia', name: 'Librería del Barrio', placeVariant: 'culture', subtype: 'Librería cultural', tag: 'LOCAL' },
  { category: 'Panoramas', description: 'Productos cotidianos de almacenes y emprendimientos cercanos.', detail: 'Abierto hoy hasta las 19:00', id: 'mercado-local', kind: 'panorama', location: 'Providencia', name: 'Mercado Local', tag: 'ABIERTO' },
  { category: 'Panoramas', description: 'Productores y oficios del barrio reunidos durante la mañana.', detail: 'Sáb 14 · 10:00', id: 'feria-local', image: IMAGES.market, kind: 'panorama', location: 'Plaza Inés de Suárez', name: 'Feria local', tag: 'SÁB 14' },
  { category: 'Panoramas', description: 'Un recorrido por talleres, vitrinas y espacios creativos.', detail: 'Esta semana', id: 'ruta-arte', image: IMAGES.gallery, kind: 'panorama', location: 'Barrio Italia', name: 'Ruta de arte y diseño', tag: 'PANORAMA' },
  { category: 'Panoramas', description: 'Vecinos se reúnen para cuidar juntos las áreas verdes del sector.', detail: 'Sáb 14 · 11:00', id: 'limpieza-barrio', image: IMAGES.cleanup, kind: 'panorama', location: 'Parque Inés de Suárez', name: 'Limpieza del barrio', tag: 'SÁB 14' },
  { category: 'Panoramas', description: 'Aprende, cultiva y comparte cosechas con personas del barrio.', detail: '12 vecinos participan', id: 'huerto-comunitario', kind: 'panorama', location: 'Providencia', name: 'Huerto comunitario', tag: 'COMUNIDAD' },
  { category: 'Bares y clubes', description: 'Coctelería de autor, música en vivo y una carta breve para compartir.', detail: 'Abierto hasta las 02:00', id: 'bar-nocturno', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=82', kind: 'nightlife', location: 'Barrio Italia', name: 'Club Candelaria', price: '$$ · cover $8.000', rating: 4.6, recommendations: 67, status: 'Abierto', subtype: 'Bar · Música en vivo', tag: 'NOCHE' },
];

export const featuredItems = discoverItems.slice(0, 3);
export const weekendItems = discoverItems.slice(3, 6);
export const suggestedItems = discoverItems.slice(6, 9);

export function getDiscoverItem(id?: string) {
  return discoverItems.find((item) => item.id === id);
}

export function getItemsByCategory(category?: string) {
  return discoverItems.filter((item) => item.category === category);
}
