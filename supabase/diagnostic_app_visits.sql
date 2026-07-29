-- ============================================================================
-- AviConnect — Diagnostic de la table app_visits
--
-- Contexte : add_app_visits.sql échoue avec « column "created_at" does not
-- exist ». CREATE TABLE IF NOT EXISTS a donc été sauté : une table app_visits
-- existe déjà, mais avec des colonnes différentes de celles qu'attendent
-- app/admin/analytics.tsx et app/_layout.tsx (user_id, platform, created_at).
--
-- À exécuter dans : Dashboard Supabase → SQL Editor → Run
-- Lecture seule : ne modifie rien.
-- ============================================================================

-- ── 1. La table existe-t-elle, et dans quel schéma ? ────────────────────────
select table_schema, table_name, table_type
from information_schema.tables
where table_name = 'app_visits';

-- ── 2. Ses colonnes réelles ────────────────────────────────────────────────
-- C'est le résultat le plus important : il dit quelle colonne joue le rôle
-- de created_at (date, visited_at, inserted_at…).
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'app_visits'
order by ordinal_position;

-- ── 3. Contient-elle déjà des données ? ────────────────────────────────────
-- Si le compte est à 0, on peut la supprimer et la recréer proprement.
-- S'il est > 0, il faut renommer/migrer les colonnes sans perdre l'historique.
select count(*) as lignes from public.app_visits;

-- ── 4. RLS et politiques en place ──────────────────────────────────────────
select relrowsecurity as rls_active
from pg_class
where oid = 'public.app_visits'::regclass;

select polname as politique, cmd as operation, pg_get_expr(polqual, polrelid) as using_expr
from pg_policy
where polrelid = 'public.app_visits'::regclass;

-- ── 5. La table est-elle exposée à l'API PostgREST ? ───────────────────────
-- Le rôle `authenticated` doit avoir SELECT/INSERT, sinon l'app reçoit un 404
-- PGRST205 même quand la table existe bel et bien.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'app_visits'
order by grantee, privilege_type;
