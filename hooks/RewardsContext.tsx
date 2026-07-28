// Système de récompenses façon Duolingo — XP, niveaux, série quotidienne, badges, défis du jour.
// Persistance : Supabase (source principale) + localStorage/AsyncStorage (cache local)
import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from './AuthContext';
import { supabase } from '@/lib/supabase';

// ── Stockage (même pattern que useAuth) ─────────────────────────────────────
async function storage(op: 'get' | 'set', key: string, value?: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (op === 'get') return localStorage.getItem(key);
      localStorage.setItem(key, value!);
    } else {
      if (op === 'get') return await AsyncStorage.getItem(key);
      await AsyncStorage.setItem(key, value!);
    }
  } catch {}
  return null;
}

// ── Actions XP ──────────────────────────────────────────────────────────────
export type XpAction = 'daily' | 'publish' | 'order' | 'besoin';
export const XP_VALUES: Record<XpAction, number> = {
  daily: 10,     // connexion du jour
  publish: 25,   // publier une annonce
  order: 40,     // passer une commande
  besoin: 20,    // publier un besoin
};

// ── Défis du jour ───────────────────────────────────────────────────────────
export type QuestId = 'visite_marche' | 'consulte_annonce' | 'envoie_message';
export const QUESTS: { id: QuestId; label: string; xp: number }[] = [
  { id: 'visite_marche', label: 'Explorer le marché', xp: 10 },
  { id: 'consulte_annonce', label: 'Consulter une annonce', xp: 10 },
  { id: 'envoie_message', label: 'Envoyer un message', xp: 15 },
];

// ── Niveaux avicoles ────────────────────────────────────────────────────────
export type Level = { name: string; emoji: string; minXp: number };
export const LEVELS: Level[] = [
  { name: 'Œuf', emoji: '🥚', minXp: 0 },
  { name: 'Poussin', emoji: '🐣', minXp: 80 },
  { name: 'Poulette', emoji: '🐤', minXp: 200 },
  { name: 'Poule', emoji: '🐔', minXp: 400 },
  { name: 'Coq', emoji: '🐓', minXp: 700 },
  { name: 'Coq royal', emoji: '👑', minXp: 1100 },
  { name: 'Légende de la basse-cour', emoji: '⭐', minXp: 1600 },
];

export function getLevel(xp: number): { level: Level; index: number; next: Level | null; progress: number } {
  let index = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) { index = i; break; }
  }
  const level = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  const progress = next ? (xp - level.minXp) / (next.minXp - level.minXp) : 1;
  return { level, index, next, progress };
}

// ── Badges ──────────────────────────────────────────────────────────────────
export type BadgeDef = {
  id: string;
  label: string;
  desc: string;
  emoji: string;
  check: (s: RewardsData) => boolean;
};
export const BADGES: BadgeDef[] = [
  { id: 'premiere_annonce', label: 'Première annonce', desc: 'Publier ta première annonce', emoji: '📣', check: (s) => s.counters.annonces >= 1 },
  { id: 'marchand_actif', label: 'Marchand actif', desc: 'Publier 5 annonces', emoji: '🏪', check: (s) => s.counters.annonces >= 5 },
  { id: 'premiere_commande', label: 'Premier achat', desc: 'Passer ta première commande', emoji: '🛒', check: (s) => s.counters.commandes >= 1 },
  { id: 'bavard', label: 'Bavard', desc: 'Envoyer ton premier message', emoji: '💬', check: (s) => s.counters.messages >= 1 },
  { id: 'serie_3', label: 'Bien parti', desc: '3 jours de série', emoji: '🔥', check: (s) => s.bestStreak >= 3 },
  { id: 'serie_7', label: 'Semaine parfaite', desc: '7 jours de série', emoji: '⚡', check: (s) => s.bestStreak >= 7 },
  { id: 'serie_30', label: 'Mois de feu', desc: '30 jours de série', emoji: '🏆', check: (s) => s.bestStreak >= 30 },
  { id: 'niveau_coq', label: 'Coq du village', desc: 'Atteindre le niveau Coq', emoji: '🐓', check: (s) => getLevel(s.xp).index >= 4 },
];
const BADGE_XP = 20;

// ── Données persistées ──────────────────────────────────────────────────────
export type RewardsData = {
  xp: number;
  streak: number;
  bestStreak: number;
  lastActiveDay: string; // 'YYYY-MM-DD'
  badges: string[];
  counters: { annonces: number; commandes: number; messages: number };
  questDay: string;
  questsDone: QuestId[];
};

const EMPTY: RewardsData = {
  xp: 0, streak: 0, bestStreak: 0, lastActiveDay: '',
  badges: [], counters: { annonces: 0, commandes: 0, messages: 0 },
  questDay: '', questsDone: [],
};

function dayString(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const j = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${j}`;
}

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayString(d);
}

// ── Toast ───────────────────────────────────────────────────────────────────
export type RewardToast = {
  key: number;
  kind: 'xp' | 'badge' | 'level' | 'streak';
  title: string;
  subtitle?: string;
  emoji?: string;
};

type RewardsContextType = {
  data: RewardsData;
  ready: boolean;
  toast: RewardToast | null;
  award: (action: XpAction) => Promise<void>;
  completeQuest: (id: QuestId) => Promise<void>;
  questsDoneToday: QuestId[];
};

const RewardsContext = createContext<RewardsContextType>({
  data: EMPTY, ready: false, toast: null,
  award: async () => {}, completeQuest: async () => {},
  questsDoneToday: [],
});

export function RewardsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [data, setData] = useState<RewardsData>(EMPTY);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<RewardToast | null>(null);

  // File d'attente de toasts affichés l'un après l'autre
  const queueRef = useRef<RewardToast[]>([]);
  const showingRef = useRef(false);
  const dataRef = useRef<RewardsData>(EMPTY);
  dataRef.current = data;
  const readyRef = useRef(false);
  readyRef.current = ready;

  const pushToast = useCallback((t: Omit<RewardToast, 'key'>) => {
    queueRef.current.push({ ...t, key: Date.now() + Math.random() });
    if (showingRef.current) return;
    const next = () => {
      const item = queueRef.current.shift();
      if (!item) { showingRef.current = false; setToast(null); return; }
      showingRef.current = true;
      setToast(item);
      setTimeout(next, 2400);
    };
    next();
  }, []);

  const persist = useCallback(async (d: RewardsData) => {
    if (!user) return;
    setData(d);
    const json = JSON.stringify(d);
    // Sauvegarde locale (rapide)
    await storage('set', `@aviconnect_rewards_${user.id}`, json);
    // Sauvegarde Supabase (persistante cross-device)
    supabase.from('profiles').update({ rewards: d }).eq('id', user.id).then(() => {});
  }, [user]);

  // Applique un gain d'XP + vérifie badges et passage de niveau
  const applyGain = useCallback((d: RewardsData, gained: number): RewardsData => {
    const before = getLevel(d.xp).index;
    let next = { ...d, xp: d.xp + gained };

    // Badges nouvellement débloqués (bonus +20 XP chacun)
    for (const b of BADGES) {
      if (!next.badges.includes(b.id) && b.check(next)) {
        next = { ...next, badges: [...next.badges, b.id], xp: next.xp + BADGE_XP };
        pushToast({ kind: 'badge', title: `Badge débloqué : ${b.label}`, subtitle: `+${BADGE_XP} XP`, emoji: b.emoji });
      }
    }

    const after = getLevel(next.xp);
    if (after.index > before) {
      pushToast({ kind: 'level', title: `Niveau ${after.index + 1} — ${after.level.name} !`, emoji: after.level.emoji });
    }
    return next;
  }, [pushToast]);

  // Chargement + série quotidienne à la connexion / ouverture
  useEffect(() => {
    let cancelled = false;
    if (!user) { setReady(false); return; }

    (async () => {
      // 1. Essai Supabase (source principale, cross-device)
      let d: RewardsData | null = null;
      const { data: profile } = await supabase
        .from('profiles')
        .select('rewards')
        .eq('id', user.id)
        .single();
      if (!cancelled && profile?.rewards) {
        d = { ...EMPTY, ...(profile.rewards as RewardsData) };
      }

      // 2. Fallback localStorage/AsyncStorage si Supabase vide
      if (!d) {
        const raw = await storage('get', `@aviconnect_rewards_${user.id}`);
        if (!cancelled && raw) d = { ...EMPTY, ...JSON.parse(raw) };
      }

      if (!d) d = { ...EMPTY };
      if (cancelled) return;

      const today = dayString();
      if (d.lastActiveDay !== today) {
        const continues = d.lastActiveDay === yesterdayString();
        const streak = continues ? d.streak + 1 : 1;
        d = {
          ...d,
          streak,
          bestStreak: Math.max(streak, d.bestStreak),
          lastActiveDay: today,
          questDay: today,
          questsDone: [],
        };
        d = applyGain(d, XP_VALUES.daily);
        pushToast({
          kind: 'streak',
          title: streak > 1 ? `Série de ${streak} jours !` : 'Bienvenue !',
          subtitle: `+${XP_VALUES.daily} XP de connexion`,
          emoji: '🔥',
        });
      } else if (d.questDay !== today) {
        d = { ...d, questDay: today, questsDone: [] };
      }

      setData(d);
      setReady(true);
      const json = JSON.stringify(d);
      await storage('set', `@aviconnect_rewards_${user.id}`, json);
      supabase.from('profiles').update({ rewards: d }).eq('id', user.id).then(() => {});
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  const award = useCallback(async (action: XpAction) => {
    if (!user || !readyRef.current) return;
    let d = { ...dataRef.current };
    if (action === 'publish') d.counters = { ...d.counters, annonces: d.counters.annonces + 1 };
    if (action === 'order') d.counters = { ...d.counters, commandes: d.counters.commandes + 1 };
    if (action === 'besoin') d.counters = { ...d.counters, annonces: d.counters.annonces + 1 };

    const labels: Record<XpAction, string> = {
      daily: 'Connexion du jour', publish: 'Annonce publiée',
      order: 'Commande passée', besoin: 'Besoin publié',
    };
    pushToast({ kind: 'xp', title: `+${XP_VALUES[action]} XP`, subtitle: labels[action], emoji: '✨' });
    d = applyGain(d, XP_VALUES[action]);
    await persist(d);
  }, [user, applyGain, persist, pushToast]);

  const completeQuest = useCallback(async (id: QuestId) => {
    if (!user || !readyRef.current) return;
    const today = dayString();
    let d = { ...dataRef.current };
    if (d.questDay === today && d.questsDone.includes(id)) return;
    if (d.questDay !== today) { d.questDay = today; d.questsDone = []; }

    const quest = QUESTS.find((q) => q.id === id)!;
    d.questsDone = [...d.questsDone, id];
    if (id === 'envoie_message') d.counters = { ...d.counters, messages: d.counters.messages + 1 };

    pushToast({ kind: 'xp', title: `Défi accompli : ${quest.label}`, subtitle: `+${quest.xp} XP`, emoji: '🎯' });
    d = applyGain(d, quest.xp);
    await persist(d);
  }, [user, applyGain, persist, pushToast]);

  const questsDoneToday = data.questDay === dayString() ? data.questsDone : [];

  return (
    <RewardsContext.Provider value={{ data, ready, toast, award, completeQuest, questsDoneToday }}>
      {children}
    </RewardsContext.Provider>
  );
}

export function useRewards() {
  return useContext(RewardsContext);
}
