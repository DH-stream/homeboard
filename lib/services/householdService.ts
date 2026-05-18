import type { CreateHouseholdInput, CreateHouseholdMemberInput, HouseholdRepository, UpdateHouseholdMemberInput } from "@/lib/repositories/householdRepository";

export function createHouseholdService(repository: HouseholdRepository) {
  return {
    createHousehold(input: CreateHouseholdInput) {
      return repository.createHousehold(input);
    },
    getHousehold(householdId: string | null) {
      return repository.getHousehold(householdId);
    },
    listHouseholds() {
      return repository.listHouseholds();
    },
    createHouseholdMembers(householdId: string, members: CreateHouseholdMemberInput[]) {
      return repository.createHouseholdMembers(householdId, members);
    },
    listHouseholdMembers(householdId: string) {
      return repository.listHouseholdMembers(householdId);
    },
    updateHouseholdMember(memberId: string, patch: UpdateHouseholdMemberInput) {
      return repository.updateHouseholdMember(memberId, patch);
    },
  };
}
