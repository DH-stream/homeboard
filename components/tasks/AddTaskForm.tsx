"use client";

import { useMemo, useState } from "react";
import { getLocale, useLanguage } from "@/lib/i18n";
import type { CreateTaskInput, HouseholdMember, TaskSchedule } from "@/types";

type RepeatType = TaskSchedule["type"];

const defaultWeekdays = [1, 2, 3, 4, 5];

export function AddTaskForm({ members, onCreate }: { members: HouseholdMember[]; onCreate: (input: CreateTaskInput) => Promise<unknown> }) {
  const { language, t } = useLanguage();
  const locale = getLocale(language);
  const [title, setTitle] = useState("");
  const [assignedToMemberId, setAssignedToMemberId] = useState("");
  const [date, setDate] = useState("");
  const [repeatType, setRepeatType] = useState<RepeatType>("once");
  const [timesOfDay, setTimesOfDay] = useState(["20:00"]);
  const [daysOfWeek, setDaysOfWeek] = useState(defaultWeekdays);
  const [isSaving, setSaving] = useState(false);

  const visibleTimes = repeatType === "once" ? timesOfDay.slice(0, 1) : timesOfDay;

  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, day) => {
        const date = new Date(2026, 0, 4 + day);
        return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
      }),
    [locale],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    const [firstTime = "20:00"] = timesOfDay;
    const dueDate = date ? new Date(`${date}T00:00:00`) : new Date();
    const [hours, minutes] = firstTime.split(":").map(Number);
    dueDate.setHours(hours || 20, minutes || 0, 0, 0);

    const cleanTimes = timesOfDay.filter(Boolean);
    const schedule =
      repeatType === "once"
        ? { type: "once" as const }
        : {
            type: repeatType,
            timesOfDay: cleanTimes,
            daysOfWeek: repeatType === "weekly" ? daysOfWeek : undefined,
            startsOn: date || undefined,
          };

    try {
      await onCreate({
        title,
        assignedToMemberId: assignedToMemberId || undefined,
        dueDate: dueDate.toISOString(),
        schedule,
      });
      setTitle("");
      setDate("");
      setRepeatType("once");
      setTimesOfDay(["20:00"]);
      setDaysOfWeek(defaultWeekdays);
    } finally {
      setSaving(false);
    }
  }

  function updateTime(index: number, value: string) {
    setTimesOfDay((current) => current.map((time, currentIndex) => (currentIndex === index ? value : time)));
  }

  function removeTime(index: number) {
    setTimesOfDay((current) => (current.length > 1 ? current.filter((_, currentIndex) => currentIndex !== index) : current));
  }

  function toggleWeekday(day: number) {
    setDaysOfWeek((current) => {
      const next = current.includes(day) ? current.filter((value) => value !== day) : [...current, day];
      return next.sort((a, b) => a - b);
    });
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
        <p className="min-w-0 truncate self-center px-1 text-xs font-bold text-white/55" title={date ? t("futureSchedulingPreview") : t("clearDueDate")}>
          {date ? t("futureSchedulingPreview") : t("clearDueDate")}
        </p>
        <select
          aria-label={t("repeats")}
          className="min-h-12 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 font-bold text-white outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-300"
          onChange={(event) => setRepeatType(event.target.value as RepeatType)}
          value={repeatType}
        >
          <option className="text-stone-950" value="once">
            {t("oneOff")}
          </option>
          <option className="text-stone-950" value="daily">
            {t("daily")}
          </option>
          <option className="text-stone-950" value="weekly">
            {t("weekly")}
          </option>
        </select>
      </div>

      <div className="mt-3 rounded-3xl border border-white/10 bg-white/[0.06] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">{repeatType === "once" ? t("time") : t("times")}</p>
          {repeatType === "once" ? null : (
            <button className="pressable min-h-10 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-amber-100" onClick={() => setTimesOfDay((current) => [...current, "20:00"])} type="button">
              {t("addTime")}
            </button>
          )}
        </div>
        <div className="grid gap-2">
          {visibleTimes.map((time, index) => (
            <div className="flex gap-2" key={index}>
              <input
                aria-label={`${t("time")} ${index + 1}`}
                className="min-h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 font-bold text-white outline-none transition-colors duration-150 ease-[var(--ease-out)] focus:border-amber-300"
                onChange={(event) => updateTime(index, event.target.value)}
                type="time"
                value={time}
              />
              {repeatType === "once" ? null : (
                <button className="pressable min-h-12 rounded-2xl px-3 py-2 text-sm font-black text-white/70 disabled:opacity-30" disabled={timesOfDay.length === 1} onClick={() => removeTime(index)} type="button">
                  {t("removeTime")}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {repeatType === "weekly" ? (
        <div className="mt-3 rounded-3xl border border-white/10 bg-white/[0.06] p-3">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/55">{t("weekdays")}</p>
          <div className="grid grid-cols-7 gap-1">
            {weekdayLabels.map((label, day) => {
              const selected = daysOfWeek.includes(day);
              return (
                <button className={`pressable min-h-11 rounded-2xl px-1 text-xs font-black ${selected ? "bg-amber-300 text-stone-950" : "bg-white/10 text-white/70"}`} key={day} onClick={() => toggleWeekday(day)} type="button">
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <button className="pressable mt-3 min-h-12 w-full rounded-2xl bg-amber-300 px-4 py-3 font-black text-stone-950 hover:bg-amber-200 disabled:opacity-60" disabled={isSaving || (repeatType === "weekly" && daysOfWeek.length === 0)} type="submit">
        {isSaving ? t("adding") : date || repeatType !== "once" ? t("addTask") : t("addToToday")}
      </button>
    </form>
  );
}
