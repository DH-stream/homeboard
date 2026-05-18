"use client";

import { useEffect, useState } from "react";
import { getMemberRepository } from "@/lib/repositories/memberRepository";
import { useResolvedHouseholdId } from "@/lib/hooks/useResolvedHouseholdId";
import { createMemberService } from "@/lib/services/memberService";
import type { Household, HouseholdMember } from "@/types";

export function useHousehold() {
  const [household, setHousehold] = useState<Household | null>(null);

  useEffect(() => {
    createMemberService(getMemberRepository(null)).getHousehold().then(setHousehold);
  }, []);

  return { household, isLoading: !household };
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
