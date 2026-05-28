import { createStreakRepository } from "@/lib/repositories/streakRepository";
import type { TaskInstance } from "@/types";

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function calculateStreakFromCompletedDays(completedDates: string[], anchorDate: string) {
  const completedSet = new Set(completedDates);
  let streak = 0;
  const cursor = new Date(`${anchorDate}T12:00:00Z`);
  while (true) {
    const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-${String(cursor.getUTCDate()).padStart(2, "0")}`;
    if (!completedSet.has(key)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function getActiveStreakAnchor(completedDates: string[], now: Date) {
  const completedSet = new Set(completedDates);
  const todayKey = toDateKey(now);
  if (completedSet.has(todayKey)) return todayKey;

  const yesterdayKey = toDateKey(addDays(now, -1));
  if (completedSet.has(yesterdayKey)) return yesterdayKey;

  return null;
}

export function createStreakService() {
  const repository = createStreakRepository();

  return {
    async listCompletedTaskDays(householdId: string) {
      return repository.listCompletedTaskDays(householdId);
    },
    async maybeMarkTodayComplete(householdId: string, todayTasks: TaskInstance[]) {
      return repository.maybeMarkTodayComplete(householdId, todayTasks);
    },
    async getHouseholdTaskStreak(householdId: string, now = new Date()) {
      const completedDays = await repository.listCompletedTaskDays(householdId);
      if (completedDays.length === 0) return 0;

      const completedDates = completedDays.map((day) => day.date).sort((a, b) => b.localeCompare(a));
      const anchorDate = getActiveStreakAnchor(completedDates, now);
      if (!anchorDate) return 0;

      return calculateStreakFromCompletedDays(completedDates, anchorDate);
    },
  };
}
