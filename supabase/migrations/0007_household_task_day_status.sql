create table if not exists public.household_task_day_status (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  date date not null,
  status text not null default 'completed',
  completed_at timestamptz not null default now(),
  completed_task_count integer not null default 0,
  required_task_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, date)
);

create index if not exists household_task_day_status_household_date_idx
  on public.household_task_day_status (household_id, date desc);

alter table public.household_task_day_status enable row level security;

drop policy if exists "members can read household task day status" on public.household_task_day_status;
drop policy if exists "members can create household task day status" on public.household_task_day_status;
drop policy if exists "members can update household task day status" on public.household_task_day_status;

create policy "members can read household task day status"
on public.household_task_day_status
for select
to authenticated
using (public.is_household_member(household_id));

create policy "members can create household task day status"
on public.household_task_day_status
for insert
to authenticated
with check (public.is_household_member(household_id));

create policy "members can update household task day status"
on public.household_task_day_status
for update
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));
