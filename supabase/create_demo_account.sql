-- ============================================================================
-- AviConnect — Compte de démonstration pour la review Apple et Google
--
-- PRÉALABLE OBLIGATOIRE : créer le compte par l'inscription normale, sur
-- https://aviconnect.sn ou dans l'app, avec :
--   E-mail  : demo@aviconnect.sn
--   Rôle    : Éleveur   ← important, le rôle ne peut pas être changé en SQL
--                          (le trigger protect_profile_columns le restaure)
--   Mot de passe : celui que tu choisis, à communiquer à Apple
--
-- L'inscription échouera à envoyer l'e-mail de confirmation (la boîte
-- demo@aviconnect.sn n'existe pas) : c'est normal, ce script s'en charge.
--
-- Puis exécuter ce fichier dans : Dashboard Supabase → SQL Editor → Run.
-- Idempotent : peut être rejoué sans danger.
-- ============================================================================

-- ── 1. Confirmer l'adresse e-mail ───────────────────────────────────────────
-- Sans cette ligne, le testeur d'Apple ne peut pas se connecter et l'app est
-- rejetée pour « impossible de dépasser l'écran de connexion ».

update auth.users
set email_confirmed_at = now()
where email = 'demo@aviconnect.sn'
  and email_confirmed_at is null;

-- ── 2. Compléter le profil ──────────────────────────────────────────────────
-- Ces colonnes ne sont pas protégées par trigger, contrairement à role,
-- verified, blocked et aux statuts de certification.

update public.profiles
set prenom = 'Compte',
    nom    = 'Démonstration',
    ferme  = 'Ferme de démonstration AviConnect',
    region = 'Dakar',
    phone  = coalesce(nullif(phone, ''), '770000000')
where email = 'demo@aviconnect.sn';

-- ── 3. Quelques annonces pour que la review ait du contenu ──────────────────
-- Un testeur qui arrive sur un marché vide conclut souvent que l'app est
-- incomplète (règle Apple 4.2, « minimum functionality »).

insert into public.annonces (eleveur_id, eleveur, eleveur_phone, region, produit, titre, qte, prix, dispo, detail)
select p.id, p.prenom || ' ' || p.nom, p.phone, 'Dakar', 'poulet',
       'Poulets de chair Cobb 500', 250, 2800, 'Immédiat',
       'Lot de démonstration. Poulets élevés en 42 jours, poids moyen 2,1 kg.'
from public.profiles p
where p.email = 'demo@aviconnect.sn'
  and not exists (
    select 1 from public.annonces a
    where a.eleveur_id = p.id and a.titre = 'Poulets de chair Cobb 500'
  );

insert into public.annonces (eleveur_id, eleveur, eleveur_phone, region, produit, titre, qte, prix, dispo, detail)
select p.id, p.prenom || ' ' || p.nom, p.phone, 'Dakar', 'oeuf',
       'Œufs frais de consommation', 120, 2500, 'Immédiat',
       'Lot de démonstration. Plateau de 30 œufs, ramassage du jour.'
from public.profiles p
where p.email = 'demo@aviconnect.sn'
  and not exists (
    select 1 from public.annonces a
    where a.eleveur_id = p.id and a.titre = 'Œufs frais de consommation'
  );

insert into public.annonces (eleveur_id, eleveur, eleveur_phone, region, produit, titre, qte, prix, dispo, detail)
select p.id, p.prenom || ' ' || p.nom, p.phone, 'Thiès', 'aliment',
       'Aliment démarrage poussins', 40, 18000, 'Dans 3 jours',
       'Lot de démonstration. Sac de 50 kg, formulation démarrage.'
from public.profiles p
where p.email = 'demo@aviconnect.sn'
  and not exists (
    select 1 from public.annonces a
    where a.eleveur_id = p.id and a.titre = 'Aliment démarrage poussins'
  );

-- ── 4. Vérification ─────────────────────────────────────────────────────────
-- email_confirme doit être vrai, role doit être 'eleveur', nb_annonces >= 3.

select u.email,
       (u.email_confirmed_at is not null) as email_confirme,
       p.role,
       p.prenom || ' ' || p.nom as nom_affiche,
       p.region,
       (select count(*) from public.annonces a where a.eleveur_id = p.id) as nb_annonces
from auth.users u
join public.profiles p on p.id = u.id
where u.email = 'demo@aviconnect.sn';
