import type { NotifType } from '@/hooks/AnnoncesContext';

// Destination d'une notification quand l'utilisateur appuie dessus.
// Source unique partagée par les trois surfaces : la liste in-app
// (app/notifications), la bannière web (sendPush) et la notification
// système Android/iOS (usePushNotifications). Sans cette table, une
// notification arrive mais reste inerte au tap.
export const NOTIF_ROUTES: Record<NotifType, string> = {
  nouvelle_commande:   '/commandes',
  commande_acceptee:   '/commandes',
  commande_refusee:    '/commandes',
  paiement_recu:       '/commandes',
  couvoir_inscription: '/admin/couvoirs',
  vet_inscription:     '/admin/veterinaires',
  boost_demande:       '/admin/boosts',
  abonnement_demande:  '/admin/boosts',
  signalement:         '/admin/moderation',
};

export function notifRoute(type?: string | null): string | undefined {
  if (!type) return undefined;
  return NOTIF_ROUTES[type as NotifType];
}
