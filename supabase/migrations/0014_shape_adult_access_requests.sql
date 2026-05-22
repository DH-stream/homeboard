drop function if exists public.adult_list_access_requests(uuid);

create or replace function public.adult_list_access_requests(
  p_household_id uuid
)
returns table (
  request_id uuid,
  household_id uuid,
  device_id uuid,
  local_device_id text,
  device_name text,
  status text,
  requested_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by_user_id uuid,
  cooldown_until timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    r.id as request_id,
    r.household_id,
    r.device_id,
    r.local_device_id,
    d.name as device_name,
    r.status,
    r.requested_at,
    r.reviewed_at,
    r.reviewed_by_user_id,
    r.cooldown_until,
    r.created_at,
    r.updated_at
  from public.adult_access_requests r
  left join public.devices d
    on d.id = r.device_id
   and d.household_id = r.household_id
  where r.household_id = p_household_id
    and public.is_household_adult(p_household_id)
  order by
    case when r.status = 'pending' then 0 else 1 end,
    r.requested_at desc;
$$;

revoke all on function public.adult_list_access_requests(uuid) from public;
grant execute on function public.adult_list_access_requests(uuid) to authenticated;
