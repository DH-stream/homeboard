create extension if not exists pgcrypto;

create or replace function public.is_household_adult(p_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
      and hm.role = 'adult'
  );
$$;

drop function if exists public.device_get_household_summary(uuid, uuid, text);
drop function if exists public.device_list_completed_task_days(uuid, uuid, text);
drop function if exists public.device_upsert_completed_task_day(uuid, date, integer, integer, uuid, text);
drop function if exists public.device_is_linked_to_household(uuid, uuid, text);

alter table public.devices
  add column if not exists access_token_hash text;

create or replace function public.device_hash_access_token(p_access_token text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select encode(digest(p_access_token, 'sha256'), 'hex');
$$;

revoke all on function public.device_hash_access_token(text) from public;
grant execute on function public.device_hash_access_token(text) to anon, authenticated;

create or replace function public.device_is_linked_to_household(
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
  select exists (
    select 1
    from public.devices d
    where d.id = p_cloud_device_id
      and d.household_id = p_household_id
      and d.paired_at is not null
      and d.access_token_hash is not null
      and d.access_token_hash = public.device_hash_access_token(p_device_access_token)
      and (d.local_device_id is null or d.local_device_id = p_local_device_id)
  );
$$;

revoke all on function public.device_is_linked_to_household(uuid, uuid, text, text) from public;
grant execute on function public.device_is_linked_to_household(uuid, uuid, text, text) to anon, authenticated;

create or replace function public.device_get_household_summary(
  p_household_id uuid,
  p_cloud_device_id uuid,
  p_local_device_id text,
  p_device_access_token text
)
returns table (id uuid, name text, created_at timestamptz, updated_at timestamptz)
language sql security definer set search_path = public stable
as $$
  select h.id, h.name, h.created_at, h.updated_at
  from public.households h
  where h.id = p_household_id
    and public.device_is_linked_to_household(p_household_id, p_cloud_device_id, p_local_device_id, p_device_access_token);
$$;

revoke all on function public.device_get_household_summary(uuid, uuid, text, text) from public;
grant execute on function public.device_get_household_summary(uuid, uuid, text, text) to anon, authenticated;

create or replace function public.device_list_completed_task_days(
  p_household_id uuid,
  p_cloud_device_id uuid,
  p_local_device_id text,
  p_device_access_token text
)
returns setof public.household_task_day_status
language sql security definer set search_path = public stable
as $$
  select s.*
  from public.household_task_day_status s
  where s.household_id = p_household_id
    and s.status = 'completed'
    and public.device_is_linked_to_household(p_household_id, p_cloud_device_id, p_local_device_id, p_device_access_token)
  order by s.date desc;
$$;

revoke all on function public.device_list_completed_task_days(uuid, uuid, text, text) from public;
grant execute on function public.device_list_completed_task_days(uuid, uuid, text, text) to anon, authenticated;

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
end;
$$;

revoke all on function public.device_upsert_completed_task_day(uuid, date, integer, integer, uuid, text, text) from public;
grant execute on function public.device_upsert_completed_task_day(uuid, date, integer, integer, uuid, text, text) to anon, authenticated;

alter table public.devices enable row level security;
alter table public.device_pairing_sessions enable row level security;

drop policy if exists "deny all devices" on public.devices;
create policy "deny all devices" on public.devices for all to anon, authenticated using (false) with check (false);

drop policy if exists "deny all pairing sessions" on public.device_pairing_sessions;
create policy "deny all pairing sessions" on public.device_pairing_sessions for all to anon, authenticated using (false) with check (false);

create or replace function public.device_get(p_device_id uuid)
returns table (
  id uuid,
  household_id uuid,
  name text,
  mode text,
  last_seen_at timestamptz,
  paired_at timestamptz,
  paired_by_user_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select d.id, d.household_id, d.name, d.mode, d.last_seen_at, d.paired_at, d.paired_by_user_id, d.created_at, d.updated_at
  from public.devices d
  where d.id = p_device_id
    and d.household_id is not null
    and public.is_household_adult(d.household_id);
$$;
revoke all on function public.device_get(uuid) from public;
grant execute on function public.device_get(uuid) to authenticated;

create or replace function public.device_list_household_devices(p_household_id uuid)
returns table (
  id uuid,
  household_id uuid,
  name text,
  mode text,
  last_seen_at timestamptz,
  paired_at timestamptz,
  paired_by_user_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language sql security definer set search_path = public stable
as $$
  select d.id, d.household_id, d.name, d.mode, d.last_seen_at, d.paired_at, d.paired_by_user_id, d.created_at, d.updated_at
  from public.devices d
  where d.household_id = p_household_id
    and public.is_household_adult(p_household_id)
  order by d.updated_at desc;
$$;
revoke all on function public.device_list_household_devices(uuid) from public;
grant execute on function public.device_list_household_devices(uuid) to authenticated;

create or replace function public.device_update_name(p_device_id uuid, p_name text)
returns table (
  id uuid,
  household_id uuid,
  name text,
  mode text,
  last_seen_at timestamptz,
  paired_at timestamptz,
  paired_by_user_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql security definer set search_path = public
as $$
declare v_household_id uuid;
begin
  select d.household_id into v_household_id from public.devices d where d.id = p_device_id;
  if v_household_id is null or not public.is_household_adult(v_household_id) then
    raise exception 'adult access required';
  end if;

  update public.devices
  set name = left(trim(p_name), 40), updated_at = now()
  where id = p_device_id;
  return query
  select d.id, d.household_id, d.name, d.mode, d.last_seen_at, d.paired_at, d.paired_by_user_id, d.created_at, d.updated_at
  from public.devices d
  where d.id = p_device_id;
end;
$$;
revoke all on function public.device_update_name(uuid, text) from public;
grant execute on function public.device_update_name(uuid, text) to authenticated;

drop function if exists public.device_unlink_from_household(uuid);

create or replace function public.device_unlink_from_household(p_household_id uuid, p_device_id uuid)
returns table (
  id uuid,
  household_id uuid,
  name text,
  mode text,
  last_seen_at timestamptz,
  paired_at timestamptz,
  paired_by_user_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_household_adult(p_household_id) then
    raise exception 'adult access required';
  end if;

  update public.devices
  set household_id = null, paired_at = null, access_token_hash = null, updated_at = now()
  where id = p_device_id and household_id = p_household_id;

  update public.device_pairing_sessions
  set status = 'expired', updated_at = now()
  where device_id = p_device_id and status = 'pending';

  return query
  select d.id, d.household_id, d.name, d.mode, d.last_seen_at, d.paired_at, d.paired_by_user_id, d.created_at, d.updated_at
  from public.devices d
  where d.id = p_device_id;
end;
$$;
revoke all on function public.device_unlink_from_household(uuid, uuid) from public;
grant execute on function public.device_unlink_from_household(uuid, uuid) to authenticated;

create or replace function public.device_get_pairing_session(p_pairing_code text)
returns table (
  id uuid,
  device_id uuid,
  pairing_code text,
  status text,
  expires_at timestamptz,
  household_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  device_mode text,
  device_name text
)
language sql security definer set search_path = public stable
as $$
  select s.id, s.device_id, s.pairing_code, s.status, s.expires_at, s.household_id, s.created_at, s.updated_at, d.mode, d.name
  from public.device_pairing_sessions s
  join public.devices d on d.id = s.device_id
  where s.pairing_code = upper(trim(p_pairing_code))
  order by s.created_at desc
  limit 1;
$$;
revoke all on function public.device_get_pairing_session(text) from public;
grant execute on function public.device_get_pairing_session(text) to anon, authenticated;

create or replace function public.device_claim_pairing_session(p_pairing_code text, p_household_id uuid, p_member_id uuid)
returns table (
  id uuid,
  device_id uuid,
  pairing_code text,
  status text,
  expires_at timestamptz,
  household_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  device_mode text,
  device_name text
)
language plpgsql security definer set search_path = public
as $$
declare v_session public.device_pairing_sessions%rowtype;
begin
  if not public.is_household_adult(p_household_id) then
    raise exception 'adult access required';
  end if;

  if p_member_id is not null and not exists (
    select 1 from public.household_members hm where hm.id = p_member_id and hm.household_id = p_household_id
  ) then
    raise exception 'member does not belong to household';
  end if;

  select * into v_session
  from public.device_pairing_sessions
  where pairing_code = upper(trim(p_pairing_code))
    and status = 'pending'
    and expires_at > now()
  order by created_at desc
  limit 1;

  if v_session.id is null then
    return;
  end if;

  update public.device_pairing_sessions
  set status = 'claimed', household_id = p_household_id, claimed_by_member_id = p_member_id, updated_at = now()
  where id = v_session.id;

  update public.devices
  set household_id = p_household_id, paired_at = now(), last_seen_at = now(), updated_at = now()
  where id = v_session.device_id;

  return query
  select s.id, s.device_id, s.pairing_code, s.status, s.expires_at, s.household_id, s.created_at, s.updated_at, d.mode, d.name
  from public.device_pairing_sessions s
  join public.devices d on d.id = s.device_id
  where s.id = v_session.id;
end;
$$;
revoke all on function public.device_claim_pairing_session(text, uuid, uuid) from public;
grant execute on function public.device_claim_pairing_session(text, uuid, uuid) to authenticated;

create or replace function public.device_create_pairing_session(
  p_device_name text,
  p_mode text,
  p_local_device_id text,
  p_persisted_device_id uuid,
  p_access_token text
)
returns setof public.device_pairing_sessions
language plpgsql security definer set search_path = public
as $$
declare
  v_device public.devices%rowtype;
  v_session public.device_pairing_sessions%rowtype;
  v_code text;
  i integer;
begin
  if p_persisted_device_id is not null then
    select * into v_device
    from public.devices
    where id = p_persisted_device_id
      and household_id is null
      and paired_at is null;
  end if;

  if v_device.id is null then
    select * into v_device
    from public.devices
    where local_device_id = p_local_device_id
      and household_id is null
      and paired_at is null
    limit 1;
  end if;

  if v_device.id is null then
    insert into public.devices(name, mode, local_device_id, last_seen_at, access_token_hash)
    values (p_device_name, p_mode, p_local_device_id, now(), public.device_hash_access_token(p_access_token))
    returning * into v_device;
  else
    update public.devices
    set name = p_device_name,
      mode = p_mode,
      local_device_id = p_local_device_id,
      last_seen_at = now(),
      updated_at = now(),
      access_token_hash = public.device_hash_access_token(p_access_token)
    where id = v_device.id
    returning * into v_device;
  end if;

  for i in 1..5 loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    begin
      insert into public.device_pairing_sessions(device_id, pairing_code, status, expires_at)
      values (v_device.id, v_code, 'pending', now() + interval '2 minutes')
      returning * into v_session;
      exit;
    exception
      when unique_violation then
        if i = 5 then
          raise;
        end if;
    end;
  end loop;

  return query
  select s.id, s.device_id, s.pairing_code, s.status, s.expires_at, s.household_id, s.created_at, s.updated_at, d.mode, d.name
  from public.device_pairing_sessions s
  join public.devices d on d.id = s.device_id
  where s.id = v_session.id;
end;
$$;
revoke all on function public.device_create_pairing_session(text, text, text, uuid, text) from public;
grant execute on function public.device_create_pairing_session(text, text, text, uuid, text) to anon, authenticated;
