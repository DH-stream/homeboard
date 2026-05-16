import type { CalendarRepository } from "@/lib/repositories/calendarRepository";
import { toLocalDateKey } from "@/lib/utils/date";

export function createCalendarService(repository: CalendarRepository) {
  return {
    async listEvents() {
      return repository.listEvents();
    },
    async listTodayEvents() {
      const today = toLocalDateKey();
      const events = await repository.listEvents();
      return events.filter((event) => toLocalDateKey(event.startAt) === today);
    },
  };
}
