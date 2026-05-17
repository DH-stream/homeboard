-- HomeBoard durable calendar foundation.
-- OAuth/provider tokens are intentionally not stored in these public client tables.
-- Future provider credentials must be stored server-side only and encrypted/secured.

create extension if not exists pgcrypto;

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  display_name text not null,
  color text not null,
  avatar_url text,
  role text not null default 'adult',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists calendar_connections (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  connected_by_member_id uuid references household_members(id) on delete set null,
  provider text not null check (provider in ('google', 'microsoft', 'icloud_caldav', 'ics', 'manual')),
  account_label text not null,
  account_email text,
  status text not null default 'needs_setup',
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists calendar_sources (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  connection_id uuid references calendar_connections(id) on delete cascade,
  provider_calendar_id text not null,
  name text not null,
  color text,
  enabled boolean not null default true,
  visibility text not null default 'household',
  sync_mode text not null default 'read_only',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (connection_id, provider_calendar_id)
);

create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  source_id uuid references calendar_sources(id) on delete cascade,
  external_event_id text not null,
  title text not null,
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  color text,
  raw_updated_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (source_id, external_event_id)
);

create index if not exists calendar_sources_household_id_idx on calendar_sources(household_id);
create index if not exists calendar_sources_connection_id_idx on calendar_sources(connection_id);
create index if not exists calendar_events_household_id_start_at_idx on calendar_events(household_id, start_at);
create index if not exists calendar_events_source_id_start_at_idx on calendar_events(source_id, start_at);
