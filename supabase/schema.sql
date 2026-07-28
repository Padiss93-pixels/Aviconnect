-- ============================================================================
-- AviConnect — Schéma Supabase avec Row Level Security
-- À exécuter dans : Dashboard Supabase → SQL Editor → New query → Run
-- Idempotent : peut être rejoué sans danger.
-- ============================================================================

-- ── 1. Profils utilisateurs ─────────────────────────────────────────────────
-- Lié 1:1 à auth.users. Créé automatiquement à l'inscription (trigger).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  phone text,
  prenom text not null default '',
  nom text not null default '',
  ferme text,
  clinique text,
  region text not null default 'Dakar',
  role text not null default 'eleveur'
    check (role in ('eleveur', 'acheteur', 'couvoir', 'admin', 'veterinaire')),
  verified boolean not null default false,
  blocked boolean not null default false,
  photo_url text,
  couvoir_status text check (couvoir_status in ('pending', 'certified', 'rejected')),
  vet_status text check (vet_status in ('pending', 'certified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Fonction utilitaire : l'utilisateur courant est-il admin ?
-- SECURITY DEFINER pour éviter la récursion RLS sur profiles.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and blocked = false
  );
$$;

-- Création automatique du profil à l'inscription.
-- Le rôle vient des métadonnées, mais 'admin' est interdit à l'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data ->> 'role', 'eleveur');
begin
  if requested_role not in ('eleveur', 'acheteur', 'couvoir', 'veterinaire') then
    requested_role := 'eleveur';
  end if;
  insert into public.profiles (id, email, phone, prenom, nom, ferme, clinique, region, role, couvoir_status, vet_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'prenom', ''),
    coalesce(new.raw_user_meta_data ->> 'nom', ''),
    nullif(new.raw_user_meta_data ->> 'ferme', ''),
    nullif(new.raw_user_meta_data ->> 'clinique', ''),
    coalesce(new.raw_user_meta_data ->> 'region', 'Dakar'),
    requested_role,
    case when requested_role = 'couvoir' then 'pending' end,
    case when requested_role = 'veterinaire' then 'pending' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Garde-fou : un non-admin ne peut pas modifier ses colonnes sensibles
-- (rôle, blocage, vérification, statuts de certification).
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.blocked := old.blocked;
    new.verified := old.verified;
    new.couvoir_status := old.couvoir_status;
    new.vet_status := old.vet_status;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists on_profile_update_guard on public.profiles;
create trigger on_profile_update_guard
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Politiques RLS profiles
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Pas d'insert client (trigger uniquement), pas de delete client
-- (suppression de compte via la fonction delete_user ci-dessous).

-- Suppression de compte par l'utilisateur lui-même (règle Apple 5.1.1).
-- Supprime auth.users → cascade sur profiles et toutes les données liées.
create or replace function public.delete_user()
returns void
language sql
security definer
set search_path = public
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_user() from public;
grant execute on function public.delete_user() to authenticated;

-- Suppression d'un compte par un admin (vérifié côté serveur).
create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Accès refusé : réservé aux administrateurs';
  end if;
  delete from auth.users where id = target_id;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- ── 2. Annonces (éleveurs / couvoirs) ───────────────────────────────────────

create table if not exists public.annonces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  titre text not null,
  categorie text not null,
  description text,
  prix numeric(12, 2) not null check (prix >= 0),
  quantite integer not null default 1 check (quantite > 0),
  region text not null,
  photo_url text,
  statut text not null default 'active' check (statut in ('active', 'vendue', 'suspendue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.annonces enable row level security;

drop policy if exists "annonces_select_authenticated" on public.annonces;
create policy "annonces_select_authenticated"
  on public.annonces for select
  to authenticated
  using (true);

drop policy if exists "annonces_insert_sellers" on public.annonces;
create policy "annonces_insert_sellers"
  on public.annonces for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.blocked = false
        and (
          p.role = 'eleveur'
          or (p.role = 'couvoir' and p.couvoir_status = 'certified')
        )
    )
  );

drop policy if exists "annonces_update_own_or_admin" on public.annonces;
create policy "annonces_update_own_or_admin"
  on public.annonces for update
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "annonces_delete_own_or_admin" on public.annonces;
create policy "annonces_delete_own_or_admin"
  on public.annonces for delete
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- ── 3. Besoins (demandes des acheteurs) ─────────────────────────────────────

create table if not exists public.besoins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  titre text not null,
  categorie text not null,
  description text,
  quantite integer,
  region text not null,
  statut text not null default 'ouvert' check (statut in ('ouvert', 'satisfait', 'ferme')),
  created_at timestamptz not null default now()
);

alter table public.besoins enable row level security;

drop policy if exists "besoins_select_authenticated" on public.besoins;
create policy "besoins_select_authenticated"
  on public.besoins for select to authenticated using (true);

drop policy if exists "besoins_insert_own" on public.besoins;
create policy "besoins_insert_own"
  on public.besoins for insert to authenticated
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.blocked = false
    )
  );

drop policy if exists "besoins_update_own_or_admin" on public.besoins;
create policy "besoins_update_own_or_admin"
  on public.besoins for update to authenticated
  using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "besoins_delete_own_or_admin" on public.besoins;
create policy "besoins_delete_own_or_admin"
  on public.besoins for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- ── 4. Commandes ────────────────────────────────────────────────────────────
-- Visibles uniquement par l'acheteur, le vendeur et l'admin.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  annonce_id uuid references public.annonces (id) on delete set null,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  quantite integer not null default 1 check (quantite > 0),
  message text,
  statut text not null default 'demande'
    check (statut in ('demande', 'confirmee', 'livree', 'annulee')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "orders_select_participants" on public.orders;
create policy "orders_select_participants"
  on public.orders for select to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

drop policy if exists "orders_insert_buyer" on public.orders;
create policy "orders_insert_buyer"
  on public.orders for insert to authenticated
  with check (
    buyer_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.blocked = false
    )
  );

drop policy if exists "orders_update_participants" on public.orders;
create policy "orders_update_participants"
  on public.orders for update to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

-- ── 5. Catalogue vétérinaire ────────────────────────────────────────────────

create table if not exists public.vet_catalogue (
  id uuid primary key default gen_random_uuid(),
  vet_id uuid not null references public.profiles (id) on delete cascade,
  nom text not null,
  type text not null,
  description text,
  prix numeric(12, 2) check (prix >= 0),
  created_at timestamptz not null default now()
);

alter table public.vet_catalogue enable row level security;

drop policy if exists "vet_catalogue_select_authenticated" on public.vet_catalogue;
create policy "vet_catalogue_select_authenticated"
  on public.vet_catalogue for select to authenticated using (true);

drop policy if exists "vet_catalogue_write_own" on public.vet_catalogue;
create policy "vet_catalogue_write_own"
  on public.vet_catalogue for all to authenticated
  using (vet_id = auth.uid() or public.is_admin())
  with check (
    (vet_id = auth.uid()
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'veterinaire' and p.blocked = false
      ))
    or public.is_admin()
  );

-- ── 6. Actualités et publicités (contenu géré par l'admin) ──────────────────

create table if not exists public.actualites (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  contenu text not null,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.actualites enable row level security;

drop policy if exists "actualites_select_authenticated" on public.actualites;
create policy "actualites_select_authenticated"
  on public.actualites for select to authenticated using (true);

drop policy if exists "actualites_write_admin" on public.actualites;
create policy "actualites_write_admin"
  on public.actualites for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create table if not exists public.pubs (
  id uuid primary key default gen_random_uuid(),
  titre text,
  image_url text not null,
  lien text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.pubs enable row level security;

drop policy if exists "pubs_select_authenticated" on public.pubs;
create policy "pubs_select_authenticated"
  on public.pubs for select to authenticated using (true);

drop policy if exists "pubs_write_admin" on public.pubs;
create policy "pubs_write_admin"
  on public.pubs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── 7. Notifications ────────────────────────────────────────────────────────
-- Chaque utilisateur ne voit que les siennes.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read boolean not null default false,
  data jsonb,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
  on public.notifications for delete to authenticated
  using (user_id = auth.uid());

-- Notifier tous les admins à l'inscription d'un couvoir ou d'un vétérinaire.
create or replace function public.notify_admins_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role in ('couvoir', 'veterinaire') then
    insert into public.notifications (user_id, type, title, body, data)
    select
      p.id,
      case when new.role = 'couvoir' then 'couvoir_inscription' else 'vet_inscription' end,
      case when new.role = 'couvoir' then '🏭 Nouveau couvoir à valider' else '💉 Nouveau vétérinaire à valider' end,
      new.prenom || ' ' || new.nom || ' vient de s''inscrire. Vérifiez et validez son profil.',
      jsonb_build_object('profile_id', new.id)
    from public.profiles p
    where p.role = 'admin';
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_created_notify on public.profiles;
create trigger on_profile_created_notify
  after insert on public.profiles
  for each row execute function public.notify_admins_on_signup();

-- ── 8. Stockage des photos ──────────────────────────────────────────────────
-- Bucket public en lecture ; chaque utilisateur écrit dans son dossier <uid>/...

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos_public_read" on storage.objects;
create policy "photos_public_read"
  on storage.objects for select
  using (bucket_id = 'photos');

drop policy if exists "photos_insert_own_folder" on storage.objects;
create policy "photos_insert_own_folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "photos_delete_own" on storage.objects;
create policy "photos_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ── 9. Index utiles ─────────────────────────────────────────────────────────

create index if not exists idx_annonces_owner on public.annonces (owner_id);
create index if not exists idx_annonces_region on public.annonces (region);
create index if not exists idx_besoins_owner on public.besoins (owner_id);
create index if not exists idx_orders_buyer on public.orders (buyer_id);
create index if not exists idx_orders_seller on public.orders (seller_id);
create index if not exists idx_notifications_user on public.notifications (user_id, read);
create index if not exists idx_vet_catalogue_vet on public.vet_catalogue (vet_id);

-- ── 10. Boosts & abonnements ─────────────────────────────────────────────────

create table if not exists public.boosts (
  id            bigint generated always as identity primary key,
  annonce_id    bigint references public.annonces(id) on delete cascade,
  eleveur_id    uuid   references auth.users(id) on delete cascade,
  duration_days integer not null,
  amount        integer not null,
  start_date    timestamptz,
  end_date      timestamptz,
  status        text    not null default 'pending',
  payment_method text,
  payment_ref   text,
  created_at    timestamptz default now()
);

alter table public.boosts enable row level security;

create policy "boosts_public_active" on public.boosts
  for select using (status = 'active');

create policy "boosts_own_all" on public.boosts
  for all using (auth.uid() = eleveur_id)
  with check (auth.uid() = eleveur_id);

create policy "boosts_admin" on public.boosts
  for all using (public.is_admin());


create table if not exists public.couvoir_subscriptions (
  id             bigint generated always as identity primary key,
  user_id        uuid   references auth.users(id) on delete cascade,
  amount         integer not null default 25000,
  start_date     timestamptz,
  end_date       timestamptz,
  status         text    not null default 'pending',
  payment_method text,
  payment_ref    text,
  created_at     timestamptz default now()
);

alter table public.couvoir_subscriptions enable row level security;

create policy "subs_public_active" on public.couvoir_subscriptions
  for select using (status = 'active');

create policy "subs_own_all" on public.couvoir_subscriptions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "subs_admin" on public.couvoir_subscriptions
  for all using (public.is_admin());

create index if not exists idx_boosts_annonce on public.boosts (annonce_id, status, end_date);
create index if not exists idx_subs_user on public.couvoir_subscriptions (user_id, status, end_date);
