import { mockTaskInstances, mockTaskSchedules, mockTasks } from "@/data/mockTasks";
import { NotFoundError } from "@/lib/errors";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { atLocalTime, toLocalDateKey } from "@/lib/utils/date";
import type { CreateTaskInput, Task, TaskInstance, TaskSchedule, TaskScheduleType, UpdateTaskInstanceInput } from "@/types";

const LEGACY_TASK_STORAGE_KEY = "homeboard.taskInstances.v1";
const LEGACY_TEMPLATE_STORAGE_KEY = "homeboard.taskTemplates.v1";
const LEGACY_SCHEDULE_STORAGE_KEY = "homeboard.taskSchedules.v1";
const TASK_CACHE_KEY = "homeboard.taskCache.v1";
const TASK_SYNC_QUEUE_KEY = "homeboard.taskSyncQueue.v1";
const DEFAULT_HOUSEHOLD_ID = "household-demo";
const DAILY_PREVIEW_DAYS = 7;
const WEEKLY_PREVIEW_DAYS = 14;
const OCCURRENCE_KEY_DELIMITER = "::";

export type TaskRepositoryMode = "local" | "supabase";

export interface TaskRepository {
  listTaskTemplates(householdId?: string | null): Promise<Task[]>;
  listTaskInstances(householdId?: string | null): Promise<TaskInstance[]>;
  createTask(householdId: string | null, input: CreateTaskInput): Promise<TaskInstance[]>;
  updateTaskInstance(input: UpdateTaskInstanceInput): Promise<TaskInstance>;
  flushPendingWrites?(householdId?: string | null): Promise<void>;
}

type TaskCache = {
  version: 1;
  updatedAt: string;
  tasks: Task[];
  schedules: TaskSchedule[];
  instances: TaskInstance[];
};

type TaskSyncQueueItem =
  | { id: string; type: "createTask"; householdId: string | null; input: CreateTaskInput; task?: Task; schedule?: TaskSchedule; createdAt: string }
  | { id: string; type: "updateTaskInstance"; input: UpdateTaskInstanceInput; createdAt: string };

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

type TaskWithScheduleRpcRow = {
  task_id: string;
  household_id: string;
  title: string;
  description: string | null;
  assigned_to_member_id: string | null;
  status: Task["status"];
  source: Task["source"];
  task_created_at: string;
  task_updated_at: string;
  schedule_id: string;
  schedule_type: TaskScheduleType;
  schedule_due_date: string | null;
  schedule_times_of_day: string[] | null;
  schedule_days_of_week: number[] | null;
  schedule_starts_on: string | null;
  schedule_ends_on: string | null;
  schedule_created_at: string;
  schedule_updated_at: string;
};

type TaskInstanceRow = {
  id: string;
  task_id: string;
  household_id: string;
  occurrence_key: string | null;
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

function mapTaskWithSchedule(row: TaskWithScheduleRpcRow) {
  return {
    task: mapTask({
      id: row.task_id,
      household_id: row.household_id,
      title: row.title,
      description: row.description,
      assigned_to_member_id: row.assigned_to_member_id,
      status: row.status,
      source: row.source,
      created_at: row.task_created_at,
      updated_at: row.task_updated_at,
    }),
    schedule: mapSchedule({
      id: row.schedule_id,
      task_id: row.task_id,
      type: row.schedule_type,
      due_date: row.schedule_due_date,
      times_of_day: row.schedule_times_of_day,
      days_of_week: row.schedule_days_of_week,
      starts_on: row.schedule_starts_on,
      ends_on: row.schedule_ends_on,
      created_at: row.schedule_created_at,
      updated_at: row.schedule_updated_at,
    }),
  };
}

function mapInstance(row: TaskInstanceRow): TaskInstance {
  return {
    id: row.id,
    taskId: row.task_id,
    householdId: row.household_id,
    occurrenceKey: row.occurrence_key ?? buildOccurrenceKey(row.task_id, row.due_date),
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
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createQueueId() {
  return createId("task-sync");
}

function todayAtEndOfDay() {
  const due = new Date();
  due.setHours(20, 0, 0, 0);
  return due.toISOString();
}

function defaultCache(): TaskCache {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    tasks: mockTasks,
    schedules: mockTaskSchedules,
    instances: mockTaskInstances.map(normaliseInstanceIdentity),
  };
}

function normaliseInstanceIdentity(instance: TaskInstance): TaskInstance {
  return {
    ...instance,
    occurrenceKey: instance.occurrenceKey ?? buildOccurrenceKey(instance.taskId, instance.dueDate),
  };
}

function readTaskCache(fallbackToMock = true): TaskCache {
  const fallback = fallbackToMock ? defaultCache() : { version: 1 as const, updatedAt: new Date().toISOString(), tasks: [], schedules: [], instances: [] };
  const cached = readJson<TaskCache | null>(TASK_CACHE_KEY, null);
  if (cached?.version === 1) {
    return { ...cached, instances: cached.instances.map(normaliseInstanceIdentity) };
  }

  const legacyTasks = readJson<Task[] | null>(LEGACY_TEMPLATE_STORAGE_KEY, null);
  const legacySchedules = readJson<TaskSchedule[] | null>(LEGACY_SCHEDULE_STORAGE_KEY, null);
  const legacyInstances = readJson<TaskInstance[] | null>(LEGACY_TASK_STORAGE_KEY, null);
  if (legacyTasks || legacySchedules || legacyInstances) {
    const migrated = {
      version: 1 as const,
      updatedAt: new Date().toISOString(),
      tasks: legacyTasks ?? mockTasks,
      schedules: legacySchedules ?? mockTaskSchedules,
      instances: (legacyInstances ?? mockTaskInstances).map(normaliseInstanceIdentity),
    };
    writeTaskCache(migrated);
    return migrated;
  }

  return fallback;
}

function writeTaskCache(cache: TaskCache) {
  writeJson(TASK_CACHE_KEY, { ...cache, instances: cache.instances.map(normaliseInstanceIdentity) });
}

function readQueue() {
  return readJson<TaskSyncQueueItem[]>(TASK_SYNC_QUEUE_KEY, []);
}

function writeQueue(queue: TaskSyncQueueItem[]) {
  writeJson(TASK_SYNC_QUEUE_KEY, queue);
}

function enqueue(item: { type: "createTask"; householdId: string | null; input: CreateTaskInput; task?: Task; schedule?: TaskSchedule } | { type: "updateTaskInstance"; input: UpdateTaskInstanceInput }) {
  writeQueue([...readQueue(), { ...item, id: createQueueId(), createdAt: new Date().toISOString() } as TaskSyncQueueItem]);
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

function localTimeKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function buildOccurrenceKey(taskId: string, dueDate: string) {
  return [taskId, toLocalDateKey(dueDate), localTimeKey(dueDate)].join(OCCURRENCE_KEY_DELIMITER);
}

function createInstance(task: Task, schedule: TaskSchedule, dueDate: string, now: string, persisted = false): TaskInstance {
  const occurrenceKey = buildOccurrenceKey(task.id, dueDate);
  return {
    id: persisted ? createId("instance") : `virtual${OCCURRENCE_KEY_DELIMITER}${occurrenceKey}`,
    taskId: task.id,
    householdId: task.householdId,
    occurrenceKey,
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
  if (task.status !== "active") return [];

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

function mergeGeneratedAndSavedInstances(tasks: Task[], schedules: TaskSchedule[], savedInstances: TaskInstance[]) {
  const now = new Date().toISOString();
  const savedByOccurrence = new Map<string, TaskInstance>();
  const savedByTaskAndDueDate = new Map<string, TaskInstance>();

  for (const saved of savedInstances.map(normaliseInstanceIdentity)) {
    if (saved.occurrenceKey) savedByOccurrence.set(saved.occurrenceKey, saved);
    savedByTaskAndDueDate.set(`${saved.taskId}${OCCURRENCE_KEY_DELIMITER}${saved.dueDate}`, saved);
  }

  return schedules
    .flatMap((schedule) => {
      const task = tasks.find((candidate) => candidate.id === schedule.taskId);
      if (!task) return [];
      return generateInstances(task, schedule, now).map((generated) => {
        const saved = savedByOccurrence.get(generated.occurrenceKey ?? "") ?? savedByTaskAndDueDate.get(`${generated.taskId}${OCCURRENCE_KEY_DELIMITER}${generated.dueDate}`);
        if (!saved) return generated;

        return {
          ...generated,
          ...saved,
          id: saved.id,
          occurrenceKey: saved.occurrenceKey ?? generated.occurrenceKey,
          taskId: generated.taskId,
          householdId: generated.householdId,
          dueDate: saved.dueDate ?? generated.dueDate,
          scheduleId: generated.scheduleId,
          scheduleType: generated.scheduleType,
        };
      });
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
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
  const dueDate = input.dueDate ?? existing.dueDate;
  return {
    ...existing,
    occurrenceKey: input.occurrenceKey ?? existing.occurrenceKey ?? buildOccurrenceKey(input.taskId ?? existing.taskId, dueDate),
    titleSnapshot: input.titleSnapshot ?? existing.titleSnapshot,
    assignedToMemberId: input.assignedToMemberId ?? existing.assignedToMemberId,
    dueDate,
    completedAt: input.completedAt === null ? undefined : input.completedAt ?? existing.completedAt,
    completedByMemberId: input.completedAt === null ? undefined : input.completedByMemberId ?? existing.completedByMemberId,
    updatedAt: new Date().toISOString(),
  };
}

function applyInstanceUpdateToCache(input: UpdateTaskInstanceInput, fallbackHouseholdId = DEFAULT_HOUSEHOLD_ID) {
  const cache = readTaskCache(false);
  const occurrenceKey = input.occurrenceKey ?? (input.taskId && input.dueDate ? buildOccurrenceKey(input.taskId, input.dueDate) : undefined);
  const existing = cache.instances.find((instance) => instance.id === input.id || (occurrenceKey && instance.occurrenceKey === occurrenceKey));

  if (existing) {
    const updated = updateInstance(existing, input);
    writeTaskCache({ ...cache, updatedAt: new Date().toISOString(), instances: cache.instances.map((instance) => (instance.id === existing.id ? updated : instance)) });
    return updated;
  }

  if (!input.taskId || !input.dueDate) {
    const generated = mergeGeneratedAndSavedInstances(cache.tasks, cache.schedules, cache.instances).find((instance) => instance.id === input.id);
    if (!generated) throw new NotFoundError(`Task instance ${input.id} was not found.`);

    return applyInstanceUpdateToCache({
      taskId: generated.taskId,
      householdId: generated.householdId,
      occurrenceKey: generated.occurrenceKey,
      titleSnapshot: generated.titleSnapshot,
      assignedToMemberId: generated.assignedToMemberId,
      dueDate: generated.dueDate,
      scheduleId: generated.scheduleId,
      scheduleType: generated.scheduleType,
      ...input,
    }, fallbackHouseholdId);
  }

  const task = cache.tasks.find((candidate) => candidate.id === input.taskId);
  const schedule = cache.schedules.find((candidate) => candidate.id === input.scheduleId || candidate.taskId === input.taskId);
  const now = new Date().toISOString();
  const created: TaskInstance = updateInstance(
    {
      id: createId("instance"),
      taskId: input.taskId,
      householdId: input.householdId ?? task?.householdId ?? fallbackHouseholdId,
      occurrenceKey: occurrenceKey ?? buildOccurrenceKey(input.taskId, input.dueDate),
      titleSnapshot: input.titleSnapshot ?? task?.title ?? "",
      assignedToMemberId: input.assignedToMemberId ?? task?.assignedToMemberId,
      dueDate: input.dueDate,
      scheduleId: input.scheduleId ?? schedule?.id,
      scheduleType: input.scheduleType ?? schedule?.type,
      createdAt: now,
      updatedAt: now,
    },
    input,
  );

  writeTaskCache({ ...cache, updatedAt: now, instances: [...cache.instances, created] });
  return created;
}

/**
 * localStorage-backed task repository. It is local-only when Supabase is not configured
 * and doubles as the offline cache backing Supabase sync mode.
 */
export class LocalTaskRepository implements TaskRepository {
  async listTaskTemplates() {
    return readTaskCache().tasks;
  }

  async listTaskInstances() {
    const cache = readTaskCache();
    return mergeGeneratedAndSavedInstances(cache.tasks, cache.schedules, cache.instances);
  }

  async createTask(householdId: string | null, input: CreateTaskInput) {
    const { task, schedule, instances } = createTaskRecords(input, householdId);
    const cache = readTaskCache();

    writeTaskCache({
      version: 1,
      updatedAt: new Date().toISOString(),
      tasks: [...cache.tasks, task],
      schedules: [...cache.schedules, schedule],
      instances: cache.instances,
    });
    return instances;
  }

  async updateTaskInstance(input: UpdateTaskInstanceInput): Promise<TaskInstance> {
    return applyInstanceUpdateToCache(input);
  }
}

export class SupabaseTaskRepository implements TaskRepository {
  private readonly client = createBrowserSupabaseClient();

  private instanceSelect = "id, task_id, household_id, occurrence_key, title_snapshot, assigned_to_member_id, due_date, schedule_id, schedule_type, completed_at, completed_by_member_id, created_at, updated_at";

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

  private async listTaskSchedules(taskIds: string[]) {
    if (!this.client || !taskIds.length) return [];

    const { data, error } = await this.client
      .from("task_schedules")
      .select("id, task_id, type, due_date, times_of_day, days_of_week, starts_on, ends_on, created_at, updated_at")
      .in("task_id", taskIds)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as TaskScheduleRow[]).map(mapSchedule);
  }

  private async listSavedInstances(householdId: string) {
    if (!this.client) return [];

    const { data, error } = await this.client
      .from("task_instances")
      .select(this.instanceSelect)
      .eq("household_id", householdId)
      .order("due_date", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as unknown as TaskInstanceRow[]).map(mapInstance);
  }

  async listTaskInstances(householdId?: string | null) {
    if (!this.client || !householdId) return [];

    const tasks = await this.listTaskTemplates(householdId);
    const schedules = await this.listTaskSchedules(tasks.map((task) => task.id));
    const instances = await this.listSavedInstances(householdId);
    writeTaskCache({ version: 1, updatedAt: new Date().toISOString(), tasks, schedules, instances });
    return mergeGeneratedAndSavedInstances(tasks, schedules, instances);
  }

  async createTask(householdId: string | null, input: CreateTaskInput) {
    const { task, schedule } = createTaskRecords(input, householdId);
    return this.createTaskFromRecords(householdId, input, task, schedule);
  }

  async createTaskFromRecords(householdId: string | null, input: CreateTaskInput, task: Task, schedule: TaskSchedule) {
    if (!this.client || !householdId) throw new Error("Supabase is not configured for task sync.");

    const { data, error } = await this.client
      .rpc("create_task_with_schedule", {
        p_household_id: householdId,
        p_title: task.title,
        p_description: input.description ?? task.description ?? null,
        p_assigned_to_member_id: task.assignedToMemberId || null,
        p_source: task.source,
        p_schedule_type: schedule.type,
        p_due_date: schedule.dueDate ?? null,
        p_times_of_day: schedule.timesOfDay ?? null,
        p_days_of_week: schedule.daysOfWeek ?? null,
        p_starts_on: schedule.startsOn ?? null,
        p_ends_on: schedule.endsOn ?? null,
        p_task_id: task.id,
        p_schedule_id: schedule.id,
      })
      .single();

    if (error) throw error;
    const { task: savedTask, schedule: savedSchedule } = mapTaskWithSchedule(data as unknown as TaskWithScheduleRpcRow);
    return generateInstances(savedTask, savedSchedule, new Date().toISOString());
  }

  async updateTaskInstance(input: UpdateTaskInstanceInput): Promise<TaskInstance> {
    if (!this.client) throw new Error("Supabase is not configured for task sync.");

    const occurrenceKey = input.occurrenceKey ?? (input.taskId && input.dueDate ? buildOccurrenceKey(input.taskId, input.dueDate) : undefined);
    const now = new Date().toISOString();
    const values: Partial<{
      title_snapshot: string;
      assigned_to_member_id: string | null;
      due_date: string;
      completed_at: string | null;
      completed_by_member_id: string | null;
      updated_at: string;
    }> = { updated_at: now };

    if (input.titleSnapshot !== undefined) values.title_snapshot = input.titleSnapshot;
    if (input.assignedToMemberId !== undefined) values.assigned_to_member_id = input.assignedToMemberId || null;
    if (input.dueDate !== undefined) values.due_date = input.dueDate;
    if (input.completedAt !== undefined) {
      values.completed_at = input.completedAt;
      values.completed_by_member_id = input.completedAt === null ? null : input.completedByMemberId ?? null;
    } else if (input.completedByMemberId !== undefined) {
      values.completed_by_member_id = input.completedByMemberId || null;
    }

    const existing = occurrenceKey ? await this.findInstanceByOccurrence(input.taskId, occurrenceKey) : null;
    if (existing || !input.id.startsWith("virtual")) {
      const targetId = existing?.id ?? input.id;
      const { data, error } = await this.client.from("task_instances").update(values).eq("id", targetId).select(this.instanceSelect).single();
      if (error) throw error;
      return mapInstance(data as unknown as TaskInstanceRow);
    }

    if (!input.taskId || !input.householdId || !input.dueDate) {
      throw new NotFoundError(`Task instance ${input.id} was not found.`);
    }

    const { data, error } = await this.client
      .from("task_instances")
      .insert({
        task_id: input.taskId,
        household_id: input.householdId,
        occurrence_key: occurrenceKey ?? buildOccurrenceKey(input.taskId, input.dueDate),
        title_snapshot: input.titleSnapshot ?? "",
        assigned_to_member_id: input.assignedToMemberId ?? null,
        due_date: input.dueDate,
        schedule_id: input.scheduleId ?? null,
        schedule_type: input.scheduleType ?? null,
        completed_at: input.completedAt ?? null,
        completed_by_member_id: input.completedAt === null ? null : input.completedByMemberId ?? null,
      })
      .select(this.instanceSelect)
      .single();

    if (error) throw error;
    return mapInstance(data as unknown as TaskInstanceRow);
  }

  private async findInstanceByOccurrence(taskId?: string, occurrenceKey?: string) {
    if (!this.client || !taskId || !occurrenceKey) return null;

    const { data, error } = await this.client.from("task_instances").select(this.instanceSelect).eq("task_id", taskId).eq("occurrence_key", occurrenceKey).maybeSingle();
    if (error) throw error;
    return data ? mapInstance(data as unknown as TaskInstanceRow) : null;
  }
}

export class CachedTaskRepository implements TaskRepository {
  constructor(private readonly remote: SupabaseTaskRepository, private readonly local: LocalTaskRepository) {}

  async listTaskTemplates(householdId?: string | null) {
    try {
      return await this.remote.listTaskTemplates(householdId);
    } catch (error) {
      console.warn("HomeBoard task sync is offline; using cached task templates.", error);
      return readTaskCache(false).tasks;
    }
  }

  async listTaskInstances(householdId?: string | null) {
    await this.flushPendingWrites(householdId);
    try {
      return await this.remote.listTaskInstances(householdId);
    } catch (error) {
      console.warn("HomeBoard task sync is offline; using cached task occurrences.", error);
      const cache = readTaskCache(false);
      return mergeGeneratedAndSavedInstances(cache.tasks, cache.schedules, cache.instances);
    }
  }

  async createTask(householdId: string | null, input: CreateTaskInput) {
    try {
      const created = await this.remote.createTask(householdId, input);
      await this.remote.listTaskInstances(householdId);
      return created;
    } catch (error) {
      console.warn("HomeBoard task sync create is queued until Supabase is reachable.", error);
      const { task, schedule, instances } = createTaskRecords(input, householdId);
      const cache = readTaskCache(false);
      writeTaskCache({
        version: 1,
        updatedAt: new Date().toISOString(),
        tasks: [...cache.tasks, task],
        schedules: [...cache.schedules, schedule],
        instances: cache.instances,
      });
      enqueue({ type: "createTask", householdId, input, task, schedule });
      return instances;
    }
  }

  async updateTaskInstance(input: UpdateTaskInstanceInput): Promise<TaskInstance> {
    try {
      const updated = await this.remote.updateTaskInstance(input);
      applyInstanceUpdateToCache({ ...input, id: updated.id, occurrenceKey: updated.occurrenceKey, completedAt: updated.completedAt ?? null, completedByMemberId: updated.completedByMemberId });
      return updated;
    } catch (error) {
      console.warn("HomeBoard task sync update is queued until Supabase is reachable.", error);
      enqueue({ type: "updateTaskInstance", input });
      return applyInstanceUpdateToCache(input);
    }
  }

  async flushPendingWrites(householdId?: string | null) {
    const queue = readQueue();
    if (!queue.length) return;

    const remaining: TaskSyncQueueItem[] = [];
    for (const item of queue) {
      try {
        if (item.type === "createTask") {
          if (item.task && item.schedule) {
            await this.remote.createTaskFromRecords(item.householdId ?? householdId ?? null, item.input, item.task, item.schedule);
          } else {
            await this.remote.createTask(item.householdId ?? householdId ?? null, item.input);
          }
        } else {
          await this.remote.updateTaskInstance(item.input);
        }
      } catch (error) {
        console.warn("HomeBoard task sync queue will retry later.", error);
        remaining.push(item);
      }
    }

    writeQueue(remaining);
  }
}

export const localTaskRepository = new LocalTaskRepository();
export const supabaseTaskRepository = new SupabaseTaskRepository();
export const cachedTaskRepository = new CachedTaskRepository(supabaseTaskRepository, localTaskRepository);

export function getTaskRepository(householdId?: string | null): { mode: TaskRepositoryMode; repository: TaskRepository } {
  if (isSupabaseConfigured() && householdId) return { mode: "supabase", repository: cachedTaskRepository };
  return { mode: "local", repository: localTaskRepository };
}

let serverCache: TaskCache = {
  version: 1,
  updatedAt: new Date().toISOString(),
  tasks: [...mockTasks],
  schedules: [...mockTaskSchedules],
  instances: mockTaskInstances.map(normaliseInstanceIdentity),
};

/**
 * In-memory server repository for API route previews on Vercel/serverless.
 * It is intentionally non-authoritative; production should replace it with durable storage.
 */
export class ServerTaskRepository implements TaskRepository {
  async listTaskTemplates() {
    return serverCache.tasks;
  }

  async listTaskInstances() {
    return mergeGeneratedAndSavedInstances(serverCache.tasks, serverCache.schedules, serverCache.instances);
  }

  async createTask(householdId: string | null, input: CreateTaskInput) {
    const { task, schedule, instances } = createTaskRecords(input, householdId);
    serverCache = { ...serverCache, updatedAt: new Date().toISOString(), tasks: [...serverCache.tasks, task], schedules: [...serverCache.schedules, schedule] };
    return instances;
  }

  async updateTaskInstance(input: UpdateTaskInstanceInput): Promise<TaskInstance> {
    const occurrenceKey = input.occurrenceKey ?? (input.taskId && input.dueDate ? buildOccurrenceKey(input.taskId, input.dueDate) : undefined);
    const existing = serverCache.instances.find((task) => task.id === input.id || (occurrenceKey && task.occurrenceKey === occurrenceKey));
    if (!existing && (!input.taskId || !input.dueDate)) {
      const generated = mergeGeneratedAndSavedInstances(serverCache.tasks, serverCache.schedules, serverCache.instances).find((instance) => instance.id === input.id);
      if (!generated) throw new NotFoundError(`Task instance ${input.id} was not found.`);

      return this.updateTaskInstance({
        taskId: generated.taskId,
        householdId: generated.householdId,
        occurrenceKey: generated.occurrenceKey,
        titleSnapshot: generated.titleSnapshot,
        assignedToMemberId: generated.assignedToMemberId,
        dueDate: generated.dueDate,
        scheduleId: generated.scheduleId,
        scheduleType: generated.scheduleType,
        ...input,
      });
    }

    const updated = existing
      ? updateInstance(existing, input)
      : updateInstance(
          {
            id: createId("instance"),
            taskId: input.taskId!,
            householdId: input.householdId ?? DEFAULT_HOUSEHOLD_ID,
            occurrenceKey: occurrenceKey ?? buildOccurrenceKey(input.taskId!, input.dueDate!),
            titleSnapshot: input.titleSnapshot ?? "",
            assignedToMemberId: input.assignedToMemberId,
            dueDate: input.dueDate!,
            scheduleId: input.scheduleId,
            scheduleType: input.scheduleType,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          input,
        );

    serverCache = {
      ...serverCache,
      updatedAt: new Date().toISOString(),
      instances: existing ? serverCache.instances.map((task) => (task.id === existing.id ? updated : task)) : [...serverCache.instances, updated],
    };
    return updated;
  }
}

export const serverTaskRepository = new ServerTaskRepository();
