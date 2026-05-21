create table if not exists public.household_adult_device_grants (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  local_device_id text not null,
  granted_by_user_id uuid,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists household_adult_device_grants_active_unique_idx
  on public.household_adult_device_grants(household_id, local_device_id)
  where revoked_at is null;

create index if not exists household_adult_device_grants_device_idx
  on public.household_adult_device_grants(device_id, household_id);

alter table public.household_adult_device_grants enable row level security;

drop policy if exists "deny all adult device grants" on public.household_adult_device_grants;
create policy "deny all adult device grants"
  on public.household_adult_device_grants
  for all
  to anon, authenticated
  using (false)
  with check (false);

create or replace function public.device_has_adult_access(
  p_household_id uuid,
  p_cloud_device_id uuid,
  p_local_device_id text,
  p_device_access_token text
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.device_is_linked_to_household(
      p_household_id,
      p_cloud_device_id,
      p_local_device_id,
      p_device_access_token
    )
    and exists (
      select 1
      from public.household_adult_device_grants g
      where g.household_id = p_household_id
        and g.device_id = p_cloud_device_id
        and g.local_device_id = p_local_device_id
        and g.revoked_at is null
    );
$$;
revoke all on function public.device_has_adult_access(uuid, uuid, text, text) from public;
grant execute on function public.device_has_adult_access(uuid, uuid, text, text) to anon, authenticated;

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
  v_grant_id uuid;
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

  if v_request.status = 'denied' then
    raise exception 'only pending requests can be approved';
  end if;

  if v_request.status = 'pending' then
    update public.adult_access_requests r
    set status = 'approved',
        reviewed_at = now(),
        reviewed_by_user_id = auth.uid(),
        cooldown_until = null,
        updated_at = now()
    where r.id = v_request.id;
  end if;

  insert into public.household_adult_device_grants (
    household_id,
    device_id,
    local_device_id,
    granted_by_user_id,
    granted_at,
    created_at,
    updated_at
  )
  values (
    v_request.household_id,
    v_request.device_id,
    v_request.local_device_id,
    auth.uid(),
    now(),
    now(),
    now()
  )
  on conflict (household_id, local_device_id)
  where revoked_at is null
  do update
  set granted_by_user_id = excluded.granted_by_user_id,
      granted_at = excluded.granted_at,
      updated_at = now()
  returning id into v_grant_id;

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

  if v_request.status = 'approved' then
    raise exception 'only pending requests can be denied';
  end if;

  if v_request.status = 'pending' then
    update public.adult_access_requests r
    set status = 'denied',
        reviewed_at = now(),
        reviewed_by_user_id = auth.uid(),
        cooldown_until = now() + interval '15 minutes',
        updated_at = now()
    where r.id = v_request.id;
  end if;

  select r.* into v_request
  from public.adult_access_requests r
  where r.id = p_request_id;

  return v_request;
end;
$$;
revoke all on function public.adult_deny_access_request(uuid) from public;
grant execute on function public.adult_deny_access_request(uuid) to authenticated;
