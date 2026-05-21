"use client";

import { getLocalDeviceId, getPersistedCloudDeviceId } from "@/lib/devices/deviceIdentity";

export type DeviceAccessPayload = {
  cloudDeviceId: string;
  localDeviceId: string;
};

export function getDeviceAccessPayload(): DeviceAccessPayload | null {
  const cloudDeviceId = getPersistedCloudDeviceId();
  const localDeviceId = getLocalDeviceId();
  if (!cloudDeviceId || !localDeviceId) return null;
  return { cloudDeviceId, localDeviceId };
}
