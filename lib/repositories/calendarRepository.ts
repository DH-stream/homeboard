import { mockCalendarEvents } from "@/data/mockCalendarEvents";
import type { CalendarEvent } from "@/types";

export interface CalendarRepository {
  listEvents(): Promise<CalendarEvent[]>;
}

export const mockCalendarRepository: CalendarRepository = {
  async listEvents() {
    return mockCalendarEvents;
  },
};
