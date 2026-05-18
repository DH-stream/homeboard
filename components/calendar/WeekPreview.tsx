"use client";

import { getLocale, useLanguage } from "@/lib/i18n";
import { getWeekDays, toLocalDateKey } from "@/lib/utils/date";
import type { CalendarEvent } from "@/types";

function getWeekDaysFromOffset(weekOffset: number) {
  return getWeekDays().map((day) => {
    const next = new Date(day);
    next.setDate(day.getDate() + weekOffset * 7);
    return next;
  });
}

function getWeekLabel(days: Date[], locale: string) {
  const first = days[0];
  const last = days[days.length - 1];
  const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  return `${formatter.format(first)} – ${formatter.format(last)}`;
}

export function WeekPreview({ events, variant = "compact" }: { events: CalendarEvent[]; variant?: "compact" | "wall" }) {
  const { language, t } = useLanguage();
  const locale = getLocale(language);
  const isWall = variant === "wall";
  const weekOffsets = isWall ? [-1, 0, 1] : [0];
  const today = toLocalDateKey();

  return (
    <section className={`surface-card rounded-[2rem] ${isWall ? "p-5" : "p-4"}`}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className={`font-black tracking-tight text-stone-950 ${isWall ? "text-3xl" : "text-xl"}`}>{t("weekPreview")}</h2>
        {isWall ? <p className="text-sm font-black uppercase tracking-[0.14em] text-stone-400">← swipe →</p> : null}
      </div>

      <div className={isWall ? "-mx-5 overflow-x-auto px-5 pb-2 [scroll-snap-type:x_mandatory]" : ""}>
        <div className={isWall ? "flex gap-4" : "block"}>
          {weekOffsets.map((weekOffset) => {
            const days = getWeekDaysFromOffset(weekOffset);
            const visibleEventCount = isWall ? 3 : 2;

            return (
              <div className={isWall ? "min-w-full [scroll-snap-align:start]" : ""} key={weekOffset}>
                {isWall ? <p className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-stone-500">{getWeekLabel(days, locale)}</p> : null}
                <div className={`grid grid-cols-7 ${isWall ? "gap-3" : "gap-2"}`}>
                  {days.map((day) => {
                    const key = toLocalDateKey(day);
                    const dayEvents = events.filter((event) => toLocalDateKey(event.startAt) === key);
                    const isToday = key === today;

                    return (
                      <div
                        key={key}
                        className={`rounded-2xl transition-[background-color,color,box-shadow] duration-200 ease-[var(--ease-out)] ${isWall ? "min-h-44 p-3" : "min-h-28 p-3"} ${isToday ? "bg-stone-950 text-white" : "bg-white/80 text-stone-800"}`}
                      >
                        <p className={`font-black uppercase ${isWall ? "text-sm tracking-[0.12em]" : "text-xs tracking-[0.18em]"} ${isToday ? "text-amber-200" : "text-stone-400"}`}>
                          {new Intl.DateTimeFormat(locale, { weekday: "short" }).format(day)}
                        </p>
                        <p className={`mt-1 font-black ${isWall ? "text-4xl" : "text-2xl"}`}>{day.getDate()}</p>
                        <div className={`${isWall ? "mt-4 space-y-2" : "mt-3 space-y-1"}`}>
                          {dayEvents.slice(0, visibleEventCount).map((event) => (
                            <p
                              key={event.id}
                              className={`rounded-xl font-black leading-snug ${isWall ? "px-2.5 py-2 text-sm break-words" : "truncate rounded-full px-2 py-1 text-xs font-bold"} ${isToday ? "bg-white/15" : "bg-stone-100"}`}
                            >
                              {event.title}
                            </p>
                          ))}
                          {dayEvents.length > visibleEventCount ? <p className={`${isWall ? "text-sm" : "text-xs"} font-bold opacity-70`}>+{dayEvents.length - visibleEventCount} {t("more")}</p> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
