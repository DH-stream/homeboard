"use client";

import { useEffect, useState } from "react";
import { mockMemberRepository } from "@/lib/repositories/memberRepository";
import { createMemberService } from "@/lib/services/memberService";
import type { Household, HouseholdMember } from "@/types";

const service = createMemberService(mockMemberRepository);

export function useHousehold() {
  const [household, setHousehold] = useState<Household | null>(null);

  useEffect(() => {
    service.getHousehold().then(setHousehold);
  }, []);

  return { household, isLoading: !household };
}

export function useMembers() {
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    service.listMembers().then((next) => {
      setMembers(next);
      setLoading(false);
    });
  }, []);

  return { members, isLoading };
}
