import { getPersistedCloudDeviceId, setPersistedCloudDeviceId, setPersistedDeviceAccessToken } from "@/lib/devices/deviceIdentity";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { CreateDevicePairingSessionInput, Device, DevicePairingSession, DevicePairingSessionStatus } from "@/types";

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


function createDeviceAccessToken() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) throw new Error("Secure random values are not available in this browser.");
  const bytes = new Uint8Array(32);
  cryptoApi.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
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

    const resolvedPersistedId = input.persistedDeviceId ?? getPersistedCloudDeviceId();
    const rawAccessToken = createDeviceAccessToken();
    const { data: nextSession, error } = await this.client.rpc("device_create_pairing_session", {
      p_device_name: input.deviceName,
      p_mode: input.mode,
      p_local_device_id: input.localDeviceId,
      p_persisted_device_id: resolvedPersistedId ?? null,
      p_access_token: rawAccessToken,
    });
    if (error) throw error;
    const row = Array.isArray(nextSession) ? nextSession[0] : nextSession;
    if (!row) throw new Error("Could not create pairing session.");

    setPersistedCloudDeviceId(row.device_id as string);
    setPersistedDeviceAccessToken(rawAccessToken);
    return mapPairingSession(row as DevicePairingSessionRow);
  }

  async getPairingSession(pairingCode: string) {
    if (!this.client) return null;

    const { data, error } = await this.client.rpc("device_get_pairing_session", { p_pairing_code: pairingCode.trim().toUpperCase() });

    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return row ? mapPairingSession(row as DevicePairingSessionRow) : null;
  }

  async claimPairingSession(pairingCode: string, householdId: string, memberId?: string) {
    if (!this.client) throw new Error("Cloud is not configured.");

    const { data, error } = await this.client.rpc("device_claim_pairing_session", {
      p_pairing_code: pairingCode.trim().toUpperCase(),
      p_household_id: householdId,
      p_member_id: memberId ?? null,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("Pairing code is not available.");
    return mapPairingSession(row as DevicePairingSessionRow);
  }

  async updateDeviceName(deviceId: string, name: string) {
    if (!this.client) throw new Error("Cloud is not configured.");
    const { error } = await this.client.rpc("device_update_name", { p_device_id: deviceId, p_name: name.trim().slice(0, 40) });
    if (error) throw error;
  }
}

export const devicePairingRepository = new SupabaseDevicePairingRepository();
