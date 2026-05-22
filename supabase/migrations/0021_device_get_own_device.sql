create or replace function public.device_get_own_device(
  p_household_id uuid,
  p_cloud_device_id uuid,
  p_local_device_id text,
  p_device_access_token text
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
begin
  if not public.device_is_linked_to_household(p_household_id, p_cloud_device_id, p_local_device_id, p_device_access_token) then
    raise exception 'device is not linked to household';
  end if;

  return query
  select d.id, d.household_id, d.local_device_id, d.name, d.mode, d.updated_at
  from public.devices d
  where d.id = p_cloud_device_id
    and d.household_id = p_household_id
    and d.local_device_id = p_local_device_id
    and d.access_token_hash = public.device_hash_access_token(p_device_access_token);
end;
$$;

revoke all on function public.device_get_own_device(uuid, uuid, text, text) from public;
grant execute on function public.device_get_own_device(uuid, uuid, text, text) to anon, authenticated;
