-- Stable identity for derived task occurrences.
-- Format used by the client: task_id::YYYY-MM-DD::HH:mm in the user's local time.
-- task_instances stores per-occurrence state only; future occurrences are derived from tasks + task_schedules.

alter table if exists task_instances
  add column if not exists occurrence_key text;

update task_instances
set occurrence_key = task_id::text || '::' || to_char(due_date at time zone current_setting('TimeZone'), 'YYYY-MM-DD') || '::' || to_char(due_date at time zone current_setting('TimeZone'), 'HH24:MI')
where occurrence_key is null
  and task_id is not null
  and due_date is not null;

create unique index if not exists task_instances_task_id_occurrence_key_idx
  on task_instances(task_id, occurrence_key)
  where occurrence_key is not null;
