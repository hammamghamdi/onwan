alter table public.profiles
  add column if not exists email text,
  add column if not exists user_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_user_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_user_id_fkey
      foreign key (user_id)
      references auth.users(id)
      on delete set null;
  end if;
end $$;

create index if not exists profiles_email_idx
  on public.profiles (email);

create index if not exists profiles_user_id_idx
  on public.profiles (user_id);
