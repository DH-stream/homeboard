export type Household = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type HouseholdMemberRole = "adult" | "child" | "guest";

export type HouseholdMember = {
  id: string;
  householdId: string;
  displayName: string;
  color: string;
  avatarUrl?: string;
  role: HouseholdMemberRole;
  createdAt: string;
  updatedAt: string;
};

export type TaskSource = "manual" | "runai" | "home_assistant" | "automation";
export type TaskStatus = "active" | "archived";

export type Task = {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  assignedToMemberId?: string;
  status: TaskStatus;
  source: TaskSource;
  createdAt: string;
  updatedAt: string;
};

export type TaskSchedule = {
  id: string;
  taskId: string;
  type: "once" | "daily" | "weekly";
  dueDate?: string;
  timesOfDay?: string[];
  daysOfWeek?: number[];
  startsOn?: string;
  endsOn?: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskInstance = {
  id: string;
  taskId: string;
  householdId: string;
  titleSnapshot: string;
  assignedToMemberId?: string;
  dueDate: string;
  completedAt?: string;
  completedByMemberId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CalendarSourceType = "google" | "outlook" | "caldav" | "ics" | "manual";

export type CalendarEvent = {
  id: string;
  householdId: string;
  sourceId: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  color?: string;
  sourceType: CalendarSourceType;
  externalId?: string;
};

export type Device = {
  id: string;
  householdId: string;
  name: string;
  mode: "wall" | "mobile" | "admin";
  lastSeenAt?: string;
  defaultView?: string;
};

export type CreateTaskScheduleInput = {
  type: TaskSchedule["type"];
  timesOfDay?: string[];
  daysOfWeek?: number[];
  startsOn?: string;
  endsOn?: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  assignedToMemberId?: string;
  dueDate?: string;
  schedule?: CreateTaskScheduleInput;
  source?: TaskSource;
};

export type UpdateTaskInstanceInput = {
  id: string;
  titleSnapshot?: string;
  assignedToMemberId?: string;
  dueDate?: string;
  completedAt?: string | null;
  completedByMemberId?: string;
};
