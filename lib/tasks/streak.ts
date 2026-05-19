import type { TaskInstance } from "@/types";

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalDateKey(date = new Date()) {
  return toLocalDateKey(date);
}

export function calculateHouseholdStreak(tasks: TaskInstance[], now = new Date()) {
  const dayStats = new Map<string, { total: number; completed: number }>();

  tasks.forEach((task) => {
    const current = dayStats.get(task.dueDate) ?? { total: 0, completed: 0 };
    current.total += 1;
    if (task.completedAt) current.completed += 1;
    dayStats.set(task.dueDate, current);
  });

  let streak = 0;
  const cursor = new Date(now);

  while (true) {
    const key = toLocalDateKey(cursor);
    const stat = dayStats.get(key);

    if (!stat || stat.total === 0 || stat.completed !== stat.total) break;

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function hasSeenStreakFlameToday(householdId: string, dateKey: string) {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(`homeboard.streakFlameSeen.${householdId}.${dateKey}`) === "1";
}

export function markStreakFlameSeenToday(householdId: string, dateKey: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`homeboard.streakFlameSeen.${householdId}.${dateKey}`, "1");
}
