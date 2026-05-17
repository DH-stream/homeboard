import { mockCalendarConnections } from "@/data/mockCalendarConnections";
import { mockCalendarEvents } from "@/data/mockCalendarEvents";
import { mockCalendarSources } from "@/data/mockCalendarSources";
import type { CalendarConnection, CalendarEvent, CalendarSource } from "@/types";

const CALENDAR_SOURCE_STORAGE_KEY = "homeboard.calendarSources.v1";

type StoredCalendarSourceState = Record<string, boolean>;

function readStoredSourceState(): StoredCalendarSourceState {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(CALENDAR_SOURCE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"),
    );
  } catch {
    return {};
  }
}

function writeStoredSourceState(state: StoredCalendarSourceState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CALENDAR_SOURCE_STORAGE_KEY, JSON.stringify(state));
}

function withStoredEnabledState(source: CalendarSource, storedState: StoredCalendarSourceState): CalendarSource {
  return {
    ...source,
    enabled: storedState[source.id] ?? source.enabled,
  };
}

function sortByStartAt(events: CalendarEvent[]) {
  return [...events].sort((first, second) => new Date(first.startAt).getTime() - new Date(second.startAt).getTime());
}

export interface CalendarRepository {
  listConnections(): Promise<CalendarConnection[]>;
  listSources(): Promise<CalendarSource[]>;
  updateSourceEnabled(sourceId: string, enabled: boolean): Promise<CalendarSource>;
  listEvents(): Promise<CalendarEvent[]>;
  listEnabledEvents(): Promise<CalendarEvent[]>;
}

export const mockCalendarRepository: CalendarRepository = {
  async listConnections() {
    return mockCalendarConnections;
  },

  async listSources() {
    const storedState = readStoredSourceState();
    return mockCalendarSources.map((source) => withStoredEnabledState(source, storedState));
  },

  async updateSourceEnabled(sourceId, enabled) {
    const storedState = readStoredSourceState();
    const source = mockCalendarSources.find((nextSource) => nextSource.id === sourceId);
    if (!source) throw new Error("Calendar source not found.");

    const nextState = { ...storedState, [sourceId]: enabled };
    writeStoredSourceState(nextState);

    return withStoredEnabledState(source, nextState);
  },

  async listEvents() {
    return sortByStartAt(mockCalendarEvents);
  },

  async listEnabledEvents() {
    const sources = await this.listSources();
    const enabledSourceIds = new Set(sources.filter((source) => source.enabled).map((source) => source.id));
    return sortByStartAt(mockCalendarEvents.filter((event) => enabledSourceIds.has(event.sourceId)));
  },
};
