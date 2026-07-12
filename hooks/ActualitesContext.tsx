import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@aviconnect_actualites';

export type Categorie = 'sante' | 'vaccin' | 'virus' | 'metier' | 'marche' | 'reglementation' | 'conseil';

export const CATEGORIE_LABELS: Record<Categorie, string> = {
  sante:         'Santé animale',
  vaccin:        'Vaccination',
  virus:         'Maladies & Virus',
  metier:        'Métier',
  marche:        'Marché & Prix',
  reglementation:'Réglementation',
  conseil:       'Conseils pratiques',
};

export const CATEGORIE_COLORS: Record<Categorie, { bg: string; text: string; dot: string }> = {
  sante:          { bg: '#dcfce7', text: '#166534', dot: '#22c55e' },
  vaccin:         { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
  virus:          { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
  metier:         { bg: '#fef9c3', text: '#854d0e', dot: '#eab308' },
  marche:         { bg: '#f3e8ff', text: '#6b21a8', dot: '#a855f7' },
  reglementation: { bg: '#ffedd5', text: '#9a3412', dot: '#f97316' },
  conseil:        { bg: '#e0f2fe', text: '#0c4a6e', dot: '#0ea5e9' },
};

export const CATEGORIE_EMOJIS: Record<Categorie, string> = {
  sante:          '🩺',
  vaccin:         '💉',
  virus:          '🦠',
  metier:         '👨‍🌾',
  marche:         '📈',
  reglementation: '📋',
  conseil:        '💡',
};

export type Actualite = {
  id: number;
  titre: string;
  resume: string;
  contenu: string;
  categorie: Categorie;
  auteurId: string;
  auteurNom: string;
  createdAt: string;
  imageEmoji?: string;
};

// Articles mock pour démarrer avec du contenu
const MOCK_ACTUALITES: Actualite[] = [
  {
    id: 1,
    titre: 'Alerte : Gripppe Aviaire détectée dans la région de Thiès',
    resume: 'Des cas de grippe aviaire H5N1 ont été signalés dans plusieurs élevages. Les autorités recommandent des mesures préventives immédiates.',
    contenu: `Des cas de grippe aviaire (H5N1) ont été confirmés dans la région de Thiès. Voici les mesures à prendre immédiatement :\n\n• Isoler les animaux malades du reste du troupeau\n• Contacter immédiatement votre vétérinaire\n• Ne pas déplacer les volailles entre élevages\n• Désinfecter les équipements et les locaux\n• Signaler tout cas suspect aux autorités sanitaires\n\nLes symptômes à surveiller : mortalité soudaine, difficultés respiratoires, chute de la production d'œufs, gonflement de la tête et du cou.\n\nLe Ministère de l'Élevage a mis en place une cellule de crise. Numéro d'urgence : 33 889 10 10.`,
    categorie: 'virus',
    auteurId: 'admin',
    auteurNom: 'AviConnect Admin',
    createdAt: '2026-07-05',
    imageEmoji: '🦠',
  },
  {
    id: 2,
    titre: 'Calendrier de vaccination 2026 pour les poulets de chair',
    resume: 'Le nouveau calendrier vaccinal recommandé par le DIREL est disponible. Retrouvez les dates et vaccins essentiels pour protéger votre élevage.',
    contenu: `Le DIREL (Direction de l'Élevage) a publié le calendrier de vaccination 2026 pour les poulets de chair.\n\n**Semaine 1 (Jour 1)**\n• Marek : à l'écloserie\n• Newcastle (souche HB1) : spray ou eau de boisson\n\n**Semaine 2 (Jour 7-10)**\n• Gumboro (IBD) : eau de boisson\n• Bronchite Infectieuse : spray\n\n**Semaine 3 (Jour 18-21)**\n• Rappel Newcastle (souche La Sota)\n• Rappel Gumboro si nécessaire\n\n**Semaine 5 (Jour 35)**\n• Newcastle (vaccin huileux) : injection\n\nContactez votre vétérinaire pour adapter ce protocole à votre situation spécifique.`,
    categorie: 'vaccin',
    auteurId: 'admin',
    auteurNom: 'AviConnect Admin',
    createdAt: '2026-07-01',
    imageEmoji: '💉',
  },
  {
    id: 3,
    titre: 'Prix du maïs : hausse de 15% attendue ce trimestre',
    resume: 'Les cours du maïs sur les marchés internationaux impactent les prix locaux de l\'aliment. Comment anticiper et gérer la hausse des coûts d\'élevage.',
    contenu: `Les prix du maïs sur les marchés internationaux ont augmenté de 15% ces dernières semaines, une hausse qui va se répercuter sur le coût de l'aliment pour volailles au Sénégal.\n\n**Impact estimé :**\n• Augmentation du coût de l'aliment : +8 à 12%\n• Répercussion possible sur les prix de vente\n\n**Conseils pour limiter l'impact :**\n1. Acheter et stocker l'aliment avant la hausse\n2. Négocier des contrats à prix fixe avec vos fournisseurs\n3. Optimiser la consommation alimentaire (réduire les gaspillages)\n4. Considérer des alternatives comme le sorgho local\n\nLes éleveurs peuvent contacter la FAFA-SN (Fédération des Acteurs de la Filière Avicole) pour des achats groupés.`,
    categorie: 'marche',
    auteurId: 'admin',
    auteurNom: 'AviConnect Admin',
    createdAt: '2026-06-28',
    imageEmoji: '📈',
  },
  {
    id: 4,
    titre: 'Bonnes pratiques de biosécurité en élevage avicole',
    resume: 'Adoptez ces 10 règles d\'or pour protéger votre élevage contre les maladies et améliorer vos performances.',
    contenu: `La biosécurité est la première ligne de défense contre les maladies. Voici les 10 règles d'or :\n\n1. **Contrôler les entrées** : Personne n'entre dans le poulailler sans vêtements et chaussures propres\n2. **Pédiluves** : Placer des bacs désinfectants à chaque entrée, les renouveler régulièrement\n3. **Quarantaine** : Tout nouvel animal doit être isolé 2 à 3 semaines avant d'intégrer le troupeau\n4. **Eau potable** : Traiter l'eau à la javel (1 ml pour 10 litres)\n5. **Nettoyage quotidien** : Retirer les fientes chaque jour, elles sont source de maladies\n6. **Vide sanitaire** : 3 semaines minimum entre deux lots\n7. **Grillages** : Empêcher le contact avec les oiseaux sauvages\n8. **Rongeurs** : Dératiser régulièrement\n9. **Visiteurs** : Limiter les visites et les enregistrer\n10. **Mortalité** : Incinérer ou enterrer les carcasses loin de l'élevage`,
    categorie: 'conseil',
    auteurId: 'admin',
    auteurNom: 'AviConnect Admin',
    createdAt: '2026-06-20',
    imageEmoji: '💡',
  },
];

async function readStorage(): Promise<Actualite[]> {
  try {
    const raw = Platform.OS === 'web' ? localStorage.getItem(KEY) : await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function writeStorage(items: Actualite[]): Promise<void> {
  try {
    const json = JSON.stringify(items);
    if (Platform.OS === 'web') localStorage.setItem(KEY, json);
    else await AsyncStorage.setItem(KEY, json);
  } catch {}
}

type ActualitesContextType = {
  actualites: Actualite[];       // user-created + mock merged
  addActualite: (a: Actualite) => Promise<void>;
  deleteActualite: (id: number) => Promise<void>;
};

const ActualitesContext = createContext<ActualitesContextType>({
  actualites: MOCK_ACTUALITES,
  addActualite: async () => {},
  deleteActualite: async () => {},
});

export function ActualitesProvider({ children }: { children: React.ReactNode }) {
  const [userActus, setUserActus] = useState<Actualite[]>([]);

  useEffect(() => { readStorage().then(setUserActus); }, []);

  const actualites = (() => {
    const mockIds = new Set(MOCK_ACTUALITES.map((a) => a.id));
    const unique = userActus.filter((a) => !mockIds.has(a.id));
    return [...unique, ...MOCK_ACTUALITES].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  })();

  const addActualite = useCallback(async (a: Actualite) => {
    const updated = [a, ...userActus];
    setUserActus(updated);
    await writeStorage(updated);
  }, [userActus]);

  const deleteActualite = useCallback(async (id: number) => {
    const updated = userActus.filter((a) => a.id !== id);
    setUserActus(updated);
    await writeStorage(updated);
  }, [userActus]);

  return (
    <ActualitesContext.Provider value={{ actualites, addActualite, deleteActualite }}>
      {children}
    </ActualitesContext.Provider>
  );
}

export function useActualites() { return useContext(ActualitesContext); }
