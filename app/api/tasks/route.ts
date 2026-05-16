import { NextResponse } from "next/server";
import { serverTaskRepository } from "@/lib/repositories/taskRepository";
import { createTaskService } from "@/lib/services/taskService";
import type { CreateTaskInput, UpdateTaskInstanceInput } from "@/types";

const taskService = createTaskService(serverTaskRepository);

export async function GET() {
  const tasks = await taskService.listTodayTasks();
  return NextResponse.json({ tasks, persistence: "temporary-in-memory" });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateTaskInput;
  const task = await taskService.createTask({ ...body, source: body.source ?? "manual" });
  return NextResponse.json({ task }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as UpdateTaskInstanceInput & { completed?: boolean };

  if (typeof body.completed === "boolean") {
    const task = await taskService.setTaskCompleted(body.id, body.completed, body.completedByMemberId);
    return NextResponse.json({ task });
  }

  const task = await taskService.updateTask(body);
  return NextResponse.json({ task });
}
