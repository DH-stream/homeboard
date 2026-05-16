"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import type { CreateTaskInput, HouseholdMember } from "@/types";

export function AddTaskForm({ members, onCreate }: { members: HouseholdMember[]; onCreate: (input: CreateTaskInput) => Promise<unknown> }) {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [assignedToMemberId, setAssignedToMemberId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("20:00");
  const [isSaving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    const dueDate = date ? new Date(`${date}T00:00:00`) : new Date();
    const [hours, minutes] = time.split(":").map(Number);
    dueDate.setHours(hours || 20, minutes || 0, 0, 0);

    try {
      await onCreate({ title, assignedToMemberId: assignedToMemberId || undefined, dueDate: dueDate.toISOString() });
      setTitle("");
      setDate("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="rounded-[2rem] bg-stone-950 p-4 text-white shadow-[0_18px_50px_rgba(28,25,23,0.22)]" onSubmit={handleSubmit}>
      <label className="text-sm font-black uppercase tracking-[0.2em] text-amber-200" htmlFor="task-title">
        {t("addTask")}
      </label>
      <input
        className="mt-3 min-h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-lg font-bold text-white placeholder:text-white/45 outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-300"
        id="task-title"
        onChange={(event) => setTitle(event.target.value)}
        placeholder={t("whatNeedsDoing")}
        value={title}
      />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <select
          aria-label={t("allPeople")}
          className="min-h-12 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 font-bold text-white outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-300"
          onChange={(event) => setAssignedToMemberId(event.target.value)}
          value={assignedToMemberId}
        >
          <option className="text-stone-950" value="">
            {t("anyone")}
          </option>
          {members.map((member) => (
            <option className="text-stone-950" key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </select>
        <input
          aria-label={t("dueDate")}
          className="min-h-12 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 font-bold text-white outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-300"
          onChange={(event) => setDate(event.target.value)}
          type="date"
          value={date}
        />
        <p className="min-w-0 truncate self-center px-1 text-xs font-bold text-white/55" title={date ? t("futureSchedulingPreview") : t("clearDueDate")}>{date ? t("futureSchedulingPreview") : t("clearDueDate")}</p>
        <input
          aria-label={t("time")}
          className="min-h-12 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 font-bold text-white outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-300"
          onChange={(event) => setTime(event.target.value)}
          type="time"
          value={time}
        />
      </div>
      <button className="pressable mt-3 min-h-12 w-full rounded-2xl bg-amber-300 px-4 py-3 font-black text-stone-950 hover:bg-amber-200 disabled:opacity-60" disabled={isSaving} type="submit">
        {isSaving ? t("adding") : date ? t("addTask") : t("addToToday")}
      </button>
    </form>
  );
}
