"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { calendarRepository } from "@/lib/repositories/calendarRepository";
import { createCalendarService } from "@/lib/services/calendarService";
import { useResolvedHouseholdId } from "@/lib/hooks/useResolvedHouseholdId";
import { isCloudConfigured } from "@/lib/cloud/config";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getParentAccessToken } from "@/lib/auth/parentAuth";
import type { CalendarConnection, CalendarSource } from "@/types";

const service = createCalendarService(calendarRepository);
export type CalendarSetupState = "missing_cloud_config" | "missing_household" | "ready";
type CalendarError = "calendarAdultLoginRequired" | "calendarSavedNeedsAdultSync" | "calendarSaveFailed" | "calendarInvalidUrl" | null;

function isSupportedCalendarUrl(value: string) {
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith("https://") || trimmed.startsWith("http://") || trimmed.startsWith("webcal://");
}

export function useCalendarSettings() {
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [sources, setSources] = useState<CalendarSource[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isSyncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<CalendarError>(null);
  const { householdId } = useResolvedHouseholdId();
  const setupState = useMemo<CalendarSetupState>(() => (!isCloudConfigured() ? "missing_cloud_config" : !householdId ? "missing_household" : "ready"), [householdId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (setupState !== "ready") {
      setConnections([]);
      setSources([]);
      setLoading(false);
      return;
    }
    const [nextConnections, nextSources] = await Promise.all([service.listConnections(householdId), service.listSources(householdId)]);
    setConnections(nextConnections);
    setSources(nextSources);
    setLoading(false);
  }, [householdId, setupState]);

  useEffect(() => { refresh(); }, [refresh]);

  const updateSourceEnabled = useCallback(async (sourceId: string, enabled: boolean) => {
    const updated = await service.updateSourceEnabled(sourceId, enabled);
    await refresh();
    return updated;
  }, [refresh]);

  const addIcsSource = useCallback(async (name: string, syncUrl: string, color: string, enabled: boolean) => {
    const trimmedName = name.trim();
    const trimmedUrl = syncUrl.trim();
    if (!trimmedName || !trimmedUrl) throw new Error("missing_calendar_fields");
    if (!isSupportedCalendarUrl(trimmedUrl)) throw new Error("invalid_calendar_url");

    const client = createBrowserSupabaseClient();
    if (!client || !householdId) throw new Error("missing_client");
    let connectionId = connections.find((connection) => connection.provider === "ics")?.id;
    if (!connectionId) {
      const { data: connection, error: connectionError } = await client
        .from("calendar_connections")
        .insert({ household_id: householdId, provider: "ics", account_label: "Calendar link", status: "connected" })
        .select("id")
        .single();
      if (connectionError) throw connectionError;
      connectionId = connection?.id;
    }
    if (!connectionId) throw new Error("missing_calendar_connection");

    const { data: source, error: sourceError } = await client
      .from("calendar_sources")
      .insert({ household_id: householdId, connection_id: connectionId, provider_calendar_id: `ics:${Date.now()}`, name: trimmedName, color, enabled, sync_url: trimmedUrl })
      .select("id")
      .single();
    if (sourceError) throw sourceError;
    await refresh();
    return source?.id as string | undefined;
  }, [connections, householdId, refresh]);

  const syncSource = useCallback(async (sourceId: string) => {
    const token = await getParentAccessToken();
    if (!token) {
      setSyncError("calendarAdultLoginRequired");
      return false;
    }
    setSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch("/api/calendar/sync-source", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ sourceId }) });
      if (!response.ok) throw new Error("calendar_sync_failed");
      await refresh();
      return true;
    } catch (error) {
      console.warn("HomeBoard calendar source could not be synced.", error);
      setSyncError("calendarSaveFailed");
      return false;
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  const syncAll = useCallback(async () => {
    if (!householdId) return false;
    const token = await getParentAccessToken();
    if (!token) {
      setSyncError("calendarAdultLoginRequired");
      return false;
    }
    setSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch("/api/calendar/sync-all", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ householdId }) });
      if (!response.ok) throw new Error("calendar_sync_failed");
      await refresh();
      return true;
    } catch (error) {
      console.warn("HomeBoard calendars could not be synced.", error);
      setSyncError("calendarSaveFailed");
      return false;
    } finally {
      setSyncing(false);
    }
  }, [householdId, refresh]);

  const addSourceAndSync = useCallback(async (name: string, syncUrl: string, color: string, enabled: boolean) => {
    setSyncing(true);
    setSyncError(null);
    try {
      const token = await getParentAccessToken();
      const newSourceId = await addIcsSource(name, syncUrl, color, enabled);
      if (!token) {
        setSyncError("calendarSavedNeedsAdultSync");
        return true;
      }
      if (!newSourceId) return true;
      const response = await fetch("/api/calendar/sync-source", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ sourceId: newSourceId }) });
      if (!response.ok) throw new Error("calendar_sync_failed");
      await refresh();
      return true;
    } catch (error) {
      console.warn("HomeBoard calendar source could not be saved.", error);
      setSyncError(error instanceof Error && error.message === "invalid_calendar_url" ? "calendarInvalidUrl" : "calendarSaveFailed");
      return false;
    } finally {
      setSyncing(false);
    }
  }, [addIcsSource, refresh]);

  return { connections, sources, householdId, isLoading, isSyncing, syncError, setupState, updateSourceEnabled, refresh, addIcsSource, addSourceAndSync, syncSource, syncAll };
}