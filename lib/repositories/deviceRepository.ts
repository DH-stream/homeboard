import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Device } from "@/types";

type DeviceRow = {
  id: string;
  household_id: string;
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
    householdId: row.household_id,
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
}

export class SupabaseDeviceRepository implements DeviceRepository {
  private readonly client = createBrowserSupabaseClient();

  async listDevices(householdId?: string | null) {
    if (!this.client || !householdId) return [];

    const { data, error } = await this.client
      .from("devices")
      .select("id, household_id, name, mode, last_seen_at, paired_at, paired_by_user_id, created_at, updated_at")
      .eq("household_id", householdId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return ((data ?? []) as DeviceRow[]).map(mapDevice);
  }

  async updateDeviceName(deviceId: string, name: string) {
    if (!this.client) throw new Error("Supabase client unavailable");

    const { data, error } = await this.client
      .from("devices")
      .update({ name })
      .eq("id", deviceId)
      .select("id, household_id, name, mode, last_seen_at, paired_at, paired_by_user_id, created_at, updated_at")
      .single();

    if (error) throw error;
    return mapDevice(data as DeviceRow);
  }
}

export const deviceRepository = new SupabaseDeviceRepository();
