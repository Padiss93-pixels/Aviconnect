-- ============================================================================
-- Correctif — le signalement échouait avec :
--   column "data" of relation "notifications" does not exist
--
-- Cause : le déclencheur notify_admins_on_report écrivait dans une colonne
-- `data` qui existe dans supabase/schema.sql mais pas dans la base réellement
-- déployée. Comme le déclencheur s'exécute dans la même transaction que
-- l'insertion du signalement, son échec annulait le signalement entier.
--
-- Correctif en deux temps :
--   1. n'écrire que dans les colonnes réellement présentes ;
--   2. isoler la notification dans un bloc d'exception, pour qu'un problème
--      de notification ne fasse plus jamais perdre un signalement.
--
-- À exécuter dans : Dashboard Supabase → SQL Editor → Run
-- ============================================================================

create or replace function public.notify_admins_on_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.notifications (user_id, type, title, body, read)
    select
      p.id,
      'signalement',
      '🚩 Nouveau signalement',
      'Contenu signalé (' || new.motif || ') — '
        || coalesce(new.target_label, new.target_type)
        || '. À examiner dans la modération.',
      false
    from public.profiles p
    where p.role = 'admin';
  exception when others then
    -- La notification est secondaire : on la journalise sans bloquer.
    raise warning 'notification admin impossible pour le signalement % : %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

-- ── Vérification ────────────────────────────────────────────────────────────
-- Doit renvoyer une ligne, sans erreur.

insert into public.reports (reporter_id, target_type, target_id, target_label, motif, details)
select id, 'annonce', 'diagnostic-tmp', 'Annonce de diagnostic', 'spam', 'Test automatique'
from public.profiles
limit 1
returning id, statut, created_at;

-- Puis nettoyer :
-- delete from public.reports where target_id = 'diagnostic-tmp';
