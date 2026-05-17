import { createBrowserSupabaseClient } from "@/lib/supabase/client";
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
  updateSourceEnabled(sourceId: string, enabled: boolean): Promise<CalendarSource>;
  listEnabledEvents(householdId: string | null): Promise<CalendarEvent[]>;
}

export class SupabaseCalendarRepository implements CalendarRepository {
  private readonly client = createBrowserSupabaseClient();

  async listConnections(householdId: string | null) {
    if (!this.client || !householdId) return [];

    const { data, error } = await this.client
      .from("calendar_connections")
      .select("id, household_id, connected_by_member_id, provider, account_label, account_email, status, last_synced_at, created_at, updated_at")
      .eq("household_id", householdId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as CalendarConnectionRow[]).map(mapConnection);
  }

  async listSources(householdId: string | null) {
    if (!this.client || !householdId) return [];

    const { data, error } = await this.client
      .from("calendar_sources")
      .select("id, household_id, connection_id, provider_calendar_id, name, color, enabled, visibility, sync_mode, created_at, updated_at")
      .eq("household_id", householdId)
      .order("name", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as CalendarSourceRow[]).map(mapSource);
  }

  async updateSourceEnabled(sourceId: string, enabled: boolean) {
    if (!this.client) throw new Error("Supabase is not configured.");

    const { data, error } = await this.client
      .from("calendar_sources")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("id", sourceId)
      .select("id, household_id, connection_id, provider_calendar_id, name, color, enabled, visibility, sync_mode, created_at, updated_at")
      .single();

    if (error) throw error;
    return mapSource(data as CalendarSourceRow);
  }

  async listEnabledEvents(householdId: string | null) {
    if (!this.client || !householdId) return [];

    const sources = await this.listSources(householdId);
    const enabledSourceIds = sources.filter((source) => source.enabled).map((source) => source.id);
    if (!enabledSourceIds.length) return [];

    const { data, error } = await this.client
      .from("calendar_events")
      .select("id, household_id, source_id, external_event_id, title, description, location, start_at, end_at, all_day, color")
      .eq("household_id", householdId)
      .in("source_id", enabledSourceIds)
      .order("start_at", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as CalendarEventRow[]).map(mapEvent);
  }
}

export const calendarRepository = new SupabaseCalendarRepository();
