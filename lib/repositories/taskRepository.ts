import { mockTaskInstances, mockTaskSchedules, mockTasks } from "@/data/mockTasks";
import { NotFoundError } from "@/lib/errors";
import { atLocalTime, toLocalDateKey } from "@/lib/utils/date";
import type { CreateTaskInput, Task, TaskInstance, TaskSchedule, UpdateTaskInstanceInput } from "@/types";

const TASK_STORAGE_KEY = "homeboard.taskInstances.v1";
const TEMPLATE_STORAGE_KEY = "homeboard.taskTemplates.v1";
const SCHEDULE_STORAGE_KEY = "homeboard.taskSchedules.v1";
const DEFAULT_HOUSEHOLD_ID = "household-demo";
const DAILY_PREVIEW_DAYS = 7;
const WEEKLY_PREVIEW_DAYS = 14;

export interface TaskRepository {
  listTaskTemplates(): Promise<Task[]>;
  listTaskInstances(): Promise<TaskInstance[]>;
  createTask(input: CreateTaskInput): Promise<TaskInstance[]>;
  updateTaskInstance(input: UpdateTaskInstanceInput): Promise<TaskInstance>;
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function todayAtEndOfDay() {
  const due = new Date();
  due.setHours(20, 0, 0, 0);
  return due.toISOString();
}

function readTemplates() {
  return readJson<Task[]>(TEMPLATE_STORAGE_KEY, mockTasks);
}

function readSchedules() {
  return readJson<TaskSchedule[]>(SCHEDULE_STORAGE_KEY, mockTaskSchedules);
}

function readInstances() {
  return readJson<TaskInstance[]>(TASK_STORAGE_KEY, mockTaskInstances);
}

function saveTemplates(tasks: Task[]) {
  writeJson(TEMPLATE_STORAGE_KEY, tasks);
}

function saveSchedules(schedules: TaskSchedule[]) {
  writeJson(SCHEDULE_STORAGE_KEY, schedules);
}

function saveInstances(tasks: TaskInstance[]) {
  writeJson(TASK_STORAGE_KEY, tasks);
}

function parseTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return {
    hours: Number.isFinite(hours) ? hours : 20,
    minutes: Number.isFinite(minutes) ? minutes : 0,
  };
}

function normaliseTimesOfDay(timesOfDay?: string[]) {
  const validTimes = (timesOfDay ?? [])
    .map((time) => time.trim())
    .filter((time) => /^\d{2}:\d{2}$/.test(time));

  return validTimes.length ? Array.from(new Set(validTimes)).sort() : ["20:00"];
}

function localDateFromKey(value?: string) {
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateForTime(date: Date, time: string) {
  const { hours, minutes } = parseTime(time);
  return atLocalTime(hours, minutes, date);
}

function createInstance(task: Task, dueDate: string, now: string): TaskInstance {
  return {
    id: createId("instance"),
    taskId: task.id,
    householdId: DEFAULT_HOUSEHOLD_ID,
    titleSnapshot: task.title,
    assignedToMemberId: task.assignedToMemberId,
    dueDate,
    createdAt: now,
    updatedAt: now,
  };
}

function scheduleFromInput(input: CreateTaskInput, taskId: string, now: string): TaskSchedule {
  const scheduleType = input.schedule?.type ?? "once";
  return {
    id: createId("schedule"),
    taskId,
    type: scheduleType,
    dueDate: scheduleType === "once" ? input.dueDate ?? todayAtEndOfDay() : undefined,
    timesOfDay: scheduleType === "once" ? undefined : normaliseTimesOfDay(input.schedule?.timesOfDay),
    daysOfWeek: scheduleType === "weekly" ? input.schedule?.daysOfWeek ?? [] : input.schedule?.daysOfWeek,
    startsOn: input.schedule?.startsOn,
    endsOn: input.schedule?.endsOn,
    createdAt: now,
    updatedAt: now,
  };
}

function generateInstances(task: Task, schedule: TaskSchedule, now: string) {
  if (schedule.type === "once") {
    return [createInstance(task, schedule.dueDate ?? todayAtEndOfDay(), now)];
  }

  const startsOn = localDateFromKey(schedule.startsOn);
  const today = localDateFromKey();
  const firstDate = startsOn > today ? startsOn : today;
  const previewDays = schedule.type === "weekly" ? WEEKLY_PREVIEW_DAYS : DAILY_PREVIEW_DAYS;
  const timesOfDay = normaliseTimesOfDay(schedule.timesOfDay);
  const daysOfWeek = schedule.type === "weekly" ? schedule.daysOfWeek ?? [] : undefined;
  const endsOnKey = schedule.endsOn;
  const instances: TaskInstance[] = [];

  for (let offset = 0; offset <= previewDays; offset += 1) {
    const date = new Date(firstDate);
    date.setDate(firstDate.getDate() + offset);
    const dateKey = toLocalDateKey(date);
    if (endsOnKey && dateKey > endsOnKey) break;
    if (daysOfWeek && !daysOfWeek.includes(date.getDay())) continue;

    for (const time of timesOfDay) {
      instances.push(createInstance(task, dateForTime(date, time), now));
    }
  }

  return instances;
}

function createTaskRecords(input: CreateTaskInput) {
  const now = new Date().toISOString();
  const task: Task = {
    id: createId("task"),
    householdId: DEFAULT_HOUSEHOLD_ID,
    title: input.title,
    description: input.description,
    assignedToMemberId: input.assignedToMemberId || undefined,
    status: "active",
    source: input.source ?? "manual",
    createdAt: now,
    updatedAt: now,
  };
  const schedule = scheduleFromInput(input, task.id, now);
  const instances = generateInstances(task, schedule, now);

  return { task, schedule, instances };
}

/**
 * Temporary localStorage-backed task repository for the product preview.
 * Swap this implementation for Supabase/Postgres without changing UI consumers.
 */
export const localTaskRepository: TaskRepository = {
  async listTaskTemplates() {
    return readTemplates();
  },
  async listTaskInstances() {
    return readInstances().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },
  async createTask(input) {
    const { task, schedule, instances } = createTaskRecords(input);

    saveTemplates([...readTemplates(), task]);
    saveSchedules([...readSchedules(), schedule]);
    saveInstances([...readInstances(), ...instances]);
    return instances;
  },
  async updateTaskInstance(input) {
    const instances = readInstances();
    const existing = instances.find((task) => task.id === input.id);
    if (!existing) {
      throw new NotFoundError(`Task instance ${input.id} was not found.`);
    }

    const updated: TaskInstance = {
      ...existing,
      titleSnapshot: input.titleSnapshot ?? existing.titleSnapshot,
      assignedToMemberId: input.assignedToMemberId ?? existing.assignedToMemberId,
      dueDate: input.dueDate ?? existing.dueDate,
      completedAt: input.completedAt === null ? undefined : input.completedAt ?? existing.completedAt,
      completedByMemberId:
        input.completedAt === null ? undefined : input.completedByMemberId ?? existing.completedByMemberId,
      updatedAt: new Date().toISOString(),
    };

    saveInstances(instances.map((task) => (task.id === input.id ? updated : task)));
    return updated;
  },
};

let serverInstances = [...mockTaskInstances];
let serverTemplates = [...mockTasks];
let serverSchedules = [...mockTaskSchedules];

/**
 * In-memory server repository for API route previews on Vercel/serverless.
 * It is intentionally non-authoritative; production should replace it with durable storage.
 */
export const serverTaskRepository: TaskRepository = {
  async listTaskTemplates() {
    return serverTemplates;
  },
  async listTaskInstances() {
    return serverInstances.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },
  async createTask(input) {
    const { task, schedule, instances } = createTaskRecords(input);
    serverTemplates = [...serverTemplates, task];
    serverSchedules = [...serverSchedules, schedule];
    serverInstances = [...serverInstances, ...instances];
    return instances;
  },
  async updateTaskInstance(input) {
    const existing = serverInstances.find((task) => task.id === input.id);
    if (!existing) throw new NotFoundError(`Task instance ${input.id} was not found.`);

    const updated: TaskInstance = {
      ...existing,
      titleSnapshot: input.titleSnapshot ?? existing.titleSnapshot,
      assignedToMemberId: input.assignedToMemberId ?? existing.assignedToMemberId,
      dueDate: input.dueDate ?? existing.dueDate,
      completedAt: input.completedAt === null ? undefined : input.completedAt ?? existing.completedAt,
      completedByMemberId:
        input.completedAt === null ? undefined : input.completedByMemberId ?? existing.completedByMemberId,
      updatedAt: new Date().toISOString(),
    };
    serverInstances = serverInstances.map((task) => (task.id === input.id ? updated : task));
    return updated;
  },
};
