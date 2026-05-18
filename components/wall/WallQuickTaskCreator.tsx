"use client";

import { useState, type FormEvent } from "react";
import { useLanguage } from "@/lib/i18n";
import { atLocalTime } from "@/lib/utils/date";
import type { CreateTaskInput, HouseholdMember } from "@/types";

const MINIMUM_SAVE_FEEDBACK_MS = 320;

async function waitForMinimumSaveFeedback(saveStartedAt: number) {
  const remainingFeedbackMs = MINIMUM_SAVE_FEEDBACK_MS - (performance.now() - saveStartedAt);
  if (remainingFeedbackMs > 0) await new Promise((resolve) => window.setTimeout(resolve, remainingFeedbackMs));
}

export function WallQuickTaskCreator({
  members,
  onCancel,
  onCreated,
  onCreateTask,
  variant = "panel",
}: {
  members: HouseholdMember[];
  onCancel?: () => void;
  onCreateTask: (input: CreateTaskInput) => Promise<unknown>;
  onCreated?: (created: unknown) => void;
  variant?: "popover" | "panel";
}) {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [assignedToMemberId, setAssignedToMemberId] = useState<string | undefined>();
  const [isSaving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSaving) return;

    setCreateError(null);
    setSaving(true);
    const saveStartedAt = performance.now();
    try {
      const created = await onCreateTask({
        title: trimmedTitle,
        assignedToMemberId,
        dueDate: atLocalTime(20, 0),
        schedule: { type: "once" },
        source: "manual",
      });
      await waitForMinimumSaveFeedback(saveStartedAt);
      onCreated?.(created);
      setTitle("");
      setAssignedToMemberId(undefined);
      if (variant === "popover") onCancel?.();
    } catch {
      await waitForMinimumSaveFeedback(saveStartedAt);
      setCreateError(t("taskSaveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="w-full min-w-0 rounded-[1.75rem] border border-white/75 bg-white/78 p-3 shadow-[0_20px_70px_rgba(84,59,34,0.16)] backdrop-blur-xl lg:p-4"
      onSubmit={handleSubmit}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">{t("wallQuickTaskLabel")}</p>
          <label className="mt-2 block text-lg font-black tracking-tight text-stone-950" htmlFor={variant === "panel" ? "wall-task-title-panel" : "wall-task-title-popover"}>
            {t("wallQuickTaskPrompt")}
          </label>
        </div>
        {onCancel ? (
          <button className="pressable min-h-10 rounded-full bg-stone-100 px-3 text-sm font-black text-stone-600" onClick={onCancel} type="button">
            {t("cancel")}
          </button>
        ) : null}
      </div>

      <input
        autoFocus={variant === "popover"}
        className="mt-3 min-h-14 w-full rounded-2xl border border-stone-200/80 bg-white px-4 text-xl font-black text-stone-950 outline-none transition-colors duration-150 ease-[var(--ease-out)] placeholder:text-stone-400 focus:border-amber-500"
        id={variant === "panel" ? "wall-task-title-panel" : "wall-task-title-popover"}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={t("wallQuickTaskPlaceholder")}
        value={title}
      />

      <fieldset className="mt-3">
        <legend className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-stone-500">{t("wallQuickTaskAssigneePrompt")}</legend>
        <div className="flex flex-wrap gap-2">
          <button
            className={`pressable min-h-11 rounded-full px-4 text-sm font-black shadow-sm ${!assignedToMemberId ? "bg-stone-950 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200"}`}
            aria-pressed={!assignedToMemberId}
            onClick={() => setAssignedToMemberId(undefined)}
            type="button"
          >
            {t("wallQuickTaskAnyone")}
          </button>
          {members.map((member) => {
            const selected = assignedToMemberId === member.id;
            return (
              <button
                className={`pressable min-h-11 rounded-full px-4 text-sm font-black shadow-sm ${selected ? "text-stone-950 ring-2 ring-stone-950" : "bg-white text-stone-700 ring-1 ring-stone-200"}`}
                aria-pressed={selected}
                key={member.id}
                onClick={() => setAssignedToMemberId(member.id)}
                style={selected ? { backgroundColor: member.color } : undefined}
                type="button"
              >
                {member.displayName}
              </button>
            );
          })}
        </div>
      </fieldset>

      {createError ? (
        <p className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700" role="alert">
          {createError}
        </p>
      ) : null}

      <div className="mt-3 flex gap-2">
        <button className="pressable inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-4 py-3 font-black text-stone-950 shadow-sm disabled:opacity-50" disabled={!title.trim() || isSaving} type="submit">
          {isSaving ? <span className="save-spinner" aria-hidden /> : null}
          {isSaving ? t("saving") : t("wallQuickTaskSubmit")}
        </button>
      </div>
    </form>
  );
}
