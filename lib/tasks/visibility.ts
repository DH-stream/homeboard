import { isSameLocalDay } from "@/lib/utils/date";
import type { TaskInstance } from "@/types";

const DAILY_RECURRING_REVEAL_MINUTES = 90;
export const COMPLETED_TASK_REMAINING_GRACE_MINUTES = 30;

export function shouldShowTodayTask(task: TaskInstance, now: Date) {
  if (!isSameLocalDay(task.dueDate, now)) return false;

  if (task.completedAt) return true;
  if (task.scheduleType !== "daily") return true;

  const revealAt = new Date(task.dueDate).getTime() - DAILY_RECURRING_REVEAL_MINUTES * 60 * 1000;
  return now.getTime() >= revealAt;
}

export function isRecentlyCompleted(task: TaskInstance, now: Date, graceMinutes = COMPLETED_TASK_REMAINING_GRACE_MINUTES) {
  if (!task.completedAt) return false;

  const completedAt = new Date(task.completedAt).getTime();
  if (Number.isNaN(completedAt)) return false;

  return now.getTime() - completedAt < graceMinutes * 60 * 1000;
}

export function shouldShowInRemainingTasks(task: TaskInstance, now: Date) {
  return !task.completedAt || isRecentlyCompleted(task, now);
}

export function shouldShowInCompletedTasks(task: TaskInstance) {
  return Boolean(task.completedAt);
}