import type { TaskRepository } from "@/lib/repositories/taskRepository";
import type { CreateTaskInput, UpdateTaskInstanceInput } from "@/types";

export function createTaskService(repository: TaskRepository) {
  return {
    async listTodayTasks() {
      return repository.listTaskInstances();
    },
    async createTask(input: CreateTaskInput) {
      if (!input.title.trim()) {
        throw new Error("Task title is required.");
      }

      return repository.createTask({ ...input, title: input.title.trim() });
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
