import type { TribuusPlace } from '@/features/places/model/place';

const now = Date.now();
const daysAgo = (days: number) => new Date(now - days * 86_400_000).toISOString();

export const demoPlaces: TribuusPlace[] = [
  {
    activityScore: 0.92, communityTags: ['Buen café', 'Atención amable', 'Pet friendly'], createdAt: daysAgo(90), id: 'place-cafe-triciclo', localRelevance: 0.96, popularity: 18, provider: 'mapbox', status: 'active',
    providerData: { address: 'Av. Providencia 1420', category: 'Cafetería', coordinate: [-70.6388, -33.4384], mapboxId: 'demo.mapbox.cafe-triciclo', name: 'Café Triciclo', neighborhood: 'Providencia', rawCategory: 'coffee_shop' },
    recommendations: [
      { authorId: 'u-camila', authorName: 'Camila R.', confidence: 0.95, createdAt: daysAgo(2), id: 'rec-triciclo-1', tags: ['Buen café', 'Atención amable'], text: 'El café y los rollos de canela son increíbles. Se siente muy de barrio.' },
      { authorId: 'u-diego', authorName: 'Diego M.', confidence: 0.9, createdAt: daysAgo(8), id: 'rec-triciclo-2', tags: ['Pet friendly'], text: 'La terraza es tranquila y reciben muy bien a quienes llegan con mascotas.' },
    ],
  },
  {
    activityScore: 0.86, communityTags: ['Rico', 'Producto local'], createdAt: daysAgo(64), id: 'place-la-popular', localRelevance: 0.88, popularity: 37, provider: 'mapbox', status: 'active',
    providerData: { address: 'Irarrázaval 3490', category: 'Restaurante', coordinate: [-70.6008, -33.4558], mapboxId: 'demo.mapbox.la-popular', name: 'La Popular Pizza', neighborhood: 'Ñuñoa', rawCategory: 'restaurant' },
    recommendations: [{ authorId: 'u-sofia', authorName: 'Sofía P.', confidence: 0.94, createdAt: daysAgo(4), id: 'rec-popular-1', tags: ['Rico', 'Producto local'], text: 'Masas muy buenas y un ambiente perfecto para compartir con amigos.' }],
  },
  {
    activityScore: 0.75, communityTags: ['Precio justo', 'Producto local'], createdAt: daysAgo(30), id: 'place-pan-norte', localRelevance: 0.91, popularity: 21, provider: 'community', status: 'active',
    providerData: { address: 'Av. Norte 318', category: 'Panadería', coordinate: [-70.6228, -33.4299], mapboxId: null, name: 'Panadería Norte', neighborhood: 'Los Leones' },
    recommendations: [{ authorId: 'u-diego', authorName: 'Diego M.', confidence: 0.88, createdAt: daysAgo(1), id: 'rec-pan-1', tags: ['Precio justo', 'Producto local'], text: 'Volvieron a abrir y el pan de masa madre está especialmente bueno.' }],
  },
];

