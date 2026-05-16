"use client";

import { useEffect, useState } from "react";
import { TodayAgenda } from "@/components/calendar/TodayAgenda";
import { WeekPreview } from "@/components/calendar/WeekPreview";
import { WallShell } from "@/components/layout/WallShell";
import { MemberBadge } from "@/components/members/MemberBadge";
import { TaskList } from "@/components/tasks/TaskList";
import { useCalendarEvents } from "@/lib/hooks/useCalendarEvents";
import { useHousehold, useMembers } from "@/lib/hooks/useMembers";
import { useTasks } from "@/lib/hooks/useTasks";
import { formatShortDate } from "@/lib/utils/date";
import type { TaskInstance } from "@/types";

export default function WallPage() {
  const { household } = useHousehold();
  const { members } = useMembers();
  const { events, todayEvents } = useCalendarEvents();
  const { tasks, stats, setTaskCompleted } = useTasks();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000 * 30);
    return () => window.clearInterval(timer);
  }, []);

  async function toggleTask(task: TaskInstance) {
    await setTaskCompleted(task.id, !task.completedAt, task.assignedToMemberId);
  }

  return (
    <WallShell>
      <header className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-lg font-black uppercase tracking-[0.24em] text-amber-700">{household?.name ?? "HomeBoard"}</p>
          <h1 className="mt-2 text-6xl font-black tracking-tight text-stone-950 lg:text-8xl">{formatShortDate(now)}</h1>
          <p className="mt-3 text-4xl font-black text-stone-600">
            {new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now)}
          </p>
        </div>
        <div className="rounded-[2rem] bg-stone-950 p-5 text-white shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-200">Today&apos;s progress</p>
          <p className="mt-2 text-5xl font-black">{stats.completed}/{stats.total}</p>
          <p className="mt-1 font-semibold text-white/70">tasks complete · {stats.remaining} remaining</p>
        </div>
      </header>

      <div className="mt-5 flex flex-wrap gap-2">
        {members.map((member) => (
          <MemberBadge key={member.id} member={member} />
        ))}
      </div>

      <div className="mt-6 grid flex-1 gap-5 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-[2.25rem] bg-white/45 p-4 ring-1 ring-white/80">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-stone-500">Touch to check off</p>
              <h2 className="text-3xl font-black tracking-tight text-stone-950">Today&apos;s tasks</h2>
            </div>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-stone-600 shadow-sm">Grouped by person</span>
          </div>
          <TaskList grouped members={members} onToggle={toggleTask} roomy tasks={tasks} />
        </section>
        <aside className="grid content-start gap-5">
          <TodayAgenda events={todayEvents} />
          <WeekPreview events={events} />
        </aside>
      </div>
    </WallShell>
  );
}
