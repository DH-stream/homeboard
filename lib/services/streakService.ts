import { createStreakRepository } from "@/lib/repositories/streakRepository";
import type { TaskInstance } from "@/types";

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
      const streakRow = await repository.getHouseholdStreak(householdId);
      if (streakRow?.current_streak && streakRow.current_streak > 0) return streakRow.current_streak;

      const completedDays = await repository.listCompletedTaskDays(householdId);
      if (completedDays.length === 0) return 0;

      const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const completedDates = completedDays.map((day) => day.date).sort((a, b) => b.localeCompare(a));
      const anchorDate = completedDates.find((date) => date <= nowKey);
      if (!anchorDate) return 0;

      return calculateStreakFromCompletedDays(completedDates, anchorDate);
    },
  };
}
