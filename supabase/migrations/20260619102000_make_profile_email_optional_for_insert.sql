alter table public.profiles enable row level security;

drop policy if exists "Anyone can create profiles" on public.profiles;

create policy "Anyone can create profiles"
on public.profiles
for insert
to anon, authenticated
with check (
  username is not null
  and owner_token is not null
  and city is not null
  and map_url is not null
  and instructions_ar is not null
  and user_id is null
);
