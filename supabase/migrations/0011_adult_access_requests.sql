create table if not exists public.adult_access_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  local_device_id text not null,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by_user_id uuid,
  cooldown_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint adult_access_requests_status_check check (status in ('pending', 'approved', 'denied'))
);

create index if not exists adult_access_requests_household_status_idx
  on public.adult_access_requests(household_id, status, requested_at desc);

create index if not exists adult_access_requests_device_idx
  on public.adult_access_requests(device_id, requested_at desc);

create unique index if not exists adult_access_requests_pending_unique_idx
  on public.adult_access_requests(household_id, local_device_id)
  where status = 'pending';

alter table public.adult_access_requests enable row level security;

drop policy if exists "deny all adult access requests" on public.adult_access_requests;
create policy "deny all adult access requests"
  on public.adult_access_requests
  for all
  to anon, authenticated
  using (false)
  with check (false);

create or replace function public.device_request_adult_access(
  p_household_id uuid,
  p_local_device_id text
)
returns public.adult_access_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device public.devices%rowtype;
  v_existing public.adult_access_requests%rowtype;
  v_created public.adult_access_requests%rowtype;
begin
  select d.*
  into v_device
  from public.devices d
  where d.household_id = p_household_id
    and d.local_device_id = p_local_device_id
    and d.paired_at is not null
  order by d.updated_at desc
  limit 1;

  if v_device.id is null then
    raise exception 'device is not linked to household';
  end if;

  if v_device.mode = 'wall' then
    raise exception 'wall devices cannot request adult access';
  end if;

  select r.*
  into v_existing
  from public.adult_access_requests r
  where r.household_id = p_household_id
    and r.local_device_id = p_local_device_id
    and r.status = 'pending'
  order by r.requested_at desc
  limit 1;

  if v_existing.id is not null then
    return v_existing;
  end if;

  select r.*
  into v_existing
  from public.adult_access_requests r
  where r.household_id = p_household_id
    and r.local_device_id = p_local_device_id
    and r.status = 'denied'
    and r.cooldown_until is not null
    and r.cooldown_until > now()
  order by r.cooldown_until desc
  limit 1;

  if v_existing.id is not null then
    raise exception 'adult access request cooldown active until %', v_existing.cooldown_until;
  end if;

  insert into public.adult_access_requests (household_id, device_id, local_device_id, status, requested_at, created_at, updated_at)
  values (p_household_id, v_device.id, p_local_device_id, 'pending', now(), now(), now())
  returning * into v_created;

  return v_created;
end;
$$;
revoke all on function public.device_request_adult_access(uuid, text) from public;
grant execute on function public.device_request_adult_access(uuid, text) to anon, authenticated;

create or replace function public.adult_list_access_requests(
  p_household_id uuid
)
returns setof public.adult_access_requests
language sql
security definer
set search_path = public
stable
as $$
  select r.*
  from public.adult_access_requests r
  where r.household_id = p_household_id
    and public.is_household_adult(p_household_id)
  order by
    case when r.status = 'pending' then 0 else 1 end,
    r.requested_at desc;
$$;
revoke all on function public.adult_list_access_requests(uuid) from public;
grant execute on function public.adult_list_access_requests(uuid) to authenticated;

create or replace function public.adult_approve_access_request(
  p_request_id uuid
)
returns public.adult_access_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.adult_access_requests%rowtype;
begin
  select r.* into v_request
  from public.adult_access_requests r
  where r.id = p_request_id;

  if v_request.id is null then
    raise exception 'adult access request not found';
  end if;

  if not public.is_household_adult(v_request.household_id) then
    raise exception 'adult access required';
  end if;

  if exists (
    select 1
    from public.devices d
    where d.id = v_request.device_id
      and d.mode = 'wall'
  ) then
    raise exception 'wall devices cannot receive adult access';
  end if;

  update public.adult_access_requests r
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by_user_id = auth.uid(),
      cooldown_until = null,
      updated_at = now()
  where r.id = v_request.id
    and r.status = 'pending';

  select r.* into v_request
  from public.adult_access_requests r
  where r.id = p_request_id;

  return v_request;
end;
$$;
revoke all on function public.adult_approve_access_request(uuid) from public;
grant execute on function public.adult_approve_access_request(uuid) to authenticated;

create or replace function public.adult_deny_access_request(
  p_request_id uuid
)
returns public.adult_access_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.adult_access_requests%rowtype;
begin
  select r.* into v_request
  from public.adult_access_requests r
  where r.id = p_request_id;

  if v_request.id is null then
    raise exception 'adult access request not found';
  end if;

  if not public.is_household_adult(v_request.household_id) then
    raise exception 'adult access required';
  end if;

  update public.adult_access_requests r
  set status = 'denied',
      reviewed_at = now(),
      reviewed_by_user_id = auth.uid(),
      cooldown_until = now() + interval '15 minutes',
      updated_at = now()
  where r.id = v_request.id
    and r.status = 'pending';

  select r.* into v_request
  from public.adult_access_requests r
  where r.id = p_request_id;

  return v_request;
end;
$$;
revoke all on function public.adult_deny_access_request(uuid) from public;
grant execute on function public.adult_deny_access_request(uuid) to authenticated;
