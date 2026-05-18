"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { calendarRepository } from "@/lib/repositories/calendarRepository";
import { createCalendarService } from "@/lib/services/calendarService";
import { useResolvedHouseholdId } from "@/lib/hooks/useResolvedHouseholdId";
import { toLocalDateKey } from "@/lib/utils/date";
import type { CalendarEvent } from "@/types";

const service = createCalendarService(calendarRepository);
const MOCK_SOURCE_ID = "local-mock-calendar-source";
const SHOULD_SHOW_DEV_MOCK_EVENTS = process.env.NODE_ENV === "development";

function startOfLocalWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diffToMonday);
  next.setHours(0, 0, 0, 0);
  return next;
}

function createLocalIso(dayOffset: number, hour: number, minute = 0) {
  const date = startOfLocalWeek(new Date());
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function createMockCalendarEvents(): CalendarEvent[] {
  if (!SHOULD_SHOW_DEV_MOCK_EVENTS) return [];

  const events = [
    { title: "Frukosttest i molnet", dayOffset: 0, startHour: 7, endHour: 7, endMinute: 45, color: "#f59e0b" },
    { title: "Hämta Leah på förskolan", dayOffset: 0, startHour: 16, startMinute: 15, endHour: 16, endMinute: 45, color: "#f97316" },
    { title: "Handla inför veckan", dayOffset: 1, startHour: 17, endHour: 18, color: "#14b8a6" },
    { title: "BVC kontroll och vägning", dayOffset: 2, startHour: 9, startMinute: 30, endHour: 10, endMinute: 15, color: "#8b5cf6" },
    { title: "Simskola med lång titel för läsbarhetstest", dayOffset: 3, startHour: 18, endHour: 19, color: "#0ea5e9" },
    { title: "Fredagsmys och filmkväll", dayOffset: 4, startHour: 19, endHour: 21, color: "#ec4899" },
    { title: "Helgplan: lekplats och pannkakor", dayOffset: 5, startHour: 10, endHour: 12, color: "#22c55e" },
  ];

  return events.map((event, index) => ({
    id: `mock-calendar-event-${index + 1}`,
    householdId: "local-mock-household",
    sourceId: MOCK_SOURCE_ID,
    title: event.title,
    startAt: createLocalIso(event.dayOffset, event.startHour, event.startMinute ?? 0),
    endAt: createLocalIso(event.dayOffset, event.endHour, event.endMinute ?? 0),
    allDay: false,
    color: event.color,
    sourceType: "manual",
    externalId: `mock-${index + 1}`,
  }));
}

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { householdId } = useResolvedHouseholdId();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const cloudEvents = await service.listEvents(householdId);
      setEvents(cloudEvents.length ? cloudEvents : createMockCalendarEvents());
      setError(null);
    } catch (unknownError) {
      console.warn("HomeBoard calendar events could not be loaded from cloud.", unknownError);
      setEvents(createMockCalendarEvents());
      setError("calendar_unreachable");
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const todayEvents = useMemo(() => {
    const today = toLocalDateKey();
    return events.filter((event) => toLocalDateKey(event.startAt) === today);
  }, [events]);

  return { events, todayEvents, isLoading, error, refresh };
}
