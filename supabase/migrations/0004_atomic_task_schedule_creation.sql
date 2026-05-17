-- Atomic task + schedule creation for the schedule-derived task model.
-- PostgreSQL functions run in one transaction, so a schedule insert failure rolls back the task insert.

create or replace function public.create_task_with_schedule(
  p_household_id uuid,
  p_title text,
  p_description text default null,
  p_assigned_to_member_id uuid default null,
  p_source text default 'manual',
  p_schedule_type text default 'once',
  p_due_date timestamptz default null,
  p_times_of_day text[] default null,
  p_days_of_week integer[] default null,
  p_starts_on date default null,
  p_ends_on date default null,
  p_task_id uuid default gen_random_uuid(),
  p_schedule_id uuid default gen_random_uuid()
)
returns table (
  task_id uuid,
  household_id uuid,
  title text,
  description text,
  assigned_to_member_id uuid,
  status text,
  source text,
  task_created_at timestamptz,
  task_updated_at timestamptz,
  schedule_id uuid,
  schedule_type text,
  schedule_due_date timestamptz,
  schedule_times_of_day text[],
  schedule_days_of_week integer[],
  schedule_starts_on date,
  schedule_ends_on date,
  schedule_created_at timestamptz,
  schedule_updated_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_task record;
  v_schedule record;
begin
  insert into tasks (
    id,
    household_id,
    title,
    description,
    assigned_to_member_id,
    status,
    source
  )
  values (
    coalesce(p_task_id, gen_random_uuid()),
    p_household_id,
    p_title,
    p_description,
    p_assigned_to_member_id,
    'active',
    coalesce(p_source, 'manual')
  )
  returning * into v_task;

  insert into task_schedules (
    id,
    task_id,
    type,
    due_date,
    times_of_day,
    days_of_week,
    starts_on,
    ends_on
  )
  values (
    coalesce(p_schedule_id, gen_random_uuid()),
    v_task.id,
    p_schedule_type,
    p_due_date,
    p_times_of_day,
    p_days_of_week,
    p_starts_on,
    p_ends_on
  )
  returning * into v_schedule;

  return query select
    v_task.id,
    v_task.household_id,
    v_task.title,
    v_task.description,
    v_task.assigned_to_member_id,
    v_task.status,
    v_task.source,
    v_task.created_at,
    v_task.updated_at,
    v_schedule.id,
    v_schedule.type,
    v_schedule.due_date,
    v_schedule.times_of_day,
    v_schedule.days_of_week,
    v_schedule.starts_on,
    v_schedule.ends_on,
    v_schedule.created_at,
    v_schedule.updated_at;
end;
$$;
