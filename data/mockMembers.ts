import type { HouseholdMember } from "@/types";

const now = "2026-01-01T08:00:00.000Z";

export const mockMembers: HouseholdMember[] = [
  {
    id: "member-alex",
    householdId: "household-demo",
    displayName: "Alex",
    color: "#8b5cf6",
    role: "adult",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "member-sam",
    householdId: "household-demo",
    displayName: "Sam",
    color: "#14b8a6",
    role: "adult",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "member-riley",
    householdId: "household-demo",
    displayName: "Riley",
    color: "#f97316",
    role: "child",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "member-jordan",
    householdId: "household-demo",
    displayName: "Jordan",
    color: "#0ea5e9",
    role: "child",
    createdAt: now,
    updatedAt: now,
  },
];
