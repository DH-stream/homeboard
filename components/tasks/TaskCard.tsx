"use client";

import { useState } from "react";
import { MemberBadge } from "@/components/members/MemberBadge";
import { formatTime } from "@/lib/utils/date";
import type { HouseholdMember, TaskInstance } from "@/types";

export function TaskCard({
  task,
  member,
  onToggle,
  onEdit,
  roomy = false,
}: {
  task: TaskInstance;
  member?: HouseholdMember;
  onToggle: (task: TaskInstance) => Promise<void> | void;
  onEdit?: (task: TaskInstance, title: string) => Promise<unknown> | void;
  roomy?: boolean;
}) {
  const [isBusy, setBusy] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.titleSnapshot);
  const completed = Boolean(task.completedAt);

  async function handleToggle() {
    setBusy(true);
    try {
      await onToggle(task);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    if (!onEdit || !title.trim()) return;
    await onEdit(task, title.trim());
    setEditing(false);
  }

  return (
    <article
      className={`group rounded-[1.6rem] border p-4 transition ${
        completed
          ? "border-emerald-200 bg-emerald-50/80 text-stone-500"
          : "border-white/80 bg-white/85 text-stone-950 shadow-[0_14px_40px_rgba(87,64,38,0.08)]"
      } ${roomy ? "lg:p-5" : ""}`}
    >
      <div className="flex items-center gap-4">
        <button
          aria-label={completed ? "Mark task incomplete" : "Mark task complete"}
          className={`flex shrink-0 items-center justify-center rounded-2xl border-2 text-2xl font-black transition ${
            roomy ? "h-16 w-16" : "h-12 w-12"
          } ${completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-stone-300 bg-white text-transparent hover:border-emerald-400"}`}
          disabled={isBusy}
          onClick={handleToggle}
          type="button"
        >
          ✓
        </button>
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-2xl border border-stone-200 bg-white px-3 py-2 font-bold outline-none focus:border-amber-500"
                onChange={(event) => setTitle(event.target.value)}
                value={title}
              />
              <button className="rounded-2xl bg-stone-950 px-3 py-2 text-sm font-bold text-white" onClick={handleSubmit} type="button">
                Save
              </button>
            </div>
          ) : (
            <h3 className={`truncate font-black tracking-tight ${roomy ? "text-2xl" : "text-lg"} ${completed ? "line-through" : ""}`}>
              {task.titleSnapshot}
            </h3>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-stone-500">
            <span>{formatTime(task.dueDate)}</span>
            <MemberBadge compact member={member} />
          </div>
        </div>
        {onEdit && !isEditing ? (
          <button className="rounded-full px-3 py-2 text-sm font-bold text-stone-500 hover:bg-stone-100" onClick={() => setEditing(true)} type="button">
            Edit
          </button>
        ) : null}
      </div>
    </article>
  );
}
