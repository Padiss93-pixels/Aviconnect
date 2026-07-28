-- ── Migration vers Supabase (pub, actualités, favoris) ──────────────────────

-- 1. Colonnes manquantes sur actualites
ALTER TABLE public.actualites
  ADD COLUMN IF NOT EXISTS resume     text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS categorie  text NOT NULL DEFAULT 'conseil',
  ADD COLUMN IF NOT EXISTS auteur_id  text NOT NULL DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS auteur_nom text NOT NULL DEFAULT 'AviConnect Admin',
  ADD COLUMN IF NOT EXISTS image_emoji text;

-- 2. Tables pub banners et pub marché
CREATE TABLE IF NOT EXISTS public.pub_banners (
  id          text PRIMARY KEY,
  data        jsonb NOT NULL,
  actif       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pub_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub_banners_select" ON public.pub_banners;
CREATE POLICY "pub_banners_select" ON public.pub_banners
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "pub_banners_write_admin" ON public.pub_banners;
CREATE POLICY "pub_banners_write_admin" ON public.pub_banners
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.pub_marches (
  id          text PRIMARY KEY,
  data        jsonb NOT NULL,
  actif       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pub_marches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub_marches_select" ON public.pub_marches;
CREATE POLICY "pub_marches_select" ON public.pub_marches
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "pub_marches_write_admin" ON public.pub_marches;
CREATE POLICY "pub_marches_write_admin" ON public.pub_marches
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. Favoris par utilisateur (tableau d'IDs d'annonces)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS favorites  int[] NOT NULL DEFAULT '{}';
