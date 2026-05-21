"use client";

import { getLocalDeviceId, getPersistedCloudDeviceId, getPersistedDeviceAccessToken } from "@/lib/devices/deviceIdentity";

export type DeviceAccessPayload = {
  cloudDeviceId: string;
  localDeviceId: string;
  accessToken: string;
};

export function getDeviceAccessPayload(): DeviceAccessPayload | null {
  const cloudDeviceId = getPersistedCloudDeviceId();
  const localDeviceId = getLocalDeviceId();
  const accessToken = getPersistedDeviceAccessToken();
  if (!cloudDeviceId || !localDeviceId || !accessToken) return null;
  return { cloudDeviceId, localDeviceId, accessToken };
}

export function hasIncompleteCloudDeviceAccess() {
  const cloudDeviceId = getPersistedCloudDeviceId();
  const accessToken = getPersistedDeviceAccessToken();
  return Boolean(cloudDeviceId && !accessToken);
}
