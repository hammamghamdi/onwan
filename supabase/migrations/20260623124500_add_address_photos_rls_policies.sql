alter table public.address_photos enable row level security;

drop policy if exists "Authenticated owners can read address photos" on public.address_photos;
drop policy if exists "Authenticated owners can insert address photos" on public.address_photos;
drop policy if exists "Authenticated owners can update address photos" on public.address_photos;
drop policy if exists "Authenticated owners can delete address photos" on public.address_photos;

create policy "Authenticated owners can read address photos"
on public.address_photos
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = address_photos.profile_id
      and profiles.user_id = auth.uid()
  )
);

create policy "Authenticated owners can insert address photos"
on public.address_photos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = address_photos.profile_id
      and profiles.user_id = auth.uid()
  )
);

create policy "Authenticated owners can update address photos"
on public.address_photos
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = address_photos.profile_id
      and profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = address_photos.profile_id
      and profiles.user_id = auth.uid()
  )
);

create policy "Authenticated owners can delete address photos"
on public.address_photos
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = address_photos.profile_id
      and profiles.user_id = auth.uid()
  )
);
