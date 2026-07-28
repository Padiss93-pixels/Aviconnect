-- Table de suivi des visites
CREATE TABLE IF NOT EXISTS public.app_visits (
  id        bigserial PRIMARY KEY,
  user_id   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  platform  text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visits_insert" ON public.app_visits;
CREATE POLICY "visits_insert" ON public.app_visits
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "visits_admin_select" ON public.app_visits;
CREATE POLICY "visits_admin_select" ON public.app_visits
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_app_visits_date ON public.app_visits (created_at);
CREATE INDEX IF NOT EXISTS idx_app_visits_user ON public.app_visits (user_id);
