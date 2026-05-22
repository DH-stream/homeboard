"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createTaskService } from "@/lib/services/taskService";
import { getTaskRepository } from "@/lib/repositories/taskRepository";
import { useResolvedHouseholdId } from "@/lib/hooks/useResolvedHouseholdId";
import { useLanguage, type Language } from "@/lib/i18n";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { readTaskCache, writeTaskCache } from "@/lib/tasks/taskCache";
import type { CreateTaskInput, TaskInstance, UpdateTaskInstanceInput } from "@/types";

function mergeTaskInstances(current: TaskInstance[], next: TaskInstance[]) {
  const byId = new Map(current.map((task) => [task.id, task]));
  for (const task of next) byId.set(task.id, task);
  return Array.from(byId.values()).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}



const TASK_REALTIME_TABLES = [
  "tasks",
  "task_instances",
  "household_task_day_status",
  "household_streaks",
] as const;

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
  const refreshTimeoutRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const freshTasks = await service.listTodayTasks(householdId);
      setTasks(freshTasks);
      writeTaskCache(householdId, freshTasks);
      setError(null);
    } catch (unknownError) {
      console.error(unknownError);
      setError(copy.load);
    } finally {
      setLoading(false);
    }
  }, [copy.load, householdId, service]);

  useEffect(() => {
    const cached = readTaskCache(householdId);
    if (cached) {
      setTasks(cached.tasks);
      setLoading(false);
    } else {
      setTasks([]);
      setLoading(true);
    }
    void refresh();
  }, [householdId, refresh]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !householdId || mode !== "supabase") return;

    const queueRefresh = () => {
      if (refreshTimeoutRef.current) window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = window.setTimeout(() => {
        refreshTimeoutRef.current = null;
        void refresh();
      }, 350);
    };

    const channel = supabase.channel(`tasks-realtime-${householdId}`);

    for (const table of TASK_REALTIME_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `household_id=eq.${householdId}` },
        queueRefresh,
      );
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") queueRefresh();
    };

    channel.subscribe();
    window.addEventListener("focus", queueRefresh);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      window.removeEventListener("focus", queueRefresh);
      document.removeEventListener("visibilitychange", handleVisibility);
      void supabase.removeChannel(channel);
    };
  }, [householdId, mode, refresh]);

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
        setTasks((current) => mergeTaskInstances(current, created));
        try {
          await refresh();
        } catch (refreshError) {
          console.warn("HomeBoard kept the newly created task visible while refresh failed.", refreshError);
        }
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
