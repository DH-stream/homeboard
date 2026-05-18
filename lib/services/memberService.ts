import type { MemberRepository } from "@/lib/repositories/memberRepository";

export function createMemberService(repository: MemberRepository) {
  return {
    getHousehold: () => repository.getHousehold(),
    listMembers: (householdId?: string | null) => repository.listMembers(householdId),
  };
}
