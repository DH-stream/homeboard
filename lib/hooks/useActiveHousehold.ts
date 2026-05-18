"use client";

import { useCallback, useEffect, useState } from "react";
import { mockHousehold } from "@/data/mockHousehold";
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
    try {
      setHousehold(await service.getHousehold(householdId));
    } catch (error) {
      console.warn("HomeBoard household settings could not be loaded from cloud; using device data.", error);
      setHousehold(mockHousehold);
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { household, householdId, isDevOverride, isLoading, refresh, refreshHouseholdId, selectedHouseholdId };
}
