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

create or replace function public.calendar_list_connections(p_household_id uuid)
returns table (
  id uuid,
  household_id uuid,
  connected_by_member_id uuid,
  provider text,
  account_label text,
  account_email text,
  status text,
  last_synced_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql security definer set search_path = public stable
as $$
  select c.id, c.household_id, c.connected_by_member_id, c.provider, c.account_label, c.account_email, c.status, c.last_synced_at, c.created_at, c.updated_at
  from public.calendar_connections c
  where c.household_id = p_household_id
    and public.is_household_adult(p_household_id)
  order by c.created_at asc;
$$;
revoke all on function public.calendar_list_connections(uuid) from public;
grant execute on function public.calendar_list_connections(uuid) to authenticated;

create or replace function public.calendar_list_sources(p_household_id uuid)
returns table (
  id uuid,
  household_id uuid,
  connection_id uuid,
  provider_calendar_id text,
  name text,
  color text,
  enabled boolean,
  visibility text,
  sync_mode text,
  sync_url text,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql security definer set search_path = public stable
as $$
  select s.id, s.household_id, s.connection_id, s.provider_calendar_id, s.name, s.color, s.enabled, s.visibility, s.sync_mode, s.sync_url, s.last_synced_at, s.last_error, s.created_at, s.updated_at
  from public.calendar_sources s
  where s.household_id = p_household_id
    and public.is_household_adult(p_household_id)
  order by s.name asc;
$$;
revoke all on function public.calendar_list_sources(uuid) from public;
grant execute on function public.calendar_list_sources(uuid) to authenticated;

create or replace function public.calendar_create_ics_source(p_household_id uuid, p_name text, p_sync_url text, p_color text, p_enabled boolean)
returns table (
  id uuid,
  household_id uuid,
  connection_id uuid,
  provider_calendar_id text,
  name text,
  color text,
  enabled boolean,
  visibility text,
  sync_mode text,
  sync_url text,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql security definer set search_path = public
as $$
declare v_connection_id uuid;
declare v_name text;
declare v_sync_url text;
begin
  if not public.is_household_adult(p_household_id) then raise exception 'adult access required'; end if;
  v_name := left(trim(coalesce(p_name, '')), 80);
  v_sync_url := trim(coalesce(p_sync_url, ''));
  if v_name = '' or v_sync_url = '' then raise exception 'missing calendar fields'; end if;

  select c.id into v_connection_id from public.calendar_connections c where c.household_id = p_household_id and c.provider = 'ics' order by c.created_at asc limit 1;
  if v_connection_id is null then
    insert into public.calendar_connections(household_id, provider, account_label, status)
    values (p_household_id, 'ics', 'Calendar link', 'connected')
    returning id into v_connection_id;
  end if;

  return query
  insert into public.calendar_sources(household_id, connection_id, provider_calendar_id, name, color, enabled, sync_url)
  values (p_household_id, v_connection_id, 'ics:' || replace(gen_random_uuid()::text, '-', ''), v_name, p_color, p_enabled, v_sync_url)
  returning calendar_sources.id, calendar_sources.household_id, calendar_sources.connection_id, calendar_sources.provider_calendar_id, calendar_sources.name, calendar_sources.color, calendar_sources.enabled, calendar_sources.visibility, calendar_sources.sync_mode, calendar_sources.sync_url, calendar_sources.last_synced_at, calendar_sources.last_error, calendar_sources.created_at, calendar_sources.updated_at;
end;
$$;
revoke all on function public.calendar_create_ics_source(uuid, text, text, text, boolean) from public;
grant execute on function public.calendar_create_ics_source(uuid, text, text, text, boolean) to authenticated;

create or replace function public.calendar_update_source_enabled(p_source_id uuid, p_enabled boolean)
returns table (
  id uuid,
  household_id uuid,
  connection_id uuid,
  provider_calendar_id text,
  name text,
  color text,
  enabled boolean,
  visibility text,
  sync_mode text,
  sync_url text,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql security definer set search_path = public
as $$
declare v_household_id uuid;
begin
  select s.household_id into v_household_id from public.calendar_sources s where s.id = p_source_id;
  if v_household_id is null then raise exception 'calendar source not found'; end if;
  if not public.is_household_adult(v_household_id) then raise exception 'adult access required'; end if;

  return query
  update public.calendar_sources s
  set enabled = p_enabled, updated_at = now()
  where s.id = p_source_id
  returning s.id, s.household_id, s.connection_id, s.provider_calendar_id, s.name, s.color, s.enabled, s.visibility, s.sync_mode, s.sync_url, s.last_synced_at, s.last_error, s.created_at, s.updated_at;
end;
$$;
revoke all on function public.calendar_update_source_enabled(uuid, boolean) from public;
grant execute on function public.calendar_update_source_enabled(uuid, boolean) to authenticated;

create or replace function public.calendar_adult_list_enabled_events(p_household_id uuid)
returns table (
  id uuid,
  household_id uuid,
  source_id uuid,
  external_event_id text,
  title text,
  description text,
  location text,
  start_at timestamptz,
  end_at timestamptz,
  all_day boolean,
  color text
)
language sql security definer set search_path = public stable
as $$
  select e.id, e.household_id, e.source_id, e.external_event_id, e.title, e.description, e.location, e.start_at, e.end_at, e.all_day, e.color
  from public.calendar_events e
  where e.household_id = p_household_id
    and public.is_household_adult(p_household_id)
    and exists (select 1 from public.calendar_sources s where s.id = e.source_id and s.enabled)
  order by e.start_at asc;
$$;
revoke all on function public.calendar_adult_list_enabled_events(uuid) from public;
grant execute on function public.calendar_adult_list_enabled_events(uuid) to authenticated;


create or replace function public.calendar_device_list_enabled_events(
  p_household_id uuid,
  p_cloud_device_id uuid,
  p_local_device_id text,
  p_device_access_token text
)
returns table (
  id uuid,
  household_id uuid,
  source_id uuid,
  external_event_id text,
  title text,
  description text,
  location text,
  start_at timestamptz,
  end_at timestamptz,
  all_day boolean,
  color text
)
language sql security definer set search_path = public stable
as $$
  select e.id, e.household_id, e.source_id, e.external_event_id, e.title, e.description, e.location, e.start_at, e.end_at, e.all_day, e.color
  from public.calendar_events e
  where e.household_id = p_household_id
    and public.device_is_linked_to_household(p_household_id, p_cloud_device_id, p_local_device_id, p_device_access_token)
    and exists (select 1 from public.calendar_sources s where s.id = e.source_id and s.enabled)
  order by e.start_at asc;
$$;
revoke all on function public.calendar_device_list_enabled_events(uuid, uuid, text, text) from public;
grant execute on function public.calendar_device_list_enabled_events(uuid, uuid, text, text) to anon, authenticated;
