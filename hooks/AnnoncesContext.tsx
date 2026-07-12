import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { LOTS, type Lot } from '@/constants/mockData';
import { useAuthContext } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOTS_KEY = '@aviconnect_user_lots';

// Clé de notifs propre à chaque utilisateur
function notifKey(userId: string) {
  return `@aviconnect_notifs_${userId}`;
}

const ADMIN_NOTIF_KEY = '@aviconnect_notifs_admin';

export type NotifType =
  | 'nouvelle_commande'
  | 'commande_acceptee'
  | 'commande_refusee'
  | 'paiement_recu'
  | 'couvoir_inscription'
  | 'vet_inscription';

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
  paiement_recu: '💰',
  couvoir_inscription: '🏭',
  vet_inscription: '💉',
};

async function sendPush(title: string, body: string) {
  if (Platform.OS !== 'web') return;
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') await Notification.requestPermission();
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon.png' });
    }
  } catch {}
}

async function readStorage(): Promise<Lot[]> {
  try {
    const raw = Platform.OS === 'web'
      ? localStorage.getItem(LOTS_KEY)
      : await AsyncStorage.getItem(LOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function writeStorage(lots: Lot[]): Promise<void> {
  try {
    const json = JSON.stringify(lots);
    if (Platform.OS === 'web') localStorage.setItem(LOTS_KEY, json);
    else await AsyncStorage.setItem(LOTS_KEY, json);
  } catch {}
}

async function readNotifsForUser(userId: string, isAdmin = false): Promise<Notification[]> {
  try {
    const key = notifKey(userId);
    const raw = Platform.OS === 'web'
      ? localStorage.getItem(key)
      : await AsyncStorage.getItem(key);
    const userNotifs: Notification[] = raw ? JSON.parse(raw) : [];

    if (!isAdmin) return userNotifs;

    // Pour l'admin : fusionner avec la clé fixe admin
    const adminRaw = Platform.OS === 'web'
      ? localStorage.getItem(ADMIN_NOTIF_KEY)
      : await AsyncStorage.getItem(ADMIN_NOTIF_KEY);
    const adminNotifs: Notification[] = adminRaw ? JSON.parse(adminRaw) : [];

    // Dédupliquer par id, fusionner et trier par date desc
    const allById = new Map<number, Notification>();
    for (const n of [...userNotifs, ...adminNotifs]) allById.set(n.id, n);
    const merged = Array.from(allById.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    // Resynchroniser dans la clé utilisateur pour les futures lectures
    const json = JSON.stringify(merged);
    if (Platform.OS === 'web') localStorage.setItem(key, json);
    else await AsyncStorage.setItem(key, json);
    // Vider la clé fixe admin (déjà migré)
    if (Platform.OS === 'web') localStorage.removeItem(ADMIN_NOTIF_KEY);
    else await AsyncStorage.removeItem(ADMIN_NOTIF_KEY);
    return merged;
  } catch { return []; }
}

async function writeNotifsForUser(userId: string, notifs: Notification[]): Promise<void> {
  try {
    const key = notifKey(userId);
    const json = JSON.stringify(notifs);
    if (Platform.OS === 'web') localStorage.setItem(key, json);
    else await AsyncStorage.setItem(key, json);
  } catch {}
}

type AnnoncesContextType = {
  annonces: Lot[];
  userLots: Lot[];
  notifications: Notification[];
  unreadCount: number;
  addAnnonce: (lot: Lot) => Promise<void>;
  deleteAnnonce: (id: number) => Promise<void>;
  deleteAnnoncesByAuthor: (author: string) => Promise<void>;
  updateAnnonce: (lot: Lot) => Promise<void>;
  reduceStock: (lotId: number, qte: number, acheteur: string, orderId: number) => Promise<void>;
  sendNotification: (type: NotifType, title: string, body: string, orderId?: number, targetUserId?: string) => Promise<void>;
  markNotifsRead: () => Promise<void>;
};

const AnnoncesContext = createContext<AnnoncesContextType>({
  annonces: LOTS, userLots: [], notifications: [], unreadCount: 0,
  addAnnonce: async () => {}, deleteAnnonce: async () => {},
  deleteAnnoncesByAuthor: async () => {},
  updateAnnonce: async () => {}, reduceStock: async () => {},
  sendNotification: async () => {}, markNotifsRead: async () => {},
});

export function AnnoncesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [userLots, setUserLots] = useState<Lot[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Charger les annonces au montage
  useEffect(() => {
    readStorage().then(setUserLots);
  }, []);

  // Recharger les notifs à chaque changement d'utilisateur connecté
  useEffect(() => {
    if (user?.id) {
      readNotifsForUser(user.id, user.role === 'admin').then(setNotifications);
    } else {
      setNotifications([]);
    }
  }, [user?.id]);

  const addAnnonce = useCallback(async (lot: Lot) => {
    const updated = [lot, ...userLots];
    setUserLots(updated);
    await writeStorage(updated);
  }, [userLots]);

  const deleteAnnonce = useCallback(async (id: number) => {
    const updated = userLots.filter((l) => l.id !== id);
    setUserLots(updated);
    await writeStorage(updated);
  }, [userLots]);

  // Supprime toutes les annonces d'un auteur (utilisé à la suppression de compte)
  const deleteAnnoncesByAuthor = useCallback(async (author: string) => {
    const updated = userLots.filter((l) => l.eleveur !== author);
    setUserLots(updated);
    await writeStorage(updated);
  }, [userLots]);

  const updateAnnonce = useCallback(async (lot: Lot) => {
    const updated = userLots.map((l) => l.id === lot.id ? lot : l);
    setUserLots(updated);
    await writeStorage(updated);
  }, [userLots]);

  // Envoie une notification au destinataire ciblé (targetUserId)
  // Si targetUserId non fourni → on écrit pour l'utilisateur courant
  const sendNotification = useCallback(async (
    type: NotifType,
    title: string,
    body: string,
    orderId?: number,
    targetUserId?: string,
  ) => {
    const recipientId = targetUserId || user?.id;
    if (!recipientId) return; // pas de destinataire identifiable, on ignore

    const notif: Notification = {
      id: Date.now(),
      type,
      title,
      body,
      date: new Date().toISOString(),
      read: false,
      orderId,
    };

    // Lire les notifs existantes du destinataire, ajouter la nouvelle
    const existing = await readNotifsForUser(recipientId);
    const updated = [notif, ...existing];
    await writeNotifsForUser(recipientId, updated);

    // Si le destinataire est l'utilisateur actuellement connecté, mettre à jour l'état React
    if (recipientId === user?.id) {
      setNotifications(updated);
    }

    // Push uniquement si le destinataire est l'utilisateur courant (on ne peut pas push pour quelqu'un d'autre)
    if (recipientId === user?.id) {
      await sendPush(title, body);
    }
  }, [user?.id]);

  const reduceStock = useCallback(async (lotId: number, qte: number, acheteur: string, orderId: number) => {
    // Cherche d'abord dans userLots, sinon dans les mocks
    const existsInUser = userLots.some((l) => l.id === lotId);
    const allLots = [...userLots, ...LOTS];
    const lot = allLots.find((l) => l.id === lotId);

    let updated: typeof userLots;
    if (existsInUser) {
      updated = userLots.map((l) =>
        l.id === lotId ? { ...l, qte: Math.max(0, l.qte - qte) } : l
      );
    } else if (lot) {
      // Lot mock : on l'insère dans userLots avec le stock réduit pour persister la modification
      const mockReduced = { ...lot, qte: Math.max(0, lot.qte - qte) };
      updated = [mockReduced, ...userLots];
    } else {
      updated = userLots;
    }

    setUserLots(updated);
    await writeStorage(updated);

    if (lot) {
      await sendNotification(
        'nouvelle_commande',
        `${NOTIF_ICONS.nouvelle_commande} Nouvelle commande !`,
        `${acheteur} a commandé ${qte} unités de "${lot.titre}". Stock restant : ${Math.max(0, lot.qte - qte)}.`,
        orderId,
        lot.eleveurId, // undefined pour les mocks sans eleveurId → notification ignorée (pas de vendeur connecté)
      );
    }
  }, [userLots, sendNotification]);

  const markNotifsRead = useCallback(async () => {
    if (!user?.id) return;
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    await writeNotifsForUser(user.id, updated);
  }, [notifications, user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  // userLots peut contenir des overrides de lots mock (stock réduit) — on déduplique par id, userLots a la priorité
  const userLotIds = new Set(userLots.map((l) => l.id));
  const annonces = [...userLots, ...LOTS.filter((l) => !userLotIds.has(l.id))];

  return (
    <AnnoncesContext.Provider value={{
      annonces, userLots, notifications, unreadCount,
      addAnnonce, deleteAnnonce, deleteAnnoncesByAuthor, updateAnnonce, reduceStock, sendNotification, markNotifsRead,
    }}>
      {children}
    </AnnoncesContext.Provider>
  );
}

export function useAnnonces() { return useContext(AnnoncesContext); }
