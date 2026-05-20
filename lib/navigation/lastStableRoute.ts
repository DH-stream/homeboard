export const LAST_STABLE_ROUTE_KEY = "homeboard.lastStableRoute.v1";

const SAFE_SETTINGS_RETURN_ROUTES = new Set(["/app", "/wall"]);

export function isSafeSettingsReturnRoute(route: string | null | undefined): route is "/app" | "/wall" {
  return Boolean(route && SAFE_SETTINGS_RETURN_ROUTES.has(route));
}

export function saveLastStableRoute(route: string) {
  if (!isSafeSettingsReturnRoute(route)) return;
  try {
    window.localStorage.setItem(LAST_STABLE_ROUTE_KEY, route);
  } catch {
    // ignore storage failures
  }
}

export function readLastStableRoute() {
  try {
    const value = window.localStorage.getItem(LAST_STABLE_ROUTE_KEY);
    return isSafeSettingsReturnRoute(value) ? value : null;
  } catch {
    return null;
  }
}
