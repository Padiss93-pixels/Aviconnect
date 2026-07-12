import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type ProductType } from '@/constants/mockData';

const KEY = '@aviconnect_besoins';

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
  dateExpiry: string;  // date limite souhaitée
  createdAt: string;
};

async function readStorage(): Promise<Besoin[]> {
  try {
    const raw = Platform.OS === 'web'
      ? localStorage.getItem(KEY)
      : await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function writeStorage(besoins: Besoin[]): Promise<void> {
  try {
    const json = JSON.stringify(besoins);
    if (Platform.OS === 'web') localStorage.setItem(KEY, json);
    else await AsyncStorage.setItem(KEY, json);
  } catch {}
}

type BesoinContextType = {
  besoins: Besoin[];
  addBesoin: (b: Besoin) => Promise<void>;
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
  const [besoins, setBesoins] = useState<Besoin[]>([]);

  useEffect(() => { readStorage().then(setBesoins); }, []);

  const addBesoin = useCallback(async (b: Besoin) => {
    const updated = [b, ...besoins];
    setBesoins(updated);
    await writeStorage(updated);
  }, [besoins]);

  const deleteBesoin = useCallback(async (id: number) => {
    const updated = besoins.filter((b) => b.id !== id);
    setBesoins(updated);
    await writeStorage(updated);
  }, [besoins]);

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
