"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { calendarRepository } from "@/lib/repositories/calendarRepository";
import { createCalendarService } from "@/lib/services/calendarService";
import { useResolvedHouseholdId } from "@/lib/hooks/useResolvedHouseholdId";
import { toLocalDateKey } from "@/lib/utils/date";
import type { CalendarEvent } from "@/types";

const service = createCalendarService(calendarRepository);

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setLoading] = useState(true);
  const { householdId } = useResolvedHouseholdId();

  const refresh = useCallback(async () => {
    setLoading(true);
    setEvents(await service.listEvents(householdId));
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const todayEvents = useMemo(() => {
    const today = toLocalDateKey();
    return events.filter((event) => toLocalDateKey(event.startAt) === today);
  }, [events]);

  return { events, todayEvents, isLoading, refresh };
}
