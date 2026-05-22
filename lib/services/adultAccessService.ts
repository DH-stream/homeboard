import { getDeviceAccessPayload } from "@/lib/devices/deviceAccess";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type AdultAccessCheckResult = {
  hasAdultAccess: boolean;
  reason: "ok" | "missing_context" | "unavailable";
};

export type AdultAccessRequestResult = {
  status: "requested" | "pending";
};

export type AdultAccessRequestErrorKind = "missing_context" | "cooldown" | "unavailable" | "unknown";
export type AdultAccessRequestStatus = "pending" | "approved" | "denied";
export type AdultAccessRequestRecord = {
  requestId: string;
  status: AdultAccessRequestStatus;
  requestedAt: string | null;
  deviceName: string | null;
};

export class AdultAccessRequestError extends Error {
  kind: AdultAccessRequestErrorKind;

  constructor(kind: AdultAccessRequestErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

function hasPendingHint(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("pending") || normalized.includes("already requested") || normalized.includes("already exists");
}

function hasCooldownHint(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("cooldown") || normalized.includes("recently denied") || normalized.includes("try again later");
}

export async function checkDeviceAdultAccess(householdId: string | null): Promise<AdultAccessCheckResult> {
  if (!householdId) return { hasAdultAccess: false, reason: "missing_context" };
  const deviceAccess = getDeviceAccessPayload();
  if (!deviceAccess) return { hasAdultAccess: false, reason: "missing_context" };

  const client = createBrowserSupabaseClient();
  if (!client) return { hasAdultAccess: false, reason: "unavailable" };

  const { data, error } = await client.rpc("device_has_adult_access", {
    p_household_id: householdId,
    p_cloud_device_id: deviceAccess.cloudDeviceId,
    p_local_device_id: deviceAccess.localDeviceId,
    p_device_access_token: deviceAccess.accessToken,
  });

  if (error) throw new AdultAccessRequestError("unknown", error.message || "Could not check adult access.");
  return { hasAdultAccess: Boolean(data), reason: "ok" };
}

export async function requestAdultAccess(householdId: string | null): Promise<AdultAccessRequestResult> {
  if (!householdId) throw new AdultAccessRequestError("missing_context", "Household context is missing.");
  const deviceAccess = getDeviceAccessPayload();
  if (!deviceAccess) throw new AdultAccessRequestError("missing_context", "Device pairing context is missing.");

  const client = createBrowserSupabaseClient();
  if (!client) throw new AdultAccessRequestError("unavailable", "Cloud is unavailable.");

  const { error } = await client.rpc("device_request_adult_access", {
    p_household_id: householdId,
    p_cloud_device_id: deviceAccess.cloudDeviceId,
    p_local_device_id: deviceAccess.localDeviceId,
    p_device_access_token: deviceAccess.accessToken,
  });

  if (!error) return { status: "requested" };

  const message = error.message || "Could not request adult access.";
  if (hasPendingHint(message)) return { status: "pending" };
  if (hasCooldownHint(message)) throw new AdultAccessRequestError("cooldown", message);
  throw new AdultAccessRequestError("unknown", message);
}

export async function listAdultAccessRequests(householdId: string | null): Promise<AdultAccessRequestRecord[]> {
  if (!householdId) return [];
  const client = createBrowserSupabaseClient();
  if (!client) throw new AdultAccessRequestError("unavailable", "Cloud is unavailable.");

  const { data, error } = await client.rpc("adult_list_access_requests", {
    p_household_id: householdId,
  });

  if (error) throw new AdultAccessRequestError("unknown", error.message || "Could not list access requests.");
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const requestId = typeof record.request_id === "string"
        ? record.request_id
        : typeof record.id === "string"
          ? record.id
          : null;
      if (!requestId) return null;
      const statusValue = typeof record.status === "string" ? record.status : "pending";
      const status: AdultAccessRequestStatus = statusValue === "approved" || statusValue === "denied" ? statusValue : "pending";
      return {
        requestId,
        status,
        requestedAt: typeof record.requested_at === "string" ? record.requested_at : null,
        deviceName: typeof record.device_name === "string" ? record.device_name : null,
      } satisfies AdultAccessRequestRecord;
    })
    .filter((item): item is AdultAccessRequestRecord => Boolean(item));
}

export async function approveAdultAccessRequest(requestId: string): Promise<void> {
  const client = createBrowserSupabaseClient();
  if (!client) throw new AdultAccessRequestError("unavailable", "Cloud is unavailable.");

  const { error } = await client.rpc("adult_approve_access_request", {
    p_request_id: requestId,
  });
  if (error) throw new AdultAccessRequestError("unknown", error.message || "Could not approve access request.");
}

export async function denyAdultAccessRequest(requestId: string): Promise<void> {
  const client = createBrowserSupabaseClient();
  if (!client) throw new AdultAccessRequestError("unavailable", "Cloud is unavailable.");

  const { error } = await client.rpc("adult_deny_access_request", {
    p_request_id: requestId,
  });
  if (error) throw new AdultAccessRequestError("unknown", error.message || "Could not deny access request.");
}
