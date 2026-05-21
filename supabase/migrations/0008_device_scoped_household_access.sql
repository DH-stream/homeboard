-- Device-scoped read/write path for paired wall/mobile access.
-- This does not grant adult/admin permissions.

create or replace function public.device_is_linked_to_household(
  p_household_id uuid,
  p_cloud_device_id uuid,
  p_local_device_id text
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.devices d
    where d.id = p_cloud_device_id
      and d.household_id = p_household_id
      and (d.local_device_id is null or d.local_device_id = p_local_device_id)
  );
$$;

revoke all on function public.device_is_linked_to_household(uuid, uuid, text) from public;
grant execute on function public.device_is_linked_to_household(uuid, uuid, text) to anon, authenticated;

create or replace function public.device_get_household_summary(
  p_household_id uuid,
  p_cloud_device_id uuid,
  p_local_device_id text
)
returns table (
  id uuid,
  name text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select h.id, h.name, h.created_at, h.updated_at
  from public.households h
  where h.id = p_household_id
    and public.device_is_linked_to_household(p_household_id, p_cloud_device_id, p_local_device_id);
$$;

revoke all on function public.device_get_household_summary(uuid, uuid, text) from public;
grant execute on function public.device_get_household_summary(uuid, uuid, text) to anon, authenticated;

create or replace function public.device_list_completed_task_days(
  p_household_id uuid,
  p_cloud_device_id uuid,
  p_local_device_id text
)
returns setof public.household_task_day_status
language sql
security definer
set search_path = public
stable
as $$
  select s.*
  from public.household_task_day_status s
  where s.household_id = p_household_id
    and s.status = 'completed'
    and public.device_is_linked_to_household(p_household_id, p_cloud_device_id, p_local_device_id)
  order by s.date desc;
$$;

revoke all on function public.device_list_completed_task_days(uuid, uuid, text) from public;
grant execute on function public.device_list_completed_task_days(uuid, uuid, text) to anon, authenticated;

create or replace function public.device_upsert_completed_task_day(
  p_household_id uuid,
  p_date date,
  p_completed_task_count integer,
  p_required_task_count integer,
  p_cloud_device_id uuid,
  p_local_device_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.device_is_linked_to_household(p_household_id, p_cloud_device_id, p_local_device_id) then
    raise exception 'device is not linked to household';
  end if;

  insert into public.household_task_day_status (
    household_id,
    date,
    status,
    completed_task_count,
    required_task_count,
    completed_at,
    updated_at
  ) values (
    p_household_id,
    p_date,
    'completed',
    p_completed_task_count,
    p_required_task_count,
    now(),
    now()
  )
  on conflict (household_id, date)
  do update set
    status = 'completed',
    completed_task_count = excluded.completed_task_count,
    required_task_count = excluded.required_task_count,
    completed_at = now(),
    updated_at = now();
end;
$$;

revoke all on function public.device_upsert_completed_task_day(uuid, date, integer, integer, uuid, text) from public;
grant execute on function public.device_upsert_completed_task_day(uuid, date, integer, integer, uuid, text) to anon, authenticated;
