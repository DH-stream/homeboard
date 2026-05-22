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

  if v_last is not null and p_completed_date < v_last then
    return;
  end if;

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

alter table public.household_streaks enable row level security;

drop policy if exists "deny all household streaks" on public.household_streaks;
create policy "deny all household streaks"
on public.household_streaks
for all
to anon, authenticated
using (false)
with check (false);
