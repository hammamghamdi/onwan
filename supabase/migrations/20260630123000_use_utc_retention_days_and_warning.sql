create or replace function public.aggregate_visit_daily_stats(
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  visit_cutoff_date date := timezone('UTC', p_now)::date - 90;
  address_rows_considered integer;
  homepage_rows_considered integer;
  address_days_upserted integer;
  homepage_days_upserted integer;
begin
  select count(*)::integer
  into address_rows_considered
  from public.address_visits
  where timezone('UTC', visited_at)::date < visit_cutoff_date
    and username is not null
    and btrim(username) <> '';

  select count(*)::integer
  into homepage_rows_considered
  from public.homepage_visits
  where timezone('UTC', created_at)::date < visit_cutoff_date
    and visitor_id is not null
    and btrim(visitor_id) <> '';

  with aggregated as (
    select
      timezone('UTC', visited_at)::date as stat_date,
      username,
      count(*)::integer as total_visits,
      greatest(
        count(distinct visitor_id) filter (where visitor_id is not null),
        count(*) filter (where is_unique)
      )::integer as unique_visitors
    from public.address_visits
    where timezone('UTC', visited_at)::date < visit_cutoff_date
      and username is not null
      and btrim(username) <> ''
    group by timezone('UTC', visited_at)::date, username
  ),
  upserted as (
    insert into public.address_visit_daily_stats (
      stat_date,
      username,
      total_visits,
      unique_visitors,
      updated_at
    )
    select
      stat_date,
      username,
      total_visits,
      unique_visitors,
      now()
    from aggregated
    on conflict (stat_date, username) do update
    set
      total_visits = excluded.total_visits,
      unique_visitors = excluded.unique_visitors,
      updated_at = now()
    returning 1
  )
  select count(*)::integer
  into address_days_upserted
  from upserted;

  with aggregated as (
    select
      timezone('UTC', created_at)::date as stat_date,
      count(*)::integer as total_visits,
      count(distinct visitor_id)::integer as unique_visitors
    from public.homepage_visits
    where timezone('UTC', created_at)::date < visit_cutoff_date
      and visitor_id is not null
      and btrim(visitor_id) <> ''
    group by timezone('UTC', created_at)::date
  ),
  upserted as (
    insert into public.homepage_visit_daily_stats (
      stat_date,
      total_visits,
      unique_visitors,
      updated_at
    )
    select
      stat_date,
      total_visits,
      unique_visitors,
      now()
    from aggregated
    on conflict (stat_date) do update
    set
      total_visits = excluded.total_visits,
      unique_visitors = excluded.unique_visitors,
      updated_at = now()
    returning 1
  )
  select count(*)::integer
  into homepage_days_upserted
  from upserted;

  return jsonb_build_object(
    'now', p_now,
    'visit_cutoff_date', visit_cutoff_date,
    'address_rows_considered', coalesce(address_rows_considered, 0),
    'homepage_rows_considered', coalesce(homepage_rows_considered, 0),
    'address_days_upserted', coalesce(address_days_upserted, 0),
    'homepage_days_upserted', coalesce(homepage_days_upserted, 0)
  );
end;
$$;

create or replace function public.retention_cleanup_preview(
  p_now timestamptz default now()
)
returns jsonb
language sql
security definer
set search_path = public
as $$
select jsonb_build_object(
  'visit_cutoff_date',
    (timezone('UTC', p_now)::date - 90),
  'address_visits_eligible_for_cleanup',
    (
      select count(*)::integer
      from public.address_visits
      where timezone('UTC', visited_at)::date < (timezone('UTC', p_now)::date - 90)
        and username is not null
        and btrim(username) <> ''
    ),
  'address_visits_invalid_rows_retained',
    (
      select count(*)::integer
      from public.address_visits
      where timezone('UTC', visited_at)::date < (timezone('UTC', p_now)::date - 90)
        and (username is null or btrim(username) = '')
    ),
  'homepage_visits_eligible_for_cleanup',
    (
      select count(*)::integer
      from public.homepage_visits
      where timezone('UTC', created_at)::date < (timezone('UTC', p_now)::date - 90)
        and visitor_id is not null
        and btrim(visitor_id) <> ''
    ),
  'homepage_visits_invalid_rows_retained',
    (
      select count(*)::integer
      from public.homepage_visits
      where timezone('UTC', created_at)::date < (timezone('UTC', p_now)::date - 90)
        and (visitor_id is null or btrim(visitor_id) = '')
    ),
  'public_address_access_logs_older_than_30_days',
    (
      select count(*)::integer
      from public.public_address_access_logs
      where created_at < p_now - interval '30 days'
    ),
  'expired_public_address_blocks_older_than_30_days',
    (
      select count(*)::integer
      from public.public_address_blocks
      where blocked_until < p_now - interval '30 days'
    )
);
$$;

create or replace function public.run_retention_cleanup(
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  visit_cutoff_date date := timezone('UTC', p_now)::date - 90;
  log_cutoff timestamptz := p_now - interval '30 days';
  aggregation_summary jsonb;
  deleted_address_visits integer;
  deleted_homepage_visits integer;
  deleted_access_logs integer;
  deleted_expired_blocks integer;
begin
  aggregation_summary := public.aggregate_visit_daily_stats(p_now);

  with deleted as (
    delete from public.address_visits
    where timezone('UTC', visited_at)::date < visit_cutoff_date
      and username is not null
      and btrim(username) <> ''
    returning 1
  )
  select count(*)::integer
  into deleted_address_visits
  from deleted;

  with deleted as (
    delete from public.homepage_visits
    where timezone('UTC', created_at)::date < visit_cutoff_date
      and visitor_id is not null
      and btrim(visitor_id) <> ''
    returning 1
  )
  select count(*)::integer
  into deleted_homepage_visits
  from deleted;

  with deleted as (
    delete from public.public_address_access_logs
    where created_at < log_cutoff
    returning 1
  )
  select count(*)::integer
  into deleted_access_logs
  from deleted;

  with deleted as (
    delete from public.public_address_blocks
    where blocked_until < log_cutoff
    returning 1
  )
  select count(*)::integer
  into deleted_expired_blocks
  from deleted;

  return jsonb_build_object(
    'cleanup_time', p_now,
    'visit_cutoff_date', visit_cutoff_date,
    'log_cutoff', log_cutoff,
    'aggregation', aggregation_summary,
    'deleted_address_visits', coalesce(deleted_address_visits, 0),
    'deleted_homepage_visits', coalesce(deleted_homepage_visits, 0),
    'deleted_public_address_access_logs', coalesce(deleted_access_logs, 0),
    'deleted_expired_public_address_blocks', coalesce(deleted_expired_blocks, 0)
  );
end;
$$;

create or replace function public.admin_platform_analytics()
returns jsonb
language sql
security definer
set search_path = public
as $$
with
  address_counts as (
    select count(*)::integer as total_registered_addresses
    from public.profiles
  ),
  raw_address_stats as (
    select
      timezone('UTC', av.visited_at)::date as stat_date,
      av.username,
      count(*)::integer as total_visits,
      greatest(
        count(distinct av.visitor_id) filter (where av.visitor_id is not null),
        count(*) filter (where av.is_unique)
      )::integer as unique_visitors
    from public.address_visits av
    where av.username is not null
      and btrim(av.username) <> ''
      and not exists (
        select 1
        from public.address_visit_daily_stats s
        where s.stat_date = timezone('UTC', av.visited_at)::date
          and s.username = av.username
      )
    group by timezone('UTC', av.visited_at)::date, av.username
  ),
  combined_address_stats as (
    select stat_date, username, total_visits, unique_visitors
    from public.address_visit_daily_stats
    union all
    select stat_date, username, total_visits, unique_visitors
    from raw_address_stats
  ),
  visit_counts as (
    select
      coalesce(sum(total_visits), 0)::integer as total_visits,
      coalesce(sum(unique_visitors), 0)::integer as total_unique_visitors
    from combined_address_stats
  ),
  latest_registered_addresses as (
    select coalesce(jsonb_agg(row_data order by created_at desc), '[]'::jsonb) as data
    from (
      select
        p.created_at,
        jsonb_build_object(
          'username', p.username,
          'display_username', coalesce(p.display_username, p.username),
          'city', p.city,
          'created_at', p.created_at
        ) as row_data
      from public.profiles p
      order by p.created_at desc nulls last
      limit 10
    ) latest
  ),
  visit_stats as (
    select
      username,
      sum(total_visits)::integer as total_visits,
      sum(unique_visitors)::integer as unique_visitors
    from combined_address_stats
    group by username
  ),
  most_visited_addresses as (
    select coalesce(jsonb_agg(row_data order by total_visits desc, username asc), '[]'::jsonb) as data
    from (
      select
        p.username,
        coalesce(vs.total_visits, 0) as total_visits,
        jsonb_build_object(
          'username', p.username,
          'display_username', coalesce(p.display_username, p.username),
          'city', p.city,
          'total_visits', coalesce(vs.total_visits, 0),
          'unique_visitors', coalesce(vs.unique_visitors, 0)
        ) as row_data
      from public.profiles p
      left join visit_stats vs on vs.username = p.username
      order by coalesce(vs.total_visits, 0) desc, p.username asc
      limit 10
    ) ranked
  ),
  raw_table_counts as (
    select
      (select count(*)::integer from public.address_visits) as address_visits,
      (select count(*)::integer from public.homepage_visits) as homepage_visits,
      (select count(*)::integer from public.public_address_access_logs) as public_address_access_logs
  )
select jsonb_build_object(
  'total_registered_addresses', address_counts.total_registered_addresses,
  'total_visits', visit_counts.total_visits,
  'total_unique_visitors', visit_counts.total_unique_visitors,
  'latest_registered_addresses', latest_registered_addresses.data,
  'most_visited_addresses', most_visited_addresses.data,
  'raw_table_counts', jsonb_build_object(
    'address_visits', raw_table_counts.address_visits,
    'homepage_visits', raw_table_counts.homepage_visits,
    'public_address_access_logs', raw_table_counts.public_address_access_logs
  ),
  'retention_cleanup_warning', (
    raw_table_counts.address_visits >= 100000
    or raw_table_counts.homepage_visits >= 50000
    or raw_table_counts.public_address_access_logs >= 100000
  )
)
from address_counts, visit_counts, latest_registered_addresses, most_visited_addresses, raw_table_counts;
$$;

create or replace function public.admin_address_monitor(
  p_search_username text default '',
  p_search_city text default '',
  p_sort text default 'created_desc',
  p_page integer default 1,
  p_page_size integer default 25
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_page integer := greatest(coalesce(p_page, 1), 1);
  safe_page_size integer := least(greatest(coalesce(p_page_size, 25), 1), 100);
  offset_rows integer;
  total_rows integer;
  rows_json jsonb;
begin
  offset_rows := (safe_page - 1) * safe_page_size;

  with raw_address_stats as (
    select
      timezone('UTC', av.visited_at)::date as stat_date,
      av.username,
      count(*)::integer as total_visits,
      greatest(
        count(distinct av.visitor_id) filter (where av.visitor_id is not null),
        count(*) filter (where av.is_unique)
      )::integer as unique_visitors
    from public.address_visits av
    where av.username is not null
      and btrim(av.username) <> ''
      and not exists (
        select 1
        from public.address_visit_daily_stats s
        where s.stat_date = timezone('UTC', av.visited_at)::date
          and s.username = av.username
      )
    group by timezone('UTC', av.visited_at)::date, av.username
  ),
  combined_address_stats as (
    select stat_date, username, total_visits, unique_visitors
    from public.address_visit_daily_stats
    union all
    select stat_date, username, total_visits, unique_visitors
    from raw_address_stats
  ),
  visit_stats as (
    select
      username,
      sum(total_visits)::integer as total_visits,
      sum(unique_visitors)::integer as unique_visitors
    from combined_address_stats
    group by username
  ),
  last_visits as (
    select username, max(visited_at) as last_visit_at
    from public.address_visits
    where username is not null
      and btrim(username) <> ''
    group by username
  ),
  base as (
    select
      p.id,
      p.username,
      coalesce(p.display_username, p.username) as display_username,
      p.city,
      p.created_at,
      p.is_suspended,
      p.suspended_reason,
      p.suspended_at,
      coalesce(vs.total_visits, 0) as total_visits,
      coalesce(vs.unique_visitors, 0) as unique_visitors,
      lv.last_visit_at
    from public.profiles p
    left join visit_stats vs on vs.username = p.username
    left join last_visits lv on lv.username = p.username
    where (coalesce(p_search_username, '') = '' or p.username ilike '%' || p_search_username || '%')
      and (coalesce(p_search_city, '') = '' or coalesce(p.city, '') ilike '%' || p_search_city || '%')
  )
  select count(*)::integer
  into total_rows
  from base;

  with raw_address_stats as (
    select
      timezone('UTC', av.visited_at)::date as stat_date,
      av.username,
      count(*)::integer as total_visits,
      greatest(
        count(distinct av.visitor_id) filter (where av.visitor_id is not null),
        count(*) filter (where av.is_unique)
      )::integer as unique_visitors
    from public.address_visits av
    where av.username is not null
      and btrim(av.username) <> ''
      and not exists (
        select 1
        from public.address_visit_daily_stats s
        where s.stat_date = timezone('UTC', av.visited_at)::date
          and s.username = av.username
      )
    group by timezone('UTC', av.visited_at)::date, av.username
  ),
  combined_address_stats as (
    select stat_date, username, total_visits, unique_visitors
    from public.address_visit_daily_stats
    union all
    select stat_date, username, total_visits, unique_visitors
    from raw_address_stats
  ),
  visit_stats as (
    select
      username,
      sum(total_visits)::integer as total_visits,
      sum(unique_visitors)::integer as unique_visitors
    from combined_address_stats
    group by username
  ),
  last_visits as (
    select username, max(visited_at) as last_visit_at
    from public.address_visits
    where username is not null
      and btrim(username) <> ''
    group by username
  ),
  base as (
    select
      p.id,
      p.username,
      coalesce(p.display_username, p.username) as display_username,
      p.city,
      p.created_at,
      p.is_suspended,
      p.suspended_reason,
      p.suspended_at,
      coalesce(vs.total_visits, 0) as total_visits,
      coalesce(vs.unique_visitors, 0) as unique_visitors,
      lv.last_visit_at
    from public.profiles p
    left join visit_stats vs on vs.username = p.username
    left join last_visits lv on lv.username = p.username
    where (coalesce(p_search_username, '') = '' or p.username ilike '%' || p_search_username || '%')
      and (coalesce(p_search_city, '') = '' or coalesce(p.city, '') ilike '%' || p_search_city || '%')
  ),
  sorted as (
    select *
    from base
    order by
      case when p_sort = 'visits_desc' then total_visits end desc nulls last,
      case when p_sort = 'visits_asc' then total_visits end asc nulls last,
      case when p_sort = 'created_asc' then created_at end asc nulls last,
      case when p_sort = 'last_visit_desc' then last_visit_at end desc nulls last,
      case when p_sort = 'last_visit_asc' then last_visit_at end asc nulls last,
      created_at desc nulls last
    limit safe_page_size
    offset offset_rows
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'username', username,
    'display_username', display_username,
    'city', city,
    'created_at', created_at,
    'is_suspended', is_suspended,
    'suspended_reason', suspended_reason,
    'suspended_at', suspended_at,
    'total_visits', total_visits,
    'unique_visitors', unique_visitors,
    'last_visit_at', last_visit_at
  )), '[]'::jsonb)
  into rows_json
  from sorted;

  return jsonb_build_object(
    'total', total_rows,
    'page', safe_page,
    'page_size', safe_page_size,
    'rows', rows_json
  );
end;
$$;

grant all on public.address_visit_daily_stats to service_role;
grant all on public.homepage_visit_daily_stats to service_role;
grant execute on function public.aggregate_visit_daily_stats(timestamptz) to service_role;
grant execute on function public.retention_cleanup_preview(timestamptz) to service_role;
grant execute on function public.run_retention_cleanup(timestamptz) to service_role;
grant execute on function public.admin_platform_analytics() to service_role;
grant execute on function public.admin_address_monitor(text, text, text, integer, integer) to service_role;
