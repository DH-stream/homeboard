alter table calendar_connections
  alter column status type text,
  alter column status set default 'connected';

alter table calendar_connections
  add column if not exists last_error text;

alter table calendar_sources
  add column if not exists sync_url text,
  add column if not exists provider_metadata jsonb,
  add column if not exists last_synced_at timestamptz,
  add column if not exists last_error text;

alter table calendar_events
  add column if not exists timezone text,
  add column if not exists status text default 'confirmed',
  add column if not exists recurrence_key text,
  add column if not exists provider_metadata jsonb,
  add column if not exists raw jsonb;

create unique index if not exists calendar_events_source_external_occurrence_idx
  on calendar_events(source_id, external_event_id);
