-- ============================================================================
-- Diagnostic — pourquoi l'envoi d'un signalement échoue
-- À exécuter dans : Dashboard Supabase → SQL Editor → Run
-- Ne modifie rien : la ligne de test est supprimée à la fin.
-- ============================================================================

-- ── 1. Les tables existent-elles ? ──────────────────────────────────────────
select table_name
from information_schema.tables
where table_schema = 'public' and table_name in ('reports', 'user_blocks')
order by table_name;

-- ── 2. Les politiques RLS sont-elles en place ? ─────────────────────────────
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename in ('reports', 'user_blocks')
order by tablename, policyname;

-- ── 3. Contraintes des tables concernées ────────────────────────────────────
-- Une contrainte CHECK inattendue sur notifications.type ferait échouer le
-- trigger notify_admins_on_report, et donc l'insertion du signalement entier.
select rel.relname as "table", con.conname as contrainte, pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace ns on ns.oid = rel.relnamespace
where ns.nspname = 'public'
  and rel.relname in ('reports', 'notifications')
  and con.contype = 'c'
order by rel.relname, con.conname;

-- ── 4. Le trigger de notification est-il présent ? ──────────────────────────
select tgname as trigger, tgrelid::regclass as "table", tgenabled as actif
from pg_trigger
where not tgisinternal and tgrelid = 'public.reports'::regclass;

-- ── 5. Test réel d'insertion ────────────────────────────────────────────────
-- Reproduit exactement ce que fait l'application. Si une erreur apparaît ici,
-- c'est le message que l'app reçoit et n'affiche pas lisiblement.
do $$
declare
  uid uuid;
begin
  select id into uid from public.profiles limit 1;
  if uid is null then
    raise notice 'AUCUN PROFIL EN BASE — impossible de tester';
    return;
  end if;

  insert into public.reports (reporter_id, target_type, target_id, target_label, motif, details)
  values (uid, 'annonce', 'diagnostic-tmp', 'Annonce de diagnostic', 'spam', 'Test automatique');

  raise notice 'INSERTION OK — la table et le trigger fonctionnent';

  delete from public.reports where target_id = 'diagnostic-tmp';
  delete from public.notifications where data ->> 'target_id' = 'diagnostic-tmp';

  raise notice 'Ligne de test supprimée';
end $$;
