import { isCloudConfigured } from "@/lib/cloud/config";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type CloudDiagnosticsStatus = "not_configured" | "active" | "unreachable";

export type CloudDiagnostics = {
  status: CloudDiagnosticsStatus;
  checkedAt: string;
  isProjectConfigured: boolean;
  householdId: string | null;
  householdName: string | null;
  memberCount: number | null;
  taskCount: number | null;
  calendarEventCount: number | null;
  repositoryMode: "cloud" | "local";
};

export interface CloudDiagnosticsRepository {
  getDiagnostics(householdId: string | null): Promise<CloudDiagnostics>;
}

async function countRows(client: NonNullable<ReturnType<typeof createBrowserSupabaseClient>>, table: string, householdId: string) {
  const { count, error } = await client.from(table).select("id", { count: "exact", head: true }).eq("household_id", householdId);
  if (error) throw error;
  return count ?? 0;
}

export class SupabaseCloudDiagnosticsRepository implements CloudDiagnosticsRepository {
  private readonly client = createBrowserSupabaseClient();

  async getDiagnostics(householdId: string | null): Promise<CloudDiagnostics> {
    const checkedAt = new Date().toISOString();
    const base = {
      checkedAt,
      isProjectConfigured: isCloudConfigured(),
      householdId,
      householdName: null,
      memberCount: null,
      taskCount: null,
      calendarEventCount: null,
      repositoryMode: isCloudConfigured() && householdId ? ("cloud" as const) : ("local" as const),
    };

    if (!this.client || !householdId) {
      return { ...base, status: "not_configured" };
    }

    try {
      const { data: household, error: householdError } = await this.client
        .from("households")
        .select("name")
        .eq("id", householdId)
        .maybeSingle();

      if (householdError) throw householdError;

      const [memberCount, taskCount, calendarEventCount] = await Promise.all([
        countRows(this.client, "household_members", householdId),
        countRows(this.client, "tasks", householdId),
        countRows(this.client, "calendar_events", householdId),
      ]);

      return {
        ...base,
        status: "active",
        householdName: typeof household?.name === "string" ? household.name : null,
        memberCount,
        taskCount,
        calendarEventCount,
      };
    } catch (error) {
      console.warn("HomeBoard cloud diagnostics could not reach the configured backend.", error);
      return { ...base, status: "unreachable" };
    }
  }
}

export const cloudDiagnosticsRepository = new SupabaseCloudDiagnosticsRepository();
