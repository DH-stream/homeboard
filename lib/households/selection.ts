export const SELECTED_HOUSEHOLD_STORAGE_KEY = "homeboard.selectedHouseholdId.v1";
export const SELECTED_HOUSEHOLD_CHANGED_EVENT = "homeboard:selected-household-changed";

export function getHouseholdIdOverride() {
  return process.env.NEXT_PUBLIC_HOMEBOARD_HOUSEHOLD_ID?.trim() || null;
}

export function getLocalSelectedHouseholdId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SELECTED_HOUSEHOLD_STORAGE_KEY)?.trim() || null;
}

export function resolveCurrentHouseholdId() {
  return getHouseholdIdOverride() ?? getLocalSelectedHouseholdId();
}

export function saveSelectedHouseholdId(householdId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SELECTED_HOUSEHOLD_STORAGE_KEY, householdId);
  window.dispatchEvent(new CustomEvent(SELECTED_HOUSEHOLD_CHANGED_EVENT, { detail: { householdId } }));
}

export function resetSelectedHouseholdId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SELECTED_HOUSEHOLD_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(SELECTED_HOUSEHOLD_CHANGED_EVENT, { detail: { householdId: null } }));
}
