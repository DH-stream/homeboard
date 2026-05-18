import { NextResponse } from "next/server";
import { syncAllEnabledCalendarSources } from "@/lib/services/calendarSyncService";
import { verifyHouseholdAccess } from "@/lib/services/calendarRouteGuard";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const householdId = typeof body?.householdId === "string" ? body.householdId : "";
    if (!householdId) return NextResponse.json({ error: "householdId is required." }, { status: 400 });
    const hasAccess = await verifyHouseholdAccess(request, householdId);
    if (!hasAccess) return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    const result = await syncAllEnabledCalendarSources(householdId);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
