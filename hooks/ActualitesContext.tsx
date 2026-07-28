import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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
  id: string;
  titre: string;
  resume: string;
  contenu: string;
  categorie: Categorie;
  auteurId: string;
  auteurNom: string;
  createdAt: string;
  imageEmoji?: string;
};

function rowToActualite(row: any): Actualite {
  return {
    id: row.id,
    titre: row.titre,
    resume: row.resume ?? '',
    contenu: row.contenu,
    categorie: (row.categorie ?? 'conseil') as Categorie,
    auteurId: row.auteur_id ?? 'admin',
    auteurNom: row.auteur_nom ?? 'AviConnect Admin',
    createdAt: row.created_at,
    imageEmoji: row.image_emoji ?? undefined,
  };
}

type ActualitesContextType = {
  actualites: Actualite[];
  addActualite: (a: Omit<Actualite, 'id' | 'createdAt'>) => Promise<void>;
  deleteActualite: (id: string) => Promise<void>;
};

const ActualitesContext = createContext<ActualitesContextType>({
  actualites: [],
  addActualite: async () => {},
  deleteActualite: async () => {},
});

export function ActualitesProvider({ children }: { children: React.ReactNode }) {
  const [actualites, setActualites] = useState<Actualite[]>([]);

  useEffect(() => {
    supabase
      .from('actualites')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setActualites(data.map(rowToActualite));
      });
  }, []);

  const addActualite = useCallback(async (a: Omit<Actualite, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase.from('actualites').insert({
      titre: a.titre,
      resume: a.resume,
      contenu: a.contenu,
      categorie: a.categorie,
      auteur_id: a.auteurId,
      auteur_nom: a.auteurNom,
      image_emoji: a.imageEmoji ?? null,
    }).select().single();
    if (!error && data) setActualites((prev) => [rowToActualite(data), ...prev]);
  }, []);

  const deleteActualite = useCallback(async (id: string) => {
    await supabase.from('actualites').delete().eq('id', id);
    setActualites((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return (
    <ActualitesContext.Provider value={{ actualites, addActualite, deleteActualite }}>
      {children}
    </ActualitesContext.Provider>
  );
}

export function useActualites() { return useContext(ActualitesContext); }
