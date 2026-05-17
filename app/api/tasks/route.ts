import { NextResponse } from "next/server";
import { NotFoundError } from "@/lib/errors";
import { serverTaskRepository } from "@/lib/repositories/taskRepository";
import { createTaskService } from "@/lib/services/taskService";
import { isValidDateValue } from "@/lib/utils/date";
import type { CreateTaskInput, CreateTaskScheduleInput, TaskSource, UpdateTaskInstanceInput } from "@/types";

const taskService = createTaskService(serverTaskRepository);
const taskSources: TaskSource[] = ["manual", "runai", "home_assistant", "automation"];

type JsonRecord = Record<string, unknown>;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonBody(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    return { body };
  } catch {
    return { error: jsonError("Request body must be valid JSON.", 400) };
  }
}

function optionalString(body: JsonRecord, key: string) {
  const value = body[key];
  if (value === undefined) return undefined;
  return typeof value === "string" ? value : null;
}


function optionalStringArray(body: JsonRecord, key: string) {
  const value = body[key];
  if (value === undefined) return undefined;
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : null;
}

function optionalNumberArray(body: JsonRecord, key: string) {
  const value = body[key];
  if (value === undefined) return undefined;
  return Array.isArray(value) && value.every((item) => typeof item === "number") ? value : null;
}

function parseSchedule(value: unknown): { schedule?: CreateTaskScheduleInput; error?: NextResponse } {
  if (value === undefined) return {};
  if (!isRecord(value)) return { error: jsonError("schedule must be an object when provided.", 400) };

  const type = value.type;
  if (type !== "once" && type !== "daily" && type !== "weekly") {
    return { error: jsonError("schedule.type must be once, daily, or weekly.", 400) };
  }

  const timesOfDay = optionalStringArray(value, "timesOfDay");
  if (timesOfDay === null) return { error: jsonError("schedule.timesOfDay must be an array of time strings.", 400) };

  const daysOfWeek = optionalNumberArray(value, "daysOfWeek");
  if (daysOfWeek === null) return { error: jsonError("schedule.daysOfWeek must be an array of numbers.", 400) };
  if (daysOfWeek?.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    return { error: jsonError("schedule.daysOfWeek values must be integers from 0 to 6.", 400) };
  }

  const startsOn = optionalString(value, "startsOn");
  if (startsOn === null) return { error: jsonError("schedule.startsOn must be a string when provided.", 400) };

  const endsOn = optionalString(value, "endsOn");
  if (endsOn === null) return { error: jsonError("schedule.endsOn must be a string when provided.", 400) };

  return {
    schedule: {
      type,
      timesOfDay,
      daysOfWeek,
      startsOn: startsOn?.trim() || undefined,
      endsOn: endsOn?.trim() || undefined,
    },
  };
}

function parseCreateTaskInput(body: unknown): { input?: CreateTaskInput; error?: NextResponse } {
  if (!isRecord(body)) return { error: jsonError("Request body must be a JSON object.", 400) };

  const title = body.title;
  if (typeof title !== "string" || !title.trim()) {
    return { error: jsonError("Task title is required.", 400) };
  }

  const description = optionalString(body, "description");
  if (description === null) return { error: jsonError("Task description must be a string when provided.", 400) };

  const assignedToMemberId = optionalString(body, "assignedToMemberId");
  if (assignedToMemberId === null) return { error: jsonError("assignedToMemberId must be a string when provided.", 400) };

  const dueDate = optionalString(body, "dueDate");
  if (dueDate === null) return { error: jsonError("dueDate must be a string when provided.", 400) };
  if (dueDate && !isValidDateValue(dueDate)) return { error: jsonError("dueDate must be a valid date string.", 400) };

  const source = optionalString(body, "source");
  if (source === null) return { error: jsonError("source must be a string when provided.", 400) };
  if (source && !taskSources.includes(source as TaskSource)) return { error: jsonError("source is not supported.", 400) };

  const parsedSchedule = parseSchedule(body.schedule);
  if (parsedSchedule.error) return { error: parsedSchedule.error };

  return {
    input: {
      title: title.trim(),
      description: description?.trim() || undefined,
      assignedToMemberId: assignedToMemberId?.trim() || undefined,
      dueDate,
      schedule: parsedSchedule.schedule,
      source: (source as TaskSource | undefined) ?? "manual",
    },
  };
}

function parseUpdateTaskInput(body: unknown): {
  input?: UpdateTaskInstanceInput;
  completed?: boolean;
  error?: NextResponse;
} {
  if (!isRecord(body)) return { error: jsonError("Request body must be a JSON object.", 400) };

  const id = body.id;
  if (typeof id !== "string" || !id.trim()) return { error: jsonError("Task instance id is required.", 400) };

  const titleSnapshot = optionalString(body, "titleSnapshot");
  if (titleSnapshot === null) return { error: jsonError("titleSnapshot must be a string when provided.", 400) };

  const assignedToMemberId = optionalString(body, "assignedToMemberId");
  if (assignedToMemberId === null) return { error: jsonError("assignedToMemberId must be a string when provided.", 400) };

  const dueDate = optionalString(body, "dueDate");
  if (dueDate === null) return { error: jsonError("dueDate must be a string when provided.", 400) };
  if (dueDate && !isValidDateValue(dueDate)) return { error: jsonError("dueDate must be a valid date string.", 400) };

  const completedByMemberId = optionalString(body, "completedByMemberId");
  if (completedByMemberId === null) return { error: jsonError("completedByMemberId must be a string when provided.", 400) };

  const completed = body.completed;
  if (completed !== undefined && typeof completed !== "boolean") {
    return { error: jsonError("completed must be a boolean when provided.", 400) };
  }

  return {
    completed,
    input: {
      id: id.trim(),
      titleSnapshot: titleSnapshot?.trim() || undefined,
      assignedToMemberId: assignedToMemberId?.trim() || undefined,
      dueDate,
      completedByMemberId: completedByMemberId?.trim() || undefined,
    },
  };
}

function handleRouteError(error: unknown) {
  if (error instanceof NotFoundError) return jsonError(error.message, 404);
  console.error(error);
  return jsonError("Unexpected server error.", 500);
}

export async function GET() {
  const tasks = await taskService.listTodayTasks();
  return NextResponse.json({ tasks, persistence: "temporary-in-memory" });
}

export async function POST(request: Request) {
  const { body, error } = await readJsonBody(request);
  if (error) return error;

  const parsed = parseCreateTaskInput(body);
  if (parsed.error) return parsed.error;

  try {
    const tasks = await taskService.createTask(null, parsed.input!);
    return NextResponse.json({ task: tasks[0], tasks }, { status: 201 });
  } catch (routeError) {
    return handleRouteError(routeError);
  }
}

export async function PATCH(request: Request) {
  const { body, error } = await readJsonBody(request);
  if (error) return error;

  const parsed = parseUpdateTaskInput(body);
  if (parsed.error) return parsed.error;

  try {
    const task =
      typeof parsed.completed === "boolean"
        ? await taskService.setTaskCompleted(parsed.input!, parsed.completed, parsed.input!.completedByMemberId)
        : await taskService.updateTask(parsed.input!);

    return NextResponse.json({ task });
  } catch (routeError) {
    return handleRouteError(routeError);
  }
}
