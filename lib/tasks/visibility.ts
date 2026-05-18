import { isSameLocalDay } from "@/lib/utils/date";
import type { TaskInstance } from "@/types";

const DAILY_RECURRING_REVEAL_MINUTES = 90;

export function shouldShowTodayTask(task: TaskInstance, now: Date) {
  if (!isSameLocalDay(task.dueDate, now)) return false;

  if (task.completedAt) return true;
  if (task.scheduleType !== "daily") return true;

  const revealAt = new Date(task.dueDate).getTime() - DAILY_RECURRING_REVEAL_MINUTES * 60 * 1000;
  return now.getTime() >= revealAt;
}
