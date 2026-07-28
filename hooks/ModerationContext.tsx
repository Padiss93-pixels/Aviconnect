import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from './AuthContext';

// Signalement de contenu et blocage entre utilisateurs.
// Exigences App Store 1.2 (contenu généré par les utilisateurs) : l'app doit
// permettre de signaler un contenu abusif ET de bloquer son auteur.
// Tables et politiques RLS : supabase/add_moderation.sql

export type ReportTargetType = 'annonce' | 'besoin' | 'profil' | 'message';

export type ReportMotif =
  | 'arnaque'
  | 'contenu_inapproprie'
  | 'fausse_annonce'
  | 'maltraitance_animale'
  | 'harcelement'
  | 'spam'
  | 'autre';

export const MOTIF_LABELS: Record<ReportMotif, string> = {
  arnaque: 'Arnaque ou tentative d’escroquerie',
  fausse_annonce: 'Annonce fausse ou trompeuse',
  contenu_inapproprie: 'Contenu inapproprié ou choquant',
  maltraitance_animale: 'Maltraitance animale',
  harcelement: 'Harcèlement ou insultes',
  spam: 'Spam ou publicité déguisée',
  autre: 'Autre motif',
};

type ReportInput = {
  targetType: ReportTargetType;
  targetId: string | number;
  targetLabel?: string;
  reportedUserId?: string;
  motif: ReportMotif;
  details?: string;
};

type ModerationContextType = {
  blockedIds: Set<string>;
  isBlocked: (userId?: string | null) => boolean;
  blockUser: (userId: string) => Promise<{ error?: string }>;
  unblockUser: (userId: string) => Promise<{ error?: string }>;
  reportContent: (input: ReportInput) => Promise<{ error?: string }>;
  refreshBlocks: () => Promise<void>;
};

const ModerationContext = createContext<ModerationContextType>({
  blockedIds: new Set(),
  isBlocked: () => false,
  blockUser: async () => ({}),
  unblockUser: async () => ({}),
  reportContent: async () => ({}),
  refreshBlocks: async () => {},
});

export function ModerationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  const refreshBlocks = useCallback(async () => {
    if (!user?.id) { setBlockedIds(new Set()); return; }
    const { data, error } = await supabase
      .from('user_blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id);
    if (error) {
      console.error('[AviConnect] fetch user_blocks error:', error.message);
      return;
    }
    setBlockedIds(new Set((data ?? []).map((r: any) => r.blocked_id as string)));
  }, [user?.id]);

  useEffect(() => { refreshBlocks(); }, [refreshBlocks]);

  const isBlocked = useCallback(
    (userId?: string | null) => !!userId && blockedIds.has(userId),
    [blockedIds]
  );

  const blockUser = useCallback(async (userId: string) => {
    if (!user?.id) return { error: 'Connectez-vous pour bloquer un utilisateur.' };
    if (userId === user.id) return { error: 'Vous ne pouvez pas vous bloquer vous-même.' };
    const { error } = await supabase
      .from('user_blocks')
      .upsert({ blocker_id: user.id, blocked_id: userId });
    if (error) return { error: error.message };
    setBlockedIds((prev) => new Set(prev).add(userId));
    return {};
  }, [user?.id]);

  const unblockUser = useCallback(async (userId: string) => {
    if (!user?.id) return { error: 'Connectez-vous pour gérer vos blocages.' };
    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', userId);
    if (error) return { error: error.message };
    setBlockedIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
    return {};
  }, [user?.id]);

  const reportContent = useCallback(async (input: ReportInput) => {
    if (!user?.id) return { error: 'Connectez-vous pour signaler un contenu.' };
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: input.targetType,
      target_id: String(input.targetId),
      target_label: input.targetLabel ?? null,
      reported_user_id: input.reportedUserId ?? null,
      motif: input.motif,
      details: input.details?.trim() || null,
    });
    // 23505 = doublon : ce contenu a déjà été signalé par cet utilisateur.
    if (error && (error as any).code === '23505') {
      return { error: 'Vous avez déjà signalé ce contenu. Notre équipe l’examine.' };
    }
    if (error) return { error: error.message };
    return {};
  }, [user?.id]);

  return (
    <ModerationContext.Provider
      value={{ blockedIds, isBlocked, blockUser, unblockUser, reportContent, refreshBlocks }}
    >
      {children}
    </ModerationContext.Provider>
  );
}

export function useModeration() { return useContext(ModerationContext); }
