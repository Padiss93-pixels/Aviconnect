import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from './AuthContext';

// Compteur affiché sur l'onglet Messages.
//
// On compte le nombre de PERSONNES qui ont écrit sans réponse lue, pas le
// nombre de messages : dix messages du même éleveur affichent 1, pas 10. C'est
// ce que la pastille doit dire — combien de conversations demandent votre
// attention.
//
// Les messages ne créent volontairement aucune ligne dans `notifications` : ils
// n'ont pas à encombrer la cloche, cette pastille suffit à l'intérieur de
// l'application. La notification système, elle, part toujours (voir
// notifyReceiver dans app/chat/[id].tsx) pour prévenir quand l'app est fermée.

type UnreadMessagesContextType = {
  /** Nombre d'expéditeurs distincts ayant au moins un message non lu. */
  unreadSenders: number;
  refresh: () => Promise<void>;
};

const UnreadMessagesContext = createContext<UnreadMessagesContextType>({
  unreadSenders: 0,
  refresh: async () => {},
});

export function UnreadMessagesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [unreadSenders, setUnreadSenders] = useState(0);

  const refresh = useCallback(async () => {
    if (!user?.id) { setUnreadSenders(0); return; }
    const { data, error } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', user.id)
      .eq('read', false);
    if (error) {
      console.error('[AviConnect] compteur messages non lus:', error.message);
      return;
    }
    setUnreadSenders(new Set((data ?? []).map((m: any) => m.sender_id)).size);
  }, [user?.id]);

  useEffect(() => {
    refresh();
    if (!user?.id) return;

    // Polling de secours, au cas où le temps réel décroche.
    const interval = setInterval(refresh, 15_000);

    const sub = supabase
      .channel(`unread-messages-${user.id}`)
      // Nouveau message reçu : le compteur monte.
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, refresh)
      // Message marqué comme lu à l'ouverture de la conversation : il descend.
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, refresh)
      .subscribe();

    return () => { clearInterval(interval); supabase.removeChannel(sub); };
  }, [refresh, user?.id]);

  return (
    <UnreadMessagesContext.Provider value={{ unreadSenders, refresh }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
}

export function useUnreadMessages() { return useContext(UnreadMessagesContext); }
