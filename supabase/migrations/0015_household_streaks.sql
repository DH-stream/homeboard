create table if not exists public.household_streaks (
  household_id uuid primary key references public.households(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_completed_date date,
  updated_at timestamptz not null default now()
);

create or replace function public.upsert_household_streak_completion(
  p_household_id uuid,
  p_completed_date date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current integer := 0;
  v_longest integer := 0;
  v_last date;
  v_next integer;
begin
  insert into public.household_streaks (household_id)
  values (p_household_id)
  on conflict (household_id) do nothing;

  select current_streak, longest_streak, last_completed_date
  into v_current, v_longest, v_last
  from public.household_streaks
  where household_id = p_household_id
  for update;

  if v_last = p_completed_date then
    return;
  end if;

  if v_last = (p_completed_date - interval '1 day')::date then
    v_next := v_current + 1;
  else
    v_next := 1;
  end if;

  update public.household_streaks
  set current_streak = v_next,
      longest_streak = greatest(v_longest, v_next),
      last_completed_date = p_completed_date,
      updated_at = now()
  where household_id = p_household_id;
end;
$$;

create or replace function public.calculate_household_streak_from_day_status(
  p_household_id uuid,
  p_anchor_date date
)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  with ordered as (
    select s.date,
           (p_anchor_date - s.date) as day_offset,
           row_number() over (order by s.date desc) - 1 as idx
    from public.household_task_day_status s
    where s.household_id = p_household_id
      and s.status = 'completed'
      and s.date <= p_anchor_date
    order by s.date desc
  )
  select coalesce(count(*), 0)::integer
  from ordered
  where day_offset = idx;
$$;
