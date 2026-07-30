-- ============================================================================
-- AviConnect — Notification à la réception d'un message
--
-- Problème résolu : un message reçu alors qu'on se trouvait sur l'accueil, les
-- marchés ou le profil ne laissait aucune trace. Ni compteur sur la cloche, ni
-- entrée dans /notifications : il fallait ouvrir la conversation pour le
-- découvrir.
--
-- Cause : l'écran de chat envoyait bien un push Expo, mais n'écrivait aucune
-- ligne dans `notifications` — et il ne pouvait pas le faire. La table n'a
-- aucune politique RLS d'insertion (schema.sql ne définit que select, update et
-- delete), donc un client ne peut écrire une notification pour personne, pas
-- même pour lui-même.
--
-- Solution : un trigger `security definer`, qui contourne RLS comme le fait
-- déjà notify_admins_on_report pour les signalements.
--
-- À exécuter dans : Dashboard Supabase → SQL Editor → Run
-- Idempotent : peut être rejoué sans danger.
-- ============================================================================

create or replace function public.notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  expediteur text;
begin
  -- Encapsulé dans un bloc d'exception : le trigger tourne dans la transaction
  -- d'envoi du message. Sans ça, un problème de notification ferait perdre le
  -- message lui-même — leçon tirée de fix_notify_report.sql.
  begin
    select coalesce(nullif(trim(p.prenom || ' ' || p.nom), ''), 'Un utilisateur')
      into expediteur
    from public.profiles p
    where p.id = new.sender_id;

    insert into public.notifications (user_id, type, title, body, read)
    values (
      new.receiver_id,
      'nouveau_message',
      '💬 ' || coalesce(expediteur, 'Un utilisateur'),
      -- La colonne du corps du message s'appelle `text` (cf. app/chat/[id].tsx).
      left(new.text, 140),
      false
    );
  exception when others then
    raise warning 'notification impossible pour le message % : %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_message_created_notify on public.messages;
create trigger on_message_created_notify
  after insert on public.messages
  for each row execute function public.notify_on_message();

-- ── Vérification ────────────────────────────────────────────────────────────
-- 1. Le trigger doit apparaître, actif.
select tgname as trigger, tgenabled as actif
from pg_trigger
where not tgisinternal and tgrelid = 'public.messages'::regclass;

-- 2. Contrôle du diagnostic à l'origine de ce fichier : `notifications` n'a
--    bien aucune politique d'insertion. Si une ligne « INSERT » apparaît ici,
--    dites-le — cela change l'analyse.
select polname as politique,
       case polcmd when 'r' then 'SELECT' when 'a' then 'INSERT'
                   when 'w' then 'UPDATE' when 'd' then 'DELETE'
                   else 'ALL' end as operation
from pg_policy
where polrelid = 'public.notifications'::regclass
order by operation;

-- 3. Qui a un jeton push ? Un compte sans jeton ne recevra jamais de
--    notification système, app fermée. C'est la piste restante si les push
--    n'arrivent toujours pas après ce correctif.
select prenom, nom, role, (push_token is not null) as a_un_push_token
from public.profiles
order by a_un_push_token desc, nom;
