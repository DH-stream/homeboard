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
      setError(copy.load);
    } finally {
      setLoading(false);
    }
  }, [copy.load, householdId, service]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!repository.flushPendingWrites) return;

    const flush = () => {
      repository.flushPendingWrites?.(householdId).catch((unknownError) => console.warn(unknownError));
    };

    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [householdId, repository]);

  const createTask = useCallback(
    async (input: CreateTaskInput) => {
      try {
        const created = await service.createTask(householdId, input);
        await refresh();
        return created;
      } catch (unknownError) {
        console.error(unknownError);
        setError(copy.save);
        throw unknownError;
      }
    },
    [copy.save, householdId, refresh, service],
  );

  const updateTask = useCallback(
    async (input: UpdateTaskInstanceInput) => {
      try {
        const current = tasks.find((task) => task.id === input.id);
        const updated = await service.updateTask({
          taskId: current?.taskId,
          householdId: current?.householdId,
          occurrenceKey: current?.occurrenceKey,
          assignedToMemberId: current?.assignedToMemberId,
          dueDate: current?.dueDate,
          scheduleId: current?.scheduleId,
          scheduleType: current?.scheduleType,
          ...input,
        });
        await refresh();
        return updated;
      } catch (unknownError) {
        console.error(unknownError);
        setError(copy.save);
        throw unknownError;
      }
    },
    [copy.save, refresh, service, tasks],
  );

  const setTaskCompleted = useCallback(
    async (task: TaskInstance, completed: boolean, completedByMemberId?: string) => {
      try {
        const updated = await service.setTaskCompleted(task, completed, completedByMemberId);
        await refresh();
        return updated;
      } catch (unknownError) {
        console.error(unknownError);
        setError(copy.save);
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
