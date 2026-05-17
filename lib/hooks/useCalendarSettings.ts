"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { calendarRepository } from "@/lib/repositories/calendarRepository";
import { createCalendarService } from "@/lib/services/calendarService";
import { getConfiguredHouseholdId, isSupabaseConfigured } from "@/lib/supabase/client";
import type { CalendarConnection, CalendarSource } from "@/types";

const service = createCalendarService(calendarRepository);

export type CalendarSetupState = "missing_supabase_env" | "missing_household" | "ready";

export function useCalendarSettings() {
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [sources, setSources] = useState<CalendarSource[]>([]);
  const [isLoading, setLoading] = useState(true);
  const householdId = getConfiguredHouseholdId();

  const setupState = useMemo<CalendarSetupState>(() => {
    if (!isSupabaseConfigured()) return "missing_supabase_env";
    if (!householdId) return "missing_household";
    return "ready";
  }, [householdId]);

  const refresh = useCallback(async () => {
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

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateSourceEnabled = useCallback(
    async (sourceId: string, enabled: boolean) => {
      const updated = await service.updateSourceEnabled(sourceId, enabled);
      await refresh();
      return updated;
    },
    [refresh],
  );

  return { connections, sources, isLoading, setupState, updateSourceEnabled, refresh };
}
