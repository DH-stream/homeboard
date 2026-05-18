"use client";

import { useCallback, useEffect, useState } from "react";
import { cloudDiagnosticsRepository, type CloudDiagnostics } from "@/lib/repositories/cloudDiagnosticsRepository";
import { useResolvedHouseholdId } from "@/lib/hooks/useResolvedHouseholdId";

export function useCloudDiagnostics() {
  const { householdId } = useResolvedHouseholdId();
  const [diagnostics, setDiagnostics] = useState<CloudDiagnostics | null>(null);
  const [isLoading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setDiagnostics(await cloudDiagnosticsRepository.getDiagnostics(householdId));
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { diagnostics, isLoading, refresh };
}
