create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists id uuid;

update public.profiles
set id = gen_random_uuid()
where id is null;

alter table public.profiles
  alter column id set default gen_random_uuid();

alter table public.profiles
  alter column id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_id_key'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_id_key unique (id);
  end if;
end $$;

create table if not exists public.address_photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  display_order integer not null check (display_order between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, display_order)
);

create index if not exists address_photos_profile_id_display_order_idx
on public.address_photos (profile_id, display_order);

alter table public.address_photos enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_address_photos_updated_at on public.address_photos;

create trigger set_address_photos_updated_at
before update on public.address_photos
for each row
execute function public.set_updated_at();

create or replace function public.extract_address_photo_storage_path(photo_url text)
returns text
language sql
immutable
as $$
  select nullif(
    regexp_replace(
      photo_url,
      '^.*\/storage\/v1\/object\/public\/address-photos\/',
      ''
    ),
    ''
  );
$$;

insert into public.address_photos (profile_id, storage_path, display_order)
select p.id, public.extract_address_photo_storage_path(photo_url), display_order
from public.profiles p
cross join lateral (
  values
    (p.photo1, 1),
    (p.photo2, 2),
    (p.photo3, 3)
) as legacy_photos(photo_url, display_order)
where photo_url is not null
  and public.extract_address_photo_storage_path(photo_url) is not null
on conflict (profile_id, display_order) do nothing;

create or replace function public.replace_profile_address_photos(
  p_username text,
  p_owner_token text,
  p_storage_paths text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile_id uuid;
  storage_path text;
  photo_index integer;
begin
  select id
  into target_profile_id
  from public.profiles
  where username = p_username
    and owner_token = p_owner_token;

  if target_profile_id is null then
    raise exception 'Address profile not found or owner token is invalid';
  end if;

  if coalesce(array_length(p_storage_paths, 1), 0) > 3 then
    raise exception 'A maximum of 3 photos is allowed';
  end if;

  delete from public.address_photos
  where profile_id = target_profile_id;

  if p_storage_paths is null then
    return;
  end if;

  for photo_index in 1..array_length(p_storage_paths, 1) loop
    storage_path := nullif(trim(p_storage_paths[photo_index]), '');

    if storage_path is not null then
      insert into public.address_photos (
        profile_id,
        storage_path,
        display_order
      )
      values (
        target_profile_id,
        storage_path,
        photo_index
      );
    end if;
  end loop;
end;
$$;

grant execute on function public.replace_profile_address_photos(text, text, text[])
to anon, authenticated;
