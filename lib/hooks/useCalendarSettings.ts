"use client";

import { useCallback, useEffect, useState } from "react";
import { mockCalendarRepository } from "@/lib/repositories/calendarRepository";
import { createCalendarService } from "@/lib/services/calendarService";
import type { CalendarConnection, CalendarSource } from "@/types";

const service = createCalendarService(mockCalendarRepository);

export function useCalendarSettings() {
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [sources, setSources] = useState<CalendarSource[]>([]);
  const [isLoading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [nextConnections, nextSources] = await Promise.all([service.listConnections(), service.listSources()]);
    setConnections(nextConnections);
    setSources(nextSources);
    setLoading(false);
  }, []);

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

  return { connections, sources, isLoading, updateSourceEnabled, refresh };
}
