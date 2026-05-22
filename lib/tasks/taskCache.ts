import type { TaskInstance } from "@/types";

type TaskCachePayload = {
  updatedAt: string;
  tasks: TaskInstance[];
};

const TASK_CACHE_PREFIX = "homeboard.tasks.cache.v1";

function taskCacheKey(householdId: string) {
  return `${TASK_CACHE_PREFIX}:${householdId}`;
}

export function readTaskCache(householdId: string | null | undefined): TaskCachePayload | null {
  if (!householdId || typeof window === "undefined") return null;
  const key = taskCacheKey(householdId);
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as TaskCachePayload;
    if (!parsed || !Array.isArray(parsed.tasks) || typeof parsed.updatedAt !== "string") {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function writeTaskCache(householdId: string | null | undefined, tasks: TaskInstance[]) {
  if (!householdId || typeof window === "undefined") return;
  const payload: TaskCachePayload = {
    updatedAt: new Date().toISOString(),
    tasks,
  };
  window.localStorage.setItem(taskCacheKey(householdId), JSON.stringify(payload));
}
