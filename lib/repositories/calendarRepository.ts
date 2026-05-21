import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getDeviceAccessPayload } from "@/lib/devices/deviceAccess";
import type { CalendarConnection, CalendarEvent, CalendarSource } from "@/types";

type CalendarConnectionRow = {
  id: string;
  household_id: string;
  connected_by_member_id: string | null;
  provider: CalendarConnection["provider"];
  account_label: string;
  account_email: string | null;
  status: CalendarConnection["status"];
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

type CalendarSourceRow = {
  id: string;
  household_id: string;
  connection_id: string;
  provider_calendar_id: string;
  name: string;
  color: string | null;
  enabled: boolean;
  visibility: CalendarSource["visibility"];
  sync_mode: CalendarSource["syncMode"];
  sync_url: string | null;
  last_synced_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

type CalendarEventRow = {
  id: string;
  household_id: string;
  source_id: string;
  external_event_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  color: string | null;
};

function mapConnection(row: CalendarConnectionRow): CalendarConnection {
  return {
    id: row.id,
    householdId: row.household_id,
    connectedByMemberId: row.connected_by_member_id ?? undefined,
    provider: row.provider,
    accountLabel: row.account_label,
    accountEmail: row.account_email ?? undefined,
    status: row.status,
    lastSyncedAt: row.last_synced_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSource(row: CalendarSourceRow): CalendarSource {
  return {
    id: row.id,
    householdId: row.household_id,
    connectionId: row.connection_id,
    providerCalendarId: row.provider_calendar_id,
    name: row.name,
    color: row.color ?? undefined,
    enabled: row.enabled,
    visibility: row.visibility,
    syncMode: row.sync_mode,
    syncUrl: row.sync_url ?? undefined,
    lastSyncedAt: row.last_synced_at ?? undefined,
    lastError: row.last_error ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    householdId: row.household_id,
    sourceId: row.source_id,
    title: row.title,
    description: row.description ?? undefined,
    location: row.location ?? undefined,
    startAt: row.start_at,
    endAt: row.end_at,
    allDay: row.all_day,
    color: row.color ?? undefined,
    externalId: row.external_event_id,
  };
}

export interface CalendarRepository {
  listConnections(householdId: string | null): Promise<CalendarConnection[]>;
  listSources(householdId: string | null): Promise<CalendarSource[]>;
  createIcsSource(householdId: string, name: string, syncUrl: string, color: string, enabled: boolean): Promise<CalendarSource>;
  updateSourceEnabled(sourceId: string, enabled: boolean): Promise<CalendarSource>;
  removeSource(sourceId: string): Promise<void>;
  listEnabledEvents(householdId: string | null): Promise<CalendarEvent[]>;
}

export class SupabaseCalendarRepository implements CalendarRepository {
  private readonly client = createBrowserSupabaseClient();

  async listConnections(householdId: string | null) {
    if (!this.client || !householdId) return [];

    const { data, error } = await this.client.rpc("calendar_list_connections", { p_household_id: householdId });

    if (error) throw error;
    return ((data ?? []) as CalendarConnectionRow[]).map(mapConnection);
  }

  async listSources(householdId: string | null) {
    if (!this.client || !householdId) return [];

    const { data, error } = await this.client.rpc("calendar_list_sources", { p_household_id: householdId });

    if (error) throw error;
    return ((data ?? []) as CalendarSourceRow[]).map(mapSource);
  }


  async createIcsSource(householdId: string, name: string, syncUrl: string, color: string, enabled: boolean) {
    if (!this.client) throw new Error("Supabase is not configured.");

    const { data, error } = await this.client.rpc("calendar_create_ics_source", {
      p_household_id: householdId,
      p_name: name,
      p_sync_url: syncUrl,
      p_color: color,
      p_enabled: enabled,
    });

    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("calendar_create_failed");
    return mapSource(row as CalendarSourceRow);
  }

  async updateSourceEnabled(sourceId: string, enabled: boolean) {
    if (!this.client) throw new Error("Supabase is not configured.");

    const { data, error } = await this.client.rpc("calendar_update_source_enabled", { p_source_id: sourceId, p_enabled: enabled });

    if (error) throw error;
    return mapSource(data as CalendarSourceRow);
  }


  async removeSource(sourceId: string) {
    if (!this.client) throw new Error("Supabase is not configured.");

    const { error } = await this.client.rpc("calendar_remove_source", { p_source_id: sourceId });
    if (error) throw error;
  }

  async listEnabledEvents(householdId: string | null) {
    if (!this.client || !householdId) return [];

    const deviceAccess = getDeviceAccessPayload();
    if (deviceAccess) {
      const { data, error } = await this.client.rpc("calendar_device_list_enabled_events", {
        p_household_id: householdId,
        p_cloud_device_id: deviceAccess.cloudDeviceId,
        p_local_device_id: deviceAccess.localDeviceId,
        p_device_access_token: deviceAccess.accessToken,
      });
      if (error) throw error;
      return ((data ?? []) as CalendarEventRow[]).map(mapEvent);
    }

    const { data: authData } = await this.client.auth.getSession();
    if (!authData.session) return [];

    const { data, error } = await this.client.rpc("calendar_adult_list_enabled_events", { p_household_id: householdId });
    if (error) throw error;
    return ((data ?? []) as CalendarEventRow[]).map(mapEvent);
  }

}

export const calendarRepository = new SupabaseCalendarRepository();
