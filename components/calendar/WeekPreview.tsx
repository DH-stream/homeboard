"use client";

import { useEffect, useMemo, useState } from "react";
import { getLocale, useLanguage, type Language } from "@/lib/i18n";
import { getWeekDays, toLocalDateKey } from "@/lib/utils/date";
import type { CalendarEvent } from "@/types";

const wallCopy: Record<Language, { previousWeek: string; nextWeek: string; noEvents: string; today: string }> = {
  en: {
    previousWeek: "Previous week",
    nextWeek: "Next week",
    noEvents: "No events this day.",
    today: "Today",
  },
  sv: {
    previousWeek: "Förra veckan",
    nextWeek: "Nästa vecka",
    noEvents: "Inga händelser den här dagen.",
    today: "Idag",
  },
};

function getWeekDaysFromOffset(weekOffset: number) {
  return getWeekDays().map((day) => {
    const next = new Date(day);
    next.setDate(day.getDate() + weekOffset * 7);
    return next;
  });
}

function formatEventTime(event: CalendarEvent, locale: string) {
  if (event.allDay) return "";
  const formatter = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });
  return `${formatter.format(new Date(event.startAt))}–${formatter.format(new Date(event.endAt))}`;
}

export function WeekPreview({ events, variant = "compact" }: { events: CalendarEvent[]; variant?: "compact" | "wall" }) {
  const { language, t } = useLanguage();
  const copy = wallCopy[language];
  const locale = getLocale(language);
  const isWall = variant === "wall";
  const [weekOffset, setWeekOffset] = useState(0);
  const days = useMemo(() => (isWall ? getWeekDaysFromOffset(weekOffset) : getWeekDays()), [isWall, weekOffset]);
  const today = toLocalDateKey();
  const [selectedDayKey, setSelectedDayKey] = useState(today);

  useEffect(() => {
    if (!isWall) return;
    const dayKeys = days.map(toLocalDateKey);
    if (dayKeys.includes(today)) {
      setSelectedDayKey(today);
      return;
    }
    setSelectedDayKey(dayKeys[0] ?? today);
  }, [days, isWall, today]);

  const selectedEvents = events.filter((event) => toLocalDateKey(event.startAt) === selectedDayKey);
  const selectedDay = days.find((day) => toLocalDateKey(day) === selectedDayKey) ?? days[0];

  return (
    <section className={`surface-card rounded-[2rem] ${isWall ? "p-5" : "p-4"}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className={`font-black tracking-tight text-stone-950 ${isWall ? "text-2xl" : "text-xl"}`}>{t("weekPreview")}</h2>
        {isWall ? (
          <div className="flex items-center gap-2">
            <button className="pressable h-10 w-10 rounded-full bg-white text-lg font-black text-stone-700 shadow-sm ring-1 ring-black/5" onClick={() => setWeekOffset((current) => current - 1)} type="button" aria-label={copy.previousWeek}>
              ←
            </button>
            <button className="pressable h-10 w-10 rounded-full bg-white text-lg font-black text-stone-700 shadow-sm ring-1 ring-black/5" onClick={() => setWeekOffset((current) => current + 1)} type="button" aria-label={copy.nextWeek}>
              →
            </button>
          </div>
        ) : null}
      </div>

      <div className={`grid grid-cols-7 ${isWall ? "gap-2" : "gap-2"}`}>
        {days.map((day) => {
          const key = toLocalDateKey(day);
          const dayEvents = events.filter((event) => toLocalDateKey(event.startAt) === key);
          const isToday = key === today;
          const isSelected = isWall && selectedDayKey === key;
          const visibleEventCount = isWall ? 1 : 2;

          if (isWall) {
            return (
              <button
                aria-pressed={isSelected}
                className={`pressable min-h-28 rounded-2xl p-2 text-left transition-[background-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out)] ${isSelected ? "bg-stone-950 text-white shadow-xl shadow-stone-950/15" : isToday ? "bg-amber-100 text-stone-950" : "bg-white/80 text-stone-800"}`}
                key={key}
                onClick={() => setSelectedDayKey((current) => (current === key ? key : key))}
                type="button"
              >
                <p className={`text-xs font-black uppercase tracking-[0.12em] ${isSelected ? "text-amber-200" : "text-stone-400"}`}>
                  {new Intl.DateTimeFormat(locale, { weekday: "short" }).format(day)}
                </p>
                <div className="mt-1 flex items-baseline justify-between gap-1">
                  <p className="text-3xl font-black">{day.getDate()}</p>
                  {isToday ? <span className={`text-[0.65rem] font-black uppercase tracking-[0.12em] ${isSelected ? "text-amber-200" : "text-amber-700"}`}>{copy.today}</span> : null}
                </div>
                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, visibleEventCount).map((event) => (
                    <p key={event.id} className={`rounded-xl px-2 py-1 text-xs font-black leading-snug ${isSelected ? "bg-white/15" : "bg-stone-100"}`}>
                      {event.title}
                    </p>
                  ))}
                  {dayEvents.length > visibleEventCount ? <p className="text-xs font-black opacity-70">+{dayEvents.length - visibleEventCount} {t("more")}</p> : null}
                </div>
              </button>
            );
          }

          return (
            <div key={key} className={`min-h-28 rounded-2xl p-3 transition-[background-color,color,box-shadow] duration-200 ease-[var(--ease-out)] ${isToday ? "bg-stone-950 text-white" : "bg-white/80 text-stone-800"}`}>
              <p className={`text-xs font-black uppercase tracking-[0.18em] ${isToday ? "text-amber-200" : "text-stone-400"}`}>
                {new Intl.DateTimeFormat(locale, { weekday: "short" }).format(day)}
              </p>
              <p className="mt-1 text-2xl font-black">{day.getDate()}</p>
              <div className="mt-3 space-y-1">
                {dayEvents.slice(0, visibleEventCount).map((event) => (
                  <p key={event.id} className={`truncate rounded-full px-2 py-1 text-xs font-bold ${isToday ? "bg-white/15" : "bg-stone-100"}`}>
                    {event.title}
                  </p>
                ))}
                {dayEvents.length > visibleEventCount ? <p className="text-xs font-bold opacity-70">+{dayEvents.length - visibleEventCount} {t("more")}</p> : null}
              </div>
            </div>
          );
        })}
      </div>

      {isWall ? (
        <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-white/85 p-4 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-stone-400">
            {new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(selectedDay)}
          </p>
          <div className="mt-3 space-y-2">
            {selectedEvents.length ? (
              selectedEvents.map((event) => (
                <div className="rounded-2xl bg-stone-100 px-4 py-3" key={event.id}>
                  <p className="text-base font-black leading-snug text-stone-950">{event.title}</p>
                  {formatEventTime(event, locale) ? <p className="mt-1 text-sm font-bold text-stone-500">{formatEventTime(event, locale)}</p> : null}
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-bold text-stone-500">{copy.noEvents}</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
