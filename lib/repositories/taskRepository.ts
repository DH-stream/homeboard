import { mockTaskInstances, mockTaskSchedules, mockTasks } from "@/data/mockTasks";
import { NotFoundError } from "@/lib/errors";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { atLocalTime, toLocalDateKey } from "@/lib/utils/date";
import type { CreateTaskInput, Task, TaskInstance, TaskSchedule, TaskScheduleType, UpdateTaskInstanceInput } from "@/types";

const TASK_STORAGE_KEY = "homeboard.taskInstances.v1";
const TEMPLATE_STORAGE_KEY = "homeboard.taskTemplates.v1";
const SCHEDULE_STORAGE_KEY = "homeboard.taskSchedules.v1";
const DEFAULT_HOUSEHOLD_ID = "household-demo";
const DAILY_PREVIEW_DAYS = 7;
const WEEKLY_PREVIEW_DAYS = 14;

export type TaskRepositoryMode = "local" | "supabase";

export interface TaskRepository {
  listTaskTemplates(householdId?: string | null): Promise<Task[]>;
  listTaskInstances(householdId?: string | null): Promise<TaskInstance[]>;
  createTask(householdId: string | null, input: CreateTaskInput): Promise<TaskInstance[]>;
  updateTaskInstance(input: UpdateTaskInstanceInput): Promise<TaskInstance>;
}

type TaskRow = {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  assigned_to_member_id: string | null;
  status: Task["status"];
  source: Task["source"];
  created_at: string;
  updated_at: string;
};

type TaskScheduleRow = {
  id: string;
  task_id: string;
  type: TaskScheduleType;
  due_date: string | null;
  times_of_day: string[] | null;
  days_of_week: number[] | null;
  starts_on: string | null;
  ends_on: string | null;
  created_at: string;
  updated_at: string;
};

type TaskInstanceRow = {
  id: string;
  task_id: string;
  household_id: string;
  title_snapshot: string;
  assigned_to_member_id: string | null;
  due_date: string;
  schedule_id: string | null;
  schedule_type: TaskScheduleType | null;
  completed_at: string | null;
  completed_by_member_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    householdId: row.household_id,
    title: row.title,
    description: row.description ?? undefined,
    assignedToMemberId: row.assigned_to_member_id ?? undefined,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSchedule(row: TaskScheduleRow): TaskSchedule {
  return {
    id: row.id,
    taskId: row.task_id,
    type: row.type,
    dueDate: row.due_date ?? undefined,
    timesOfDay: row.times_of_day ?? undefined,
    daysOfWeek: row.days_of_week ?? undefined,
    startsOn: row.starts_on ?? undefined,
    endsOn: row.ends_on ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInstance(row: TaskInstanceRow): TaskInstance {
  return {
    id: row.id,
    taskId: row.task_id,
    householdId: row.household_id,
    titleSnapshot: row.title_snapshot,
    assignedToMemberId: row.assigned_to_member_id ?? undefined,
    dueDate: row.due_date,
    scheduleId: row.schedule_id ?? undefined,
    scheduleType: row.schedule_type ?? undefined,
    completedAt: row.completed_at ?? undefined,
    completedByMemberId: row.completed_by_member_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

function createInstance(task: Task, schedule: TaskSchedule, dueDate: string, now: string): TaskInstance {
  return {
    id: createId("instance"),
    taskId: task.id,
    householdId: task.householdId,
    titleSnapshot: task.title,
    assignedToMemberId: task.assignedToMemberId,
    dueDate,
    scheduleId: schedule.id,
    scheduleType: schedule.type,
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
    return [createInstance(task, schedule, schedule.dueDate ?? todayAtEndOfDay(), now)];
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
      instances.push(createInstance(task, schedule, dateForTime(date, time), now));
    }
  }

  return instances;
}

function createTaskRecords(input: CreateTaskInput, householdId: string | null = DEFAULT_HOUSEHOLD_ID) {
  const now = new Date().toISOString();
  const task: Task = {
    id: createId("task"),
    householdId: householdId ?? DEFAULT_HOUSEHOLD_ID,
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

function updateInstance(existing: TaskInstance, input: UpdateTaskInstanceInput): TaskInstance {
  return {
    ...existing,
    titleSnapshot: input.titleSnapshot ?? existing.titleSnapshot,
    assignedToMemberId: input.assignedToMemberId ?? existing.assignedToMemberId,
    dueDate: input.dueDate ?? existing.dueDate,
    completedAt: input.completedAt === null ? undefined : input.completedAt ?? existing.completedAt,
    completedByMemberId: input.completedAt === null ? undefined : input.completedByMemberId ?? existing.completedByMemberId,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Temporary localStorage-backed task repository for the product preview.
 * Supabase-backed sync is selected only when Supabase and a household id are both available.
 */
export class LocalTaskRepository implements TaskRepository {
  async listTaskTemplates() {
    return readTemplates();
  }

  async listTaskInstances() {
    return readInstances().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  async createTask(householdId: string | null, input: CreateTaskInput) {
    const { task, schedule, instances } = createTaskRecords(input, householdId);

    saveTemplates([...readTemplates(), task]);
    saveSchedules([...readSchedules(), schedule]);
    saveInstances([...readInstances(), ...instances]);
    return instances;
  }

  async updateTaskInstance(input: UpdateTaskInstanceInput) {
    const instances = readInstances();
    const existing = instances.find((task) => task.id === input.id);
    if (!existing) {
      throw new NotFoundError(`Task instance ${input.id} was not found.`);
    }

    const updated = updateInstance(existing, input);
    saveInstances(instances.map((task) => (task.id === input.id ? updated : task)));
    return updated;
  }
}

export class SupabaseTaskRepository implements TaskRepository {
  private readonly client = createBrowserSupabaseClient();

  async listTaskTemplates(householdId?: string | null) {
    if (!this.client || !householdId) return [];

    const { data, error } = await this.client
      .from("tasks")
      .select("id, household_id, title, description, assigned_to_member_id, status, source, created_at, updated_at")
      .eq("household_id", householdId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as TaskRow[]).map(mapTask);
  }

  async listTaskInstances(householdId?: string | null) {
    if (!this.client || !householdId) return [];

    const { data, error } = await this.client
      .from("task_instances")
      .select("id, task_id, household_id, title_snapshot, assigned_to_member_id, due_date, schedule_id, schedule_type, completed_at, completed_by_member_id, created_at, updated_at")
      .eq("household_id", householdId)
      .order("due_date", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as TaskInstanceRow[]).map(mapInstance);
  }

  async createTask(householdId: string | null, input: CreateTaskInput) {
    if (!this.client || !householdId) throw new Error("Supabase is not configured for task sync.");

    const now = new Date().toISOString();
    const { data: taskData, error: taskError } = await this.client
      .from("tasks")
      .insert({
        household_id: householdId,
        title: input.title,
        description: input.description ?? null,
        assigned_to_member_id: input.assignedToMemberId || null,
        status: "active",
        source: input.source ?? "manual",
      })
      .select("id, household_id, title, description, assigned_to_member_id, status, source, created_at, updated_at")
      .single();

    if (taskError) throw taskError;
    const task = mapTask(taskData as TaskRow);
    const scheduleDraft = scheduleFromInput(input, task.id, now);

    const { data: scheduleData, error: scheduleError } = await this.client
      .from("task_schedules")
      .insert({
        task_id: task.id,
        type: scheduleDraft.type,
        due_date: scheduleDraft.dueDate ?? null,
        times_of_day: scheduleDraft.timesOfDay ?? null,
        days_of_week: scheduleDraft.daysOfWeek ?? null,
        starts_on: scheduleDraft.startsOn ?? null,
        ends_on: scheduleDraft.endsOn ?? null,
      })
      .select("id, task_id, type, due_date, times_of_day, days_of_week, starts_on, ends_on, created_at, updated_at")
      .single();

    if (scheduleError) throw scheduleError;
    const schedule = mapSchedule(scheduleData as TaskScheduleRow);
    const generatedInstances = generateInstances(task, schedule, now);
    if (!generatedInstances.length) return [];

    const { data: instanceData, error: instanceError } = await this.client
      .from("task_instances")
      .insert(
        generatedInstances.map((instance) => ({
          task_id: instance.taskId,
          household_id: householdId,
          title_snapshot: instance.titleSnapshot,
          assigned_to_member_id: instance.assignedToMemberId ?? null,
          due_date: instance.dueDate,
          schedule_id: instance.scheduleId ?? null,
          schedule_type: instance.scheduleType ?? null,
          completed_at: null,
          completed_by_member_id: null,
        })),
      )
      .select("id, task_id, household_id, title_snapshot, assigned_to_member_id, due_date, schedule_id, schedule_type, completed_at, completed_by_member_id, created_at, updated_at")
      .order("due_date", { ascending: true });

    if (instanceError) throw instanceError;
    return ((instanceData ?? []) as TaskInstanceRow[]).map(mapInstance);
  }

  async updateTaskInstance(input: UpdateTaskInstanceInput) {
    if (!this.client) throw new Error("Supabase is not configured for task sync.");

    const values: Partial<{
      title_snapshot: string;
      assigned_to_member_id: string | null;
      due_date: string;
      completed_at: string | null;
      completed_by_member_id: string | null;
      updated_at: string;
    }> = { updated_at: new Date().toISOString() };

    if (input.titleSnapshot !== undefined) values.title_snapshot = input.titleSnapshot;
    if (input.assignedToMemberId !== undefined) values.assigned_to_member_id = input.assignedToMemberId || null;
    if (input.dueDate !== undefined) values.due_date = input.dueDate;
    if (input.completedAt !== undefined) {
      values.completed_at = input.completedAt;
      values.completed_by_member_id = input.completedAt === null ? null : input.completedByMemberId ?? null;
    } else if (input.completedByMemberId !== undefined) {
      values.completed_by_member_id = input.completedByMemberId || null;
    }

    const { data, error } = await this.client
      .from("task_instances")
      .update(values)
      .eq("id", input.id)
      .select("id, task_id, household_id, title_snapshot, assigned_to_member_id, due_date, schedule_id, schedule_type, completed_at, completed_by_member_id, created_at, updated_at")
      .single();

    if (error) throw error;
    return mapInstance(data as TaskInstanceRow);
  }
}

export const localTaskRepository = new LocalTaskRepository();
export const supabaseTaskRepository = new SupabaseTaskRepository();

export function getTaskRepository(householdId?: string | null): { mode: TaskRepositoryMode; repository: TaskRepository } {
  if (isSupabaseConfigured() && householdId) return { mode: "supabase", repository: supabaseTaskRepository };
  return { mode: "local", repository: localTaskRepository };
}

let serverInstances = [...mockTaskInstances];
let serverTemplates = [...mockTasks];
let serverSchedules = [...mockTaskSchedules];

/**
 * In-memory server repository for API route previews on Vercel/serverless.
 * It is intentionally non-authoritative; production should replace it with durable storage.
 */
export class ServerTaskRepository implements TaskRepository {
  async listTaskTemplates() {
    return serverTemplates;
  }

  async listTaskInstances() {
    return serverInstances.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  async createTask(householdId: string | null, input: CreateTaskInput) {
    const { task, schedule, instances } = createTaskRecords(input, householdId);
    serverTemplates = [...serverTemplates, task];
    serverSchedules = [...serverSchedules, schedule];
    serverInstances = [...serverInstances, ...instances];
    return instances;
  }

  async updateTaskInstance(input: UpdateTaskInstanceInput) {
    const existing = serverInstances.find((task) => task.id === input.id);
    if (!existing) throw new NotFoundError(`Task instance ${input.id} was not found.`);

    const updated = updateInstance(existing, input);
    serverInstances = serverInstances.map((task) => (task.id === input.id ? updated : task));
    return updated;
  }
}

export const serverTaskRepository = new ServerTaskRepository();
