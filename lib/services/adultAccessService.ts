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
