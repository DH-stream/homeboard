import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getDeviceAccessPayload } from "@/lib/devices/deviceAccess";
import { getLocalDateKey } from "@/lib/tasks/streak";
import type { TaskInstance } from "@/types";

const LOCAL_STREAK_DAYS_KEY = "homeboard.householdTaskDayStatus.v1";

type TaskDayStatusRow = {
  id: string;
  household_id: string;
  date: string;
  status: string;
  completed_at: string;
  completed_task_count: number;
  required_task_count: number;
  created_at: string;
  updated_at: string;
};

type LocalStore = Record<string, { date: string; completedAt: string; completedTaskCount: number; requiredTaskCount: number }[]>;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readLocalStore(): LocalStore {
  if (!canUseStorage()) return {};
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_STREAK_DAYS_KEY) ?? "{}") as LocalStore;
  } catch {
    return {};
  }
}

function writeLocalStore(value: LocalStore) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LOCAL_STREAK_DAYS_KEY, JSON.stringify(value));
}

function todayDateKey() {
  return getLocalDateKey(new Date());
}

export function createStreakRepository() {
  const supabase = createBrowserSupabaseClient();
  const canUseSupabase = isSupabaseConfigured() && Boolean(supabase);

  return {
    async listCompletedTaskDays(householdId: string) {
      if (canUseSupabase && supabase) {
        const deviceAccess = getDeviceAccessPayload();
        if (deviceAccess) {
          const { data, error } = await supabase.rpc("device_list_completed_task_days", {
            p_household_id: householdId,
            p_cloud_device_id: deviceAccess.cloudDeviceId,
            p_local_device_id: deviceAccess.localDeviceId,
        p_device_access_token: deviceAccess.accessToken,
          });
          if (error) throw error;
          return (data ?? []) as TaskDayStatusRow[];
        }

        const { data, error } = await supabase
          .from("household_task_day_status")
          .select("id, household_id, date, status, completed_at, completed_task_count, required_task_count, created_at, updated_at")
          .eq("household_id", householdId)
          .eq("status", "completed")
          .order("date", { ascending: false });
        if (error) throw error;
        return (data ?? []) as TaskDayStatusRow[];
      }

      const store = readLocalStore();
      return (store[householdId] ?? []).map((day) => ({
        id: `${householdId}-${day.date}`,
        household_id: householdId,
        date: day.date,
        status: "completed",
        completed_at: day.completedAt,
        completed_task_count: day.completedTaskCount,
        required_task_count: day.requiredTaskCount,
        created_at: day.completedAt,
        updated_at: day.completedAt,
      }));
    },

    async maybeMarkTodayComplete(householdId: string, todayTasks: TaskInstance[]) {
      const requiredTaskCount = todayTasks.length;
      if (requiredTaskCount === 0) return false;

      const completedTaskCount = todayTasks.filter((task) => task.completedAt).length;
      if (completedTaskCount !== requiredTaskCount) return false;

      const date = todayDateKey();
      if (canUseSupabase && supabase) {
        const deviceAccess = getDeviceAccessPayload();
        if (deviceAccess) {
          const { error } = await supabase.rpc("device_upsert_completed_task_day", {
            p_household_id: householdId,
            p_date: date,
            p_completed_task_count: completedTaskCount,
            p_required_task_count: requiredTaskCount,
            p_cloud_device_id: deviceAccess.cloudDeviceId,
            p_local_device_id: deviceAccess.localDeviceId,
        p_device_access_token: deviceAccess.accessToken,
          });
          if (error) throw error;
          return true;
        }

        const { error } = await supabase.from("household_task_day_status").upsert({
          household_id: householdId,
          date,
          status: "completed",
          completed_task_count: completedTaskCount,
          required_task_count: requiredTaskCount,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "household_id,date" });
        if (error) throw error;
        return true;
      }

      const store = readLocalStore();
      const current = store[householdId] ?? [];
      if (current.some((day) => day.date === date)) return true;
      store[householdId] = [...current, { date, completedAt: new Date().toISOString(), completedTaskCount, requiredTaskCount }].sort((a, b) => b.date.localeCompare(a.date));
      writeLocalStore(store);
      return true;
    },
  };
}
