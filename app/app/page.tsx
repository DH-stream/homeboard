"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TodayAgenda } from "@/components/calendar/TodayAgenda";
import { AppShell } from "@/components/layout/AppShell";
import { MemberFilterPills } from "@/components/members/MemberFilterPills";
import { WallPairingCard } from "@/components/pairing/WallPairingCard";
import { AddTaskForm } from "@/components/tasks/AddTaskForm";
import { TaskList } from "@/components/tasks/TaskList";
import { ActionToast } from "@/components/ui/ActionToast";
import { EmptyState } from "@/components/ui/EmptyState";
import { StreakFlameIndicator } from "@/components/ui/StreakFlameIndicator";
import { StatusChip } from "@/components/ui/StatusChip";
import { consumePendingFirstRunReveal, hasPendingFirstRunReveal } from "@/lib/firstRunReveal";
import { resetDeviceStartView, saveDeviceStartView } from "@/lib/devicePreferences";
import { isCloudConfigured } from "@/lib/cloud/config";
import {
  enableLocalOnlyMode,
  isLocalOnlyModeEnabled,
  LOCAL_ONLY_MODE_CHANGED_EVENT,
  saveSelectedHouseholdId,
} from "@/lib/households/selection";
import { shouldShowDebugNavigation } from "@/lib/devicePreferences";
import { useCalendarEvents } from "@/lib/hooks/useCalendarEvents";
import { useMembers } from "@/lib/hooks/useMembers";
import { useResolvedHouseholdId } from "@/lib/hooks/useResolvedHouseholdId";
import { useTasks } from "@/lib/hooks/useTasks";
import { useLanguage } from "@/lib/i18n";
import { getLocalDateKey, hasSeenStreakFlameToday, markStreakFlameSeenToday } from "@/lib/tasks/streak";
import { createStreakService } from "@/lib/services/streakService";
import { shouldShowInCompletedTasks, shouldShowInRemainingTasks, shouldShowTodayTask } from "@/lib/tasks/visibility";
import { isFutureLocalDay } from "@/lib/utils/date";
import type { TaskInstance } from "@/types";

type Filter = "open" | "completed";

function isRecurringTask(task: TaskInstance) {
  return task.scheduleType === "daily" || task.scheduleType === "weekly";
}

function getFirstCreatedTaskId(created: unknown) {
  if (!Array.isArray(created)) return null;
  const firstTask = created.find((task): task is TaskInstance => Boolean(task && typeof task === "object" && "id" in task));
  return firstTask?.id ?? null;
}

export default function MobileAppPage() {
  const router = useRouter();
  const [isSetupMode, setIsSetupMode] = useState(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("setup") === "1",
  );
  const { getCompletionEncouragement, language, t } = useLanguage();
  const { members } = useMembers();
  const { householdId } = useResolvedHouseholdId();
  const { todayEvents } = useCalendarEvents();
  const { tasks, createTask, setTaskCompleted, updateTask, error: taskError, mode: taskMode } = useTasks();
  const [filter, setFilter] = useState<Filter>("open");
  const [memberFilter, setMemberFilter] = useState<string | null>(null);
  const [completionFeedback, setCompletionFeedback] = useState<{ taskId: string; message: string } | null>(null);
  const [isFirstRunRevealActive] = useState(() => hasPendingFirstRunReveal("app"));
  const [pendingFutureTask, setPendingFutureTask] = useState<TaskInstance | null>(null);
  const [createSuccessMessage, setCreateSuccessMessage] = useState<string | null>(null);
  const [recentlyCreatedTaskId, setRecentlyCreatedTaskId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [useLocalMobile, setUseLocalMobile] = useState(() =>
    isLocalOnlyModeEnabled(),
  );
  const showDebugNavigation = shouldShowDebugNavigation();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000 * 60);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    consumePendingFirstRunReveal("app");
  }, []);

  useEffect(() => {
    const syncLocalOnlyMode = () => setUseLocalMobile(isLocalOnlyModeEnabled());

    syncLocalOnlyMode();
    window.addEventListener(LOCAL_ONLY_MODE_CHANGED_EVENT, syncLocalOnlyMode);
    window.addEventListener("storage", syncLocalOnlyMode);

    return () => {
      window.removeEventListener(LOCAL_ONLY_MODE_CHANGED_EVENT, syncLocalOnlyMode);
      window.removeEventListener("storage", syncLocalOnlyMode);
    };
  }, []);

  const todayTasks = useMemo(() => tasks.filter((task) => shouldShowTodayTask(task, now)), [now, tasks]);
  const upcomingTasks = useMemo(() => tasks.filter((task) => !isRecurringTask(task) && isFutureLocalDay(task.dueDate)), [tasks]);
  const [streak, setStreak] = useState(0);
  const [showStreakIntro, setShowStreakIntro] = useState(false);
  const streakService = useMemo(() => createStreakService(), []);

  useEffect(() => {
    if (!householdId || streak < 2) {
      setShowStreakIntro(false);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dateKey = getLocalDateKey(now);
    if (hasSeenStreakFlameToday(householdId, dateKey)) return;

    setShowStreakIntro(true);
    markStreakFlameSeenToday(householdId, dateKey);
    const timer = window.setTimeout(() => setShowStreakIntro(false), 1800);
    return () => window.clearTimeout(timer);
  }, [householdId, now, streak]);


  useEffect(() => {
    if (!householdId) {
      setStreak(0);
      return;
    }

    let cancelled = false;

    const syncStreak = async () => {
      try {
        await streakService.maybeMarkTodayComplete(householdId, todayTasks);
        const nextStreak = await streakService.getHouseholdTaskStreak(householdId, now);
        if (!cancelled) setStreak(nextStreak);
      } catch (error) {
        console.warn("Unable to sync household streak", error);
      }
    };

    syncStreak();

    return () => {
      cancelled = true;
    };
  }, [householdId, now, streakService, todayTasks]);
  const stats = useMemo(() => {
    const completed = todayTasks.filter((task) => task.completedAt).length;
    return { completed, total: todayTasks.length, remaining: todayTasks.length - completed };
  }, [todayTasks]);

  const filteredTasks = useMemo(() => {
    return todayTasks.filter((task) => {
      const statusMatch = filter === "completed" ? shouldShowInCompletedTasks(task) : shouldShowInRemainingTasks(task, now);
      const memberMatch = memberFilter === null || task.assignedToMemberId === memberFilter;
      return statusMatch && memberMatch;
    });
  }, [filter, memberFilter, now, todayTasks]);

  const todayTaskAnimationKey = `today-${memberFilter ?? "all-members"}-${filter}`;
  const taskStorageLabel = taskMode === "supabase" ? t("homeCloudSync") : t("previewStorage");
  const taskStorageNote = taskMode === "supabase" ? t("cloudTaskDueDatePreview") : t("dueDatePreview");
  const remainingEmptyTitle = language === "sv" ? "Allt är klart för idag." : "Everything is done for today.";
  const remainingEmptyBody = language === "sv" ? "Klara uppgifter finns under Klart." : "Completed tasks are under Done.";

  const handleTaskCreated = useCallback((created: unknown) => {
    const createdTaskId = getFirstCreatedTaskId(created);
    setCreateSuccessMessage(t("taskAdded"));
    setRecentlyCreatedTaskId(createdTaskId);
    window.setTimeout(() => {
      setRecentlyCreatedTaskId((current) => (current === createdTaskId ? null : current));
    }, 1800);
  }, [setCreateSuccessMessage, setRecentlyCreatedTaskId, t]);

  async function completeTask(task: TaskInstance, completed: boolean) {
    try {
      await setTaskCompleted(task, completed, task.assignedToMemberId);
    } catch {
      return;
    }

    if (completed) {
      const message = getCompletionEncouragement(completionFeedback?.message);
      setCompletionFeedback({ taskId: task.id, message });
      window.setTimeout(() => setCompletionFeedback((current) => (current?.taskId === task.id ? null : current)), 1400);
    }
  }

  async function toggleTask(task: TaskInstance) {
    await completeTask(task, !task.completedAt);
  }

  async function toggleUpcomingTask(task: TaskInstance) {
    if (!task.completedAt) {
      setPendingFutureTask(task);
      return;
    }

    await completeTask(task, false);
  }

  async function confirmFutureTaskCompletion() {
    if (!pendingFutureTask) return;
    const task = pendingFutureTask;
    setPendingFutureTask(null);
    await completeTask(task, true);
  }

  const filterLabels: Record<Filter, string> = {
    open: t("filtersOpen"),
    completed: t("filtersCompleted"),
  };

  if (isSetupMode || (!householdId && !useLocalMobile && isCloudConfigured())) {
    return (
      <WallPairingCard
        targetMode="mobile"
        onBack={() => {
          resetDeviceStartView();
          router.replace("/?choose=1");
        }}
        onPaired={(nextHouseholdId) => {
          saveSelectedHouseholdId(nextHouseholdId);
          saveDeviceStartView({ mode: "mobile", route: "/app" });
          setUseLocalMobile(false);
          setIsSetupMode(false);
          router.replace("/app");
        }}
        onUseLocal={() => {
          saveDeviceStartView({ mode: "mobile", route: "/app" });
          enableLocalOnlyMode();
          setUseLocalMobile(true);
          setIsSetupMode(false);
          router.replace("/app");
        }}
      />
    );
  }

  return (
    <AppShell eyebrow={t("appEyebrow")} revealActive={isFirstRunRevealActive} title={t("appTitle")}>
      <section className={`mb-4 grid grid-cols-3 gap-2 sm:gap-3 ${isFirstRunRevealActive ? "reveal-item reveal-item--card reveal-stagger-2" : ""}`}>
        <div className="surface-card min-w-0 rounded-[1.5rem] p-3 text-center sm:p-4">
          <p className="text-3xl font-black text-stone-950">{stats.total}</p>
          <p className="min-h-4 truncate text-[0.68rem] font-black uppercase tracking-[0.12em] text-stone-400 sm:text-xs sm:tracking-[0.16em]">{t("tasksLabel")}</p>
        </div>
        <div className={`min-w-0 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-3 text-center shadow-sm transition-[box-shadow,transform] duration-200 ease-[var(--ease-out)] sm:p-4 ${completionFeedback ? "shadow-emerald-200/80" : ""}`}>
          <p className="text-3xl font-black text-emerald-700">{stats.completed}</p>
          <p className="min-h-4 text-[0.68rem] font-black uppercase tracking-[0.12em] text-emerald-500 sm:text-xs sm:tracking-[0.16em] flex items-center justify-center gap-2"><span className="truncate">{completionFeedback?.message ?? t("todaysProgress")}</span>
            <StreakFlameIndicator streak={streak} animateIntro={showStreakIntro} /></p>
        </div>
        {showDebugNavigation ? (
          <Link className="pressable min-w-0 rounded-[1.5rem] bg-stone-950 p-3 text-center text-white shadow-sm sm:p-4" href="/wall">
            <p className="text-3xl font-black">{t("wall")}</p>
            <p className="min-h-4 truncate text-[0.68rem] font-black uppercase tracking-[0.12em] text-white/50 sm:text-xs sm:tracking-[0.16em]">{t("open")}</p>
          </Link>
        ) : (
          <div className="surface-card min-w-0 rounded-[1.5rem] p-3 text-center sm:p-4">
            <p className="text-3xl font-black text-stone-950">{stats.remaining}</p>
            <p className="min-h-4 truncate text-[0.68rem] font-black uppercase tracking-[0.12em] text-stone-400 sm:text-xs sm:tracking-[0.16em]">{t("remaining")}</p>
          </div>
        )}
      </section>

      <div className={isFirstRunRevealActive ? "reveal-item reveal-item--card reveal-stagger-3" : undefined}>
        <AddTaskForm members={members} onCreate={createTask} onCreated={handleTaskCreated} />
      </div>

      {taskError ? <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{t("tasksSyncError")}</p> : null}

      <section className={`surface-card mt-5 rounded-[2rem] p-4 ${isFirstRunRevealActive ? "reveal-item reveal-item--card reveal-stagger-4" : ""}`}>
        <div className="mb-3 min-w-0">
          <StatusChip tone={taskMode === "supabase" ? "emerald" : "amber"}>{taskStorageLabel}</StatusChip>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-stone-950">{t("todaysTasks")}</h2>
        </div>
        <MemberFilterPills members={members} onSelectMember={setMemberFilter} selectedMemberId={memberFilter} />
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1 text-sm font-black text-stone-600">
          {(["open", "completed"] as Filter[]).map((next) => (
            <button className={`pressable min-h-11 min-w-0 truncate rounded-xl px-2 py-2 text-center sm:px-3 ${filter === next ? "bg-white text-stone-950 shadow-sm" : ""}`} key={next} onClick={() => setFilter(next)} type="button">
              {filterLabels[next]}
            </button>
          ))}
        </div>
        {filter === "open" && !filteredTasks.length && stats.total > 0 ? (
          <EmptyState title={remainingEmptyTitle}>{remainingEmptyBody}</EmptyState>
        ) : (
          <TaskList
            animationKey={todayTaskAnimationKey}
            members={members}
            onEdit={(task, title) => updateTask({ id: task.id, titleSnapshot: title })}
            onToggle={toggleTask}
            recentlyCompletedId={completionFeedback?.taskId ?? null}
            recentlyCreatedId={recentlyCreatedTaskId}
            completionMessage={completionFeedback?.message}
            tasks={filteredTasks}
          />
        )}
      </section>

      <section className={`surface-card mt-5 rounded-[2rem] p-4 ${isFirstRunRevealActive ? "reveal-item reveal-item--card reveal-stagger-7" : ""}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black tracking-tight text-stone-950">{t("upcoming")}</h2>
          <StatusChip tone={taskMode === "supabase" ? "emerald" : "amber"}>{taskStorageLabel}</StatusChip>
        </div>
        {upcomingTasks.length ? (
          <TaskList animationKey="upcoming" members={members} onEdit={(task, title) => updateTask({ id: task.id, titleSnapshot: title })} onToggle={toggleUpcomingTask} recentlyCompletedId={completionFeedback?.taskId ?? null} completionMessage={completionFeedback?.message} tasks={upcomingTasks} />
        ) : (
          <EmptyState title={t("upcoming")}>{t("upcomingEmpty")}</EmptyState>
        )}
        <p className="mt-3 text-xs font-bold leading-5 text-stone-500">{taskStorageNote}</p>
      </section>

      <div className={`mt-5 ${isFirstRunRevealActive ? "reveal-item reveal-item--list reveal-stagger-8" : ""}`}>
        <TodayAgenda compact events={todayEvents} />
      </div>

      <ActionToast message={createSuccessMessage} onDismiss={() => setCreateSuccessMessage(null)} />

      {pendingFutureTask ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/45 px-4 py-5 backdrop-blur-sm sm:items-center" role="presentation">
          <section aria-labelledby="future-task-confirm-title" aria-modal="true" className="w-full max-w-md rounded-[2rem] border border-white/80 bg-stone-50 p-5 text-stone-950 shadow-[0_24px_80px_rgba(28,25,23,0.28)]" role="dialog">
            <div className="mb-4 h-1.5 w-14 rounded-full bg-amber-300" />
            <h2 className="text-2xl font-black tracking-tight" id="future-task-confirm-title">
              {t("markFutureTaskCompleteTitle")}
            </h2>
            <p className="mt-2 text-base font-semibold leading-7 text-stone-600">{t("markFutureTaskCompleteBody")}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button className="pressable min-h-12 rounded-2xl border border-stone-200 bg-white px-4 py-3 font-black text-stone-700 shadow-sm" onClick={() => setPendingFutureTask(null)} type="button">
                {t("cancel")}
              </button>
              <button className="pressable min-h-12 rounded-2xl bg-emerald-500 px-4 py-3 font-black text-white shadow-lg shadow-emerald-500/20" onClick={confirmFutureTaskCompletion} type="button">
                {t("markComplete")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
