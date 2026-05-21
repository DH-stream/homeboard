"use client";

import { useEffect, useState } from "react";
import { getMemberRepository } from "@/lib/repositories/memberRepository";
import { useResolvedHouseholdId } from "@/lib/hooks/useResolvedHouseholdId";
import { createMemberService } from "@/lib/services/memberService";
import type { Household, HouseholdMember } from "@/types";

export function useHousehold(providedHouseholdId?: string | null) {
  const { householdId: resolvedHouseholdId } = useResolvedHouseholdId();
  const householdId = providedHouseholdId ?? resolvedHouseholdId;
  const [household, setHousehold] = useState<Household | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const service = createMemberService(getMemberRepository(householdId));
    setLoading(true);
    service
      .getHousehold(householdId)
      .then(setHousehold)
      .catch((error) => {
        console.warn("HomeBoard household could not be loaded from cloud; using device data.", error);
        return createMemberService(getMemberRepository(null)).getHousehold(null).then(setHousehold);
      })
      .finally(() => setLoading(false));
  }, [householdId]);

  return { household, isLoading };
}

export function useMembers() {
  const { householdId } = useResolvedHouseholdId();
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const service = createMemberService(getMemberRepository(householdId));
    setLoading(true);
    service
      .listMembers(householdId)
      .then(setMembers)
      .catch((error) => {
        console.warn("HomeBoard members could not be loaded from cloud; using device data.", error);
        return createMemberService(getMemberRepository(null)).listMembers(null).then(setMembers);
      })
      .finally(() => setLoading(false));
  }, [householdId]);

  return { members, isLoading };
}
