import type { CalendarRepository } from "@/lib/repositories/calendarRepository";
import { toLocalDateKey } from "@/lib/utils/date";

export function createCalendarService(repository: CalendarRepository) {
  return {
    async listConnections() {
      return repository.listConnections();
    },
    async listSources() {
      return repository.listSources();
    },
    async updateSourceEnabled(sourceId: string, enabled: boolean) {
      return repository.updateSourceEnabled(sourceId, enabled);
    },
    async listEvents() {
      return repository.listEnabledEvents();
    },
    async listTodayEvents() {
      const today = toLocalDateKey();
      const events = await repository.listEnabledEvents();
      return events.filter((event) => toLocalDateKey(event.startAt) === today);
    },
  };
}
