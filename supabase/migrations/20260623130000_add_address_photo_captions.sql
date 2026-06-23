alter table public.address_photos
  add column if not exists caption text;

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
  preserved_captions jsonb := '{}'::jsonb;
  v_storage_path text;
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

grant execute on function public.replace_profile_address_photos(text, text, text[])
to anon, authenticated;
