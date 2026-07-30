// ============================================================================
// AviConnect — Envoi des notifications push (Expo)
//
// Déclenchée par un Database Webhook sur INSERT dans public.notifications
// (voir supabase/setup_push_webhook.sql). Elle couvre donc AUSSI les
// notifications créées côté serveur par les triggers PostgreSQL —
// notify_admins_on_report (signalements) et notify_admins_on_signup — que
// l'application cliente ne peut pas intercepter puisqu'elle n'en est pas
// l'auteur. C'était le trou : l'admin ne recevait aucun push pour un
// signalement, seulement une ligne dans sa liste in-app.
//
// Déploiement :
//   supabase functions deploy notify-push
// ============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Miroir de constants/notifRoutes.ts. La duplication est inévitable : cette
// fonction tourne sous Deno, hors du bundle de l'app. Toute route ajoutée
// là-bas doit être reportée ici, sinon le tap sur la notification retombe
// sur /notifications au lieu de l'écran de traitement.
const NOTIF_ROUTES: Record<string, string> = {
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

// Types déjà poussés par l'app elle-même, dans sendNotification
// (hooks/AnnoncesContext.tsx). Elle seule dispose de `otherUserId`, qui permet
// au tap d'ouvrir directement la conversation ; la table `notifications` ne
// stocke pas cette information, donc cette fonction ne saurait pas reconstruire
// le même lien. Les repousser ici enverrait la notification en double.
const SKIP_TYPES = new Set([
  'nouvelle_commande',
  'commande_acceptee',
  'commande_refusee',
  // Le chat pousse lui-même, avec un url /chat/<expéditeur> que cette fonction
  // ne saurait pas reconstruire : la ligne `notifications` ne stocke pas
  // l'identifiant de l'expéditeur.
  'nouveau_message',
]);

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: {
    id: number | string;
    user_id: string;
    type: string;
    title: string;
    body: string | null;
    order_id: number | null;
  } | null;
};

async function rest(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

Deno.serve(async (req) => {
  // On répond toujours 200 : une erreur ferait retenter le webhook en boucle,
  // et une notification push manquée ne doit jamais bloquer quoi que ce soit.
  const ok = (msg: string) => {
    console.log(`[notify-push] ${msg}`);
    return new Response(JSON.stringify({ ok: true, msg }), {
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const payload: WebhookPayload = await req.json();
    if (payload.type !== 'INSERT' || !payload.record) {
      return ok(`ignoré (type=${payload.type})`);
    }

    const { user_id, type, title, body, order_id } = payload.record;

    if (SKIP_TYPES.has(type)) return ok(`${type} déjà poussé par l'app`);

    const profileRes = await rest(
      `profiles?id=eq.${user_id}&select=push_token`,
    );
    if (!profileRes.ok) {
      return ok(`lecture profil impossible : ${await profileRes.text()}`);
    }
    const [profile] = await profileRes.json();
    const token: string | null = profile?.push_token ?? null;

    if (!token) return ok(`aucun push_token pour ${user_id}`);

    const expoRes = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to: token,
        title,
        body: body ?? '',
        sound: 'default',
        channelId: 'default',
        priority: 'high',
        data: {
          type,
          orderId: order_id ?? null,
          url: NOTIF_ROUTES[type] ?? '/notifications',
        },
      }),
    });

    const result = await expoRes.json();
    const ticket = result?.data;

    // Un appareil désinstallé renvoie DeviceNotRegistered. On purge le token,
    // sinon la table accumule des jetons morts et chaque notif refait un
    // aller-retour inutile vers Expo.
    if (ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered') {
      await rest(`profiles?id=eq.${user_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ push_token: null }),
      });
      return ok(`token expiré purgé pour ${user_id}`);
    }

    if (ticket?.status === 'error') {
      return ok(`Expo a refusé : ${JSON.stringify(ticket)}`);
    }

    return ok(`push envoyé à ${user_id} (${type})`);
  } catch (err) {
    return ok(`exception : ${err instanceof Error ? err.message : String(err)}`);
  }
});
