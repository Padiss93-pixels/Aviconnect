import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BANNER_KEY = '@aviconnect_banners';
const MARCHE_PUB_KEY = '@aviconnect_marche_pubs';

export type BannerPub = {
  id: string;
  bg: string;
  title: string;
  sub: string;
  lien?: string;
  actif: boolean;
};

export type MarchePub = {
  id: string;
  titre: string;
  description: string;
  emoji: string;
  bg: string;
  lien?: string;
  actif: boolean;
};

const DEFAULT_BANNERS: BannerPub[] = [
  { id: 'b1', bg: '#15803d', title: 'Bienvenue sur AviConnect', sub: 'La marketplace avicole du Sénégal 🇸🇳', actif: true },
  { id: 'b2', bg: '#166534', title: '14 régions couvertes', sub: 'Trouvez des éleveurs partout au Sénégal', actif: true },
  { id: 'b3', bg: '#14532d', title: 'Couvoirs certifiés', sub: 'Poussins de qualité garantis ✓', actif: true },
];

const DEFAULT_MARCHE_PUBS: MarchePub[] = [];

async function load(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await AsyncStorage.getItem(key);
  } catch { return null; }
}

async function save(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    await AsyncStorage.setItem(key, value);
  } catch {}
}

type PubContextType = {
  banners: BannerPub[];
  marchePubs: MarchePub[];
  // Admin
  addBanner: (b: Omit<BannerPub, 'id'>) => Promise<void>;
  updateBanner: (b: BannerPub) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;
  addMarchePub: (p: Omit<MarchePub, 'id'>) => Promise<void>;
  updateMarchePub: (p: MarchePub) => Promise<void>;
  deleteMarchePub: (id: string) => Promise<void>;
};

const PubContext = createContext<PubContextType>({
  banners: DEFAULT_BANNERS,
  marchePubs: [],
  addBanner: async () => {},
  updateBanner: async () => {},
  deleteBanner: async () => {},
  addMarchePub: async () => {},
  updateMarchePub: async () => {},
  deleteMarchePub: async () => {},
});

function genId() {
  return `pub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function PubProvider({ children }: { children: React.ReactNode }) {
  const [banners, setBanners] = useState<BannerPub[]>(DEFAULT_BANNERS);
  const [marchePubs, setMarchePubs] = useState<MarchePub[]>(DEFAULT_MARCHE_PUBS);

  useEffect(() => {
    load(BANNER_KEY).then((raw) => {
      if (raw) setBanners(JSON.parse(raw));
    });
    load(MARCHE_PUB_KEY).then((raw) => {
      if (raw) setMarchePubs(JSON.parse(raw));
    });
  }, []);

  const saveBanners = useCallback(async (list: BannerPub[]) => {
    setBanners(list);
    await save(BANNER_KEY, JSON.stringify(list));
  }, []);

  const saveMarchePubs = useCallback(async (list: MarchePub[]) => {
    setMarchePubs(list);
    await save(MARCHE_PUB_KEY, JSON.stringify(list));
  }, []);

  const addBanner = useCallback(async (b: Omit<BannerPub, 'id'>) => {
    const updated = [...banners, { ...b, id: genId() }];
    await saveBanners(updated);
  }, [banners, saveBanners]);

  const updateBanner = useCallback(async (b: BannerPub) => {
    await saveBanners(banners.map((x) => x.id === b.id ? b : x));
  }, [banners, saveBanners]);

  const deleteBanner = useCallback(async (id: string) => {
    await saveBanners(banners.filter((x) => x.id !== id));
  }, [banners, saveBanners]);

  const addMarchePub = useCallback(async (p: Omit<MarchePub, 'id'>) => {
    const updated = [...marchePubs, { ...p, id: genId() }];
    await saveMarchePubs(updated);
  }, [marchePubs, saveMarchePubs]);

  const updateMarchePub = useCallback(async (p: MarchePub) => {
    await saveMarchePubs(marchePubs.map((x) => x.id === p.id ? p : x));
  }, [marchePubs, saveMarchePubs]);

  const deleteMarchePub = useCallback(async (id: string) => {
    await saveMarchePubs(marchePubs.filter((x) => x.id !== id));
  }, [marchePubs, saveMarchePubs]);

  return (
    <PubContext.Provider value={{
      banners, marchePubs,
      addBanner, updateBanner, deleteBanner,
      addMarchePub, updateMarchePub, deleteMarchePub,
    }}>
      {children}
    </PubContext.Provider>
  );
}

export function usePubs() {
  return useContext(PubContext);
}
