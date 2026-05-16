import { CalendarEventCard } from "@/components/calendar/CalendarEventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import type { CalendarEvent } from "@/types";

export function TodayAgenda({ events, compact = false }: { events: CalendarEvent[]; compact?: boolean }) {
  return (
    <section className="surface-card rounded-[2rem] p-4">
      <SectionHeader action={<StatusChip tone="amber">{events.length} events</StatusChip>} title="Today’s agenda" />
      {events.length ? (
        <div className="space-y-3">
          {events.map((event) => (
            <CalendarEventCard compact={compact} event={event} key={event.id} />
          ))}
        </div>
      ) : (
        <EmptyState title="Nothing scheduled today.">Enjoy the open space, or connect calendar sync in a future backend pass.</EmptyState>
      )}
    </section>
  );
}
