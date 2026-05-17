"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createTaskService } from "@/lib/services/taskService";
import { getTaskRepository } from "@/lib/repositories/taskRepository";
import { useResolvedHouseholdId } from "@/lib/hooks/useResolvedHouseholdId";
import { useLanguage, type Language } from "@/lib/i18n";
import type { CreateTaskInput, TaskInstance, UpdateTaskInstanceInput } from "@/types";

const taskErrorCopy: Record<Language, { load: string; save: string }> = {
  en: {
    load: "Unable to load tasks.",
    save: "Unable to save task.",
  },
  sv: {
    load: "Kunde inte ladda uppgifterna.",
    save: "Kunde inte spara uppgiften.",
  },
};

export function useTasks() {
  const { language } = useLanguage();
  const copy = taskErrorCopy[language];
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
      setError(unknownError instanceof Error ? unknownError.message : copy.load);
    } finally {
      setLoading(false);
    }
  }, [copy.load, householdId, service]);

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
        setError(unknownError instanceof Error ? unknownError.message : copy.save);
        throw unknownError;
      }
    },
    [copy.save, householdId, refresh, service],
  );

  const updateTask = useCallback(
    async (input: UpdateTaskInstanceInput) => {
      try {
        const updated = await service.updateTask(input);
        await refresh();
        return updated;
      } catch (unknownError) {
        console.error(unknownError);
        setError(unknownError instanceof Error ? unknownError.message : copy.save);
        throw unknownError;
      }
    },
    [copy.save, refresh, service],
  );

  const setTaskCompleted = useCallback(
    async (id: string, completed: boolean, completedByMemberId?: string) => {
      try {
        const updated = await service.setTaskCompleted(id, completed, completedByMemberId);
        await refresh();
        return updated;
      } catch (unknownError) {
        console.error(unknownError);
        setError(unknownError instanceof Error ? unknownError.message : copy.save);
        throw unknownError;
      }
    },
    [copy.save, refresh, service],
  );

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.completedAt).length;
    return { completed, total: tasks.length, remaining: tasks.length - completed };
  }, [tasks]);

  return { tasks, stats, isLoading, error, mode, createTask, updateTask, setTaskCompleted, refresh };
}
