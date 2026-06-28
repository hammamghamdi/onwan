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
  visit_counts as (
    select
      count(*)::integer as total_visits,
      greatest(
        count(distinct visitor_id) filter (where visitor_id is not null),
        count(*) filter (where is_unique)
      )::integer as total_unique_visitors
    from public.address_visits
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
      count(*)::integer as total_visits,
      greatest(
        count(distinct visitor_id) filter (where visitor_id is not null),
        count(*) filter (where is_unique)
      )::integer as unique_visitors
    from public.address_visits
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
  )
select jsonb_build_object(
  'total_registered_addresses', address_counts.total_registered_addresses,
  'total_visits', visit_counts.total_visits,
  'total_unique_visitors', visit_counts.total_unique_visitors,
  'latest_registered_addresses', latest_registered_addresses.data,
  'most_visited_addresses', most_visited_addresses.data
)
from address_counts, visit_counts, latest_registered_addresses, most_visited_addresses;
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

  with visit_stats as (
    select
      username,
      count(*)::integer as total_visits,
      greatest(
        count(distinct visitor_id) filter (where visitor_id is not null),
        count(*) filter (where is_unique)
      )::integer as unique_visitors,
      max(visited_at) as last_visit_at
    from public.address_visits
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
      vs.last_visit_at
    from public.profiles p
    left join visit_stats vs on vs.username = p.username
    where (coalesce(p_search_username, '') = '' or p.username ilike '%' || p_search_username || '%')
      and (coalesce(p_search_city, '') = '' or coalesce(p.city, '') ilike '%' || p_search_city || '%')
  )
  select count(*)::integer
  into total_rows
  from base;

  with visit_stats as (
    select
      username,
      count(*)::integer as total_visits,
      greatest(
        count(distinct visitor_id) filter (where visitor_id is not null),
        count(*) filter (where is_unique)
      )::integer as unique_visitors,
      max(visited_at) as last_visit_at
    from public.address_visits
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
      vs.last_visit_at
    from public.profiles p
    left join visit_stats vs on vs.username = p.username
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

grant execute on function public.admin_platform_analytics() to service_role;
grant execute on function public.admin_address_monitor(text, text, text, integer, integer) to service_role;
