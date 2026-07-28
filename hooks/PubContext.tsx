import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type BannerPub = {
  id: string;
  bg: string;
  title: string;
  sub: string;
  lien?: string;
  image?: string;
  actif: boolean;
  type?: 'default' | 'promo';
  tag?: string;
  priceLabel?: string;
  price?: string;
  accentColor?: string;
};

export type MarchePub = {
  id: string;
  titre: string;
  description: string;
  emoji: string;
  bg: string;
  lien?: string;
  image?: string;
  actif: boolean;
};

const DEFAULT_BANNERS: BannerPub[] = [
  { id: 'b1', bg: '#15803d', title: 'Bienvenue sur AviConnect', sub: 'La marketplace avicole du Sénégal 🇸🇳', actif: true },
  { id: 'b2', bg: '#166534', title: '14 régions couvertes', sub: 'Trouvez des éleveurs partout au Sénégal', actif: true },
  { id: 'b3', bg: '#14532d', title: 'Couvoirs certifiés', sub: 'Poussins de qualité garantis ✓', actif: true },
  {
    id: 'promo_pdo_1', bg: '#4A2C00', actif: true,
    type: 'promo', accentColor: '#E8A020',
    tag: 'GIE Plumes d\'Or · Hamady Ounaré',
    title: 'Poulets frais de qualité', sub: 'Élevage moderne · Alimentation naturelle',
    priceLabel: 'Poulet entier', price: '3 500 FCFA',
    lien: 'tel:+221786919716',
  },
  {
    id: 'promo_pdo_2', bg: '#0D3B22', actif: true,
    type: 'promo', accentColor: '#DAA520',
    tag: 'GIE Plumes d\'Or · Hamady Ounaré',
    title: 'Œufs frais garantis', sub: 'Hygiène garantie · Fraîcheur assurée',
    priceLabel: 'La plateau', price: '2 500 FCFA',
    lien: 'tel:+221786919716',
  },
  {
    id: 'promo_pdo_3', bg: '#1A1208', actif: true,
    type: 'promo', accentColor: '#C9973A',
    tag: 'Votre protéine santé',
    title: 'Plumes d\'Or', sub: 'Boutique : En face mosquée Alfallah\nFerme : Hamady Ounaré, derrière station Total\n📞 78 691 97 16 · TikTok @plumesdOr',
    lien: 'tel:+221786919716',
  },
];

type PubContextType = {
  banners: BannerPub[];
  marchePubs: MarchePub[];
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

function rowToBanner(row: any): BannerPub {
  return { id: row.id, actif: row.actif, ...row.data };
}

function rowToMarche(row: any): MarchePub {
  return { id: row.id, actif: row.actif, ...row.data };
}

export function PubProvider({ children }: { children: React.ReactNode }) {
  const [banners, setBanners] = useState<BannerPub[]>(DEFAULT_BANNERS);
  const [marchePubs, setMarchePubs] = useState<MarchePub[]>([]);

  useEffect(() => {
    supabase.from('pub_banners').select('*').order('created_at').then(({ data }) => {
      if (data && data.length > 0) setBanners(data.map(rowToBanner));
    });
    supabase.from('pub_marches').select('*').order('created_at').then(({ data }) => {
      if (data) setMarchePubs(data.map(rowToMarche));
    });
  }, []);

  const addBanner = useCallback(async (b: Omit<BannerPub, 'id'>) => {
    const id = genId();
    const { actif, ...data } = b;
    const { data: row } = await supabase.from('pub_banners').insert({ id, data, actif }).select().single();
    if (row) setBanners((prev) => [...prev, rowToBanner(row)]);
  }, []);

  const updateBanner = useCallback(async (b: BannerPub) => {
    const { id, actif, ...data } = b;
    await supabase.from('pub_banners').update({ data, actif }).eq('id', id);
    setBanners((prev) => prev.map((x) => x.id === id ? b : x));
  }, []);

  const deleteBanner = useCallback(async (id: string) => {
    await supabase.from('pub_banners').delete().eq('id', id);
    setBanners((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addMarchePub = useCallback(async (p: Omit<MarchePub, 'id'>) => {
    const id = genId();
    const { actif, ...data } = p;
    const { data: row } = await supabase.from('pub_marches').insert({ id, data, actif }).select().single();
    if (row) setMarchePubs((prev) => [...prev, rowToMarche(row)]);
  }, []);

  const updateMarchePub = useCallback(async (p: MarchePub) => {
    const { id, actif, ...data } = p;
    await supabase.from('pub_marches').update({ data, actif }).eq('id', id);
    setMarchePubs((prev) => prev.map((x) => x.id === id ? p : x));
  }, []);

  const deleteMarchePub = useCallback(async (id: string) => {
    await supabase.from('pub_marches').delete().eq('id', id);
    setMarchePubs((prev) => prev.filter((x) => x.id !== id));
  }, []);

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
