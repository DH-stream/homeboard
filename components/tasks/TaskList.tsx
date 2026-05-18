"use client";

import type { CSSProperties } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { MemberTaskGroup } from "@/components/tasks/MemberTaskGroup";
import { TaskCard } from "@/components/tasks/TaskCard";
import { useLanguage } from "@/lib/i18n";
import type { HouseholdMember, TaskInstance } from "@/types";

type TaskWaterfallStyle = CSSProperties & {
  "--task-waterfall-delay": string;
};

const WALL_TWO_COLUMN_TASK_THRESHOLD = 4;

export function TaskList({
  tasks,
  members,
  onToggle,
  onEdit,
  grouped = false,
  roomy = false,
  recentlyCompletedId,
  recentlyCreatedId,
  completionMessage,
  animationKey,
}: {
  tasks: TaskInstance[];
  members: HouseholdMember[];
  onToggle: (task: TaskInstance) => Promise<void> | void;
  onEdit?: (task: TaskInstance, title: string) => Promise<unknown> | void;
  grouped?: boolean;
  roomy?: boolean;
  recentlyCompletedId?: string | null;
  recentlyCreatedId?: string | null;
  completionMessage?: string;
  animationKey?: string;
}) {
  const { t } = useLanguage();

  if (!tasks.length) {
    return <EmptyState title={t("noTasks")}>{t("noTasksBody")}</EmptyState>;
  }

  if (grouped) {
    const groups = members
      .map((member) => ({ member, tasks: tasks.filter((task) => task.assignedToMemberId === member.id) }))
      .filter((group) => group.tasks.length);
    const unassigned = tasks.filter((task) => !task.assignedToMemberId);
    const shouldUseWallTwoColumns = roomy && tasks.length >= WALL_TWO_COLUMN_TASK_THRESHOLD;
    const groupedGridClassName = roomy
      ? `grid gap-4 ${shouldUseWallTwoColumns ? "xl:grid-cols-2" : ""}`
      : "grid gap-4 md:grid-cols-2 xl:grid-cols-4";

    return (
      <div className={groupedGridClassName}>
        {groups.map((group, index) => (
          <div className="task-waterfall-item" key={`${animationKey ?? "grouped"}-${group.member.id}`} style={{ "--task-waterfall-delay": `${index * 80}ms` } as TaskWaterfallStyle}>
            <MemberTaskGroup member={group.member} onToggle={onToggle} recentlyCompletedId={recentlyCompletedId} recentlyCreatedId={recentlyCreatedId} completionMessage={completionMessage} roomy={roomy} tasks={group.tasks} />
          </div>
        ))}
        {unassigned.length ? (
          <div className="task-waterfall-item" key={`${animationKey ?? "grouped"}-unassigned`} style={{ "--task-waterfall-delay": `${groups.length * 80}ms` } as TaskWaterfallStyle}>
            <MemberTaskGroup onToggle={onToggle} recentlyCompletedId={recentlyCompletedId} recentlyCreatedId={recentlyCreatedId} completionMessage={completionMessage} roomy={roomy} tasks={unassigned} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, index) => (
        <div className="task-waterfall-item" key={`${animationKey ?? "list"}-${task.id}`} style={{ "--task-waterfall-delay": `${index * 70}ms` } as TaskWaterfallStyle}>
          <TaskCard
            celebrated={recentlyCompletedId === task.id}
            recentlyCreated={recentlyCreatedId === task.id}
            completionMessage={recentlyCompletedId === task.id ? completionMessage : undefined}
            member={members.find((member) => member.id === task.assignedToMemberId)}
            onEdit={onEdit}
            onToggle={onToggle}
            roomy={roomy}
            task={task}
          />
        </div>
      ))}
    </div>
  );
}
