import { getWeekDays } from "@/lib/utils/date";
import type { CalendarEvent } from "@/types";

export function WeekPreview({ events }: { events: CalendarEvent[] }) {
  const days = getWeekDays();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="rounded-[2rem] bg-white/50 p-4 ring-1 ring-white/80">
      <h2 className="mb-3 text-xl font-black tracking-tight text-stone-950">Week preview</h2>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const key = day.toISOString().slice(0, 10);
          const dayEvents = events.filter((event) => event.startAt.slice(0, 10) === key);
          const isToday = key === today;

          return (
            <div key={key} className={`min-h-28 rounded-2xl p-3 ${isToday ? "bg-stone-950 text-white" : "bg-white/80 text-stone-800"}`}>
              <p className={`text-xs font-black uppercase tracking-[0.18em] ${isToday ? "text-amber-200" : "text-stone-400"}`}>
                {new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(day)}
              </p>
              <p className="mt-1 text-2xl font-black">{day.getDate()}</p>
              <div className="mt-3 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <p key={event.id} className={`truncate rounded-full px-2 py-1 text-xs font-bold ${isToday ? "bg-white/15" : "bg-stone-100"}`}>
                    {event.title}
                  </p>
                ))}
                {dayEvents.length > 2 ? <p className="text-xs font-bold opacity-70">+{dayEvents.length - 2} more</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
