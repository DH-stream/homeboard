import ical from "ical";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const normalizeIcsUrl = (raw: string) => raw.replace(/^webcal:/i, "https:").trim();
const getClient = () => { if (!url || !key) throw new Error("Supabase config missing for server sync."); return createClient(url, key); };

function mapEvents(sourceId: string, householdId: string, sourceColor: string | null, entries: Record<string, any>, from: Date, to: Date) {
  const out: Record<string, any> = {};
  Object.values(entries).forEach((ev: any) => {
    if (!ev || ev.type !== "VEVENT" || !ev.uid || !ev.start || !ev.end) return;
    const starts = ev.rrule?.between ? ev.rrule.between(from, to, true) : [new Date(ev.start)];
    starts.forEach((start: Date) => {
      const end = new Date(start.getTime() + Math.max(new Date(ev.end).getTime() - new Date(ev.start).getTime(), 30 * 60 * 1000));
      const external = `${ev.uid}__${start.toISOString()}`;
      out[external] = { household_id: householdId, source_id: sourceId, external_event_id: external, title: ev.summary || "Untitled", description: ev.description || null, location: ev.location || null, start_at: start.toISOString(), end_at: end.toISOString(), all_day: !!ev.datetype, color: sourceColor, status: (ev.status || "confirmed").toLowerCase(), raw: ev };
    });
  });
  return Object.values(out);
}

export async function syncCalendarSourceById(sourceId: string) {
  const client = getClient();
  const { data: source } = await client.from("calendar_sources").select("id, household_id, color, sync_url, enabled").eq("id", sourceId).single();
  if (!source || !source.enabled) return { sourceId, skipped: true };
  try {
    const res = await fetch(normalizeIcsUrl(source.sync_url));
    if (!res.ok) throw new Error(`http_${res.status}`);
    const text = await res.text();
    const parsed = ical.parseICS(text);
    const from = new Date(); from.setDate(from.getDate() - 7);
    const to = new Date(); to.setDate(to.getDate() + 90);
    const rows = mapEvents(source.id, source.household_id, source.color, parsed, from, to);
    if (rows.length) await client.from("calendar_events").upsert(rows, { onConflict: "source_id,external_event_id" });
    await client.from("calendar_sources").update({ last_synced_at: new Date().toISOString(), last_error: null }).eq("id", sourceId);
    return { sourceId, upserted: rows.length };
  } catch (error) {
    await client.from("calendar_sources").update({ last_error: "Kunde inte synka kalendern" }).eq("id", sourceId);
    return { sourceId, error: error instanceof Error ? error.message : "sync_failed" };
  }
}

export async function syncAllEnabledCalendarSources(householdId: string) {
  const client = getClient();
  const { data } = await client.from("calendar_sources").select("id").eq("household_id", householdId).eq("enabled", true);
  const results = await Promise.all((data ?? []).map((s) => syncCalendarSourceById(s.id)));
  return { householdId, results };
}
