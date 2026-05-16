import { mockHousehold } from "@/data/mockHousehold";
import { mockMembers } from "@/data/mockMembers";
import type { Household, HouseholdMember } from "@/types";

export interface MemberRepository {
  getHousehold(): Promise<Household>;
  listMembers(): Promise<HouseholdMember[]>;
}

export const mockMemberRepository: MemberRepository = {
  async getHousehold() {
    return mockHousehold;
  },
  async listMembers() {
    return mockMembers;
  },
};
