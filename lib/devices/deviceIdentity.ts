"use client";

export type LocalDeviceIdentity = {
  id: string;
  createdAt: string;
};

const DEVICE_ID_STORAGE_KEY = "homeboard.deviceId.v1";
const DEVICE_CREATED_AT_STORAGE_KEY = "homeboard.deviceCreatedAt.v1";
const DEVICE_ID_PREFIX = "device";
const CLOUD_DEVICE_ID_STORAGE_KEY = "homeboard.cloudDeviceId.v1";
const DEVICE_ACCESS_TOKEN_STORAGE_KEY = "homeboard.deviceAccessToken.v1";

function createDeviceId() {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return `${DEVICE_ID_PREFIX}_${cryptoApi.randomUUID()}`;

  const fallback = Math.random().toString(36).slice(2, 12);
  return `${DEVICE_ID_PREFIX}_${Date.now().toString(36)}_${fallback}`;
}

export function getOrCreateLocalDeviceIdentity(): LocalDeviceIdentity | null {
  if (typeof window === "undefined") return null;

  let id = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY)?.trim() || null;
  let createdAt = window.localStorage.getItem(DEVICE_CREATED_AT_STORAGE_KEY)?.trim() || null;

  if (!id) {
    id = createDeviceId();
    createdAt = new Date().toISOString();
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, id);
    window.localStorage.setItem(DEVICE_CREATED_AT_STORAGE_KEY, createdAt);
  }

  if (!createdAt) {
    createdAt = new Date().toISOString();
    window.localStorage.setItem(DEVICE_CREATED_AT_STORAGE_KEY, createdAt);
  }

  return { id, createdAt };
}

export function getLocalDeviceId() {
  return getOrCreateLocalDeviceIdentity()?.id ?? null;
}

export function resetLocalDeviceIdentity() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEVICE_ID_STORAGE_KEY);
  window.localStorage.removeItem(DEVICE_CREATED_AT_STORAGE_KEY);
}


export function getPersistedCloudDeviceId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CLOUD_DEVICE_ID_STORAGE_KEY)?.trim() || null;
}

export function setPersistedCloudDeviceId(deviceId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLOUD_DEVICE_ID_STORAGE_KEY, deviceId);
}

export function clearPersistedCloudDeviceId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CLOUD_DEVICE_ID_STORAGE_KEY);
}

export function getPersistedDeviceAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DEVICE_ACCESS_TOKEN_STORAGE_KEY)?.trim() || null;
}

export function setPersistedDeviceAccessToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEVICE_ACCESS_TOKEN_STORAGE_KEY, token);
}

export function clearPersistedDeviceAccessToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEVICE_ACCESS_TOKEN_STORAGE_KEY);
}

export function resetCurrentCloudDeviceIdentity() {
  clearPersistedCloudDeviceId();
  clearPersistedDeviceAccessToken();
}
