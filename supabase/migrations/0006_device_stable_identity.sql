alter table devices
  add column if not exists local_device_id text;

create unique index if not exists devices_local_device_id_unique_idx
  on devices(local_device_id)
  where local_device_id is not null;
