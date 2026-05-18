import { NextResponse } from "next/server";
import { syncStaleEnabledCalendarSources } from "@/lib/services/calendarSyncService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const householdId = typeof body?.householdId === "string" ? body.householdId : "";
    if (!householdId) return NextResponse.json({ error: "householdId is required." }, { status: 400 });
    const result = await syncStaleEnabledCalendarSources(householdId);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
