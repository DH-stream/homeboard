import { CalendarEventCard } from "@/components/calendar/CalendarEventCard";
import type { CalendarEvent } from "@/types";

export function TodayAgenda({ events, compact = false }: { events: CalendarEvent[]; compact?: boolean }) {
  return (
    <section className="rounded-[2rem] bg-white/50 p-4 ring-1 ring-white/80">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tight text-stone-950">Today&apos;s agenda</h2>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-800">{events.length} events</span>
      </div>
      {events.length ? (
        <div className="space-y-3">
          {events.map((event) => (
            <CalendarEventCard compact={compact} event={event} key={event.id} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-white/60 p-6 text-center text-sm font-semibold text-stone-500">
          Nothing scheduled for today.
        </div>
      )}
    </section>
  );
}
