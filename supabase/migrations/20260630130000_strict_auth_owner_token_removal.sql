alter table public.profiles enable row level security;

drop policy if exists "Anyone can create profiles" on public.profiles;
drop policy if exists "Authenticated users can claim profiles by email" on public.profiles;
drop policy if exists "Authenticated users can read own profiles" on public.profiles;
drop policy if exists "Owner token can manage profile" on public.profiles;
drop policy if exists "Public can read profiles" on public.profiles;
drop policy if exists "public can insert profiles" on public.profiles;
drop policy if exists "public can read profile" on public.profiles;
drop policy if exists "public can update profile by owner token" on public.profiles;
drop policy if exists "Authenticated owners can create profiles" on public.profiles;
drop policy if exists "Authenticated owners can update profiles" on public.profiles;
drop policy if exists "Authenticated owners can delete profiles" on public.profiles;

create policy "Public can read profiles"
on public.profiles
for select
to anon, authenticated
using (true);

create policy "Authenticated owners can create profiles"
on public.profiles
for insert
to authenticated
with check (
  user_id = auth.uid()
  and username is not null
  and city is not null
  and map_url is not null
  and instructions_ar is not null
);

create policy "Authenticated owners can update profiles"
on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Authenticated owners can delete profiles"
on public.profiles
for delete
to authenticated
using (user_id = auth.uid());

drop function if exists public.replace_profile_address_photos(text, text, text[]);

create or replace function public.replace_profile_address_photos(
  p_username text,
  p_storage_paths text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile_id uuid;
  preserved_captions jsonb := '{}'::jsonb;
  v_storage_path text;
  photo_index integer;
begin
  select id
  into target_profile_id
  from public.profiles
  where username = p_username
    and user_id = auth.uid();

  if target_profile_id is null then
    raise exception 'Address profile not found or authenticated user is not the owner';
  end if;

  if coalesce(array_length(p_storage_paths, 1), 0) > 3 then
    raise exception 'A maximum of 3 photos is allowed';
  end if;

  select coalesce(jsonb_object_agg(ap.storage_path, ap.caption), '{}'::jsonb)
  into preserved_captions
  from public.address_photos ap
  where ap.profile_id = target_profile_id
    and ap.caption is not null;

  delete from public.address_photos
  where profile_id = target_profile_id;

  if p_storage_paths is null then
    return;
  end if;

  for photo_index in 1..array_length(p_storage_paths, 1) loop
    v_storage_path := nullif(trim(p_storage_paths[photo_index]), '');

    if v_storage_path is not null then
      insert into public.address_photos (
        profile_id,
        storage_path,
        display_order,
        caption
      )
      values (
        target_profile_id,
        v_storage_path,
        photo_index,
        nullif(preserved_captions ->> v_storage_path, '')
      );
    end if;
  end loop;
end;
$$;

revoke all on function public.replace_profile_address_photos(text, text[])
from public, anon;

grant execute on function public.replace_profile_address_photos(text, text[])
to authenticated;

alter table public.profiles
  drop column if exists owner_token;
