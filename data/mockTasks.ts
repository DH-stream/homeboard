import type { Task, TaskInstance, TaskSchedule } from "@/types";
import { atLocalTime, toDateKey } from "@/lib/utils/date";

const now = "2026-01-01T08:00:00.000Z";
const today = toDateKey();

export const mockTasks: Task[] = [
  {
    id: "task-pack-lunches",
    householdId: "household-demo",
    title: "Pack lunches",
    description: "Lunch boxes, water bottles, and snack cards.",
    assignedToMemberId: "member-alex",
    status: "active",
    source: "manual",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "task-feed-pets",
    householdId: "household-demo",
    title: "Feed the pets",
    assignedToMemberId: "member-riley",
    status: "active",
    source: "manual",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "task-take-trash",
    householdId: "household-demo",
    title: "Take trash bins to curb",
    assignedToMemberId: "member-sam",
    status: "active",
    source: "automation",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "task-reading",
    householdId: "household-demo",
    title: "20 minutes of reading",
    assignedToMemberId: "member-jordan",
    status: "active",
    source: "manual",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockTaskSchedules: TaskSchedule[] = [
  {
    id: "schedule-pack-lunches",
    taskId: "task-pack-lunches",
    type: "daily",
    daysOfWeek: [1, 2, 3, 4, 5],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "schedule-feed-pets",
    taskId: "task-feed-pets",
    type: "daily",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "schedule-take-trash",
    taskId: "task-take-trash",
    type: "weekly",
    daysOfWeek: [2],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "schedule-reading",
    taskId: "task-reading",
    type: "daily",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockTaskInstances: TaskInstance[] = [
  {
    id: `${today}-pack-lunches`,
    taskId: "task-pack-lunches",
    householdId: "household-demo",
    titleSnapshot: "Pack lunches",
    assignedToMemberId: "member-alex",
    dueDate: atLocalTime(7, 30),
    createdAt: now,
    updatedAt: now,
  },
  {
    id: `${today}-feed-pets`,
    taskId: "task-feed-pets",
    householdId: "household-demo",
    titleSnapshot: "Feed the pets",
    assignedToMemberId: "member-riley",
    dueDate: atLocalTime(8, 0),
    createdAt: now,
    updatedAt: now,
  },
  {
    id: `${today}-take-trash`,
    taskId: "task-take-trash",
    householdId: "household-demo",
    titleSnapshot: "Take trash bins to curb",
    assignedToMemberId: "member-sam",
    dueDate: atLocalTime(18, 0),
    createdAt: now,
    updatedAt: now,
  },
  {
    id: `${today}-reading`,
    taskId: "task-reading",
    householdId: "household-demo",
    titleSnapshot: "20 minutes of reading",
    assignedToMemberId: "member-jordan",
    dueDate: atLocalTime(19, 30),
    createdAt: now,
    updatedAt: now,
  },
];
