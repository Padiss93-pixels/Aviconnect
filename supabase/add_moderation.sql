-- ============================================================================
-- AviConnect — Signalement de contenu et blocage entre utilisateurs
-- Exigé par Apple (App Review 1.2 — contenu généré par les utilisateurs) et
-- attendu par Google Play pour toute application sociale / marketplace.
--
-- À exécuter dans : Dashboard Supabase → SQL Editor → New query → Run
-- Idempotent : peut être rejoué sans danger.
-- ============================================================================

-- ── 1. Signalements ─────────────────────────────────────────────────────────
-- target_id est en text (et non une clé étrangère) pour couvrir indifféremment
-- une annonce, un besoin ou un profil, dont les identifiants n'ont pas le même
-- type. reported_user_id garde le lien vers l'auteur du contenu quand il est
-- connu, ce qui permet à l'admin de bloquer directement le compte fautif.

create table if not exists public.reports (
  id               bigint generated always as identity primary key,
  reporter_id      uuid not null references public.profiles (id) on delete cascade,
  target_type      text not null check (target_type in ('annonce', 'besoin', 'profil', 'message')),
  target_id        text not null,
  target_label     text,
  reported_user_id uuid references public.profiles (id) on delete cascade,
  motif            text not null check (motif in (
                     'arnaque', 'contenu_inapproprie', 'fausse_annonce',
                     'maltraitance_animale', 'harcelement', 'spam', 'autre'
                   )),
  details          text,
  statut           text not null default 'ouvert' check (statut in ('ouvert', 'traite', 'rejete')),
  created_at       timestamptz not null default now(),
  handled_at       timestamptz,
  handled_by       uuid references public.profiles (id) on delete set null
);

-- Un même utilisateur ne signale un contenu donné qu'une seule fois.
create unique index if not exists idx_reports_unique_per_reporter
  on public.reports (reporter_id, target_type, target_id);

create index if not exists idx_reports_statut on public.reports (statut, created_at desc);

alter table public.reports enable row level security;

-- Un utilisateur crée ses propres signalements, s'il n'est pas bloqué.
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own"
  on public.reports for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.blocked = false
    )
  );

-- Il relit les siens ; l'admin voit tout.
drop policy if exists "reports_select_own_or_admin" on public.reports;
create policy "reports_select_own_or_admin"
  on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

-- Seul l'admin traite un signalement.
drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin"
  on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "reports_delete_admin" on public.reports;
create policy "reports_delete_admin"
  on public.reports for delete to authenticated
  using (public.is_admin());

-- Notifier tous les admins dès qu'un signalement arrive.
--
-- Deux précautions apprises en production :
--   - n'écrire que dans les colonnes réellement présentes sur `notifications`
--     (user_id, type, title, body, read, order_id) — la colonne `data` décrite
--     dans schema.sql n'existe pas dans la base déployée ;
--   - encapsuler l'insertion dans un bloc d'exception : le déclencheur tourne
--     dans la transaction du signalement, donc son échec ferait perdre le
--     signalement lui-même, ce qui est bien plus grave qu'une notification
--     manquante.
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
    raise warning 'notification admin impossible pour le signalement % : %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_report_created_notify on public.reports;
create trigger on_report_created_notify
  after insert on public.reports
  for each row execute function public.notify_admins_on_report();

-- ── 2. Blocage entre utilisateurs ───────────────────────────────────────────
-- Blocage unilatéral : le bloqueur ne voit plus les contenus du bloqué.

create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_no_self check (blocker_id <> blocked_id)
);

create index if not exists idx_user_blocks_blocker on public.user_blocks (blocker_id);

alter table public.user_blocks enable row level security;

-- Chacun gère uniquement sa propre liste de blocage ; l'admin peut consulter.
drop policy if exists "user_blocks_select_own_or_admin" on public.user_blocks;
create policy "user_blocks_select_own_or_admin"
  on public.user_blocks for select to authenticated
  using (blocker_id = auth.uid() or public.is_admin());

drop policy if exists "user_blocks_insert_own" on public.user_blocks;
create policy "user_blocks_insert_own"
  on public.user_blocks for insert to authenticated
  with check (blocker_id = auth.uid());

drop policy if exists "user_blocks_delete_own" on public.user_blocks;
create policy "user_blocks_delete_own"
  on public.user_blocks for delete to authenticated
  using (blocker_id = auth.uid());

-- ── 3. Vérification ─────────────────────────────────────────────────────────
-- select * from public.reports order by created_at desc;
-- select * from public.user_blocks;
