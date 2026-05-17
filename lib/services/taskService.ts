import type { TaskRepository } from "@/lib/repositories/taskRepository";
import type { CreateTaskInput, UpdateTaskInstanceInput } from "@/types";

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
    async setTaskCompleted(id: string, completed: boolean, completedByMemberId?: string) {
      return repository.updateTaskInstance({
        id,
        completedAt: completed ? new Date().toISOString() : null,
        completedByMemberId,
      });
    },
  };
}
