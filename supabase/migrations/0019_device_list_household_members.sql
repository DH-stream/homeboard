create or replace function public.device_list_household_members(
  p_household_id uuid,
  p_cloud_device_id uuid,
  p_local_device_id text,
  p_device_access_token text
)
returns table (
  id uuid,
  household_id uuid,
  display_name text,
  color text,
  avatar_url text,
  role public.household_member_role,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.device_is_linked_to_household(p_household_id, p_cloud_device_id, p_local_device_id, p_device_access_token) then
    raise exception 'device is not linked to household';
  end if;

  return query
  select
    hm.id,
    hm.household_id,
    hm.display_name,
    hm.color,
    hm.avatar_url,
    hm.role,
    hm.user_id,
    hm.created_at,
    hm.updated_at
  from public.household_members hm
  where hm.household_id = p_household_id
  order by hm.created_at asc;
end;
$$;

revoke all on function public.device_list_household_members(uuid, uuid, text, text) from public;
grant execute on function public.device_list_household_members(uuid, uuid, text, text) to anon, authenticated;
