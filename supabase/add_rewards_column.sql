-- Persistance des récompenses utilisateur (XP, streak, badges) dans Supabase
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rewards jsonb;
