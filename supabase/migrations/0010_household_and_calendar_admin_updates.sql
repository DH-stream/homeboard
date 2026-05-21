create or replace function public.device_hash_access_token(p_access_token text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select encode(extensions.digest(p_access_token, 'sha256'), 'hex');
$$;

create or replace function public.is_household_adult(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.role = 'adult'
  )
  or exists (
    select 1
    from public.households h
    where h.id = target_household_id
      and h.owner_user_id = auth.uid()
  );
$$;

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

  update public.devices as d
  set name = left(trim(p_name), 40), updated_at = now()
  where d.id = p_device_id;

  return query
  select d.id, d.household_id, d.name, d.mode, d.last_seen_at, d.paired_at, d.paired_by_user_id, d.created_at, d.updated_at
  from public.devices d
  where d.id = p_device_id;
end;
$$;

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

  update public.devices as d
  set household_id = null, paired_at = null, access_token_hash = null, updated_at = now()
  where d.id = p_device_id and d.household_id = p_household_id;

  update public.device_pairing_sessions as s
  set status = 'expired', updated_at = now()
  where s.device_id = p_device_id and s.status = 'pending';

  return query
  select d.id, d.household_id, d.name, d.mode, d.last_seen_at, d.paired_at, d.paired_by_user_id, d.created_at, d.updated_at
  from public.devices d
  where d.id = p_device_id;
end;
$$;

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
  from public.device_pairing_sessions as s
  where s.pairing_code = upper(trim(p_pairing_code))
    and s.status = 'pending'
    and s.expires_at > now()
  order by s.created_at desc
  limit 1;

  if v_session.id is null then return; end if;

  update public.device_pairing_sessions as s
  set status = 'claimed', household_id = p_household_id, claimed_by_member_id = p_member_id, updated_at = now()
  where s.id = v_session.id;

  update public.devices as d
  set household_id = p_household_id, paired_at = now(), last_seen_at = now(), updated_at = now()
  where d.id = v_session.device_id;

  return query
  select s.id, s.device_id, s.pairing_code, s.status, s.expires_at, s.household_id, s.created_at, s.updated_at, d.mode, d.name
  from public.device_pairing_sessions s
  join public.devices d on d.id = s.device_id
  where s.id = v_session.id;
end;
$$;

create or replace function public.device_create_pairing_session(
  p_device_name text,
  p_mode text,
  p_local_device_id text,
  p_persisted_device_id uuid,
  p_access_token text
)
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
declare v_device public.devices%rowtype; v_session public.device_pairing_sessions%rowtype; v_code text; i integer;
begin
  if p_persisted_device_id is not null then
    select * into v_device from public.devices as d where d.id = p_persisted_device_id and d.household_id is null and d.paired_at is null;
  end if;

  if v_device.id is null then
    select * into v_device from public.devices as d where d.local_device_id = p_local_device_id and d.household_id is null and d.paired_at is null limit 1;
  end if;

  if v_device.id is null then
    insert into public.devices(name, mode, local_device_id, last_seen_at, access_token_hash)
    values (p_device_name, p_mode, p_local_device_id, now(), public.device_hash_access_token(p_access_token))
    returning * into v_device;
  else
    update public.devices as d
    set name = p_device_name, mode = p_mode, local_device_id = p_local_device_id, last_seen_at = now(), updated_at = now(), access_token_hash = public.device_hash_access_token(p_access_token)
    where d.id = v_device.id
    returning * into v_device;
  end if;

  for i in 1..5 loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    begin
      insert into public.device_pairing_sessions(device_id, pairing_code, status, expires_at)
      values (v_device.id, v_code, 'pending', now() + interval '2 minutes') returning * into v_session;
      exit;
    exception when unique_violation then if i = 5 then raise; end if;
    end;
  end loop;

  return query
  select s.id, s.device_id, s.pairing_code, s.status, s.expires_at, s.household_id, s.created_at, s.updated_at, d.mode, d.name
  from public.device_pairing_sessions s
  join public.devices d on d.id = s.device_id
  where s.id = v_session.id;
end;
$$;

create or replace function public.household_update_name(p_household_id uuid, p_name text)
returns table (id uuid, name text, owner_user_id uuid, created_at timestamptz, updated_at timestamptz)
language plpgsql security definer set search_path = public
as $$
declare v_name text;
begin
  if not public.is_household_adult(p_household_id) then raise exception 'adult access required'; end if;
  v_name := left(trim(coalesce(p_name, '')), 40);
  if v_name = '' then raise exception 'household name required'; end if;

  update public.households as h
  set name = v_name, updated_at = now()
  where h.id = p_household_id;

  return query
  select h.id, h.name, h.owner_user_id, h.created_at, h.updated_at
  from public.households h
  where h.id = p_household_id;
end;
$$;
revoke all on function public.household_update_name(uuid, text) from public;
grant execute on function public.household_update_name(uuid, text) to authenticated;

create or replace function public.calendar_remove_source(p_source_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_household_id uuid;
begin
  select s.household_id into v_household_id from public.calendar_sources as s where s.id = p_source_id;
  if v_household_id is null then raise exception 'calendar source not found'; end if;
  if not public.is_household_adult(v_household_id) then raise exception 'adult access required'; end if;

  delete from public.calendar_events as e where e.source_id = p_source_id;
  delete from public.calendar_sources as s where s.id = p_source_id;
end;
$$;
revoke all on function public.calendar_remove_source(uuid) from public;
grant execute on function public.calendar_remove_source(uuid) to authenticated;
