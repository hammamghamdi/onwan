create table if not exists public.abuse_reports (
  id uuid primary key default gen_random_uuid(),
  reported_username text not null,
  reported_url text not null,
  reason text not null default 'abuse',
  details text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.abuse_reports enable row level security;

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

create index if not exists abuse_reports_created_at_idx
  on public.abuse_reports (created_at desc);

create index if not exists abuse_reports_reported_username_idx
  on public.abuse_reports (reported_username);
