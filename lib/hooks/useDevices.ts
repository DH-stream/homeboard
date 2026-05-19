"use client";

import { useCallback, useEffect, useState } from "react";
import { deviceRepository } from "@/lib/repositories/deviceRepository";
import { createDeviceService } from "@/lib/services/deviceService";
import type { Device } from "@/types";

const service = createDeviceService(deviceRepository);

export function useDevices(householdId?: string | null) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!householdId) {
      setDevices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const next = await service.listDevices(householdId);
      setDevices(next);
      setError(null);
    } catch {
      setDevices([]);
      setError("load");
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { devices, isLoading, error, setDevices, refresh };
}
