-- ============================================================================
-- AviConnect — Webhook push sur les notifications
--
-- Problème résolu : les notifications créées par un trigger PostgreSQL
-- (notify_admins_on_report pour les signalements, notify_admins_on_signup pour
-- les inscriptions couvoir/vétérinaire) n'existent que côté serveur. L'app
-- cliente n'en est pas l'auteur, donc elle ne pouvait envoyer aucun push :
-- l'admin ne voyait le signalement qu'en ouvrant l'app.
--
-- Ce webhook appelle la fonction supabase/functions/notify-push à chaque
-- INSERT dans public.notifications, quelle qu'en soit l'origine.
--
-- PRÉREQUIS : déployer la fonction d'abord.
--   supabase functions deploy notify-push
-- ============================================================================

-- ── Méthode recommandée : Dashboard ─────────────────────────────────────────
-- Database → Webhooks → Create a new hook
--   Name         : notifications_push
--   Table        : public.notifications
--   Events       : Insert
--   Type         : Supabase Edge Functions
--   Edge Function: notify-push
--   Method       : POST
--   Timeout      : 5000 ms
--
-- Le Dashboard injecte lui-même l'en-tête Authorization avec la clé service
-- role ; elle ne transite jamais en clair par vos fichiers. C'est la raison
-- de préférer cette voie à celle ci-dessous.

-- ── Méthode SQL (alternative) ───────────────────────────────────────────────
-- À n'utiliser que si vous versionnez l'infrastructure. Remplacez
-- <SERVICE_ROLE_KEY> par la clé service role du projet — et n'archivez PAS ce
-- fichier une fois la clé collée dedans.
--
-- La clé service role donne un accès total à la base en contournant toutes les
-- politiques RLS. Elle ne doit jamais se retrouver dans git ni dans le bundle
-- de l'app.

-- create extension if not exists pg_net with schema extensions;
--
-- drop trigger if exists on_notification_push on public.notifications;
-- create trigger on_notification_push
--   after insert on public.notifications
--   for each row
--   execute function supabase_functions.http_request(
--     'https://ctnmflsyueqtwvhcksqz.supabase.co/functions/v1/notify-push',
--     'POST',
--     '{"Content-Type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY>"}',
--     '{}',
--     '5000'
--   );

-- ── Vérification ────────────────────────────────────────────────────────────
-- 1. Connectez-vous sur mobile avec le compte admin (enregistre push_token).
-- 2. Depuis un autre compte, signalez une annonce.
-- 3. Le téléphone admin doit recevoir la notification, app fermée.
-- 4. Logs : Dashboard → Edge Functions → notify-push → Logs.
--
-- Contrôle que le compte admin a bien un jeton :
select id, email, role, (push_token is not null) as a_un_push_token
from public.profiles
where role = 'admin';
