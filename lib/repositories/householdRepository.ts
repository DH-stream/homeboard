import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getDeviceAccessPayload } from "@/lib/devices/deviceAccess";
import { clearPersistedCloudDeviceId, clearPersistedDeviceAccessToken } from "@/lib/devices/deviceIdentity";
import { forgetSelectedCloudHouseholdOnThisDevice } from "@/lib/households/selection";
import type { Household, HouseholdMember, HouseholdMemberRole } from "@/types";

type HouseholdRow = {
  id: string;
  name: string;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
};

type HouseholdMemberRow = {
  id: string;
  household_id: string;
  user_id: string | null;
  display_name: string;
  color: string;
  avatar_url: string | null;
  role: HouseholdMemberRole;
  created_at: string;
  updated_at: string;
};

export type CreateHouseholdInput = {
  name: string;
  ownerUserId?: string;
};

export type CreateHouseholdMemberInput = {
  displayName: string;
  color: string;
  role?: HouseholdMemberRole;
  userId?: string;
};


export type UpdateHouseholdMemberInput = {
  displayName?: string;
  color?: string;
  role?: HouseholdMemberRole;
};

function mapHousehold(row: HouseholdRow): Household {
  return {
    id: row.id,
    name: row.name,
    ownerUserId: row.owner_user_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapHouseholdMember(row: HouseholdMemberRow): HouseholdMember {
  return {
    id: row.id,
    householdId: row.household_id,
    userId: row.user_id ?? undefined,
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
  listHouseholdMembers(householdId: string): Promise<HouseholdMember[]>;
  updateHouseholdMember(memberId: string, patch: UpdateHouseholdMemberInput): Promise<HouseholdMember>;
}

export class SupabaseHouseholdRepository implements HouseholdRepository {
  private readonly client = createBrowserSupabaseClient();

  private clearRevokedDeviceState() {
    clearPersistedCloudDeviceId();
    clearPersistedDeviceAccessToken();
    forgetSelectedCloudHouseholdOnThisDevice();
  }

  async createHousehold(input: CreateHouseholdInput) {
    if (!this.client) throw new Error("Supabase is not configured.");

    const row = {
      name: input.name,
      owner_user_id: input.ownerUserId ?? null,
    };

    const { data, error } = await this.client.from("households").insert(row).select("id, name, owner_user_id, created_at, updated_at").single();

    if (error) throw error;
    return mapHousehold(data as HouseholdRow);
  }

  async getHousehold(householdId: string | null) {
    if (!this.client || !householdId) return null;

    const deviceAccess = getDeviceAccessPayload();
    if (deviceAccess) {
      const { data, error } = await this.client.rpc("device_get_household_summary", {
        p_household_id: householdId,
        p_cloud_device_id: deviceAccess.cloudDeviceId,
        p_local_device_id: deviceAccess.localDeviceId,
        p_device_access_token: deviceAccess.accessToken,
      });
      if (error) {
        if (String(error.message ?? "").includes("device is not linked to household")) {
          this.clearRevokedDeviceState();
          return null;
        }
        throw error;
      }

      const row = Array.isArray(data) ? data[0] : null;
      if (row) {
        return mapHousehold({
          id: row.id,
          name: row.name,
          owner_user_id: null,
          created_at: row.created_at,
          updated_at: row.updated_at,
        });
      }
      this.clearRevokedDeviceState();
      return null;
    }

    const { data, error } = await this.client.from("households").select("id, name, owner_user_id, created_at, updated_at").eq("id", householdId).maybeSingle();

    if (error) throw error;
    return data ? mapHousehold(data as HouseholdRow) : null;
  }

  async listHouseholds() {
    if (!this.client) return [];

    const { data, error } = await this.client.from("households").select("id, name, owner_user_id, created_at, updated_at").order("created_at", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as HouseholdRow[]).map(mapHousehold);
  }

  async createHouseholdMembers(householdId: string, members: CreateHouseholdMemberInput[]) {
    if (!this.client) throw new Error("Supabase is not configured.");
    if (!members.length) return [];

    const rows = members.map((member) => ({
      household_id: householdId,
      user_id: member.userId ?? null,
      display_name: member.displayName,
      color: member.color,
      role: member.role ?? "adult",
    }));

    const { data, error } = await this.client
      .from("household_members")
      .insert(rows)
      .select("id, household_id, user_id, display_name, color, avatar_url, role, created_at, updated_at");

    if (error) throw error;
    return ((data ?? []) as HouseholdMemberRow[]).map(mapHouseholdMember);
  }

  async listHouseholdMembers(householdId: string) {
    if (!this.client || !householdId) return [];

    const { data, error } = await this.client
      .from("household_members")
      .select("id, household_id, user_id, display_name, color, avatar_url, role, created_at, updated_at")
      .eq("household_id", householdId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as HouseholdMemberRow[]).map(mapHouseholdMember);
  }
  async updateHouseholdMember(memberId: string, patch: UpdateHouseholdMemberInput) {
    if (!this.client) throw new Error("Supabase is not configured.");

    const row: Record<string, string> = {};
    if (typeof patch.displayName === "string") row.display_name = patch.displayName;
    if (typeof patch.color === "string") row.color = patch.color;
    if (typeof patch.role === "string") row.role = patch.role;

    const { data, error } = await this.client
      .from("household_members")
      .update(row)
      .eq("id", memberId)
      .select("id, household_id, user_id, display_name, color, avatar_url, role, created_at, updated_at")
      .single();

    if (error) throw error;
    return mapHouseholdMember(data as HouseholdMemberRow);
  }

}

export const householdRepository = new SupabaseHouseholdRepository();
