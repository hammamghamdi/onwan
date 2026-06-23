create or replace function public.admin_platform_analytics()
returns jsonb
language sql
security definer
set search_path = public
as $$
with
  days as (
    select generate_series(
      date_trunc('day', now()) - interval '13 days',
      date_trunc('day', now()),
      interval '1 day'
    )::date as day
  ),
  address_counts as (
    select
      count(*)::integer as total_registered_addresses,
      count(*) filter (where created_at >= date_trunc('day', now()))::integer as addresses_created_today,
      count(*) filter (where created_at >= date_trunc('week', now()))::integer as addresses_created_this_week,
      count(*) filter (where created_at >= date_trunc('month', now()))::integer as addresses_created_this_month
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
  most_visited_addresses as (
    select coalesce(jsonb_agg(row_data order by total_visits desc), '[]'::jsonb) as data
    from (
      select jsonb_build_object(
        'username', p.username,
        'city', p.city,
        'total_visits', count(v.*)::integer,
        'unique_visitors', greatest(
          count(distinct v.visitor_id) filter (where v.visitor_id is not null),
          count(*) filter (where v.is_unique)
        )::integer
      ) as row_data,
      count(v.*) as total_visits
      from public.profiles p
      left join public.address_visits v on v.username = p.username
      group by p.username, p.city
      order by total_visits desc
      limit 10
    ) ranked
  ),
  most_visited_cities as (
    select coalesce(jsonb_agg(row_data order by total_visits desc), '[]'::jsonb) as data
    from (
      select jsonb_build_object(
        'city', coalesce(nullif(trim(p.city), ''), 'غير محدد'),
        'total_visits', count(v.*)::integer,
        'addresses', count(distinct p.username)::integer
      ) as row_data,
      count(v.*) as total_visits
      from public.profiles p
      left join public.address_visits v on v.username = p.username
      group by coalesce(nullif(trim(p.city), ''), 'غير محدد')
      order by total_visits desc
      limit 10
    ) ranked
  ),
  registration_trend as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'date', days.day,
      'value', coalesce(counts.value, 0)
    ) order by days.day), '[]'::jsonb) as data
    from days
    left join (
      select created_at::date as day, count(*)::integer as value
      from public.profiles
      where created_at >= date_trunc('day', now()) - interval '13 days'
      group by created_at::date
    ) counts on counts.day = days.day
  ),
  visits_trend as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'date', days.day,
      'value', coalesce(counts.value, 0)
    ) order by days.day), '[]'::jsonb) as data
    from days
    left join (
      select visited_at::date as day, count(*)::integer as value
      from public.address_visits
      where visited_at >= date_trunc('day', now()) - interval '13 days'
      group by visited_at::date
    ) counts on counts.day = days.day
  ),
  unique_visitors_trend as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'date', days.day,
      'value', coalesce(counts.value, 0)
    ) order by days.day), '[]'::jsonb) as data
    from days
    left join (
      select
        visited_at::date as day,
        greatest(
          count(distinct visitor_id) filter (where visitor_id is not null),
          count(*) filter (where is_unique)
        )::integer as value
      from public.address_visits
      where visited_at >= date_trunc('day', now()) - interval '13 days'
      group by visited_at::date
    ) counts on counts.day = days.day
  )
select jsonb_build_object(
  'total_registered_addresses', address_counts.total_registered_addresses,
  'total_visits', visit_counts.total_visits,
  'total_unique_visitors', visit_counts.total_unique_visitors,
  'addresses_created_today', address_counts.addresses_created_today,
  'addresses_created_this_week', address_counts.addresses_created_this_week,
  'addresses_created_this_month', address_counts.addresses_created_this_month,
  'most_visited_addresses', most_visited_addresses.data,
  'most_visited_cities', most_visited_cities.data,
  'new_registrations_trend', registration_trend.data,
  'visits_trend', visits_trend.data,
  'unique_visitors_trend', unique_visitors_trend.data
)
from address_counts, visit_counts, most_visited_addresses, most_visited_cities,
  registration_trend, visits_trend, unique_visitors_trend;
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
  photo_stats as (
    select
      profile_id,
      count(*)::integer as photo_count
    from public.address_photos
    group by profile_id
  ),
  base as (
    select
      p.id,
      p.username,
      p.city,
      p.created_at,
      coalesce(vs.total_visits, 0) as total_visits,
      coalesce(vs.unique_visitors, 0) as unique_visitors,
      vs.last_visit_at,
      coalesce(ps.photo_count, 0) as photo_count
    from public.profiles p
    left join visit_stats vs on vs.username = p.username
    left join photo_stats ps on ps.profile_id = p.id
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
  photo_stats as (
    select
      profile_id,
      count(*)::integer as photo_count
    from public.address_photos
    group by profile_id
  ),
  base as (
    select
      p.id,
      p.username,
      p.city,
      p.created_at,
      coalesce(vs.total_visits, 0) as total_visits,
      coalesce(vs.unique_visitors, 0) as unique_visitors,
      vs.last_visit_at,
      coalesce(ps.photo_count, 0) as photo_count
    from public.profiles p
    left join visit_stats vs on vs.username = p.username
    left join photo_stats ps on ps.profile_id = p.id
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
      created_at desc
    limit safe_page_size
    offset offset_rows
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'username', username,
    'city', city,
    'created_at', created_at,
    'total_visits', total_visits,
    'unique_visitors', unique_visitors,
    'last_visit_at', last_visit_at,
    'photo_count', photo_count,
    'status', case
      when created_at >= now() - interval '7 days' then 'new'
      when last_visit_at >= now() - interval '30 days' then 'active'
      else 'inactive'
    end
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
