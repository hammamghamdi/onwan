alter table public.profiles
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspended_reason text,
  add column if not exists suspended_at timestamptz;

create index if not exists profiles_is_suspended_idx
  on public.profiles (is_suspended);

drop policy if exists "Anyone can submit abuse reports" on public.abuse_reports;

create policy "Anyone can submit abuse reports"
on public.abuse_reports
for insert
to anon, authenticated
with check (
  reported_username <> ''
  and reported_url <> ''
  and reason <> ''
  and status = 'new'
);

drop policy if exists "No public abuse report reads" on public.abuse_reports;

create policy "No public abuse report reads"
on public.abuse_reports
for select
to anon, authenticated
using (false);

alter table public.abuse_reports
  drop constraint if exists abuse_reports_status_check;

alter table public.abuse_reports
  add constraint abuse_reports_status_check
  check (status in ('new', 'reviewed', 'ignored', 'action_taken')) not valid;
