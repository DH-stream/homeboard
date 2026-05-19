import { mockHousehold } from "@/data/mockHousehold";
import { mockMembers } from "@/data/mockMembers";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Household, HouseholdMember, HouseholdMemberRole } from "@/types";

type HouseholdRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type HouseholdMemberRow = {
  id: string;
  household_id: string;
  display_name: string;
  color: string;
  avatar_url: string | null;
  role: HouseholdMemberRole;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapHousehold(row: HouseholdRow): Household {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapHouseholdMember(row: HouseholdMemberRow): HouseholdMember {
  return {
    id: row.id,
    householdId: row.household_id,
    displayName: row.display_name,
    color: row.color,
    avatarUrl: row.avatar_url ?? undefined,
    role: row.role,
    userId: row.user_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface MemberRepository {
  getHousehold(householdId?: string | null): Promise<Household | null>;
  listMembers(householdId?: string | null): Promise<HouseholdMember[]>;
}

export const mockMemberRepository: MemberRepository = {
  async getHousehold() {
    return mockHousehold;
  },
  async listMembers() {
    return mockMembers;
  },
};

export class SupabaseMemberRepository implements MemberRepository {
  private readonly client = createBrowserSupabaseClient();

  async getHousehold(householdId?: string | null) {
    if (!this.client || !householdId) return null;

    const { data, error } = await this.client.from("households").select("id, name, created_at, updated_at").eq("id", householdId).maybeSingle();

    if (error) throw error;
    return data ? mapHousehold(data as HouseholdRow) : null;
  }

  async listMembers(householdId?: string | null) {
    if (!this.client || !householdId) return [];

    const { data, error } = await this.client
      .from("household_members")
      .select("id, household_id, display_name, color, avatar_url, role, user_id, created_at, updated_at")
      .eq("household_id", householdId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as HouseholdMemberRow[]).map(mapHouseholdMember);
  }
}

export const supabaseMemberRepository = new SupabaseMemberRepository();

export function getMemberRepository(householdId?: string | null) {
  if (isSupabaseConfigured() && householdId) return supabaseMemberRepository;
  return mockMemberRepository;
}
