"use client";

export type LocalDeviceIdentity = {
  id: string;
  createdAt: string;
};

const DEVICE_ID_STORAGE_KEY = "homeboard.deviceId.v1";
const DEVICE_CREATED_AT_STORAGE_KEY = "homeboard.deviceCreatedAt.v1";
const DEVICE_ID_PREFIX = "device";

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
