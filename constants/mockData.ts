// Constantes de la filière avicole sénégalaise.
//
// Ce fichier contenait aussi des jeux de données de démonstration (LOTS,
// BESOINS, COUVOIRS, CONVERSATIONS) affichés en complément des vraies données
// Supabase. Ils ont été retirés à la mise en ligne du site : un visiteur ne
// doit jamais voir d'annonce ou de demande inventée. Ne rien remettre ici de
// tel — pour peupler un environnement de test, passer par un script SQL de
// seed, jamais par le bundle de l'application.
//
// Le nom du fichier est conservé pour ne pas casser les nombreux imports.

export type ProductType = 'poulet' | 'poussin' | 'oeuf' | 'aliment';

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
