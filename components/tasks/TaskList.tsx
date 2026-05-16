"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { MemberTaskGroup } from "@/components/tasks/MemberTaskGroup";
import { TaskCard } from "@/components/tasks/TaskCard";
import type { HouseholdMember, TaskInstance } from "@/types";

export function TaskList({
  tasks,
  members,
  onToggle,
  onEdit,
  grouped = false,
  roomy = false,
}: {
  tasks: TaskInstance[];
  members: HouseholdMember[];
  onToggle: (task: TaskInstance) => Promise<void> | void;
  onEdit?: (task: TaskInstance, title: string) => Promise<unknown> | void;
  grouped?: boolean;
  roomy?: boolean;
}) {
  if (!tasks.length) {
    return <EmptyState title="No tasks for today.">Add a task from the mobile app view to start the household plan.</EmptyState>;
  }

  if (grouped) {
    const groups = members
      .map((member) => ({ member, tasks: tasks.filter((task) => task.assignedToMemberId === member.id) }))
      .filter((group) => group.tasks.length);
    const unassigned = tasks.filter((task) => !task.assignedToMemberId);

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {groups.map((group) => (
          <MemberTaskGroup key={group.member.id} member={group.member} onToggle={onToggle} roomy={roomy} tasks={group.tasks} />
        ))}
        {unassigned.length ? <MemberTaskGroup onToggle={onToggle} roomy={roomy} tasks={unassigned} /> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          member={members.find((member) => member.id === task.assignedToMemberId)}
          onEdit={onEdit}
          onToggle={onToggle}
          roomy={roomy}
          task={task}
        />
      ))}
    </div>
  );
}
