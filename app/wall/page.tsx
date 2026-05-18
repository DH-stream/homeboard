"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TodayAgenda } from "@/components/calendar/TodayAgenda";
import { WeekPreview } from "@/components/calendar/WeekPreview";
import { WallShell } from "@/components/layout/WallShell";
import { MemberBadge } from "@/components/members/MemberBadge";
import { TaskList } from "@/components/tasks/TaskList";
import { WallQuickTaskButton } from "@/components/wall/WallQuickTaskButton";
import { WallQuickTaskCreator } from "@/components/wall/WallQuickTaskCreator";
import { ActionToast } from "@/components/ui/ActionToast";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { useCalendarEvents } from "@/lib/hooks/useCalendarEvents";
import { useHousehold, useMembers } from "@/lib/hooks/useMembers";
import { consumePendingFirstRunReveal, hasPendingFirstRunReveal } from "@/lib/firstRunReveal";
import { useTasks } from "@/lib/hooks/useTasks";
import { readWallTaskCreatorMode, WALL_TASK_CREATOR_MODE_CHANGE_EVENT, type WallTaskCreatorMode } from "@/lib/wallPreferences";
import { getLocale, useLanguage } from "@/lib/i18n";
import { formatShortDate, isSameLocalDay } from "@/lib/utils/date";
import type { TaskInstance } from "@/types";

const DAILY_RECURRING_REVEAL_MINUTES = 90;
const QUICK_CREATOR_CLOSE_MS = 240;
const QUICK_CREATOR_REDUCED_MOTION_CLOSE_MS = 20;

function getFirstCreatedTaskId(created: unknown) {
  if (!Array.isArray(created)) return null;
  const firstTask = created.find((task): task is TaskInstance => Boolean(task && typeof task === "object" && "id" in task));
  return firstTask?.id ?? null;
}

function shouldShowTodayTask(task: TaskInstance, now: Date) {
  if (!isSameLocalDay(task.dueDate, now)) return false;
  if (task.completedAt || task.scheduleType !== "daily") return true;

  const revealAt = new Date(task.dueDate).getTime() - DAILY_RECURRING_REVEAL_MINUTES * 60 * 1000;
  return now.getTime() >= revealAt;
}

export default function WallPage() {
  const { getCompletionEncouragement, language, t } = useLanguage();
  const locale = getLocale(language);
  const { household } = useHousehold();
  const { members } = useMembers();
  const { events, todayEvents } = useCalendarEvents();
  const { tasks, createTask, setTaskCompleted } = useTasks();
  const [now, setNow] = useState(new Date());
  const [completionFeedback, setCompletionFeedback] = useState<{ taskId: string; message: string } | null>(null);
  const [createSuccessMessage, setCreateSuccessMessage] = useState<string | null>(null);
  const [recentlyCreatedTaskId, setRecentlyCreatedTaskId] = useState<string | null>(null);
  const [isFirstRunRevealActive] = useState(() => hasPendingFirstRunReveal("wall"));
  const [wallTaskCreatorMode, setWallTaskCreatorMode] = useState<WallTaskCreatorMode | null>(null);
  const [isQuickCreatorOpen, setQuickCreatorOpen] = useState(false);
  const [isQuickCreatorMounted, setQuickCreatorMounted] = useState(false);
  const quickCreatorTimerRef = useRef<number | null>(null);

  const todayTasks = useMemo(() => tasks.filter((task) => shouldShowTodayTask(task, now)), [now, tasks]);
  const stats = useMemo(() => {
    const completed = todayTasks.filter((task) => task.completedAt).length;
    return { completed, total: todayTasks.length, remaining: todayTasks.length - completed };
  }, [todayTasks]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000 * 30);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    consumePendingFirstRunReveal("wall");
  }, []);
  const closeQuickCreator = useCallback(() => {
    if (quickCreatorTimerRef.current) window.clearTimeout(quickCreatorTimerRef.current);

    setQuickCreatorOpen(false);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    quickCreatorTimerRef.current = window.setTimeout(() => {
      setQuickCreatorMounted(false);
      quickCreatorTimerRef.current = null;
    }, prefersReducedMotion ? QUICK_CREATOR_REDUCED_MOTION_CLOSE_MS : QUICK_CREATOR_CLOSE_MS);
  }, []);

  const openQuickCreator = useCallback(() => {
    if (quickCreatorTimerRef.current) window.clearTimeout(quickCreatorTimerRef.current);

    setQuickCreatorMounted(true);
    window.requestAnimationFrame(() => setQuickCreatorOpen(true));
  }, []);

  const toggleQuickCreator = useCallback(() => {
    if (isQuickCreatorOpen) {
      closeQuickCreator();
      return;
    }

    openQuickCreator();
  }, [closeQuickCreator, isQuickCreatorOpen, openQuickCreator]);


  useEffect(() => {
    setWallTaskCreatorMode(readWallTaskCreatorMode());

    const handleChange = () => setWallTaskCreatorMode(readWallTaskCreatorMode());
    window.addEventListener(WALL_TASK_CREATOR_MODE_CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(WALL_TASK_CREATOR_MODE_CHANGE_EVENT, handleChange);
  }, []);

  useEffect(() => {
    if (wallTaskCreatorMode !== "docked" && isQuickCreatorMounted) closeQuickCreator();
  }, [closeQuickCreator, isQuickCreatorMounted, wallTaskCreatorMode]);

  useEffect(() => {
    return () => {
      if (quickCreatorTimerRef.current) window.clearTimeout(quickCreatorTimerRef.current);
    };
  }, []);

  const handleTaskCreated = useCallback((created: unknown) => {
    const createdTaskId = getFirstCreatedTaskId(created);
    setCreateSuccessMessage(t("taskAdded"));
    setRecentlyCreatedTaskId(createdTaskId);
    window.setTimeout(() => {
      setRecentlyCreatedTaskId((current) => (current === createdTaskId ? null : current));
    }, 1800);
  }, [setCreateSuccessMessage, setRecentlyCreatedTaskId, t]);

  async function toggleTask(task: TaskInstance) {
    const willComplete = !task.completedAt;
    try {
      await setTaskCompleted(task, willComplete, task.assignedToMemberId);
    } catch {
      return;
    }

    if (willComplete) {
      const message = getCompletionEncouragement(completionFeedback?.message);
      setCompletionFeedback({ taskId: task.id, message });
      window.setTimeout(() => setCompletionFeedback((current) => (current?.taskId === task.id ? null : current)), 1400);
    }
  }

  return (
    <WallShell revealActive={isFirstRunRevealActive}>
      <header className={`grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end ${isFirstRunRevealActive ? "reveal-item reveal-item--header reveal-stagger-3" : ""}`}>
        <div className="min-w-0">
          <p className="text-lg font-black uppercase tracking-[0.24em] text-amber-700">{household?.name ?? "HomeBoard"}</p>
          <h1 className="mt-2 text-6xl font-black tracking-tight text-stone-950 lg:text-8xl">{formatShortDate(now, locale)}</h1>
          <p className="mt-3 text-4xl font-black text-stone-600">
            {new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(now)}
          </p>
        </div>
        <div className={`min-w-0 rounded-[2rem] bg-stone-950 p-5 text-white shadow-[0_20px_70px_rgba(28,25,23,0.24)] transition-[box-shadow,transform] duration-200 ease-[var(--ease-out)] lg:min-w-80 ${completionFeedback ? "shadow-emerald-500/20" : ""} ${isFirstRunRevealActive ? "reveal-item reveal-item--card reveal-stagger-4" : ""}`}>
          <p className="min-h-5 truncate text-sm font-bold uppercase tracking-[0.18em] text-amber-200">{completionFeedback?.message ?? t("todaysProgress")}</p>
          <p className="mt-2 text-5xl font-black">{stats.completed}/{stats.total}</p>
          <p className="mt-1 min-h-6 truncate font-semibold text-white/70">{t("progressComplete")} · {stats.remaining} {t("remaining")}</p>
        </div>
      </header>

      <div className={`mt-5 flex flex-wrap gap-2 ${isFirstRunRevealActive ? "reveal-item reveal-item--list reveal-stagger-5" : ""}`}>
        {members.map((member) => (
          <MemberBadge key={member.id} member={member} />
        ))}
      </div>

      <div className="mt-6 grid flex-1 gap-5 xl:grid-cols-[1fr_0.9fr]">
        <section className={`surface-card rounded-[2.25rem] p-4 ${isFirstRunRevealActive ? "reveal-item reveal-item--card reveal-stagger-6" : ""}`}>
          <SectionHeader
            action={(
              <div className="flex flex-wrap justify-end gap-2">
                <StatusChip>{t("allPeople")}</StatusChip>
                {wallTaskCreatorMode === "docked" ? <WallQuickTaskButton isOpen={isQuickCreatorOpen} onToggle={toggleQuickCreator} /> : null}
              </div>
            )}
            eyebrow={t("touchToCheckOff")}
            title={t("todaysTasks")}
          />
          {wallTaskCreatorMode === "docked" && isQuickCreatorMounted ? (
            <div className={`wall-quick-add-panel w-full min-w-0 ${isQuickCreatorOpen ? "wall-quick-add-panel--open" : "wall-quick-add-panel--closing"}`}>
              <WallQuickTaskCreator members={members} onCancel={closeQuickCreator} onCreated={handleTaskCreated} onCreateTask={createTask} variant="popover" />
            </div>
          ) : null}
          {wallTaskCreatorMode === "panel" ? (
            <div className="mb-4">
              <WallQuickTaskCreator members={members} onCreated={handleTaskCreated} onCreateTask={createTask} />
            </div>
          ) : null}
          <ActionToast message={createSuccessMessage} onDismiss={() => setCreateSuccessMessage(null)} placement="inline" />
          <TaskList grouped members={members} onToggle={toggleTask} recentlyCompletedId={completionFeedback?.taskId ?? null} recentlyCreatedId={recentlyCreatedTaskId} completionMessage={completionFeedback?.message} roomy tasks={todayTasks} />
        </section>
        <aside className={`grid content-start gap-5 ${isFirstRunRevealActive ? "reveal-item reveal-item--list reveal-stagger-8" : ""}`}>
          <TodayAgenda events={todayEvents} />
          <WeekPreview events={events} />
        </aside>
      </div>
    </WallShell>
  );
}
