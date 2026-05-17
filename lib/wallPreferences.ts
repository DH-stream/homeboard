export type WallTaskCreatorMode = "off" | "docked" | "panel";

export const WALL_TASK_CREATOR_MODE_STORAGE_KEY = "homeboard.wallTaskCreatorMode.v1";
export const WALL_TASK_CREATOR_MODE_CHANGE_EVENT = "homeboard:wall-task-creator-mode-change";
export const DEFAULT_WALL_TASK_CREATOR_MODE: WallTaskCreatorMode = "docked";

const WALL_TASK_CREATOR_MODES = new Set<WallTaskCreatorMode>(["off", "docked", "panel"]);

export function isWallTaskCreatorMode(value: string | null): value is WallTaskCreatorMode {
  return value !== null && WALL_TASK_CREATOR_MODES.has(value as WallTaskCreatorMode);
}

export function readWallTaskCreatorMode(): WallTaskCreatorMode {
  if (typeof window === "undefined") return DEFAULT_WALL_TASK_CREATOR_MODE;

  const stored = window.localStorage.getItem(WALL_TASK_CREATOR_MODE_STORAGE_KEY);
  return isWallTaskCreatorMode(stored) ? stored : DEFAULT_WALL_TASK_CREATOR_MODE;
}

export function saveWallTaskCreatorMode(mode: WallTaskCreatorMode) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(WALL_TASK_CREATOR_MODE_STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent(WALL_TASK_CREATOR_MODE_CHANGE_EVENT, { detail: mode }));
}

export function resetWallTaskCreatorMode() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(WALL_TASK_CREATOR_MODE_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(WALL_TASK_CREATOR_MODE_CHANGE_EVENT, { detail: DEFAULT_WALL_TASK_CREATOR_MODE }));
}
