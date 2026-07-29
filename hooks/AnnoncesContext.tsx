import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { LOTS, type Lot } from '@/constants/mockData';
import { notifRoute } from '@/constants/notifRoutes';
import { useAuthContext } from './AuthContext';
import { useModeration } from './ModerationContext';
import { supabase } from '@/lib/supabase';

// ── Notifs Supabase ──────────────────────────────────────────────────────────

export type NotifType =
  | 'nouvelle_commande'
  | 'commande_acceptee'
  | 'commande_refusee'
  | 'paiement_recu'
  | 'couvoir_inscription'
  | 'vet_inscription'
  | 'boost_demande'
  | 'abonnement_demande'
  | 'signalement';

export type Notification = {
  id: number;
  type: NotifType;
  title: string;
  body: string;
  date: string;
  read: boolean;
  orderId?: number;
};

const NOTIF_ICONS: Record<NotifType, string> = {
  nouvelle_commande: '🛒',
  commande_acceptee: '✅',
  commande_refusee: '❌',
  boost_demande: '⚡',
  abonnement_demande: '👑',
  paiement_recu: '💰',
  couvoir_inscription: '🏭',
  vet_inscription: '💉',
  signalement: '🚩',
};

async function sendPush(title: string, body: string, type?: NotifType) {
  if (Platform.OS !== 'web') return;
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') await Notification.requestPermission();
    if (Notification.permission === 'granted') {
      const notif = new Notification(title, { body, icon: '/icon.png' });
      // Sans ce handler la bannière du navigateur est inerte : l'utilisateur
      // la voit, clique, et rien ne se passe.
      notif.onclick = () => {
        window.focus();
        const route = notifRoute(type);
        router.push((route ?? '/notifications') as any);
        notif.close();
      };
    }
  } catch {}
}

// ── Annonces Supabase ────────────────────────────────────────────────────────

type AnnoncesContextType = {
  annonces: Lot[];
  userLots: Lot[];
  notifications: Notification[];
  unreadCount: number;
  addAnnonce: (lot: Omit<Lot, 'id'>) => Promise<void>;
  deleteAnnonce: (id: number) => Promise<void>;
  deleteAnnoncesByAuthor: (authorId: string) => Promise<void>;
  updateAnnonce: (lot: Lot) => Promise<void>;
  reduceStock: (lotId: number, qte: number, acheteur: string, orderId: number) => Promise<void>;
  adjustStock: (lotId: number, delta: number) => Promise<void>;
  sendNotification: (type: NotifType, title: string, body: string, orderId?: number, targetUserId?: string) => Promise<void>;
  markNotifsRead: () => Promise<void>;
  refreshAnnonces: () => Promise<void>;
};

const AnnoncesContext = createContext<AnnoncesContextType>({
  annonces: LOTS, userLots: [], notifications: [], unreadCount: 0,
  addAnnonce: async () => {}, deleteAnnonce: async () => {},
  deleteAnnoncesByAuthor: async () => {},
  updateAnnonce: async () => {}, reduceStock: async () => {}, adjustStock: async () => {},
  sendNotification: async () => {}, markNotifsRead: async () => {},
  refreshAnnonces: async () => {},
});

function rowToLot(row: any): Lot {
  return {
    id: row.id,
    eleveur: row.eleveur,
    eleveurId: row.eleveur_id,
    eleveurPhone: row.eleveur_phone ?? undefined,
    region: row.region,
    produit: row.produit,
    titre: row.titre,
    qte: row.qte,
    prix: row.prix,
    dispo: row.dispo,
    detail: row.detail,
    photos: row.photos ?? [],
    unite: row.unite ?? undefined,
    createdAt: row.created_at,
  };
}

export function AnnoncesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const { isBlocked } = useModeration();
  const [dbLots, setDbLots] = useState<Lot[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchAnnonces = useCallback(async () => {
    const { data, error } = await supabase
      .from('annonces')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('[AviConnect] fetch annonces error:', JSON.stringify(error));
    else console.log('[AviConnect] annonces chargées:', data?.length ?? 0);
    if (!error && data) setDbLots(data.map(rowToLot));
  }, []);

  // Chargement initial + abonnement temps réel stock + polling 30s
  useEffect(() => {
    fetchAnnonces();
    const interval = setInterval(fetchAnnonces, 30_000);
    const sub = supabase
      .channel('annonces-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'annonces' }, (payload) => {
        setDbLots((prev) => prev.map((l) => l.id === payload.new.id ? rowToLot(payload.new) : l));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'annonces' }, (payload) => {
        setDbLots((prev) => {
          if (prev.some((l) => l.id === payload.new.id)) return prev;
          return [rowToLot(payload.new), ...prev];
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'annonces' }, (payload) => {
        setDbLots((prev) => prev.filter((l) => l.id !== payload.old.id));
      })
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(sub); };
  }, [fetchAnnonces]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) { setNotifications([]); return; }
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) {
      setNotifications(data.map((r) => ({
        id: r.id,
        type: r.type as NotifType,
        title: r.title,
        body: r.body,
        date: r.created_at,
        read: r.read,
        orderId: r.order_id ?? undefined,
      })));
    }
  }, [user?.id]);

  // Chargement initial + abonnement temps réel notifications + polling 15s
  useEffect(() => {
    fetchNotifications();
    if (!user?.id) return;
    const interval = setInterval(fetchNotifications, 15_000);
    const sub = supabase
      .channel(`notifs-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const r = payload.new;
        const notif: Notification = {
          id: r.id,
          type: r.type as NotifType,
          title: r.title,
          body: r.body,
          date: r.created_at,
          read: r.read,
          orderId: r.order_id ?? undefined,
        };
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });
        sendPush(r.title, r.body, notif.type);
      })
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(sub); };
  }, [fetchNotifications, user?.id]);

  const addAnnonce = useCallback(async (lot: Omit<Lot, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('annonces').insert({
      eleveur_id: user.id,
      eleveur: lot.eleveur,
      eleveur_phone: lot.eleveurPhone ?? null,
      region: lot.region,
      produit: lot.produit,
      titre: lot.titre,
      qte: lot.qte,
      prix: lot.prix,
      dispo: lot.dispo,
      detail: lot.detail,
      photos: lot.photos ?? [],
      unite: lot.unite ?? null,
    }).select().single();
    if (!error && data) setDbLots((prev) => [rowToLot(data), ...prev]);
  }, [user]);

  const deleteAnnonce = useCallback(async (id: number) => {
    await supabase.from('annonces').delete().eq('id', id);
    setDbLots((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const deleteAnnoncesByAuthor = useCallback(async (authorId: string) => {
    await supabase.from('annonces').delete().eq('eleveur_id', authorId);
    setDbLots((prev) => prev.filter((l) => l.eleveurId !== authorId));
  }, []);

  const updateAnnonce = useCallback(async (lot: Lot) => {
    const { data, error } = await supabase.from('annonces').update({
      titre: lot.titre,
      qte: lot.qte,
      prix: lot.prix,
      dispo: lot.dispo,
      detail: lot.detail,
      photos: lot.photos ?? [],
      unite: lot.unite ?? null,
      region: lot.region,
      produit: lot.produit,
    }).eq('id', lot.id).select().single();
    if (!error && data) {
      setDbLots((prev) => prev.map((l) => l.id === lot.id ? rowToLot(data) : l));
    }
  }, []);

  const sendNotification = useCallback(async (
    type: NotifType,
    title: string,
    body: string,
    orderId?: number,
    targetUserId?: string,
  ) => {
    const recipientId = targetUserId;
    if (!recipientId || recipientId === user?.id) return;

    // Notif en base (in-app)
    const { error } = await supabase.from('notifications').insert({
      user_id: recipientId,
      type,
      title,
      body,
      read: false,
      order_id: orderId ?? null,
    });
    if (error) console.error('[notif] insert error:', JSON.stringify(error));

    // Push Expo (mobile)
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', recipientId)
      .single();

    if (profile?.push_token) {
      fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          to: profile.push_token,
          title,
          body,
          // `url` est lu par le listener de usePushNotifications pour amener
          // l'utilisateur sur l'écran qui permet de traiter la notification.
          data: { type, orderId: orderId ?? null, otherUserId: user?.id ?? null, url: notifRoute(type) ?? '/notifications' },
          sound: 'default',
          channelId: 'default',
        }),
      }).catch(() => {});
    }
  }, [user?.id]);

  const reduceStock = useCallback(async (lotId: number, qte: number, acheteur: string, orderId: number) => {
    const dbLot = dbLots.find((l) => l.id === lotId);
    const mockLot = LOTS.find((l) => l.id === lotId);
    const lot = dbLot || mockLot;

    if (dbLot) {
      await supabase.rpc('reduce_annonce_stock', { lot_id: lotId, qty: qte });
      const newQte = Math.max(0, dbLot.qte - qte);
      setDbLots((prev) => prev.map((l) => l.id === lotId ? { ...l, qte: newQte } : l));
    }

    if (lot) {
      await sendNotification(
        'nouvelle_commande',
        `${NOTIF_ICONS.nouvelle_commande} Nouvelle commande !`,
        `${acheteur} a commandé ${qte} unités de "${lot.titre}". Stock restant : ${Math.max(0, lot.qte - qte)}.`,
        orderId,
        lot.eleveurId,
      );
    }
  }, [dbLots, sendNotification, user?.id]);

  const adjustStock = useCallback(async (lotId: number, delta: number) => {
    const lot = dbLots.find((l) => l.id === lotId);
    if (!lot) return;
    const newQte = Math.max(0, lot.qte + delta);
    await supabase.from('annonces').update({ qte: newQte }).eq('id', lotId);
    setDbLots((prev) => prev.map((l) => l.id === lotId ? { ...l, qte: newQte } : l));
  }, [dbLots]);

  const markNotifsRead = useCallback(async () => {
    if (!user?.id) return;
    await supabase.from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Annonces Supabase en priorité + mocks (sans doublon d'id) — stock > 0 uniquement.
  // Les annonces des vendeurs bloqués par l'utilisateur sont masquées (App Store 1.2).
  const dbLotIds = new Set(dbLots.map((l) => l.id));
  const annonces = [...dbLots, ...LOTS.filter((l) => !dbLotIds.has(l.id))]
    .filter((l) => l.qte > 0)
    .filter((l) => !isBlocked(l.eleveurId));
  const userLots = user ? dbLots.filter((l) => l.eleveurId === user.id) : [];

  return (
    <AnnoncesContext.Provider value={{
      annonces, userLots, notifications, unreadCount,
      addAnnonce, deleteAnnonce, deleteAnnoncesByAuthor, updateAnnonce,
      reduceStock, adjustStock, sendNotification, markNotifsRead,
      refreshAnnonces: fetchAnnonces,
    }}>
      {children}
    </AnnoncesContext.Provider>
  );
}

export function useAnnonces() { return useContext(AnnoncesContext); }
