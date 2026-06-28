create extension if not exists pgcrypto;

create table if not exists public.homepage_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  created_at timestamptz not null default now()
);

alter table public.homepage_visits
  add column if not exists visitor_id text,
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'homepage_visits_visitor_id_not_blank_check'
      and conrelid = 'public.homepage_visits'::regclass
  ) then
    alter table public.homepage_visits
      add constraint homepage_visits_visitor_id_not_blank_check
      check (btrim(visitor_id) <> '') not valid;
  end if;
end $$;

create index if not exists homepage_visits_created_at_idx
  on public.homepage_visits (created_at desc);

create index if not exists homepage_visits_visitor_id_idx
  on public.homepage_visits (visitor_id);

alter table public.homepage_visits enable row level security;

drop policy if exists "Public can record homepage visits" on public.homepage_visits;

create policy "Public can record homepage visits"
on public.homepage_visits
for insert
to anon, authenticated
with check (btrim(visitor_id) <> '');

drop policy if exists "No public homepage visit reads" on public.homepage_visits;

create policy "No public homepage visit reads"
on public.homepage_visits
for select
to anon, authenticated
using (false);

grant insert on public.homepage_visits to anon, authenticated;
grant all on public.homepage_visits to service_role;

create table if not exists public.address_visits (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  visitor_id text,
  is_unique boolean not null default false,
  visited_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.address_visits
  add column if not exists username text,
  add column if not exists visitor_id text,
  add column if not exists is_unique boolean not null default false,
  add column if not exists visited_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'address_visits_username_not_blank_check'
      and conrelid = 'public.address_visits'::regclass
  ) then
    alter table public.address_visits
      add constraint address_visits_username_not_blank_check
      check (btrim(username) <> '') not valid;
  end if;
end $$;

create index if not exists address_visits_username_idx
  on public.address_visits (username);

create index if not exists address_visits_username_visited_at_idx
  on public.address_visits (username, visited_at desc);

create index if not exists address_visits_visited_at_idx
  on public.address_visits (visited_at desc);

create index if not exists address_visits_visitor_id_idx
  on public.address_visits (visitor_id)
  where visitor_id is not null;

alter table public.address_visits enable row level security;

drop policy if exists "Public can record address visits" on public.address_visits;

create policy "Public can record address visits"
on public.address_visits
for insert
to anon, authenticated
with check (btrim(username) <> '');

drop policy if exists "No public address visit reads" on public.address_visits;

create policy "No public address visit reads"
on public.address_visits
for select
to anon, authenticated
using (false);

grant insert on public.address_visits to anon, authenticated;
grant all on public.address_visits to service_role;
