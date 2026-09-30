import type { CommunityPost } from '@/types/community';

export const demoCommunity = {
  id: 'demo-providencia',
  name: 'Comunidad Providencia',
} as const;

export const demoPosts: CommunityPost[] = [
  {
    id: 'post-0',
    author: 'Centro Cultural Barrio Vivo',
    category: 'evento',
    comments: [
      { id: 'comment-0', author: 'Vale S.', content: '¿Se puede llegar sin inscripción?', initials: 'VS', likes: 3, timeLabel: '7 min' },
      { id: 'comment-0-reply', author: 'Centro Cultural Barrio Vivo', content: 'Sí, la entrada es liberada hasta completar capacidad.', initials: 'BV', likes: 5, replyToCommentId: 'comment-0', timeLabel: '5 min' },
      { id: 'comment-0-2', author: 'Tomás G.', content: '¿Habrá sillas o recomiendan llevar una?', initials: 'TG', likes: 1, timeLabel: '4 min' },
      { id: 'comment-0-3', author: 'Antonia P.', content: 'Qué buena iniciativa para el barrio.', initials: 'AP', likes: 7, timeLabel: '3 min' },
      { id: 'comment-0-4', author: 'Martín C.', content: 'Nos vemos el viernes 🙌', initials: 'MC', likes: 2, timeLabel: '1 min' },
    ],
    content: 'Este viernes tendremos cine al aire libre. Trae una manta; nosotros ponemos las cabritas y la pantalla.',
    initials: 'BV',
    imageUri: 'https://images.unsplash.com/photo-1488866022504-f2584929ca5f?auto=format&fit=crop&w=1200&q=85',
    isLiked: false,
    likes: 42,
    location: 'Providencia',
    timeLabel: 'Hace 8 min',
    title: 'Cine bajo las estrellas',
  },
  {
    id: 'post-1',
    author: 'Camila R.',
    category: 'comunidad',
    comments: [
      { id: 'comment-1', author: 'Sofía P.', content: '¡Me sumo! Puedo llevar semillas.', initials: 'SP' },
    ],
    content: 'Este sábado nos reunimos para recuperar el jardín comunitario. Trae guantes si tienes; habrá herramientas para compartir.',
    initials: 'CR',
    imageUri: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=85',
    isLiked: false,
    likes: 18,
    location: 'Las Flores',
    poll: {
      question: '¿Cómo te gustaría ayudar?',
      options: [
        { id: 'garden-option-0', label: 'Plantar y ordenar', votes: 12 },
        { id: 'garden-option-1', label: 'Llevar semillas', votes: 8 },
        { id: 'garden-option-2', label: 'Compartir herramientas', votes: 5 },
      ],
    },
    timeLabel: 'Hace 25 min',
    title: 'Manos al jardín comunitario',
  },
  {
    id: 'post-2',
    author: 'Diego M.',
    category: 'recomendación',
    comments: [
      { id: 'comment-2', author: 'Nico A.', content: 'Confirmo, además atienden con mucho cariño.', initials: 'NA' },
    ],
    content: 'La pequeña panadería de Avenida Norte volvió a abrir. El pan de masa madre está especialmente bueno.',
    initials: 'DM',
    imageUri: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85',
    isLiked: true,
    likes: 31,
    location: 'Barrio Italia',
    timeLabel: 'Hace 2 h',
    title: 'Una buena recomendación',
  },
];
