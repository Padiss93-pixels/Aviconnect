-- Colonnes manquantes pour le catalogue vétérinaire
ALTER TABLE public.vet_catalogue
  ADD COLUMN IF NOT EXISTS unite text,
  ADD COLUMN IF NOT EXISTS photo text;
