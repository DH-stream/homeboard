create or replace function public.device_get_household_streak(
  p_household_id uuid,
  p_cloud_device_id uuid,
  p_local_device_id text,
  p_device_access_token text
)
returns table (
  household_id uuid,
  current_streak integer,
  longest_streak integer,
  last_completed_date date,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anchor date;
  v_backfill integer;
begin
  if not public.device_is_linked_to_household(p_household_id, p_cloud_device_id, p_local_device_id, p_device_access_token) then
    raise exception 'device is not linked to household';
  end if;

  insert into public.household_streaks (household_id)
  values (p_household_id)
  on conflict (household_id) do nothing;

  select max(s.date)
  into v_anchor
  from public.household_task_day_status s
  where s.household_id = p_household_id
    and s.status = 'completed';

  if v_anchor is not null then
    select public.calculate_household_streak_from_day_status(p_household_id, v_anchor)
    into v_backfill;

    update public.household_streaks hs
    set current_streak = greatest(hs.current_streak, coalesce(v_backfill, 0)),
        longest_streak = greatest(hs.longest_streak, greatest(hs.current_streak, coalesce(v_backfill, 0))),
        last_completed_date = coalesce(hs.last_completed_date, v_anchor),
        updated_at = now()
    where hs.household_id = p_household_id;
  end if;

  return query
  select hs.household_id, hs.current_streak, hs.longest_streak, hs.last_completed_date, hs.updated_at
  from public.household_streaks hs
  where hs.household_id = p_household_id;
end;
$$;

revoke all on function public.device_get_household_streak(uuid, uuid, text, text) from public;
grant execute on function public.device_get_household_streak(uuid, uuid, text, text) to anon, authenticated;

create or replace function public.device_upsert_completed_task_day(
  p_household_id uuid,
  p_date date,
  p_completed_task_count integer,
  p_required_task_count integer,
  p_cloud_device_id uuid,
  p_local_device_id text,
  p_device_access_token text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.device_is_linked_to_household(p_household_id, p_cloud_device_id, p_local_device_id, p_device_access_token) then
    raise exception 'device is not linked to household';
  end if;

  insert into public.household_task_day_status (
    household_id, date, status, completed_task_count, required_task_count, completed_at, updated_at
  ) values (
    p_household_id, p_date, 'completed', p_completed_task_count, p_required_task_count, now(), now()
  )
  on conflict (household_id, date)
  do update set
    status = 'completed',
    completed_task_count = excluded.completed_task_count,
    required_task_count = excluded.required_task_count,
    completed_at = now(),
    updated_at = now();

  perform public.upsert_household_streak_completion(p_household_id, p_date);
end;
$$;

revoke all on function public.device_upsert_completed_task_day(uuid, date, integer, integer, uuid, text, text) from public;
grant execute on function public.device_upsert_completed_task_day(uuid, date, integer, integer, uuid, text, text) to anon, authenticated;
