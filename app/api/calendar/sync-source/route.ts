import { NextResponse } from "next/server";
import { syncCalendarSourceById } from "@/lib/services/calendarSyncService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sourceId = typeof body?.sourceId === "string" ? body.sourceId : "";
    if (!sourceId) return NextResponse.json({ error: "sourceId is required." }, { status: 400 });
    const result = await syncCalendarSourceById(sourceId);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
