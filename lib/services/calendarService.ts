import type { CalendarRepository } from "@/lib/repositories/calendarRepository";
import { toDateKey } from "@/lib/utils/date";

export function createCalendarService(repository: CalendarRepository) {
  return {
    async listEvents() {
      return repository.listEvents();
    },
    async listTodayEvents() {
      const today = toDateKey();
      const events = await repository.listEvents();
      return events.filter((event) => event.startAt.slice(0, 10) === today);
    },
  };
}
