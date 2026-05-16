import { mockTaskInstances, mockTasks } from "@/data/mockTasks";
import type { CreateTaskInput, Task, TaskInstance, UpdateTaskInstanceInput } from "@/types";

const TASK_STORAGE_KEY = "homeboard.taskInstances.v1";
const TEMPLATE_STORAGE_KEY = "homeboard.taskTemplates.v1";
const DEFAULT_HOUSEHOLD_ID = "household-demo";

export interface TaskRepository {
  listTaskTemplates(): Promise<Task[]>;
  listTaskInstances(): Promise<TaskInstance[]>;
  createTask(input: CreateTaskInput): Promise<TaskInstance>;
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

function readInstances() {
  return readJson<TaskInstance[]>(TASK_STORAGE_KEY, mockTaskInstances);
}

function saveTemplates(tasks: Task[]) {
  writeJson(TEMPLATE_STORAGE_KEY, tasks);
}

function saveInstances(tasks: TaskInstance[]) {
  writeJson(TASK_STORAGE_KEY, tasks);
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
    const instance: TaskInstance = {
      id: createId("instance"),
      taskId: task.id,
      householdId: DEFAULT_HOUSEHOLD_ID,
      titleSnapshot: input.title,
      assignedToMemberId: input.assignedToMemberId || undefined,
      dueDate: input.dueDate ?? todayAtEndOfDay(),
      createdAt: now,
      updatedAt: now,
    };

    saveTemplates([...readTemplates(), task]);
    saveInstances([...readInstances(), instance]);
    return instance;
  },
  async updateTaskInstance(input) {
    const instances = readInstances();
    const existing = instances.find((task) => task.id === input.id);
    if (!existing) {
      throw new Error(`Task instance ${input.id} was not found.`);
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
    const instance: TaskInstance = {
      id: createId("instance"),
      taskId: task.id,
      householdId: DEFAULT_HOUSEHOLD_ID,
      titleSnapshot: input.title,
      assignedToMemberId: input.assignedToMemberId || undefined,
      dueDate: input.dueDate ?? todayAtEndOfDay(),
      createdAt: now,
      updatedAt: now,
    };
    serverTemplates = [...serverTemplates, task];
    serverInstances = [...serverInstances, instance];
    return instance;
  },
  async updateTaskInstance(input) {
    const existing = serverInstances.find((task) => task.id === input.id);
    if (!existing) throw new Error(`Task instance ${input.id} was not found.`);

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
