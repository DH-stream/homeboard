"use client";

import { useEffect, useMemo, useState } from "react";
import { mockCalendarRepository } from "@/lib/repositories/calendarRepository";
import { createCalendarService } from "@/lib/services/calendarService";
import { toDateKey } from "@/lib/utils/date";
import type { CalendarEvent } from "@/types";

const service = createCalendarService(mockCalendarRepository);

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    service.listEvents().then((next) => {
      setEvents(next);
      setLoading(false);
    });
  }, []);

  const todayEvents = useMemo(() => {
    const today = toDateKey();
    return events.filter((event) => event.startAt.slice(0, 10) === today);
  }, [events]);

  return { events, todayEvents, isLoading };
}
