alter table public.profiles
  add column if not exists display_username text;

update public.profiles
set display_username = username
where display_username is null;

alter table public.profiles
  alter column display_username set not null;

alter table public.profiles
  drop constraint if exists profiles_username_normalized_format_check;

alter table public.profiles
  add constraint profiles_username_normalized_format_check
  check (username ~ '^[a-z][a-z0-9]*$') not valid;

alter table public.profiles
  add constraint profiles_display_username_format_check
  check (display_username ~ '^[A-Za-z][A-Za-z0-9]*$') not valid;
