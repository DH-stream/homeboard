"use client";

import { useCallback, useEffect, useState } from "react";
import { householdRepository } from "@/lib/repositories/householdRepository";
import { createHouseholdService } from "@/lib/services/householdService";
import { useResolvedHouseholdId } from "@/lib/hooks/useResolvedHouseholdId";
import type { Household } from "@/types";

const service = createHouseholdService(householdRepository);

export function useActiveHousehold() {
  const { householdId, isDevOverride, selectedHouseholdId, refresh: refreshHouseholdId } = useResolvedHouseholdId();
  const [household, setHousehold] = useState<Household | null>(null);
  const [isLoading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setHousehold(await service.getHousehold(householdId));
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { household, householdId, isDevOverride, isLoading, refresh, refreshHouseholdId, selectedHouseholdId };
}
