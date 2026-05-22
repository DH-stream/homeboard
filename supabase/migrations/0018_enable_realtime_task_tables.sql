do $$
declare
  target_tables text[] := array[
    'tasks',
    'task_schedules',
    'task_instances',
    'household_task_day_status',
    'household_streaks'
  ];
  table_name text;
begin
  foreach table_name in array target_tables loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end
$$;
