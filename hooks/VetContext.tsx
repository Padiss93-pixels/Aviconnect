import React, { createContext, useContext, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type ProduitVet = {
  id: string;
  nom: string;
  description: string;
  prix: number;
  unite: string;
  categorie: 'vaccin' | 'vitamine' | 'medicament' | 'autre';
  photo?: string;
};

export type ProfilVet = {
  userId: string;
  photo?: string;
  catalogue: ProduitVet[];
};


type VetContextType = {
  getProfilVet: (userId: string) => Promise<ProfilVet>;
  addProduit: (userId: string, produit: Omit<ProduitVet, 'id'>) => Promise<void>;
  updateProduit: (userId: string, produit: ProduitVet) => Promise<void>;
  deleteProduit: (userId: string, produitId: string) => Promise<void>;
  updatePhoto: (userId: string, photoUri: string) => Promise<void>;
  getCatalogue: (userId: string) => Promise<ProduitVet[]>;
};

const VetContext = createContext<VetContextType>({
  getProfilVet: async () => ({ userId: '', catalogue: [] }),
  addProduit: async () => {},
  updateProduit: async () => {},
  deleteProduit: async () => {},
  updatePhoto: async () => {},
  getCatalogue: async () => [],
});

function rowToProduit(row: any): ProduitVet {
  return {
    id: row.id,
    nom: row.nom,
    description: row.description ?? '',
    prix: Number(row.prix ?? 0),
    unite: row.unite ?? '',
    categorie: row.type as ProduitVet['categorie'],
    photo: row.photo ?? undefined,
  };
}

export function VetProvider({ children }: { children: React.ReactNode }) {
  const getProfilVet = useCallback(async (userId: string): Promise<ProfilVet> => {
    const [{ data: profile }, { data: catalogue }] = await Promise.all([
      supabase.from('profiles').select('photo').eq('id', userId).single(),
      supabase.from('vet_catalogue').select('*').eq('vet_id', userId).order('created_at', { ascending: true }),
    ]);
    return {
      userId,
      photo: profile?.photo ?? undefined,
      catalogue: (catalogue ?? []).map(rowToProduit),
    };
  }, []);

  const addProduit = useCallback(async (userId: string, produit: Omit<ProduitVet, 'id'>) => {
    await supabase.from('vet_catalogue').insert({
      vet_id: userId,
      nom: produit.nom,
      type: produit.categorie,
      description: produit.description,
      prix: produit.prix,
      unite: produit.unite,
      photo: produit.photo ?? null,
    });
  }, []);

  const updateProduit = useCallback(async (userId: string, produit: ProduitVet) => {
    await supabase
      .from('vet_catalogue')
      .update({
        nom: produit.nom,
        type: produit.categorie,
        description: produit.description,
        prix: produit.prix,
        unite: produit.unite,
        photo: produit.photo ?? null,
      })
      .eq('id', produit.id)
      .eq('vet_id', userId);
  }, []);

  const deleteProduit = useCallback(async (userId: string, produitId: string) => {
    await supabase
      .from('vet_catalogue')
      .delete()
      .eq('id', produitId)
      .eq('vet_id', userId);
  }, []);

  const updatePhoto = useCallback(async (userId: string, photoUri: string) => {
    await supabase.from('profiles').update({ photo: photoUri }).eq('id', userId);
  }, []);

  const getCatalogue = useCallback(async (userId: string): Promise<ProduitVet[]> => {
    const { data } = await supabase
      .from('vet_catalogue')
      .select('*')
      .eq('vet_id', userId)
      .order('created_at', { ascending: true });
    return (data ?? []).map(rowToProduit);
  }, []);

  return (
    <VetContext.Provider value={{ getProfilVet, addProduit, updateProduit, deleteProduit, updatePhoto, getCatalogue }}>
      {children}
    </VetContext.Provider>
  );
}

export function useVetContext() {
  return useContext(VetContext);
}
