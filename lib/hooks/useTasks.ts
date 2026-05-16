"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { localTaskRepository } from "@/lib/repositories/taskRepository";
import { createTaskService } from "@/lib/services/taskService";
import type { CreateTaskInput, TaskInstance, UpdateTaskInstanceInput } from "@/types";

const service = createTaskService(localTaskRepository);

export function useTasks() {
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setTasks(await service.listTodayTasks());
      setError(null);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTask = useCallback(
    async (input: CreateTaskInput) => {
      const created = await service.createTask(input);
      await refresh();
      return created;
    },
    [refresh],
  );

  const updateTask = useCallback(
    async (input: UpdateTaskInstanceInput) => {
      const updated = await service.updateTask(input);
      await refresh();
      return updated;
    },
    [refresh],
  );

  const setTaskCompleted = useCallback(
    async (id: string, completed: boolean, completedByMemberId?: string) => {
      const updated = await service.setTaskCompleted(id, completed, completedByMemberId);
      await refresh();
      return updated;
    },
    [refresh],
  );

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.completedAt).length;
    return { completed, total: tasks.length, remaining: tasks.length - completed };
  }, [tasks]);

  return { tasks, stats, isLoading, error, createTask, updateTask, setTaskCompleted, refresh };
}
