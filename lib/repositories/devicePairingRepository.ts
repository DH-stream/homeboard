import { getPersistedCloudDeviceId, setPersistedCloudDeviceId } from "@/lib/devices/deviceIdentity";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { CreateDevicePairingSessionInput, Device, DevicePairingSession, DevicePairingSessionStatus } from "@/types";

type DeviceRow = {
  id: string;
  household_id: string | null;
  name: string;
  mode: Device["mode"];
  last_seen_at: string | null;
  paired_at: string | null;
  created_at: string;
  updated_at: string;
  paired_by_user_id: string | null;
  local_device_id: string | null;
};

type DevicePairingSessionRow = {
  id: string;
  device_id: string;
  pairing_code: string;
  status: DevicePairingSessionStatus;
  expires_at: string;
  claimed_by_member_id: string | null;
  household_id: string | null;
  created_at: string;
  updated_at: string;
  devices?: JoinedDevice | JoinedDevice[] | null;
};

type JoinedDevice = { mode: Device["mode"]; name: string };

function getJoinedDevice(row: DevicePairingSessionRow): JoinedDevice | null {
  const joined = row.devices;
  if (Array.isArray(joined)) return joined[0] ?? null;
  return joined ?? null;
}

const PAIRING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PAIRING_CODE_LENGTH = 6;
const PAIRING_CODE_CREATE_ATTEMPTS = 3;
const PAIRING_TTL_MINUTES = 2;

function createPairingCode() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) throw new Error("Secure random values are not available in this browser.");

  const values = new Uint32Array(PAIRING_CODE_LENGTH);
  cryptoApi.getRandomValues(values);
  return Array.from(values, (value) => PAIRING_CODE_ALPHABET[value % PAIRING_CODE_ALPHABET.length]).join("");
}

function isPossibleDuplicateCodeError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505");
}

function mapPairingSession(row: DevicePairingSessionRow): DevicePairingSession {
  const isExpired = row.status === "pending" && new Date(row.expires_at).getTime() <= Date.now();
  const joinedDevice = getJoinedDevice(row);
  return {
    id: row.id,
    deviceId: row.device_id,
    pairingCode: row.pairing_code,
    status: isExpired ? "expired" : row.status,
    expiresAt: row.expires_at,
    householdId: row.household_id ?? undefined,
    claimedByMemberId: row.claimed_by_member_id ?? undefined,
    deviceMode: joinedDevice?.mode,
    deviceName: joinedDevice?.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface DevicePairingRepository {
  createWallPairingSession(input: CreateDevicePairingSessionInput): Promise<DevicePairingSession>;
  getPairingSession(pairingCode: string): Promise<DevicePairingSession | null>;
  claimPairingSession(pairingCode: string, householdId: string, memberId?: string): Promise<DevicePairingSession>;
  updateDeviceName(deviceId: string, name: string): Promise<void>;
}

export class SupabaseDevicePairingRepository implements DevicePairingRepository {
  private readonly client = createBrowserSupabaseClient();

  async createWallPairingSession(input: CreateDevicePairingSessionInput) {
    if (!this.client) throw new Error("Cloud is not configured.");

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + PAIRING_TTL_MINUTES * 60 * 1000).toISOString();
    const selectDeviceColumns = "id, household_id, name, mode, last_seen_at, paired_at, paired_by_user_id, local_device_id, created_at, updated_at";

    const resolvedPersistedId = input.persistedDeviceId ?? getPersistedCloudDeviceId();
    let device: DeviceRow | null = null;

    if (resolvedPersistedId) {
      const { data: existingByPersisted } = await this.client
        .from("devices")
        .select(selectDeviceColumns)
        .eq("id", resolvedPersistedId)
        .maybeSingle();
      device = (existingByPersisted as DeviceRow | null) ?? null;
    }

    if (!device) {
      const { data: existingByLocal } = await this.client
        .from("devices")
        .select(selectDeviceColumns)
        .eq("local_device_id", input.localDeviceId)
        .maybeSingle();
      device = (existingByLocal as DeviceRow | null) ?? null;
    }

    if (device) {
      const { data: updatedDevice, error: updateError } = await this.client
        .from("devices")
        .update({ last_seen_at: now, updated_at: now })
        .eq("id", device.id)
        .select(selectDeviceColumns)
        .single();
      if (updateError) throw updateError;
      device = updatedDevice as DeviceRow;
    } else {
      const { data: createdDevice, error: deviceError } = await this.client
        .from("devices")
        .insert({ name: input.deviceName, mode: input.mode, last_seen_at: now, local_device_id: input.localDeviceId })
        .select(selectDeviceColumns)
        .single();
      if (deviceError) throw deviceError;
      device = createdDevice as DeviceRow;
    }

    setPersistedCloudDeviceId(device.id);

    let lastError: unknown = null;
    for (let attempt = 0; attempt < PAIRING_CODE_CREATE_ATTEMPTS; attempt += 1) {
      const { data: session, error: sessionError } = await this.client
        .from("device_pairing_sessions")
        .insert({ device_id: device.id, pairing_code: createPairingCode(), status: "pending", expires_at: expiresAt })
        .select("id, device_id, pairing_code, status, expires_at, claimed_by_member_id, household_id, created_at, updated_at, devices:device_id(mode,name)")
        .single();

      if (!sessionError) return mapPairingSession(session as DevicePairingSessionRow);
      lastError = sessionError;
      if (!isPossibleDuplicateCodeError(sessionError)) break;
    }

    throw lastError;
  }

  async getPairingSession(pairingCode: string) {
    if (!this.client) return null;

    const { data, error } = await this.client
      .from("device_pairing_sessions")
      .select("id, device_id, pairing_code, status, expires_at, claimed_by_member_id, household_id, created_at, updated_at, devices:device_id(mode,name)")
      .eq("pairing_code", pairingCode.trim().toUpperCase())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? mapPairingSession(data as DevicePairingSessionRow) : null;
  }

  async claimPairingSession(pairingCode: string, householdId: string, memberId?: string) {
    if (!this.client) throw new Error("Cloud is not configured.");

    const session = await this.getPairingSession(pairingCode);
    if (!session || session.status !== "pending") throw new Error("Pairing code is not available.");

    const now = new Date().toISOString();
    const { data: updatedSession, error: sessionError } = await this.client
      .from("device_pairing_sessions")
      .update({ status: "claimed", household_id: householdId, claimed_by_member_id: memberId ?? null, updated_at: now })
      .eq("id", session.id)
      .eq("status", "pending")
      .gt("expires_at", now)
      .select("id, device_id, pairing_code, status, expires_at, claimed_by_member_id, household_id, created_at, updated_at, devices:device_id(mode,name)")
      .single();

    if (sessionError) throw sessionError;

    const { error: deviceError } = await this.client
      .from("devices")
      .update({ household_id: householdId, paired_at: now, last_seen_at: now, updated_at: now })
      .eq("id", session.deviceId);

    if (deviceError) throw deviceError;
    return mapPairingSession(updatedSession as DevicePairingSessionRow);
  }

  async updateDeviceName(deviceId: string, name: string) {
    if (!this.client) throw new Error("Cloud is not configured.");
    const { error } = await this.client
      .from("devices")
      .update({ name: name.trim().slice(0, 40), updated_at: new Date().toISOString() })
      .eq("id", deviceId);
    if (error) throw error;
  }
}

export const devicePairingRepository = new SupabaseDevicePairingRepository();
