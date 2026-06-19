alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Authenticated users can claim profiles by email'
  ) then
    create policy "Authenticated users can claim profiles by email"
    on public.profiles
    for update
    to authenticated
    using (
      user_id is null
      and email is not null
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
    with check (
      user_id = auth.uid()
      and email is not null
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
  end if;
end $$;
