-- Scoped HomeBoard hardening. No Heating, Health, Auth, or data tables touched.
-- Apply only after staging validation and explicit shared-database approval.
do $$
begin
 if to_regprocedure('public.homeboard_internal_upsert_household_streak_completion(uuid,date)') is not null then
  raise exception 'Internal streak helper already exists';
 end if;
 if to_regprocedure('public.upsert_household_streak_completion(uuid,date)') is null then
  raise exception 'Original streak function missing';
 end if;
end;
$$;

-- Preserve the original function body, unchanged, as a privileged helper.
alter function public.upsert_household_streak_completion(uuid,date)
 rename to homeboard_internal_upsert_household_streak_completion;
revoke all on function public.homeboard_internal_upsert_household_streak_completion(uuid,date)
 from public, anon, authenticated;
grant execute on function public.homeboard_internal_upsert_household_streak_completion(uuid,date)
 to service_role;

-- Retain the original browser RPC interface but require household membership.
create function public.upsert_household_streak_completion(
 p_household_id uuid, p_completed_date date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
 if auth.uid() is null or not public.is_household_member(p_household_id) then
  raise exception 'household membership required' using errcode='42501';
 end if;
 perform public.homeboard_internal_upsert_household_streak_completion(p_household_id,p_completed_date);
end;
$$;
revoke all on function public.upsert_household_streak_completion(uuid,date)
 from public, anon, authenticated;
grant execute on function public.upsert_household_streak_completion(uuid,date)
 to authenticated, service_role;

-- Devices authenticate with a separate token, not a user JWT; preserve this.
create or replace function public.device_upsert_completed_task_day(
 p_household_id uuid, p_date date,
 p_completed_task_count integer, p_required_task_count integer,
 p_cloud_device_id uuid, p_local_device_id text, p_device_access_token text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
 if not public.device_is_linked_to_household(
   p_household_id,p_cloud_device_id,p_local_device_id,p_device_access_token
 ) then
  raise exception 'device is not linked to household';
 end if;

 insert into public.household_task_day_status (
  household_id,date,status,completed_task_count,required_task_count,completed_at,updated_at
 ) values (
  p_household_id,p_date,'completed',p_completed_task_count,p_required_task_count,now(),now()
 )
 on conflict (household_id,date) do update set
  status='completed',completed_task_count=excluded.completed_task_count,
  required_task_count=excluded.required_task_count,completed_at=now(),updated_at=now();

 perform public.homeboard_internal_upsert_household_streak_completion(p_household_id,p_date);
end;
$$;
revoke all on function public.device_upsert_completed_task_day(
 uuid,date,integer,integer,uuid,text,text
) from public;
grant execute on function public.device_upsert_completed_task_day(
 uuid,date,integer,integer,uuid,text,text
) to anon, authenticated;

-- The raw calculation has a privileged device-only caller.
revoke all on function public.calculate_household_streak_from_day_status(uuid,date)
 from public, anon, authenticated;
grant execute on function public.calculate_household_streak_from_day_status(uuid,date)
 to service_role;
