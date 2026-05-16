"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TodayAgenda } from "@/components/calendar/TodayAgenda";
import { AppShell } from "@/components/layout/AppShell";
import { MemberFilterPills } from "@/components/members/MemberFilterPills";
import { AddTaskForm } from "@/components/tasks/AddTaskForm";
import { TaskList } from "@/components/tasks/TaskList";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { useCalendarEvents } from "@/lib/hooks/useCalendarEvents";
import { useMembers } from "@/lib/hooks/useMembers";
import { useTasks } from "@/lib/hooks/useTasks";
import { useLanguage } from "@/lib/i18n";
import { isFutureLocalDay, isSameLocalDay } from "@/lib/utils/date";
import type { TaskInstance } from "@/types";

type Filter = "all" | "open" | "completed";

export default function MobileAppPage() {
  const { getCompletionEncouragement, t } = useLanguage();
  const { members } = useMembers();
  const { todayEvents } = useCalendarEvents();
  const { tasks, createTask, setTaskCompleted, updateTask } = useTasks();
  const [filter, setFilter] = useState<Filter>("all");
  const [memberFilter, setMemberFilter] = useState<string | null>(null);
  const [completionFeedback, setCompletionFeedback] = useState<{ taskId: string; message: string } | null>(null);

  const todayTasks = useMemo(() => tasks.filter((task) => isSameLocalDay(task.dueDate)), [tasks]);
  const upcomingTasks = useMemo(() => tasks.filter((task) => isFutureLocalDay(task.dueDate)), [tasks]);
  const stats = useMemo(() => {
    const completed = todayTasks.filter((task) => task.completedAt).length;
    return { completed, total: todayTasks.length, remaining: todayTasks.length - completed };
  }, [todayTasks]);

  const filteredTasks = useMemo(() => {
    return todayTasks.filter((task) => {
      const statusMatch = filter === "all" || (filter === "completed" ? task.completedAt : !task.completedAt);
      const memberMatch = memberFilter === null || task.assignedToMemberId === memberFilter;
      return statusMatch && memberMatch;
    });
  }, [filter, memberFilter, todayTasks]);

  const todayTaskAnimationKey = `today-${memberFilter ?? "all-members"}-${filter}`;

  async function toggleTask(task: TaskInstance) {
    const willComplete = !task.completedAt;
    await setTaskCompleted(task.id, willComplete, task.assignedToMemberId);
    if (willComplete) {
      const message = getCompletionEncouragement(completionFeedback?.message);
      setCompletionFeedback({ taskId: task.id, message });
      window.setTimeout(() => setCompletionFeedback((current) => (current?.taskId === task.id ? null : current)), 1400);
    }
  }

  const filterLabels: Record<Filter, string> = {
    all: t("all"),
    open: t("filtersOpen"),
    completed: t("filtersCompleted"),
  };

  return (
    <AppShell eyebrow={t("appEyebrow")} title={t("appTitle")}>
      <section className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
        <div className="surface-card min-w-0 rounded-[1.5rem] p-3 text-center sm:p-4">
          <p className="text-3xl font-black text-stone-950">{stats.total}</p>
          <p className="min-h-4 truncate text-[0.68rem] font-black uppercase tracking-[0.12em] text-stone-400 sm:text-xs sm:tracking-[0.16em]">{t("tasksLabel")}</p>
        </div>
        <div className={`min-w-0 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-3 text-center shadow-sm transition-[box-shadow,transform] duration-200 ease-[var(--ease-out)] sm:p-4 ${completionFeedback ? "shadow-emerald-200/80" : ""}`}>
          <p className="text-3xl font-black text-emerald-700">{stats.completed}</p>
          <p className="min-h-4 truncate text-[0.68rem] font-black uppercase tracking-[0.12em] text-emerald-500 sm:text-xs sm:tracking-[0.16em]">{completionFeedback?.message ?? t("done")}</p>
        </div>
        <Link className="pressable min-w-0 rounded-[1.5rem] bg-stone-950 p-3 text-center text-white shadow-sm sm:p-4" href="/wall">
          <p className="text-3xl font-black">{t("wall")}</p>
          <p className="min-h-4 truncate text-[0.68rem] font-black uppercase tracking-[0.12em] text-white/50 sm:text-xs sm:tracking-[0.16em]">{t("open")}</p>
        </Link>
      </section>

      <AddTaskForm members={members} onCreate={createTask} />

      <section className="surface-card mt-5 rounded-[2rem] p-4">
        <div className="mb-3 min-w-0">
          <StatusChip tone="amber">{t("previewStorage")}</StatusChip>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-stone-950">{t("todaysTasks")}</h2>
        </div>
        <MemberFilterPills members={members} onSelectMember={setMemberFilter} selectedMemberId={memberFilter} />
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-stone-100 p-1 text-sm font-black text-stone-600">
          {(["all", "open", "completed"] as Filter[]).map((next) => (
            <button className={`pressable min-h-11 min-w-0 truncate rounded-xl px-2 py-2 text-center sm:px-3 ${filter === next ? "bg-white text-stone-950 shadow-sm" : ""}`} key={next} onClick={() => setFilter(next)} type="button">
              {filterLabels[next]}
            </button>
          ))}
        </div>
        <TaskList
          animationKey={todayTaskAnimationKey}
          members={members}
          onEdit={(task, title) => updateTask({ id: task.id, titleSnapshot: title })}
          onToggle={toggleTask}
          recentlyCompletedId={completionFeedback?.taskId ?? null}
          completionMessage={completionFeedback?.message}
          tasks={filteredTasks}
        />
      </section>

      <section className="surface-card mt-5 rounded-[2rem] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black tracking-tight text-stone-950">{t("upcoming")}</h2>
          <StatusChip tone="amber">{t("localPreview")}</StatusChip>
        </div>
        {upcomingTasks.length ? (
          <TaskList animationKey="upcoming" members={members} onEdit={(task, title) => updateTask({ id: task.id, titleSnapshot: title })} onToggle={toggleTask} recentlyCompletedId={completionFeedback?.taskId ?? null} completionMessage={completionFeedback?.message} tasks={upcomingTasks} />
        ) : (
          <EmptyState title={t("upcoming")}>{t("upcomingEmpty")}</EmptyState>
        )}
        <p className="mt-3 text-xs font-bold leading-5 text-stone-500">{t("dueDatePreview")}</p>
      </section>

      <div className="mt-5">
        <TodayAgenda compact events={todayEvents} />
      </div>
    </AppShell>
  );
}
