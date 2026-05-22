"use client";

import { useCallback, useEffect, useState } from "react";
import { getHouseholdIdOverride, getLocalSelectedHouseholdId, resolveCurrentHouseholdId, SELECTED_HOUSEHOLD_CHANGED_EVENT } from "@/lib/households/selection";

export function useResolvedHouseholdId() {
  const overrideHouseholdId = getHouseholdIdOverride();
  const [householdId, setHouseholdId] = useState<string | null>(() => overrideHouseholdId ?? null);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(() => overrideHouseholdId ?? null);
  const [hasResolvedHouseholdId, setHasResolvedHouseholdId] = useState(Boolean(overrideHouseholdId));

  const refresh = useCallback(() => {
    const nextHouseholdId = resolveCurrentHouseholdId();
    const nextSelectedHouseholdId = overrideHouseholdId ?? getLocalSelectedHouseholdId();
    setHouseholdId(nextHouseholdId);
    setSelectedHouseholdId(nextSelectedHouseholdId);
    setHasResolvedHouseholdId(true);
  }, [overrideHouseholdId]);

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(SELECTED_HOUSEHOLD_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(SELECTED_HOUSEHOLD_CHANGED_EVENT, refresh);
    };
  }, [refresh]);

  return {
    householdId,
    hasResolvedHouseholdId,
    isDevOverride: Boolean(overrideHouseholdId),
    selectedHouseholdId,
    refresh,
  };
}
