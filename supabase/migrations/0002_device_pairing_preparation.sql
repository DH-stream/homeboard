-- Future wall/kiosk device pairing preparation.
-- Pairing security, API boundaries, and RLS policies are intentionally not implemented here.

create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  mode text not null default 'wall',
  last_seen_at timestamptz,
  paired_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists device_pairing_sessions (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references devices(id) on delete cascade,
  pairing_code text not null,
  status text not null default 'pending',
  expires_at timestamptz not null,
  claimed_by_member_id uuid references household_members(id) on delete set null,
  household_id uuid references households(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists devices_household_id_idx on devices(household_id);
create index if not exists device_pairing_sessions_device_id_idx on device_pairing_sessions(device_id);
create index if not exists device_pairing_sessions_code_status_idx on device_pairing_sessions(pairing_code, status);
create index if not exists device_pairing_sessions_expires_at_idx on device_pairing_sessions(expires_at);
