-- ============================================================================
-- AviConnect — Vérifications notifications
--
-- À COLLER DANS : navigateur → Supabase → SQL Editor → New query → Run
-- PAS dans PowerShell.
--
-- L'éditeur Supabase n'affiche que le résultat de la DERNIÈRE requête quand on
-- en lance plusieurs. Ici il n'y en a qu'une, avec les deux informations
-- réunies, pour éviter ce piège.
-- ============================================================================

-- Politiques RLS de `notifications` + qui possède un jeton push.
-- Ce qui compte : la colonne condition_with_check de la ligne INSERT.
--   - contient « user_id = auth.uid() » → un client ne peut écrire une
--     notification que pour lui-même ; les notifications de commande
--     n'atteignent jamais leur destinataire et devront passer par un trigger.
--   - vaut « true » ou plus large → l'écriture inter-utilisateurs est permise.

select
  'POLITIQUE' as bloc,
  polname as nom,
  case polcmd when 'r' then 'SELECT' when 'a' then 'INSERT'
              when 'w' then 'UPDATE' when 'd' then 'DELETE'
              else 'ALL' end as detail,
  coalesce(pg_get_expr(polwithcheck, polrelid), '—') as condition_with_check,
  coalesce(pg_get_expr(polqual, polrelid), '—') as condition_using
from pg_policy
where polrelid = 'public.notifications'::regclass

union all

select
  'JETON PUSH' as bloc,
  trim(coalesce(prenom, '') || ' ' || coalesce(nom, '')) as nom,
  role as detail,
  case when push_token is not null then 'OUI' else 'NON' end as condition_with_check,
  '—' as condition_using
from public.profiles

union all

select
  'TRIGGER' as bloc,
  tgname as nom,
  case tgenabled when 'O' then 'actif' else 'inactif' end as detail,
  '—', '—'
from pg_trigger
where not tgisinternal and tgrelid = 'public.messages'::regclass

order by bloc, nom;
