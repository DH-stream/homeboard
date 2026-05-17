import { createBrowserSupabaseClient } from "@/lib/supabase/client";
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
  created_at: string;
  updated_at: string;
};

export type CreateHouseholdInput = {
  name: string;
};

export type CreateHouseholdMemberInput = {
  displayName: string;
  color: string;
  role?: HouseholdMemberRole;
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface HouseholdRepository {
  createHousehold(input: CreateHouseholdInput): Promise<Household>;
  getHousehold(householdId: string | null): Promise<Household | null>;
  listHouseholds(): Promise<Household[]>;
  createHouseholdMembers(householdId: string, members: CreateHouseholdMemberInput[]): Promise<HouseholdMember[]>;
}

export class SupabaseHouseholdRepository implements HouseholdRepository {
  private readonly client = createBrowserSupabaseClient();

  async createHousehold(input: CreateHouseholdInput) {
    if (!this.client) throw new Error("Supabase is not configured.");

    const { data, error } = await this.client.from("households").insert({ name: input.name }).select("id, name, created_at, updated_at").single();

    if (error) throw error;
    return mapHousehold(data as HouseholdRow);
  }

  async getHousehold(householdId: string | null) {
    if (!this.client || !householdId) return null;

    const { data, error } = await this.client.from("households").select("id, name, created_at, updated_at").eq("id", householdId).maybeSingle();

    if (error) throw error;
    return data ? mapHousehold(data as HouseholdRow) : null;
  }

  async listHouseholds() {
    if (!this.client) return [];

    const { data, error } = await this.client.from("households").select("id, name, created_at, updated_at").order("created_at", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as HouseholdRow[]).map(mapHousehold);
  }

  async createHouseholdMembers(householdId: string, members: CreateHouseholdMemberInput[]) {
    if (!this.client) throw new Error("Supabase is not configured.");
    if (!members.length) return [];

    const rows = members.map((member) => ({
      household_id: householdId,
      display_name: member.displayName,
      color: member.color,
      role: member.role ?? "adult",
    }));

    const { data, error } = await this.client
      .from("household_members")
      .insert(rows)
      .select("id, household_id, display_name, color, avatar_url, role, created_at, updated_at");

    if (error) throw error;
    return ((data ?? []) as HouseholdMemberRow[]).map(mapHouseholdMember);
  }
}

export const householdRepository = new SupabaseHouseholdRepository();
