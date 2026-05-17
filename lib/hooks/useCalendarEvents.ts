"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { mockCalendarRepository } from "@/lib/repositories/calendarRepository";
import { createCalendarService } from "@/lib/services/calendarService";
import { toLocalDateKey } from "@/lib/utils/date";
import type { CalendarEvent } from "@/types";

const service = createCalendarService(mockCalendarRepository);

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setEvents(await service.listEvents());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const todayEvents = useMemo(() => {
    const today = toLocalDateKey();
    return events.filter((event) => toLocalDateKey(event.startAt) === today);
  }, [events]);

  return { events, todayEvents, isLoading, refresh };
}
