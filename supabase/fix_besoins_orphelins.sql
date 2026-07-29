-- ============================================================================
-- AviConnect — Besoins orphelins et clé étrangère manquante
--
-- Constat (juillet 2026) : les 4 besoins en base pointaient tous vers
-- acheteur_id = 8b094a90-6fb0-47e3-b1f2-2ee5406708ed, alors qu'aucune ligne
-- `profiles` ne porte cet identifiant. Le compte a été supprimé, ses besoins
-- sont restés. Résultat : sur le site en ligne, cliquer sur l'auteur d'un
-- besoin affiche « Profil introuvable ».
--
-- Cause : `besoins.acheteur_id` n'a aucune contrainte de clé étrangère vers
-- `profiles`. Rien n'empêche donc de référencer un compte inexistant, et rien
-- ne nettoie les besoins quand un compte disparaît.
--
-- À exécuter dans : Dashboard Supabase → SQL Editor → Run
-- Exécuter les sections dans l'ordre, en lisant le résultat de la 1 avant de
-- lancer la 2.
-- ============================================================================

-- ── 1. Constat : quels besoins sont orphelins ? ─────────────────────────────
-- Lisez cette liste avant de supprimer quoi que ce soit. Si un besoin que vous
-- voulez garder apparaît ici, c'est son compte auteur qu'il faut recréer, pas
-- le besoin qu'il faut effacer.
select b.id, b.acheteur_nom, b.produit, b.qte, b.region, b.acheteur_id
from public.besoins b
left join public.profiles p on p.id = b.acheteur_id
where p.id is null
order by b.id;

-- Même contrôle sur les annonces, au cas où le trou soit plus large.
select a.id, a.titre, a.eleveur, a.eleveur_id
from public.annonces a
left join public.profiles p on p.id = a.eleveur_id
where a.eleveur_id is not null and p.id is null
order by a.id;

-- ── 2. Suppression des besoins orphelins ────────────────────────────────────
-- SUPPRESSION DÉFINITIVE. Ne lancez ceci qu'après avoir lu la section 1.
delete from public.besoins b
where not exists (
  select 1 from public.profiles p where p.id = b.acheteur_id
);

-- ── 3. La contrainte qui empêche que ça se reproduise ───────────────────────
-- `on delete cascade` : supprimer un compte supprime désormais ses besoins,
-- au lieu de laisser des lignes pointant dans le vide.
--
-- Cette commande échoue s'il reste des orphelins — c'est voulu, elle sert de
-- garde-fou : ne sautez pas la section 2.
alter table public.besoins
  drop constraint if exists besoins_acheteur_id_fkey;

alter table public.besoins
  add constraint besoins_acheteur_id_fkey
  foreign key (acheteur_id) references public.profiles (id) on delete cascade;

-- ── 4. Vérification ────────────────────────────────────────────────────────
-- Doit renvoyer 0 ligne.
select b.id, b.acheteur_nom
from public.besoins b
left join public.profiles p on p.id = b.acheteur_id
where p.id is null;

-- Et la contrainte doit apparaître ici.
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.besoins'::regclass and contype = 'f';
