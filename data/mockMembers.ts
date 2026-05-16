import type { HouseholdMember } from "@/types";

const now = "2026-01-01T08:00:00.000Z";

export const mockMembers: HouseholdMember[] = [
  {
    id: "member-max",
    householdId: "household-demo",
    displayName: "Max",
    color: "#8b5cf6",
    role: "adult",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "member-felicia",
    householdId: "household-demo",
    displayName: "Felicia",
    color: "#14b8a6",
    role: "adult",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "member-leah",
    householdId: "household-demo",
    displayName: "Leah",
    color: "#f97316",
    role: "child",
    createdAt: now,
    updatedAt: now,
  },
];