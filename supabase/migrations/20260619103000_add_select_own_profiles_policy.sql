alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Authenticated users can read own profiles'
  ) then
    create policy "Authenticated users can read own profiles"
    on public.profiles
    for select
    to authenticated
    using (
      user_id = auth.uid()
    );
  end if;
end $$;
