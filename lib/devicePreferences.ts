export type DeviceMode = "wall" | "mobile" | "admin";
export type DefaultRoute = "/wall" | "/app" | "/settings";

export type DeviceStartView = {
  mode: DeviceMode;
  route: DefaultRoute;
};

export const DEVICE_MODE_STORAGE_KEY = "homeboard.deviceMode.v1";
export const DEFAULT_ROUTE_STORAGE_KEY = "homeboard.defaultRoute.v1";
export const DEVICE_ID_STORAGE_KEY = "homeboard.deviceId.v1";
export const ADULT_ACCESS_REQUIRED_REASON = "ADULT_ACCESS_REQUIRED";

export const DEVICE_START_VIEW_OPTIONS: DeviceStartView[] = [
  { mode: "wall", route: "/wall" },
  { mode: "mobile", route: "/app" },
  { mode: "admin", route: "/app" },
];

const validRoutes = new Set<DefaultRoute>(DEVICE_START_VIEW_OPTIONS.map((option) => option.route));
const validModes = new Set<DeviceMode>(DEVICE_START_VIEW_OPTIONS.map((option) => option.mode));

export function getDefaultRouteForMode(mode: DeviceMode): DefaultRoute {
  return DEVICE_START_VIEW_OPTIONS.find((option) => option.mode === mode)?.route ?? "/app";
}

export function isDeviceMode(value: string | null): value is DeviceMode {
  return value !== null && validModes.has(value as DeviceMode);
}

export function isDefaultRoute(value: string | null): value is DefaultRoute {
  return value !== null && validRoutes.has(value as DefaultRoute);
}

export function readDeviceStartView(): DeviceStartView | null {
  if (typeof window === "undefined") return null;

  const route = window.localStorage.getItem(DEFAULT_ROUTE_STORAGE_KEY);
  const mode = window.localStorage.getItem(DEVICE_MODE_STORAGE_KEY);

  if (!isDefaultRoute(route)) return null;

  return {
    mode: isDeviceMode(mode) ? mode : DEVICE_START_VIEW_OPTIONS.find((option) => option.route === route)?.mode ?? "mobile",
    route,
  };
}

export function saveDeviceStartView(startView: DeviceStartView) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(DEVICE_MODE_STORAGE_KEY, startView.mode);
  window.localStorage.setItem(DEFAULT_ROUTE_STORAGE_KEY, startView.route);
}

export function resetDeviceStartView() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(DEVICE_MODE_STORAGE_KEY);
  window.localStorage.removeItem(DEFAULT_ROUTE_STORAGE_KEY);
}

export function getDeviceProfile() {
  return readDeviceStartView()?.mode ?? null;
}

export function setDeviceProfile(mode: DeviceMode) {
  const nextStartView = { mode, route: getDefaultRouteForMode(mode) };
  saveDeviceStartView(nextStartView);
  return nextStartView;
}

export function resetDeviceProfile() {
  // Device profile reset is intentionally scoped to mode/start-route only.
  // Do not clear device identity, household selection, or auth/session state here.
  resetDeviceStartView();
}

function createDeviceId() {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return `device_${cryptoApi.randomUUID()}`;

  const fallback = Math.random().toString(36).slice(2, 12);
  return `device_${Date.now().toString(36)}_${fallback}`;
}

export function getDeviceId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DEVICE_ID_STORAGE_KEY)?.trim() || null;
}

export function getOrCreateDeviceId() {
  if (typeof window === "undefined") return null;

  const existingId = getDeviceId();
  if (existingId) return existingId;

  const nextId = createDeviceId();
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, nextId);
  return nextId;
}

export function canAccessFullSettings(mode: DeviceMode | null, hasAdultAccess: boolean) {
  return mode === "admin" && hasAdultAccess;
}

export function canManageHouseholdSettings(mode: DeviceMode | null, hasAdultAccess: boolean) {
  return canAccessFullSettings(mode, hasAdultAccess);
}

export function canManageDeviceLocalSettings(mode: DeviceMode | null) {
  return mode === "wall";
}

export function canSelectAdultProfile(hasAdultAccess: boolean) {
  return hasAdultAccess;
}

export function canAccessLightSettings(mode: DeviceMode | null) {
  return mode === "admin" || mode === "mobile" || mode === "wall";
}

export function shouldShowDebugNavigation() {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEBUG_NAV === "true";
}
