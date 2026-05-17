"use client";

import { useCallback, useEffect, useState } from "react";
import { getHouseholdIdOverride, getLocalSelectedHouseholdId, resolveCurrentHouseholdId, SELECTED_HOUSEHOLD_CHANGED_EVENT } from "@/lib/households/selection";

export function useResolvedHouseholdId() {
  const [householdId, setHouseholdId] = useState<string | null>(() => resolveCurrentHouseholdId());

  const refresh = useCallback(() => {
    setHouseholdId(resolveCurrentHouseholdId());
  }, []);

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
    isDevOverride: Boolean(getHouseholdIdOverride()),
    selectedHouseholdId: getLocalSelectedHouseholdId(),
    refresh,
  };
}
