"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TodayAgenda } from "@/components/calendar/TodayAgenda";
import { AppShell } from "@/components/layout/AppShell";
import { AddTaskForm } from "@/components/tasks/AddTaskForm";
import { TaskList } from "@/components/tasks/TaskList";
import { useCalendarEvents } from "@/lib/hooks/useCalendarEvents";
import { useMembers } from "@/lib/hooks/useMembers";
import { useTasks } from "@/lib/hooks/useTasks";
import type { TaskInstance } from "@/types";

type Filter = "all" | "open" | "completed";

export default function MobileAppPage() {
  const { members } = useMembers();
  const { todayEvents } = useCalendarEvents();
  const { tasks, stats, createTask, setTaskCompleted, updateTask } = useTasks();
  const [filter, setFilter] = useState<Filter>("all");
  const [memberFilter, setMemberFilter] = useState("all");

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const statusMatch = filter === "all" || (filter === "completed" ? task.completedAt : !task.completedAt);
      const memberMatch = memberFilter === "all" || task.assignedToMemberId === memberFilter;
      return statusMatch && memberMatch;
    });
  }, [filter, memberFilter, tasks]);

  async function toggleTask(task: TaskInstance) {
    await setTaskCompleted(task.id, !task.completedAt, task.assignedToMemberId);
  }

  return (
    <AppShell eyebrow="Mobile HomeBoard" title="Today">
      <section className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-[1.5rem] bg-white/80 p-4 text-center shadow-sm ring-1 ring-black/5">
          <p className="text-3xl font-black text-stone-950">{stats.total}</p>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-400">Tasks</p>
        </div>
        <div className="rounded-[1.5rem] bg-emerald-50 p-4 text-center shadow-sm ring-1 ring-emerald-100">
          <p className="text-3xl font-black text-emerald-700">{stats.completed}</p>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-500">Done</p>
        </div>
        <Link className="rounded-[1.5rem] bg-stone-950 p-4 text-center text-white shadow-sm" href="/wall">
          <p className="text-3xl font-black">Wall</p>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/50">Open</p>
        </Link>
      </section>

      <AddTaskForm members={members} onCreate={createTask} />

      <section className="mt-5 rounded-[2rem] bg-white/55 p-4 ring-1 ring-white/80">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black tracking-tight text-stone-950">Tasks</h2>
          <select className="rounded-full bg-white px-3 py-2 text-sm font-bold text-stone-700 shadow-sm" onChange={(event) => setMemberFilter(event.target.value)} value={memberFilter}>
            <option value="all">All people</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.displayName}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-stone-100 p-1 text-sm font-black text-stone-600">
          {(["all", "open", "completed"] as Filter[]).map((next) => (
            <button className={`rounded-xl px-3 py-2 capitalize ${filter === next ? "bg-white text-stone-950 shadow-sm" : ""}`} key={next} onClick={() => setFilter(next)} type="button">
              {next}
            </button>
          ))}
        </div>
        <TaskList
          members={members}
          onEdit={(task, title) => updateTask({ id: task.id, titleSnapshot: title })}
          onToggle={toggleTask}
          tasks={filteredTasks}
        />
      </section>

      <div className="mt-5">
        <TodayAgenda compact events={todayEvents} />
      </div>
    </AppShell>
  );
}
