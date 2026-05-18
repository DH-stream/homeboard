"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import { getLocale, useLanguage, type Language } from "@/lib/i18n";
import { getWeekDays, toLocalDateKey } from "@/lib/utils/date";
import type { CalendarEvent } from "@/types";

const wallCopy: Record<Language, { noEvents: string; today: string }> = {
  en: {
    noEvents: "No events",
    today: "Today",
  },
  sv: {
    noEvents: "Inget",
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
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const days = useMemo(() => (isWall ? getWeekDaysFromOffset(weekOffset) : getWeekDays()), [isWall, weekOffset]);
  const today = toLocalDateKey();
  const selectedDayIndex = isWall ? days.findIndex((day) => toLocalDateKey(day) === selectedDayKey) : -1;
  const weekGridTemplateColumns = isWall
    ? days
        .flatMap((_, index) => (index === selectedDayIndex ? ["minmax(5.2rem,1fr)", "minmax(15rem,2.4fr)"] : ["minmax(5.2rem,1fr)"]))
        .join(" ")
    : undefined;

  function changeWeek(direction: -1 | 1) {
    setSelectedDayKey(null);
    setWeekOffset((current) => current + direction);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    if (!isWall) return;
    pointerStartX.current = event.clientX;
  }

  function handlePointerUp(event: React.PointerEvent<HTMLElement>) {
    if (!isWall || pointerStartX.current === null) return;
    const deltaX = event.clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (Math.abs(deltaX) < 48) return;
    changeWeek(deltaX > 0 ? -1 : 1);
  }

  function closeDetailsOnBackground(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    setSelectedDayKey(null);
  }

  return (
    <section className={`surface-card rounded-[2rem] ${isWall ? "p-5" : "p-4"}`} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className={`font-black tracking-tight text-stone-950 ${isWall ? "text-2xl" : "text-xl"}`}>{t("weekPreview")}</h2>
        {isWall ? <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-400">Dra</p> : null}
      </div>

      <div
        className={`transition-all duration-300 ease-[var(--ease-out)] ${isWall ? "grid gap-2 overflow-visible py-1" : "grid grid-cols-7 gap-2"}`}
        onClick={isWall ? closeDetailsOnBackground : undefined}
        style={isWall ? { gridTemplateColumns: weekGridTemplateColumns } : undefined}
      >
        {days.map((day) => {
          const key = toLocalDateKey(day);
          const dayEvents = events.filter((event) => toLocalDateKey(event.startAt) === key);
          const isToday = key === today;
          const isSelected = isWall && selectedDayKey === key;
          const visibleEventCount = isWall ? 1 : 2;
          const dayToneClassName = isSelected
            ? "bg-amber-100 text-stone-950 ring-2 ring-amber-400 shadow-xl shadow-amber-900/10"
            : isToday
              ? "bg-stone-950 text-white shadow-xl shadow-stone-950/15"
              : "bg-white text-stone-800";
          const labelToneClassName = isSelected ? "text-amber-800" : isToday ? "text-amber-200" : "text-stone-400";
          const eventPreviewClassName = isSelected ? "bg-amber-200/75 text-stone-950" : isToday ? "bg-white/15" : "bg-stone-100";

          const dayButton = isWall ? (
            <button
              aria-pressed={isSelected}
              className={`min-h-28 rounded-2xl p-2 text-left transition-[background-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 active:translate-y-0 ${dayToneClassName}`}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedDayKey((current) => (current === key ? null : key));
              }}
              type="button"
            >
              <p className={`text-xs font-black uppercase tracking-[0.12em] ${labelToneClassName}`}>
                {new Intl.DateTimeFormat(locale, { weekday: "short" }).format(day)}
              </p>
              <div className="mt-1 flex items-baseline justify-between gap-1">
                <p className="text-3xl font-black">{day.getDate()}</p>
                {isToday ? <span className={`text-[0.65rem] font-black uppercase tracking-[0.12em] ${isSelected ? "text-amber-800" : "text-amber-200"}`}>{copy.today}</span> : null}
              </div>
              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, visibleEventCount).map((event) => (
                  <p key={event.id} className={`truncate rounded-full px-2 py-1 text-xs font-black ${eventPreviewClassName}`}>
                    {event.title}
                  </p>
                ))}
                {dayEvents.length > visibleEventCount ? <p className="text-xs font-black opacity-70">+{dayEvents.length - visibleEventCount} {t("more")}</p> : null}
              </div>
            </button>
          ) : (
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

          if (!isWall) return dayButton;

          const detailsOpen = selectedDayKey === key;
          const selectedEvents = dayEvents;

          return (
            <Fragment key={key}>
              {dayButton}
              {detailsOpen ? (
                <div
                  className="max-h-32 min-h-28 overflow-y-auto rounded-2xl border border-stone-300 bg-white p-3 text-stone-950 shadow-xl shadow-stone-950/20 ring-1 ring-white"
                  onClick={(event) => event.stopPropagation()}
                >
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-stone-600">
                    {new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric" }).format(day)}
                  </p>
                  <div className="mt-2 grid gap-2">
                    {selectedEvents.length ? (
                      selectedEvents.map((event) => {
                        const time = formatEventTime(event, locale);
                        return (
                          <div className="rounded-xl bg-stone-100 px-3 py-2 ring-1 ring-stone-200" key={event.id}>
                            <p className="text-sm font-black leading-snug text-stone-950">{event.title}</p>
                            {time ? <p className="mt-0.5 text-xs font-black text-stone-700">{time}</p> : null}
                          </div>
                        );
                      })
                    ) : (
                      <p className="rounded-xl bg-stone-100 px-3 py-2 text-sm font-black text-stone-700 ring-1 ring-stone-200">{copy.noEvents}</p>
                    )}
                  </div>
                </div>
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}
