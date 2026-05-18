export type Household = {
  id: string;
  name: string;
  ownerUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type HouseholdMemberRole = "adult" | "child" | "guest";

export type HouseholdMember = {
  id: string;
  householdId: string;
  userId?: string;
  displayName: string;
  color: string;
  avatarUrl?: string;
  role: HouseholdMemberRole;
  createdAt: string;
  updatedAt: string;
};

export type TaskSource = "manual" | "runai" | "home_assistant" | "automation";
export type TaskStatus = "active" | "archived";
export type TaskScheduleType = "once" | "daily" | "weekly";

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
  type: TaskScheduleType;
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
  occurrenceKey?: string;
  scheduleId?: string;
  scheduleType?: TaskScheduleType;
  completedAt?: string;
  completedByMemberId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CalendarProvider = "google" | "microsoft" | "icloud_caldav" | "ics" | "manual";
export type CalendarConnectionStatus = "needs_setup" | "connected" | "needs_reauth" | "error";

export type CalendarConnection = {
  id: string;
  householdId: string;
  connectedByMemberId?: string;
  provider: CalendarProvider;
  accountLabel: string;
  accountEmail?: string;
  status: CalendarConnectionStatus;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CalendarSource = {
  id: string;
  householdId: string;
  connectionId: string;
  providerCalendarId: string;
  name: string;
  color?: string;
  enabled: boolean;
  visibility: "household" | "private";
  syncMode: "read_only";
  syncUrl?: string;
  lastSyncedAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
};

export type CalendarSourceType = CalendarProvider;

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
  sourceType?: CalendarSourceType;
  externalId?: string;
};

export type DeviceAudience = "adult" | "child" | "shared";

export type Device = {
  id: string;
  householdId: string;
  name: string;
  mode: "wall" | "mobile" | "admin";
  audience?: DeviceAudience;
  linkedMemberId?: string;
  lastSeenAt?: string;
  defaultView?: string;
};


export type DevicePairingSessionStatus = "pending" | "claimed" | "expired";

export type DevicePairingSession = {
  id: string;
  deviceId: string;
  pairingCode: string;
  status: DevicePairingSessionStatus;
  expiresAt: string;
  householdId?: string;
  claimedByMemberId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateDevicePairingSessionInput = {
  deviceName: string;
  mode: "wall" | "mobile";
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
  taskId?: string;
  householdId?: string;
  occurrenceKey?: string;
  titleSnapshot?: string;
  assignedToMemberId?: string;
  dueDate?: string;
  scheduleId?: string;
  scheduleType?: TaskScheduleType;
  completedAt?: string | null;
  completedByMemberId?: string;
};