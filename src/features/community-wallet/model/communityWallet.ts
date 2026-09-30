export type InitiativeCategory = 'Actividades' | 'Espacios públicos' | 'Medioambiente' | 'Seguridad';

export type CommunityInitiative = {
  category: InitiativeCategory;
  costClp: number;
  createdAt: string;
  daysLeft: number;
  id: string;
  proposedBy: string;
  status: 'active' | 'funded' | 'review';
  summary: string;
  supportedByMe: boolean;
  supporters: number;
  title: string;
};

export type InitiativeDraft = Pick<CommunityInitiative, 'category' | 'costClp' | 'summary' | 'title'>;

export type CommunityWalletActivity = {
  amountClp: number;
  counterparty: string;
  createdAt: string;
  direction: 'incoming' | 'outgoing';
  id: string;
  label: string;
  transactionHash?: string;
};

export const demoInitiatives: CommunityInitiative[] = [
  {
    category: 'Espacios públicos',
    costClp: 1250000,
    createdAt: '2026-09-21T15:00:00.000Z',
    daysLeft: 12,
    id: 'plaza-bancas',
    proposedBy: 'Camila R.',
    status: 'active',
    summary: 'Instalar cuatro bancas resistentes y accesibles junto a los juegos de la plaza.',
    supportedByMe: false,
    supporters: 38,
    title: 'Nuevas bancas para la plaza',
  },
  {
    category: 'Medioambiente',
    costClp: 680000,
    createdAt: '2026-09-18T12:00:00.000Z',
    daysLeft: 21,
    id: 'huerto-comunitario',
    proposedBy: 'Junta de vecinos',
    status: 'active',
    summary: 'Semillas, herramientas y riego inicial para activar el huerto del pasaje Los Aromos.',
    supportedByMe: true,
    supporters: 24,
    title: 'Huerto comunitario',
  },
  {
    category: 'Actividades',
    costClp: 420000,
    createdAt: '2026-08-30T18:00:00.000Z',
    daysLeft: 0,
    id: 'cine-barrio',
    proposedBy: 'Diego M.',
    status: 'funded',
    summary: 'Arriendo de proyector y sonido para una función familiar al aire libre.',
    supportedByMe: false,
    supporters: 31,
    title: 'Cine de barrio',
  },
];

export const demoWalletActivity: CommunityWalletActivity[] = [
  { amountClp: 25000, counterparty: 'Anónimo', createdAt: '2026-09-28T17:32:00.000Z', direction: 'incoming', id: 'demo-1', label: 'Donación anónima' },
  { amountClp: 184000, counterparty: 'Proveedor local', createdAt: '2026-09-25T14:10:00.000Z', direction: 'outgoing', id: 'demo-2', label: 'Materiales para el huerto' },
  { amountClp: 15000, counterparty: 'Anónimo', createdAt: '2026-09-23T11:04:00.000Z', direction: 'incoming', id: 'demo-3', label: 'Donación anónima' },
  { amountClp: 210000, counterparty: 'Arriendo audiovisual', createdAt: '2026-09-16T20:45:00.000Z', direction: 'outgoing', id: 'demo-4', label: 'Cine de barrio' },
];
