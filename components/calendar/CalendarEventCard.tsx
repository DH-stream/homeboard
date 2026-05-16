import { formatTime } from "@/lib/utils/date";
import type { CalendarEvent } from "@/types";

export function CalendarEventCard({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) {
  return (
    <article className="flex gap-3 rounded-[1.35rem] bg-white/88 p-3 shadow-sm ring-1 ring-black/5 transition-[background-color,box-shadow] duration-200 ease-[var(--ease-out)]">
      <span className="mt-1 h-10 w-1.5 rounded-full shadow-sm" style={{ backgroundColor: event.color ?? "#f59e0b" }} />
      <div className="min-w-0 flex-1">
        <h3 className={`truncate font-black text-stone-950 ${compact ? "text-base" : "text-xl"}`}>{event.title}</h3>
        <p className="mt-1 text-sm font-semibold text-stone-500">
          {event.allDay ? "All day" : `${formatTime(event.startAt)} – ${formatTime(event.endAt)}`}
          {event.location ? ` · ${event.location}` : ""}
        </p>
      </div>
    </article>
  );
}
