"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createTaskService } from "@/lib/services/taskService";
import { getTaskRepository } from "@/lib/repositories/taskRepository";
import { useResolvedHouseholdId } from "@/lib/hooks/useResolvedHouseholdId";
import type { CreateTaskInput, TaskInstance, UpdateTaskInstanceInput } from "@/types";

export function useTasks() {
  const { householdId } = useResolvedHouseholdId();
  const { mode, repository } = useMemo(() => getTaskRepository(householdId), [householdId]);
  const service = useMemo(() => createTaskService(repository), [repository]);
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await service.listTodayTasks(householdId));
      setError(null);
    } catch (unknownError) {
      console.error(unknownError);
      setError(unknownError instanceof Error ? unknownError.message : "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [householdId, service]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTask = useCallback(
    async (input: CreateTaskInput) => {
      try {
        const created = await service.createTask(householdId, input);
        await refresh();
        return created;
      } catch (unknownError) {
        console.error(unknownError);
        setError(unknownError instanceof Error ? unknownError.message : "Unable to save task.");
        throw unknownError;
      }
    },
    [householdId, refresh, service],
  );

  const updateTask = useCallback(
    async (input: UpdateTaskInstanceInput) => {
      try {
        const updated = await service.updateTask(input);
        await refresh();
        return updated;
      } catch (unknownError) {
        console.error(unknownError);
        setError(unknownError instanceof Error ? unknownError.message : "Unable to save task.");
        throw unknownError;
      }
    },
    [refresh, service],
  );

  const setTaskCompleted = useCallback(
    async (id: string, completed: boolean, completedByMemberId?: string) => {
      try {
        const updated = await service.setTaskCompleted(id, completed, completedByMemberId);
        await refresh();
        return updated;
      } catch (unknownError) {
        console.error(unknownError);
        setError(unknownError instanceof Error ? unknownError.message : "Unable to save task.");
        throw unknownError;
      }
    },
    [refresh, service],
  );

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.completedAt).length;
    return { completed, total: tasks.length, remaining: tasks.length - completed };
  }, [tasks]);

  return { tasks, stats, isLoading, error, mode, createTask, updateTask, setTaskCompleted, refresh };
}
