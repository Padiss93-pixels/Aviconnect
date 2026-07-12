import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProduitVet = {
  id: number;
  nom: string;
  description: string;
  prix: number;
  unite: string; // ex: "par dose", "par flacon", "par kg"
  categorie: 'vaccin' | 'vitamine' | 'medicament' | 'autre';
  photo?: string;
};

export type ProfilVet = {
  userId: string;
  photo?: string;
  catalogue: ProduitVet[];
};

const VET_STORAGE_KEY = '@aviconnect_vet_profiles';

async function storage(op: 'get' | 'set', key: string, value?: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (op === 'get') return localStorage.getItem(key);
      if (op === 'set') { localStorage.setItem(key, value!); return null; }
    } else {
      if (op === 'get') return await AsyncStorage.getItem(key);
      if (op === 'set') { await AsyncStorage.setItem(key, value!); return null; }
    }
  } catch {}
  return null;
}

async function loadAllProfiles(): Promise<Record<string, ProfilVet>> {
  const raw = await storage('get', VET_STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

async function saveAllProfiles(profiles: Record<string, ProfilVet>): Promise<void> {
  await storage('set', VET_STORAGE_KEY, JSON.stringify(profiles));
}

type VetContextType = {
  getProfilVet: (userId: string) => Promise<ProfilVet>;
  addProduit: (userId: string, produit: Omit<ProduitVet, 'id'>) => Promise<void>;
  updateProduit: (userId: string, produit: ProduitVet) => Promise<void>;
  deleteProduit: (userId: string, produitId: number) => Promise<void>;
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

export function VetProvider({ children }: { children: React.ReactNode }) {
  const getProfilVet = useCallback(async (userId: string): Promise<ProfilVet> => {
    const profiles = await loadAllProfiles();
    return profiles[userId] ?? { userId, catalogue: [] };
  }, []);

  const addProduit = useCallback(async (userId: string, produit: Omit<ProduitVet, 'id'>) => {
    const profiles = await loadAllProfiles();
    const profil = profiles[userId] ?? { userId, catalogue: [] };
    const newProduit: ProduitVet = { ...produit, id: Date.now() };
    profiles[userId] = { ...profil, catalogue: [...profil.catalogue, newProduit] };
    await saveAllProfiles(profiles);
  }, []);

  const updateProduit = useCallback(async (userId: string, produit: ProduitVet) => {
    const profiles = await loadAllProfiles();
    const profil = profiles[userId] ?? { userId, catalogue: [] };
    profiles[userId] = {
      ...profil,
      catalogue: profil.catalogue.map((p) => p.id === produit.id ? produit : p),
    };
    await saveAllProfiles(profiles);
  }, []);

  const deleteProduit = useCallback(async (userId: string, produitId: number) => {
    const profiles = await loadAllProfiles();
    const profil = profiles[userId] ?? { userId, catalogue: [] };
    profiles[userId] = { ...profil, catalogue: profil.catalogue.filter((p) => p.id !== produitId) };
    await saveAllProfiles(profiles);
  }, []);

  const updatePhoto = useCallback(async (userId: string, photoUri: string) => {
    const profiles = await loadAllProfiles();
    const profil = profiles[userId] ?? { userId, catalogue: [] };
    profiles[userId] = { ...profil, photo: photoUri };
    await saveAllProfiles(profiles);
  }, []);

  const getCatalogue = useCallback(async (userId: string): Promise<ProduitVet[]> => {
    const profil = await getProfilVet(userId);
    return profil.catalogue;
  }, [getProfilVet]);

  return (
    <VetContext.Provider value={{ getProfilVet, addProduit, updateProduit, deleteProduit, updatePhoto, getCatalogue }}>
      {children}
    </VetContext.Provider>
  );
}

export function useVetContext() {
  return useContext(VetContext);
}
