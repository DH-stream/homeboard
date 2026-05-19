import { createStreakRepository } from "@/lib/repositories/streakRepository";
import type { TaskInstance } from "@/types";

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
      const completedSet = new Set(completedDays.map((day) => day.date));
      let streak = 0;
      const cursor = new Date(now);
      while (true) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
        if (!completedSet.has(key)) break;
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      return streak;
    },
  };
}
