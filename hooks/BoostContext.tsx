import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from './AuthContext';

export type BoostStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export type Boost = {
  id: number;
  annonceId: number;
  eleveurId: string;
  durationDays: number;
  amount: number;
  startDate?: string;
  endDate?: string;
  status: BoostStatus;
  paymentMethod?: string;
  paymentRef?: string;
  createdAt: string;
};

export type FeaturedCouvoir = {
  userId: string;
  prenom: string;
  nom: string;
  region?: string;
  phone?: string;
  role?: string;
  ferme?: string;
};

type BoostContextType = {
  myBoosts: Boost[];
  boostedAnnonceIds: Set<number>;
  featuredCouvoirs: FeaturedCouvoir[];
  hasActiveSubscription: boolean;
  requestBoost: (annonceId: number, durationDays: number, amount: number, paymentMethod: string, paymentRef: string) => Promise<'ok' | 'error'>;
  requestSubscription: (paymentMethod: string, paymentRef: string) => Promise<'ok' | 'error'>;
  refreshBoosts: () => Promise<void>;
};

const BoostContext = createContext<BoostContextType>({
  myBoosts: [], boostedAnnonceIds: new Set(), featuredCouvoirs: [],
  hasActiveSubscription: false,
  requestBoost: async () => 'error',
  requestSubscription: async () => 'error',
  refreshBoosts: async () => {},
});

function rowToBoost(r: any): Boost {
  return {
    id: r.id,
    annonceId: r.annonce_id,
    eleveurId: r.eleveur_id,
    durationDays: r.duration_days,
    amount: r.amount,
    startDate: r.start_date ?? undefined,
    endDate: r.end_date ?? undefined,
    status: r.status,
    paymentMethod: r.payment_method ?? undefined,
    paymentRef: r.payment_ref ?? undefined,
    createdAt: r.created_at,
  };
}

export function BoostProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [myBoosts, setMyBoosts] = useState<Boost[]>([]);
  const [boostedAnnonceIds, setBoostedAnnonceIds] = useState<Set<number>>(new Set());
  const [featuredCouvoirs, setFeaturedCouvoirs] = useState<FeaturedCouvoir[]>([]);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  const fetchPublicData = useCallback(async () => {
    // Boosts actifs (tous, pour le tri du marché)
    const { data: boostData } = await supabase
      .from('boosts')
      .select('annonce_id')
      .eq('status', 'active')
      .gt('end_date', new Date().toISOString());
    if (boostData) setBoostedAnnonceIds(new Set(boostData.map((b) => b.annonce_id)));

    // Abonnements actifs (couvoirs + vétérinaires) → profils partenaires en vedette
    const { data: subData } = await supabase
      .from('couvoir_subscriptions')
      .select('user_id')
      .eq('status', 'active')
      .gt('end_date', new Date().toISOString());
    if (subData && subData.length > 0) {
      const ids = subData.map((s) => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, prenom, nom, region, phone, role, ferme')
        .in('id', ids);
      if (profiles) {
        setFeaturedCouvoirs(profiles.map((p) => ({
          userId: p.id,
          prenom: p.prenom,
          nom: p.nom,
          region: p.region ?? undefined,
          phone: p.phone ?? undefined,
          role: p.role ?? undefined,
          ferme: p.ferme ?? undefined,
        })));
      }
    } else {
      setFeaturedCouvoirs([]);
    }
  }, []);

  const fetchMyData = useCallback(async () => {
    if (!user?.id) { setMyBoosts([]); setHasActiveSubscription(false); return; }

    const { data: boosts } = await supabase
      .from('boosts')
      .select('*')
      .eq('eleveur_id', user.id)
      .order('created_at', { ascending: false });
    if (boosts) setMyBoosts(boosts.map(rowToBoost));

    const { data: sub } = await supabase
      .from('couvoir_subscriptions')
      .select('status, end_date')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('end_date', new Date().toISOString())
      .limit(1)
      .maybeSingle();
    setHasActiveSubscription(!!sub);
  }, [user?.id]);

  const refreshBoosts = useCallback(async () => {
    await Promise.all([fetchPublicData(), fetchMyData()]);
  }, [fetchPublicData, fetchMyData]);

  useEffect(() => { fetchPublicData(); }, [fetchPublicData]);
  useEffect(() => { fetchMyData(); }, [fetchMyData]);

  // Temps réel : re-fetch quand un boost ou abonnement change de statut
  useEffect(() => {
    const sub = supabase
      .channel('boosts-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'boosts' }, () => {
        fetchPublicData();
        fetchMyData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'couvoir_subscriptions' }, () => {
        fetchPublicData();
        fetchMyData();
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchPublicData, fetchMyData]);

  const notifyAdmins = useCallback(async (type: string, title: string, body: string) => {
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');
    if (!admins || admins.length === 0) return;
    await supabase.from('notifications').insert(
      admins.map((a) => ({ user_id: a.id, type, title, body, read: false }))
    );
  }, []);

  const requestBoost = useCallback(async (
    annonceId: number,
    durationDays: number,
    amount: number,
    paymentMethod: string,
    paymentRef: string,
  ): Promise<'ok' | 'error'> => {
    if (!user?.id) return 'error';
    const { error } = await supabase.from('boosts').insert({
      annonce_id: annonceId,
      eleveur_id: user.id,
      duration_days: durationDays,
      amount,
      status: 'pending',
      payment_method: paymentMethod,
      payment_ref: paymentRef,
    });
    if (error) { console.error('[boost] insert error:', JSON.stringify(error)); return 'error'; }
    await notifyAdmins(
      'boost_demande',
      '⚡ Nouvelle demande de boost',
      `${user.prenom} demande un boost de ${durationDays} jours (${amount.toLocaleString()} F). Réf: ${paymentRef}`,
    );
    await fetchMyData();
    return 'ok';
  }, [user, fetchMyData, notifyAdmins]);

  const requestSubscription = useCallback(async (
    paymentMethod: string,
    paymentRef: string,
  ): Promise<'ok' | 'error'> => {
    if (!user?.id) return 'error';
    const { error } = await supabase.from('couvoir_subscriptions').insert({
      user_id: user.id,
      amount: 25000,
      status: 'pending',
      payment_method: paymentMethod,
      payment_ref: paymentRef,
    });
    if (error) { console.error('[sub] insert error:', JSON.stringify(error)); return 'error'; }
    await notifyAdmins(
      'abonnement_demande',
      '👑 Nouvelle demande d\'abonnement',
      `${user.prenom} demande un abonnement couvoir (25 000 F). Réf: ${paymentRef}`,
    );
    await fetchMyData();
    return 'ok';
  }, [user, fetchMyData, notifyAdmins]);

  return (
    <BoostContext.Provider value={{
      myBoosts, boostedAnnonceIds, featuredCouvoirs, hasActiveSubscription,
      requestBoost, requestSubscription, refreshBoosts,
    }}>
      {children}
    </BoostContext.Provider>
  );
}

export function useBoost() { return useContext(BoostContext); }
