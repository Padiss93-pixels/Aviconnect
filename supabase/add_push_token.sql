-- Stockage du token push Expo par utilisateur
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token text;
