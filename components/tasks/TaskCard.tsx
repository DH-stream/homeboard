"use client";

import { useState } from "react";
import { MemberBadge } from "@/components/members/MemberBadge";
import { getLocale, useLanguage } from "@/lib/i18n";
import { formatTaskDate, formatTime, isSameLocalDay } from "@/lib/utils/date";
import type { HouseholdMember, TaskInstance } from "@/types";

export function TaskCard({
  task,
  member,
  onToggle,
  onEdit,
  roomy = false,
  celebrated = false,
  completionMessage,
}: {
  task: TaskInstance;
  member?: HouseholdMember;
  onToggle: (task: TaskInstance) => Promise<void> | void;
  onEdit?: (task: TaskInstance, title: string) => Promise<unknown> | void;
  roomy?: boolean;
  celebrated?: boolean;
  completionMessage?: string;
}) {
  const { language, t } = useLanguage();
  const locale = getLocale(language);
  const [isBusy, setBusy] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.titleSnapshot);
  const completed = Boolean(task.completedAt);
  const showDate = !isSameLocalDay(task.dueDate);
  const feedbackText = completionMessage ?? t("niceWork");

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
      className={`task-card rounded-[1.6rem] border p-4 transition-[background-color,border-color,box-shadow,opacity,transform] duration-200 ease-[var(--ease-out)] ${
        completed
          ? "border-emerald-200 bg-emerald-50/85 text-stone-500 shadow-inner shadow-emerald-100/70"
          : "border-white/85 bg-white/88 text-stone-950 shadow-[0_14px_40px_rgba(87,64,38,0.08)]"
      } ${celebrated ? "task-card--celebrate" : ""} ${roomy ? "lg:p-5" : ""}`}
    >
      <div className="flex items-center gap-4">
        <button
          aria-label={completed ? t("taskIncompleteLabel") : t("taskCompleteLabel")}
          aria-pressed={completed}
          className={`task-check pressable flex shrink-0 items-center justify-center rounded-2xl border-2 font-black ${
            roomy ? "h-16 w-16 text-3xl" : "h-12 w-12 text-2xl"
          } ${completed ? "task-check--done border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "border-stone-300 bg-white text-transparent shadow-sm hover:border-emerald-400"}`}
          disabled={isBusy}
          onClick={handleToggle}
          type="button"
        >
          <span aria-hidden className="task-check-mark">
            ✓
          </span>
        </button>
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex min-w-0 gap-2">
              <input
                className="min-h-11 min-w-0 flex-1 rounded-2xl border border-stone-200 bg-white px-3 py-2 font-bold outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-500"
                onChange={(event) => setTitle(event.target.value)}
                value={title}
              />
              <button className="pressable min-h-11 rounded-2xl bg-stone-950 px-4 py-2 text-sm font-bold text-white" onClick={handleSubmit} type="button">
                {t("save")}
              </button>
            </div>
          ) : (
            <div className="min-w-0">
              <h3 className={`task-title font-black tracking-tight transition-colors duration-200 ease-[var(--ease-out)] ${roomy ? "text-2xl" : "text-lg"} ${completed ? "line-through decoration-2 underline-offset-4" : ""}`}>
                {task.titleSnapshot}
              </h3>
              <p className={`min-h-5 truncate text-sm font-black text-emerald-700 transition-[opacity,transform] duration-180 ease-[var(--ease-out)] ${celebrated ? "translate-y-0 opacity-100" : "-translate-y-0.5 opacity-0"}`} aria-hidden={!celebrated} aria-live="polite">
                {celebrated ? feedbackText : ""}
              </p>
            </div>
          )}
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold text-stone-500">
            <span className="min-w-0 truncate">{showDate ? `${formatTaskDate(task.dueDate, locale)} · ${formatTime(task.dueDate, locale)}` : formatTime(task.dueDate, locale)}</span>
            <MemberBadge compact member={member} />
          </div>
        </div>
        {onEdit && !isEditing ? (
          <button className="pressable min-h-11 shrink-0 rounded-full px-3 py-2 text-sm font-bold text-stone-500 hover:bg-stone-100" onClick={() => setEditing(true)} type="button">
            {t("edit")}
          </button>
        ) : null}
      </div>
    </article>
  );
}
