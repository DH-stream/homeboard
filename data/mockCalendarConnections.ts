import type { CalendarConnection } from "@/types";

const now = "2026-01-10T10:00:00.000Z";

export const mockCalendarConnections: CalendarConnection[] = [
  {
    id: "connection-max-google",
    householdId: "household-demo",
    connectedByMemberId: "member-max",
    provider: "google",
    accountLabel: "Max / Google",
    accountEmail: "max@example.com",
    status: "mock",
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "connection-felicia-icloud",
    householdId: "household-demo",
    connectedByMemberId: "member-felicia",
    provider: "icloud_caldav",
    accountLabel: "Felicia / iCloud",
    accountEmail: "felicia@example.com",
    status: "mock",
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "connection-family-microsoft",
    householdId: "household-demo",
    provider: "microsoft",
    accountLabel: "Family / Microsoft",
    accountEmail: "family@example.com",
    status: "mock",
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "connection-public-ics",
    householdId: "household-demo",
    provider: "ics",
    accountLabel: "Public calendars",
    status: "mock",
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  },
];
