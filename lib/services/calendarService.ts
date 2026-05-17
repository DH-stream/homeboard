import type { CalendarRepository } from "@/lib/repositories/calendarRepository";
import { toLocalDateKey } from "@/lib/utils/date";

export function createCalendarService(repository: CalendarRepository) {
  return {
    async listConnections(householdId: string | null) {
      return repository.listConnections(householdId);
    },
    async listSources(householdId: string | null) {
      return repository.listSources(householdId);
    },
    async updateSourceEnabled(sourceId: string, enabled: boolean) {
      return repository.updateSourceEnabled(sourceId, enabled);
    },
    async listEvents(householdId: string | null) {
      return repository.listEnabledEvents(householdId);
    },
    async listTodayEvents(householdId: string | null) {
      const today = toLocalDateKey();
      const events = await repository.listEnabledEvents(householdId);
      return events.filter((event) => toLocalDateKey(event.startAt) === today);
    },
  };
}
