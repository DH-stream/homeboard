"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { calendarRepository } from "@/lib/repositories/calendarRepository";
import { createCalendarService } from "@/lib/services/calendarService";
import { useResolvedHouseholdId } from "@/lib/hooks/useResolvedHouseholdId";
import { isCloudConfigured } from "@/lib/cloud/config";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { CalendarConnection, CalendarSource } from "@/types";

const service = createCalendarService(calendarRepository);
export type CalendarSetupState = "missing_cloud_config" | "missing_household" | "ready";

export function useCalendarSettings() {
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [sources, setSources] = useState<CalendarSource[]>([]);
  const [isLoading, setLoading] = useState(true);
  const { householdId } = useResolvedHouseholdId();
  const setupState = useMemo<CalendarSetupState>(() => (!isCloudConfigured() ? "missing_cloud_config" : !householdId ? "missing_household" : "ready"), [householdId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (setupState !== "ready") return void (setConnections([]), setSources([]), setLoading(false));
    const [nextConnections, nextSources] = await Promise.all([service.listConnections(householdId), service.listSources(householdId)]);
    setConnections(nextConnections); setSources(nextSources); setLoading(false);
  }, [householdId, setupState]);
  useEffect(() => { refresh(); }, [refresh]);

  const updateSourceEnabled = useCallback(async (sourceId: string, enabled: boolean) => { const updated = await service.updateSourceEnabled(sourceId, enabled); await refresh(); return updated; }, [refresh]);

  const addIcsSource = useCallback(async (name: string, syncUrl: string, color: string, enabled: boolean) => {
    const client = createBrowserSupabaseClient();
    if (!client || !householdId) throw new Error("missing_client");
    let connectionId = connections.find((c) => c.provider === "ics")?.id;
    if (!connectionId) {
      const { data: conn } = await client.from("calendar_connections").insert({ household_id: householdId, provider: "ics", account_label: "ICS", status: "connected" }).select("id").single();
      connectionId = conn?.id;
    }
    await client.from("calendar_sources").insert({ household_id: householdId, connection_id: connectionId, provider_calendar_id: `ics:${Date.now()}`, name, color, enabled, sync_url: syncUrl });
    await refresh();
  }, [connections, householdId, refresh]);

  const syncSource = useCallback(async (sourceId: string) => { await fetch("/api/calendar/sync-source", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceId }) }); await refresh(); }, [refresh]);
  const syncAll = useCallback(async () => { if (!householdId) return; await fetch("/api/calendar/sync-all", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ householdId }) }); await refresh(); }, [householdId, refresh]);

  return { connections, sources, householdId, isLoading, setupState, updateSourceEnabled, refresh, addIcsSource, syncSource, syncAll };
}
