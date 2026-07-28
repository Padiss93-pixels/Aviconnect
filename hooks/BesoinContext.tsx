import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type ProductType } from '@/constants/mockData';
import { supabase } from '@/lib/supabase';
import { useModeration } from './ModerationContext';

export type Besoin = {
  id: number;
  acheteurId: string;
  acheteurNom: string;
  acheteurPhone?: string;
  produit: ProductType;
  qte: number;
  prixMax: number;
  region: string;
  detail: string;
  dateExpiry: string;
  createdAt: string;
};

function rowToBesoin(row: any): Besoin {
  return {
    id: row.id,
    acheteurId: row.acheteur_id,
    acheteurNom: row.acheteur_nom,
    acheteurPhone: row.acheteur_phone ?? undefined,
    produit: row.produit,
    qte: row.qte,
    prixMax: row.prix_max,
    region: row.region,
    detail: row.detail,
    dateExpiry: row.date_expiry,
    createdAt: row.created_at,
  };
}

type BesoinContextType = {
  besoins: Besoin[];
  addBesoin: (b: Omit<Besoin, 'id' | 'createdAt'>) => Promise<void>;
  deleteBesoin: (id: number) => Promise<void>;
  getBesoinsForAcheteur: (acheteurId: string) => Besoin[];
};

const BesoinContext = createContext<BesoinContextType>({
  besoins: [],
  addBesoin: async () => {},
  deleteBesoin: async () => {},
  getBesoinsForAcheteur: () => [],
});

export function BesoinProvider({ children }: { children: React.ReactNode }) {
  const { isBlocked } = useModeration();
  const [allBesoins, setBesoins] = useState<Besoin[]>([]);
  // Les besoins publiés par un utilisateur bloqué sont masqués (App Store 1.2).
  const besoins = allBesoins.filter((b) => !isBlocked(b.acheteurId));

  useEffect(() => {
    supabase
      .from('besoins')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setBesoins(data.map(rowToBesoin));
      });
  }, []);

  const addBesoin = useCallback(async (b: Omit<Besoin, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase.from('besoins').insert({
      acheteur_id: b.acheteurId,
      acheteur_nom: b.acheteurNom,
      acheteur_phone: b.acheteurPhone ?? null,
      produit: b.produit,
      qte: b.qte,
      prix_max: b.prixMax,
      region: b.region,
      detail: b.detail,
      date_expiry: b.dateExpiry,
    }).select().single();
    if (!error && data) setBesoins((prev) => [rowToBesoin(data), ...prev]);
  }, []);

  const deleteBesoin = useCallback(async (id: number) => {
    await supabase.from('besoins').delete().eq('id', id);
    setBesoins((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const getBesoinsForAcheteur = useCallback((acheteurId: string) =>
    besoins.filter((b) => b.acheteurId === acheteurId),
  [besoins]);

  return (
    <BesoinContext.Provider value={{ besoins, addBesoin, deleteBesoin, getBesoinsForAcheteur }}>
      {children}
    </BesoinContext.Provider>
  );
}

export function useBesoins() { return useContext(BesoinContext); }
