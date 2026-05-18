import type { MemberRepository } from "@/lib/repositories/memberRepository";

export function createMemberService(repository: MemberRepository) {
  return {
    getHousehold: (householdId?: string | null) => repository.getHousehold(householdId),
    listMembers: (householdId?: string | null) => repository.listMembers(householdId),
  };
}
