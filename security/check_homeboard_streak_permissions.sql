-- Read-only verification after applying migration 0022.
-- Each column should return true.
select
 not has_function_privilege('anon',
   'public.upsert_household_streak_completion(uuid,date)', 'EXECUTE')
   as anon_streak_write_blocked,
 has_function_privilege('authenticated',
   'public.upsert_household_streak_completion(uuid,date)', 'EXECUTE')
   as member_streak_rpc_still_callable,
 not has_function_privilege('anon',
   'public.homeboard_internal_upsert_household_streak_completion(uuid,date)', 'EXECUTE')
   as anon_internal_helper_blocked,
 not has_function_privilege('authenticated',
   'public.homeboard_internal_upsert_household_streak_completion(uuid,date)', 'EXECUTE')
   as authenticated_internal_helper_blocked,
 not has_function_privilege('anon',
   'public.calculate_household_streak_from_day_status(uuid,date)', 'EXECUTE')
   as anon_streak_read_blocked,
 not has_function_privilege('authenticated',
   'public.calculate_household_streak_from_day_status(uuid,date)', 'EXECUTE')
   as direct_streak_read_blocked,
 has_function_privilege('anon',
   'public.device_upsert_completed_task_day(uuid,date,integer,integer,uuid,text,text)',
   'EXECUTE') as token_verified_device_route_still_callable,
 not has_schema_privilege('anon','heating','USAGE')
   as heating_private_from_anon,
 not has_schema_privilege('authenticated','heating','USAGE')
   as heating_private_from_users;
