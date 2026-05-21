create or replace function public.device_request_adult_access(
  p_household_id uuid,
  p_cloud_device_id uuid,
  p_local_device_id text,
  p_device_access_token text
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
  if not public.device_is_linked_to_household(
    p_household_id,
    p_cloud_device_id,
    p_local_device_id,
    p_device_access_token
  ) then
    raise exception 'device is not linked to household';
  end if;

  select d.*
  into v_device
  from public.devices d
  where d.id = p_cloud_device_id
    and d.household_id = p_household_id
    and d.local_device_id = p_local_device_id
    and d.paired_at is not null
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
    and r.device_id = p_cloud_device_id
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
    and r.device_id = p_cloud_device_id
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
  values (p_household_id, p_cloud_device_id, p_local_device_id, 'pending', now(), now(), now())
  returning * into v_created;

  return v_created;
end;
$$;

revoke all on function public.device_request_adult_access(uuid, text) from public;
revoke all on function public.device_request_adult_access(uuid, uuid, text, text) from public;
grant execute on function public.device_request_adult_access(uuid, uuid, text, text) to anon, authenticated;
