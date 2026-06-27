create unique index if not exists profiles_username_lower_unique_idx
  on public.profiles (lower(username));

alter table public.profiles
  add constraint profiles_username_normalized_format_check
  check (username ~ '^[a-z][a-z0-9]{4,}$') not valid;
