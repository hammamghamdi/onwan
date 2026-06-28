create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  owner_token text not null,
  city text not null,
  map_url text not null,
  instructions_ar text not null,
  instructions_en text,
  instructions_ur text,
  instructions_bn text,
  photo1 text,
  photo2 text,
  photo3 text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_username_idx
  on public.profiles (username);

create index if not exists profiles_created_at_idx
  on public.profiles (created_at desc);
