import type { TaskRepository } from "@/lib/repositories/taskRepository";
import type { CreateTaskInput, TaskInstance, UpdateTaskInstanceInput } from "@/types";

export function createTaskService(repository: TaskRepository) {
  return {
    async listTaskTemplates(householdId?: string | null) {
      return repository.listTaskTemplates(householdId);
    },
    async listTodayTasks(householdId?: string | null) {
      return repository.listTaskInstances(householdId);
    },
    async createTask(householdId: string | null, input: CreateTaskInput) {
      if (!input.title.trim()) {
        throw new Error("Task title is required.");
      }

      return repository.createTask(householdId, { ...input, title: input.title.trim() });
    },
    async updateTask(input: UpdateTaskInstanceInput) {
      return repository.updateTaskInstance(input);
    },
    async setTaskCompleted(task: TaskInstance | UpdateTaskInstanceInput, completed: boolean, completedByMemberId?: string) {
      return repository.updateTaskInstance({
        id: task.id,
        taskId: task.taskId,
        householdId: task.householdId,
        occurrenceKey: task.occurrenceKey,
        titleSnapshot: "titleSnapshot" in task ? task.titleSnapshot : undefined,
        assignedToMemberId: task.assignedToMemberId,
        dueDate: task.dueDate,
        scheduleId: task.scheduleId,
        scheduleType: task.scheduleType,
        completedAt: completed ? new Date().toISOString() : null,
        completedByMemberId,
      });
    },
  };
}
