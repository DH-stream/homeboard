create or replace function public.device_update_own_name(
  p_household_id uuid,
  p_cloud_device_id uuid,
  p_local_device_id text,
  p_device_access_token text,
  p_name text
)
returns table (
  id uuid,
  household_id uuid,
  local_device_id text,
  name text,
  mode text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  if not public.device_is_linked_to_household(p_household_id, p_cloud_device_id, p_local_device_id, p_device_access_token) then
    raise exception 'device is not linked to household';
  end if;

  v_name := btrim(coalesce(p_name, ''));
  if v_name = '' then
    raise exception 'name cannot be empty';
  end if;

  if char_length(v_name) > 40 then
    raise exception 'name is too long';
  end if;

  update public.devices d
  set name = v_name,
      updated_at = now()
  where d.id = p_cloud_device_id
    and d.household_id = p_household_id
    and d.local_device_id = p_local_device_id
    and d.access_token_hash = public.device_hash_access_token(p_device_access_token);

  return query
  select d.id, d.household_id, d.local_device_id, d.name, d.mode, d.updated_at
  from public.devices d
  where d.id = p_cloud_device_id
    and d.household_id = p_household_id
    and d.local_device_id = p_local_device_id
    and d.access_token_hash = public.device_hash_access_token(p_device_access_token);
end;
$$;

revoke all on function public.device_update_own_name(uuid, uuid, text, text, text) from public;
grant execute on function public.device_update_own_name(uuid, uuid, text, text, text) to anon, authenticated;
