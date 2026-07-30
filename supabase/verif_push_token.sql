-- ============================================================================
-- AviConnect — Vérification des jetons push (lecture seule)
--
-- À COLLER DANS : navigateur → Supabase → SQL Editor → New query → Run
--
-- Ce fichier ne modifie RIEN. Il est séparé de fix_push_token_unique.sql
-- exprès : celui-là commence par effacer tous les jetons, le relancer après un
-- réenregistrement les remettrait à zéro.
--
-- À lancer après avoir rouvert l'application sur chaque appareil.
-- Attendu : autant de OUI que d'appareils réellement utilisés, et aucun
-- jeton en double.
-- ============================================================================

select
  trim(coalesce(prenom, '') || ' ' || coalesce(nom, '')) as compte,
  role,
  case when push_token is not null then 'OUI' else 'NON' end as a_un_jeton,
  -- Un même jeton sur deux comptes signifie que le trigger d'unicité n'a pas
  -- fonctionné : à signaler.
  case
    when push_token is null then '—'
    when count(*) over (partition by push_token) > 1 then 'DOUBLON !'
    else 'unique'
  end as controle
from public.profiles
order by a_un_jeton desc, compte;
