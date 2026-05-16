import { MemberBadge } from "@/components/members/MemberBadge";
import { TaskCard } from "@/components/tasks/TaskCard";
import type { HouseholdMember, TaskInstance } from "@/types";

export function MemberTaskGroup({
  member,
  tasks,
  onToggle,
  roomy,
}: {
  member?: HouseholdMember;
  tasks: TaskInstance[];
  onToggle: (task: TaskInstance) => Promise<void> | void;
  roomy?: boolean;
}) {
  return (
    <section className="rounded-[2rem] bg-white/45 p-3 ring-1 ring-white/80">
      <div className="mb-3 flex items-center justify-between px-1">
        <MemberBadge member={member} />
        <span className="text-sm font-black text-stone-500">{tasks.filter((task) => !task.completedAt).length} left</span>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} member={member} onToggle={onToggle} roomy={roomy} task={task} />
        ))}
      </div>
    </section>
  );
}
