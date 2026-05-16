"use client";

import { MemberBadge } from "@/components/members/MemberBadge";
import { TaskCard } from "@/components/tasks/TaskCard";
import { useLanguage } from "@/lib/i18n";
import type { HouseholdMember, TaskInstance } from "@/types";

export function MemberTaskGroup({
  member,
  tasks,
  onToggle,
  roomy,
  recentlyCompletedId,
}: {
  member?: HouseholdMember;
  tasks: TaskInstance[];
  onToggle: (task: TaskInstance) => Promise<void> | void;
  roomy?: boolean;
  recentlyCompletedId?: string | null;
}) {
  const { t } = useLanguage();

  return (
    <section className="rounded-[2rem] bg-white/45 p-3 ring-1 ring-white/80">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2 px-1">
        <MemberBadge member={member} />
        <span className="shrink-0 text-sm font-black text-stone-500">{tasks.filter((task) => !task.completedAt).length} {t("left")}</span>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard celebrated={recentlyCompletedId === task.id} key={task.id} member={member} onToggle={onToggle} roomy={roomy} task={task} />
        ))}
      </div>
    </section>
  );
}
