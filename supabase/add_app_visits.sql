-- ============================================================================
-- AviConnect — Suivi des visites (statistiques d'audience)
--
-- Alimente app/admin/analytics.tsx et le kit média app/admin/annonceurs.tsx.
-- L'insertion se fait depuis VisitLogger dans app/_layout.tsx.
--
-- À exécuter dans : Dashboard Supabase → SQL Editor → Run
--
-- Note : le DROP ci-dessous est là parce qu'une ancienne table app_visits sans
-- colonne created_at bloquait la création des index. CREATE TABLE IF NOT EXISTS
-- ne corrige pas une table déjà présente au mauvais format — il la saute en
-- silence. Vérifiez `select count(*) from public.app_visits;` avant de rejouer
-- ce script sur une base qui contiendrait de l'historique.
-- ============================================================================

DROP TABLE IF EXISTS public.app_visits CASCADE;

CREATE TABLE public.app_visits (
  id         bigserial PRIMARY KEY,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  platform   text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_visits ENABLE ROW LEVEL SECURITY;

-- Chacun n'enregistre que ses propres visites.
DROP POLICY IF EXISTS "visits_insert" ON public.app_visits;
CREATE POLICY "visits_insert" ON public.app_visits
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Seul l'admin lit les statistiques.
DROP POLICY IF EXISTS "visits_admin_select" ON public.app_visits;
CREATE POLICY "visits_admin_select" ON public.app_visits
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_app_visits_date ON public.app_visits (created_at);
CREATE INDEX IF NOT EXISTS idx_app_visits_user ON public.app_visits (user_id);

-- Exposition à l'API PostgREST. Sans ces droits l'app reçoit un 404 PGRST205
-- (« Could not find the table in the schema cache ») alors que la table existe.
-- Les politiques RLS ci-dessus restent la vraie barrière de sécurité.
GRANT SELECT, INSERT ON public.app_visits TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.app_visits_id_seq TO authenticated;

-- Force PostgREST à recharger son cache de schéma immédiatement.
NOTIFY pgrst, 'reload schema';

-- ── Vérification ────────────────────────────────────────────────────────────
-- Doit renvoyer les 4 colonnes attendues.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'app_visits'
ORDER BY ordinal_position;
