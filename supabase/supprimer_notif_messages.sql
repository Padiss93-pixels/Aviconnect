-- ============================================================================
-- AviConnect — Retirer la notification in-app des messages
--
-- À COLLER DANS : navigateur → Supabase → SQL Editor → New query → Run
-- PAS dans PowerShell.
--
-- Annule add_notif_messages.sql, à la demande : un message reçu ne doit pas
-- encombrer la cloche ni la liste /notifications. À l'intérieur de
-- l'application, la pastille sur l'onglet Messages suffit — elle affiche le
-- nombre de PERSONNES qui ont écrit sans réponse lue.
--
-- Ce qui reste en place, volontairement :
--   - la notification système (push Expo), envoyée par notifyReceiver dans
--     app/chat/[id].tsx : c'est elle qui prévient quand l'app est fermée ;
--   - le compteur de l'onglet, calculé directement depuis la table `messages`
--     par hooks/UnreadMessagesContext.tsx, sans passer par `notifications`.
-- ============================================================================

drop trigger if exists on_message_created_notify on public.messages;
drop function if exists public.notify_on_message();

-- ── Nettoyage des lignes déjà créées ────────────────────────────────────────
-- Les notifications de type 'nouveau_message' insérées depuis l'installation du
-- trigger n'ont plus de raison d'être dans la cloche.
delete from public.notifications where type = 'nouveau_message';

-- ── Vérification ────────────────────────────────────────────────────────────
-- Le trigger ne doit plus apparaître (la liste peut être vide).
select tgname as trigger, tgenabled as actif
from pg_trigger
where not tgisinternal and tgrelid = 'public.messages'::regclass;

-- Doit renvoyer 0.
select count(*) as notifs_message_restantes
from public.notifications
where type = 'nouveau_message';
