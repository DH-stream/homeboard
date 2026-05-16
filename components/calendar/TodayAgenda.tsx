"use client";

import { CalendarEventCard } from "@/components/calendar/CalendarEventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { useLanguage } from "@/lib/i18n";
import type { CalendarEvent } from "@/types";

export function TodayAgenda({ events, compact = false }: { events: CalendarEvent[]; compact?: boolean }) {
  const { t } = useLanguage();

  return (
    <section className="surface-card rounded-[2rem] p-4">
      <SectionHeader action={<StatusChip tone="amber">{events.length} {t("events")}</StatusChip>} title={t("todayAgenda")} />
      {events.length ? (
        <div className="space-y-3">
          {events.map((event) => (
            <CalendarEventCard compact={compact} event={event} key={event.id} />
          ))}
        </div>
      ) : (
        <EmptyState title={t("nothingScheduled")}>{t("nothingScheduledBody")}</EmptyState>
      )}
    </section>
  );
}
