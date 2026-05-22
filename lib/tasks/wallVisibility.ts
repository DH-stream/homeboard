import { toLocalDateKey } from "@/lib/utils/date";
import type { TaskInstance } from "@/types";

function isScheduledOccurrence(task: TaskInstance) {
  return Boolean(task.scheduleId || task.scheduleType || task.occurrenceKey);
}

function buildStableGroupKey(task: TaskInstance) {
  if (task.scheduleId) return `schedule:${task.scheduleId}`;
  if (task.taskId) return `task:${task.taskId}`;
  return null;
}

function buildFallbackGroupKey(task: TaskInstance) {
  const normalizedTitle = task.titleSnapshot.trim().toLocaleLowerCase();
  const assignee = task.assignedToMemberId ?? "unassigned";
  return `fallback:${normalizedTitle}::${assignee}::${toLocalDateKey(task.dueDate)}`;
}

export function getSequentialWallRemainingTasks(allTodayTasks: TaskInstance[], revealedRemainingTasks: TaskInstance[]) {
  const groups = new Map<string, TaskInstance[]>();
  const passthrough = revealedRemainingTasks.filter((task) => !isScheduledOccurrence(task));

  for (const task of allTodayTasks) {
    if (!isScheduledOccurrence(task)) continue;

    const key = buildStableGroupKey(task) ?? buildFallbackGroupKey(task);
    const current = groups.get(key);
    if (current) current.push(task);
    else groups.set(key, [task]);
  }

  const sequential: TaskInstance[] = [];

  for (const instances of groups.values()) {
    const nextIncomplete = [...instances]
      .sort((a, b) => {
        const byDue = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (byDue !== 0) return byDue;

        const byCreated = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (byCreated !== 0) return byCreated;

        return a.id.localeCompare(b.id);
      })
      .find((instance) => !instance.completedAt);

    if (nextIncomplete) sequential.push(nextIncomplete);
  }

  return [...passthrough, ...sequential].sort((a, b) => {
    const byDue = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (byDue !== 0) return byDue;
    return a.id.localeCompare(b.id);
  });
}
