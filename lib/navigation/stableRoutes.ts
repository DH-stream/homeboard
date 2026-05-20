import { getDeviceProfile, readDeviceStartView } from "@/lib/devicePreferences";

const STABLE_ROUTES = new Set(["/app", "/wall"]);
const STORAGE_KEY = "homeboard.lastStableRoute.v1";

export function isStableAppRoute(pathname: string, searchParams?: URLSearchParams | null) {
  if (!STABLE_ROUTES.has(pathname)) return false;
  if (!searchParams) return true;
  return searchParams.get("setup") !== "1";
}

export function rememberStableRoute(pathname: string, searchParams?: URLSearchParams | null) {
  if (!isStableAppRoute(pathname, searchParams)) return;
  try { window.localStorage.setItem(STORAGE_KEY, pathname); } catch {}
}

export function getRememberedStableRoute() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value && STABLE_ROUTES.has(value) ? value : null;
  } catch {
    return null;
  }
}

export function getStableSettingsBackTarget(options: { returnTo: string | null; rememberedRoute: string | null }) {
  const { returnTo, rememberedRoute } = options;
  if (returnTo && STABLE_ROUTES.has(returnTo)) return returnTo;
  if (rememberedRoute && STABLE_ROUTES.has(rememberedRoute)) return rememberedRoute;
  const profile = readDeviceStartView()?.mode ?? getDeviceProfile();
  if (profile === "wall") return "/wall";
  return "/app";
}
