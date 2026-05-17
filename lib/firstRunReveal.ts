export type FirstRunRevealRoute = "wall" | "app" | "settings";

const PENDING_FIRST_RUN_REVEAL_KEY = "homeboard.pendingFirstRunReveal.v1";
const VALID_REVEAL_ROUTES: FirstRunRevealRoute[] = ["wall", "app", "settings"];

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function setPendingFirstRunReveal(route: FirstRunRevealRoute) {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(PENDING_FIRST_RUN_REVEAL_KEY, route);
}

export function clearPendingFirstRunReveal() {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(PENDING_FIRST_RUN_REVEAL_KEY);
}

export function hasPendingFirstRunReveal(route: FirstRunRevealRoute) {
  if (!canUseLocalStorage()) return false;

  const pendingRoute = window.localStorage.getItem(PENDING_FIRST_RUN_REVEAL_KEY);
  return pendingRoute === route;
}

export function consumePendingFirstRunReveal(route: FirstRunRevealRoute) {
  if (!canUseLocalStorage()) return false;

  const pendingRoute = window.localStorage.getItem(PENDING_FIRST_RUN_REVEAL_KEY);
  if (!VALID_REVEAL_ROUTES.includes(pendingRoute as FirstRunRevealRoute)) {
    clearPendingFirstRunReveal();
    return false;
  }

  if (pendingRoute !== route) return false;

  clearPendingFirstRunReveal();
  return true;
}
