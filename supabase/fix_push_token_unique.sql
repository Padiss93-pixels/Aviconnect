-- ============================================================================
-- AviConnect — Un jeton push appartient à un seul compte
--
-- À COLLER DANS : navigateur → Supabase → SQL Editor → New query → Run
-- PAS dans PowerShell.
--
-- Constat (juillet 2026) : 3 profils portaient le même jeton
-- ExponentPushToken[...], parce que trois comptes s'étaient connectés sur le
-- même téléphone. Un jeton identifie un APPAREIL, pas un compte.
--
-- Deux problèmes :
--   1. Les notifications d'un compte partent vers un appareil qui appartient
--      peut-être à quelqu'un d'autre — le texte des messages s'affiche sur
--      l'écran de verrouillage d'un tiers.
--   2. Impossible de tester : 5 comptes sur 8 n'avaient aucun jeton.
--
-- La déconnexion libère désormais le jeton côté application (AuthContext), mais
-- ça ne suffit pas : si l'utilisateur ne se déconnecte pas et qu'un autre
-- compte se connecte, ou si l'app est simplement désinstallée, le jeton reste
-- accroché. La RLS interdisant à un client de modifier le profil d'autrui,
-- seul un trigger peut garantir l'unicité.
-- ============================================================================

-- ── 1. Remise à zéro de l'état actuel ───────────────────────────────────────
-- On efface tous les jetons. Chaque appareil réenregistrera le sien au
-- prochain lancement de l'application — c'est automatique, rien à faire de
-- plus. Plus fiable que de deviner quel compte utilise réellement le téléphone.

update public.profiles set push_token = null where push_token is not null;

-- ── 2. Le trigger qui maintient l'unicité ───────────────────────────────────
-- Dès qu'un jeton est enregistré sur un profil, il est retiré de tous les
-- autres. `security definer` est indispensable : la politique
-- profiles_update_own_or_admin empêcherait sinon de toucher les autres lignes.

create or replace function public.push_token_unique()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- La mise à jour ci-dessous redéclenche ce trigger, mais avec
  -- push_token = null : la condition WHEN du trigger l'arrête aussitôt.
  update public.profiles
  set push_token = null
  where push_token = new.push_token
    and id <> new.id;

  return null;
end;
$$;

drop trigger if exists on_push_token_set on public.profiles;
create trigger on_push_token_set
  after insert or update of push_token on public.profiles
  for each row
  when (new.push_token is not null)
  execute function public.push_token_unique();

-- ── 3. Vérification ─────────────────────────────────────────────────────────
-- Aucun jeton ne doit apparaître deux fois. Attendu : 0 ligne.
select push_token, count(*) as comptes
from public.profiles
where push_token is not null
group by push_token
having count(*) > 1;

-- État des jetons, après réouverture de l'app sur chaque appareil.
select trim(coalesce(prenom, '') || ' ' || coalesce(nom, '')) as compte,
       role,
       case when push_token is not null then 'OUI' else 'NON' end as a_un_jeton
from public.profiles
order by a_un_jeton desc, compte;
