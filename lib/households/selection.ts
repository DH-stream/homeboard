export const SELECTED_HOUSEHOLD_STORAGE_KEY = "homeboard.selectedHouseholdId.v1";
export const LOCAL_ONLY_MODE_STORAGE_KEY = "homeboard.localOnlyMode.v1";
export const SELECTED_HOUSEHOLD_CHANGED_EVENT = "homeboard:selected-household-changed";
export const LOCAL_ONLY_MODE_CHANGED_EVENT = "homeboard:local-only-mode-changed";

export function getHouseholdIdOverride() {
  return process.env.NEXT_PUBLIC_HOMEBOARD_HOUSEHOLD_ID?.trim() || null;
}

export function getLocalSelectedHouseholdId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SELECTED_HOUSEHOLD_STORAGE_KEY)?.trim() || null;
}

export function isLocalOnlyModeEnabled() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(LOCAL_ONLY_MODE_STORAGE_KEY) === "true";
}

export function resolveCurrentHouseholdId() {
  return getHouseholdIdOverride() ?? getLocalSelectedHouseholdId();
}

export function saveSelectedHouseholdId(householdId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SELECTED_HOUSEHOLD_STORAGE_KEY, householdId);
  window.localStorage.removeItem(LOCAL_ONLY_MODE_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(SELECTED_HOUSEHOLD_CHANGED_EVENT, { detail: { householdId } }));
  window.dispatchEvent(new CustomEvent(LOCAL_ONLY_MODE_CHANGED_EVENT, { detail: false }));
}

export function enableLocalOnlyMode() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SELECTED_HOUSEHOLD_STORAGE_KEY);
  window.localStorage.setItem(LOCAL_ONLY_MODE_STORAGE_KEY, "true");
  window.dispatchEvent(new CustomEvent(SELECTED_HOUSEHOLD_CHANGED_EVENT, { detail: { householdId: null } }));
  window.dispatchEvent(new CustomEvent(LOCAL_ONLY_MODE_CHANGED_EVENT, { detail: true }));
}

export function disableLocalOnlyMode() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_ONLY_MODE_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(LOCAL_ONLY_MODE_CHANGED_EVENT, { detail: false }));
}

export function resetSelectedHouseholdId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SELECTED_HOUSEHOLD_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(SELECTED_HOUSEHOLD_CHANGED_EVENT, { detail: { householdId: null } }));
}
