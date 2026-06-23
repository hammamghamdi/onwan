create or replace function public.check_public_address_rate_limit(
  p_ip_hash text,
  p_username text,
  p_user_agent text,
  p_now timestamptz,
  p_window_start timestamptz,
  p_blocked_until timestamptz,
  p_distinct_limit integer
)
returns table (
  is_blocked boolean,
  reason text,
  distinct_usernames integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  active_block_until timestamptz;
  distinct_count integer;
begin
  select public_address_blocks.blocked_until
  into active_block_until
  from public.public_address_blocks
  where public_address_blocks.ip_hash = p_ip_hash
    and public_address_blocks.blocked_until > p_now
  order by public_address_blocks.blocked_until desc
  limit 1;

  if active_block_until is not null then
    return query select true, 'active_block'::text, 0;
    return;
  end if;

  insert into public.public_address_access_logs (
    ip_hash,
    username,
    user_agent,
    created_at
  )
  values (
    p_ip_hash,
    p_username,
    p_user_agent,
    p_now
  );

  select count(distinct public_address_access_logs.username)
  into distinct_count
  from public.public_address_access_logs
  where public_address_access_logs.ip_hash = p_ip_hash
    and public_address_access_logs.created_at >= p_window_start;

  if distinct_count >= p_distinct_limit then
    insert into public.public_address_blocks (
      ip_hash,
      blocked_until,
      reason,
      created_at
    )
    values (
      p_ip_hash,
      p_blocked_until,
      'Opened 5 different usernames within 5 minutes',
      p_now
    );

    return query select true, 'limit_exceeded'::text, distinct_count;
    return;
  end if;

  return query select false, 'allowed'::text, distinct_count;
end;
$$;

grant execute on function public.check_public_address_rate_limit(
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  timestamptz,
  integer
)
to service_role;
