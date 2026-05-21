import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Device } from "@/types";

type DeviceRow = {
  id: string;
  household_id: string | null;
  name: string | null;
  mode: Device["mode"];
  last_seen_at: string | null;
  paired_at: string | null;
  paired_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapDevice(row: DeviceRow): Device {
  return {
    id: row.id,
    householdId: row.household_id ?? "",
    name: row.name ?? "",
    mode: row.mode,
    lastSeenAt: row.last_seen_at ?? undefined,
    pairedAt: row.paired_at ?? undefined,
    pairedByUserId: row.paired_by_user_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface DeviceRepository {
  listDevices(householdId?: string | null): Promise<Device[]>;
  updateDeviceName(deviceId: string, name: string): Promise<Device>;
  unlinkDeviceFromHousehold(householdId: string, deviceId: string): Promise<Device>;
  getDevice(deviceId: string): Promise<Device | null>;
}

export class SupabaseDeviceRepository implements DeviceRepository {
  private readonly client = createBrowserSupabaseClient();

  async listDevices(householdId?: string | null) {
    if (!this.client || !householdId) return [];
    const { data, error } = await this.client.rpc("device_list_household_devices", { p_household_id: householdId });

    if (error) throw error;
    return ((data ?? []) as DeviceRow[]).map(mapDevice);
  }

  async updateDeviceName(deviceId: string, name: string) {
    if (!this.client) throw new Error("Supabase client unavailable");

    const { data, error } = await this.client.rpc("device_update_name", { p_device_id: deviceId, p_name: name });

    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return mapDevice(row as DeviceRow);
  }

  async unlinkDeviceFromHousehold(householdId: string, deviceId: string) {
    if (!this.client) throw new Error("Supabase client unavailable");

    const { data, error } = await this.client.rpc("device_unlink_from_household", { p_household_id: householdId, p_device_id: deviceId });

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    return mapDevice(row as DeviceRow);
  }

  async getDevice(deviceId: string) {
    if (!this.client) return null;

    const { data, error } = await this.client.rpc("device_get", { p_device_id: deviceId });

    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return mapDevice(row as DeviceRow);
  }
}

export const deviceRepository = new SupabaseDeviceRepository();
