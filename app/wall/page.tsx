"use client";

import { useEffect, useMemo, useState } from "react";
import { TodayAgenda } from "@/components/calendar/TodayAgenda";
import { WeekPreview } from "@/components/calendar/WeekPreview";
import { WallShell } from "@/components/layout/WallShell";
import { MemberBadge } from "@/components/members/MemberBadge";
import { TaskList } from "@/components/tasks/TaskList";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { useCalendarEvents } from "@/lib/hooks/useCalendarEvents";
import { useHousehold, useMembers } from "@/lib/hooks/useMembers";
import { useTasks } from "@/lib/hooks/useTasks";
import { getLocale, useLanguage } from "@/lib/i18n";
import { formatShortDate, isSameLocalDay } from "@/lib/utils/date";
import type { TaskInstance } from "@/types";

export default function WallPage() {
  const { language, t } = useLanguage();
  const locale = getLocale(language);
  const { household } = useHousehold();
  const { members } = useMembers();
  const { events, todayEvents } = useCalendarEvents();
  const { tasks, setTaskCompleted } = useTasks();
  const [now, setNow] = useState(new Date());
  const [recentlyCompletedId, setRecentlyCompletedId] = useState<string | null>(null);

  const todayTasks = useMemo(() => tasks.filter((task) => isSameLocalDay(task.dueDate, now)), [now, tasks]);
  const stats = useMemo(() => {
    const completed = todayTasks.filter((task) => task.completedAt).length;
    return { completed, total: todayTasks.length, remaining: todayTasks.length - completed };
  }, [todayTasks]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000 * 30);
    return () => window.clearInterval(timer);
  }, []);

  async function toggleTask(task: TaskInstance) {
    const willComplete = !task.completedAt;
    await setTaskCompleted(task.id, willComplete, task.assignedToMemberId);
    if (willComplete) {
      setRecentlyCompletedId(task.id);
      window.setTimeout(() => setRecentlyCompletedId((current) => (current === task.id ? null : current)), 1400);
    }
  }

  return (
    <WallShell>
      <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <p className="text-lg font-black uppercase tracking-[0.24em] text-amber-700">{household?.name ?? "HomeBoard"}</p>
          <h1 className="mt-2 text-6xl font-black tracking-tight text-stone-950 lg:text-8xl">{formatShortDate(now, locale)}</h1>
          <p className="mt-3 text-4xl font-black text-stone-600">
            {new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(now)}
          </p>
        </div>
        <div className={`min-w-0 rounded-[2rem] bg-stone-950 p-5 text-white shadow-[0_20px_70px_rgba(28,25,23,0.24)] transition-[box-shadow,transform] duration-200 ease-[var(--ease-out)] lg:min-w-80 ${recentlyCompletedId ? "shadow-emerald-500/20" : ""}`}>
          <p className="min-h-5 truncate text-sm font-bold uppercase tracking-[0.18em] text-amber-200">{recentlyCompletedId ? t("niceWork") : t("todaysProgress")}</p>
          <p className="mt-2 text-5xl font-black">{stats.completed}/{stats.total}</p>
          <p className="mt-1 min-h-6 truncate font-semibold text-white/70">{t("progressComplete")} · {stats.remaining} {t("remaining")}</p>
        </div>
      </header>

      <div className="mt-5 flex flex-wrap gap-2">
        {members.map((member) => (
          <MemberBadge key={member.id} member={member} />
        ))}
      </div>

      <div className="mt-6 grid flex-1 gap-5 xl:grid-cols-[1fr_0.9fr]">
        <section className="surface-card rounded-[2.25rem] p-4">
          <SectionHeader
            action={<StatusChip>{t("allPeople")}</StatusChip>}
            eyebrow={t("touchToCheckOff")}
            title={t("todaysTasks")}
          />
          <TaskList grouped members={members} onToggle={toggleTask} recentlyCompletedId={recentlyCompletedId} roomy tasks={todayTasks} />
        </section>
        <aside className="grid content-start gap-5">
          <TodayAgenda events={todayEvents} />
          <WeekPreview events={events} />
        </aside>
      </div>
    </WallShell>
  );
}
