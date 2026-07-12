export type ProductType = 'poulet' | 'poussin' | 'oeuf' | 'aliment';
export type UserRole = 'eleveur' | 'acheteur' | 'couvoir' | 'admin';

export type Lot = {
  id: number;
  eleveur: string;
  eleveurId?: string;
  eleveurPhone?: string;
  region: string;
  produit: ProductType;
  titre: string;
  qte: number;
  prix: number;
  dispo: string;
  detail: string;
  createdAt: string;
  photos?: string[];
  unite?: 'piece' | 'carton';
};

export type Couvoir = {
  id: number;
  nom: string;
  region: string;
  verified: boolean;
  stocks: number;
  prix: number;
  races: string[];
  contact?: string;
};

export type Besoin = {
  id: number;
  acheteur: string;
  type: string;
  region: string;
  produit: ProductType;
  qte: number;
  prixMax: number;
  date: string;
};

export type Message = {
  id: number;
  senderId: string;
  text: string;
  timestamp: string;
};

export type Conversation = {
  id: number;
  participant: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Message[];
};

export const LOTS: Lot[] = [
  {
    id: 1,
    eleveur: 'Moussa Diallo',
    eleveurPhone: '771234567',
    region: 'Dakar',
    produit: 'poulet',
    titre: 'Poulets de chair Cobb 500',
    qte: 500,
    prix: 2800,
    dispo: 'Immédiat',
    detail: '42 jours · 2.1 kg/tête · élevage biosécurisé',
    createdAt: '2025-06-14',
    photos: ['https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=85&auto=format&fit=crop'],
  },
  {
    id: 2,
    eleveur: 'Ibrahima Ndiaye',
    eleveurPhone: '762345678',
    region: 'Kaolack',
    produit: 'poulet',
    titre: 'Poulets de chair Ross 308',
    qte: 1200,
    prix: 2600,
    dispo: 'Dans 3 jours',
    detail: '38 jours · 1.9 kg/tête',
    createdAt: '2025-06-13',
    photos: ['https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&q=85&auto=format&fit=crop'],
  },
  {
    id: 3,
    eleveur: 'Fatou Seck',
    eleveurPhone: '703456789',
    region: 'Thiès',
    produit: 'oeuf',
    titre: 'Œufs frais calibre moyen',
    qte: 4800,
    prix: 120,
    dispo: 'Immédiat',
    detail: 'ISA Brown · plateau 30 · ramassage quotidien',
    createdAt: '2025-06-12',
    photos: ['https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&q=85&auto=format&fit=crop'],
  },
  {
    id: 4,
    eleveur: 'Cheikh Ly',
    eleveurPhone: '774567890',
    region: 'Ziguinchor',
    produit: 'poussin',
    titre: 'Poussins Arbor Acres J1',
    qte: 2000,
    prix: 450,
    dispo: 'Immédiat',
    detail: '1 jour · vaccination Marek incluse',
    createdAt: '2025-06-11',
    photos: ['https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=800&q=85&auto=format&fit=crop'],
  },
  {
    id: 5,
    eleveur: 'Omar Sow',
    eleveurPhone: '765678901',
    region: 'Louga',
    produit: 'aliment',
    titre: 'Aliment démarrage poussins',
    qte: 50,
    prix: 18500,
    dispo: 'Immédiat',
    detail: 'Sac 50 kg · protéines 22% · minéraux',
    createdAt: '2025-06-10',
    photos: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=85&auto=format&fit=crop'],
  },
  {
    id: 6,
    eleveur: 'Aissatou Ba',
    eleveurPhone: '706789012',
    region: 'Saint-Louis',
    produit: 'poulet',
    titre: 'Poulets fermiers Label Rouge',
    qte: 300,
    prix: 3200,
    dispo: 'Dans 1 semaine',
    detail: '56 jours · 2.4 kg/tête · élevage plein air',
    createdAt: '2025-06-09',
    photos: ['https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=85&auto=format&fit=crop'],
  },
];

export const COUVOIRS: Couvoir[] = [
  {
    id: 1,
    nom: 'Couvoir du Sahel',
    region: 'Dakar',
    verified: true,
    stocks: 12000,
    prix: 450,
    races: ['Cobb 500', 'Ross 308', 'ISA Brown'],
    contact: '+221 77 123 45 67',
  },
  {
    id: 2,
    nom: 'SenPoussin',
    region: 'Thiès',
    verified: true,
    stocks: 8000,
    prix: 440,
    races: ['Cobb 500', 'Arbor Acres'],
    contact: '+221 76 234 56 78',
  },
  {
    id: 3,
    nom: 'Avicole Nord',
    region: 'Saint-Louis',
    verified: true,
    stocks: 5000,
    prix: 420,
    races: ['Ross 308', 'Hubbard'],
    contact: '+221 70 345 67 89',
  },
];

export const BESOINS: Besoin[] = [
  {
    id: 1,
    acheteur: 'Marché Sandaga SARL',
    type: 'Grossiste',
    region: 'Dakar',
    produit: 'poulet',
    qte: 500,
    prixMax: 2900,
    date: '2025-06-20',
  },
  {
    id: 2,
    acheteur: 'Restaurant Le Baobab',
    type: 'Restaurateur',
    region: 'Dakar',
    produit: 'poulet',
    qte: 80,
    prixMax: 3100,
    date: '2025-06-15',
  },
  {
    id: 3,
    acheteur: 'Supermarché Auchan Thiès',
    type: 'Grande surface',
    region: 'Thiès',
    produit: 'oeuf',
    qte: 10000,
    prixMax: 130,
    date: '2025-06-18',
  },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    participant: 'Moussa Diallo',
    lastMessage: 'Bonjour, les poulets sont encore disponibles ?',
    timestamp: '10:30',
    unread: 2,
    messages: [
      { id: 1, senderId: 'other', text: 'Bonjour, les poulets sont encore disponibles ?', timestamp: '10:28' },
      { id: 2, senderId: 'me', text: 'Oui, il reste 500 têtes.', timestamp: '10:30' },
    ],
  },
  {
    id: 2,
    participant: 'Fatou Seck',
    lastMessage: 'Quel est le prix pour 2000 œufs ?',
    timestamp: 'Hier',
    unread: 0,
    messages: [
      { id: 1, senderId: 'other', text: 'Quel est le prix pour 2000 œufs ?', timestamp: 'Hier 14:15' },
      { id: 2, senderId: 'me', text: 'Pour 2000 œufs, je fais 115 F CFA l\'unité.', timestamp: 'Hier 14:20' },
    ],
  },
];

export const REGIONS = [
  'Toutes',
  'Dakar',
  'Diourbel',
  'Fatick',
  'Kaffrine',
  'Kaolack',
  'Kédougou',
  'Kolda',
  'Louga',
  'Matam',
  'Saint-Louis',
  'Sédhiou',
  'Tambacounda',
  'Thiès',
  'Ziguinchor',
];

export const PRODUCT_EMOJIS: Record<ProductType, string> = {
  poulet: '🐔',
  poussin: '🐣',
  oeuf: '🥚',
  aliment: '🌽',
};

export const PRODUCT_LABELS: Record<ProductType, string> = {
  poulet: 'Poulet',
  poussin: 'Poussin',
  oeuf: 'Œuf',
  aliment: 'Aliment',
};
