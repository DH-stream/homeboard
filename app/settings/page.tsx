import { AppShell } from "@/components/layout/AppShell";
import { SettingsCard } from "@/components/settings/SettingsCard";

export default function SettingsPage() {
  return (
    <AppShell eyebrow="Setup" title="Settings">
      <div className="grid gap-4 md:grid-cols-2">
        <SettingsCard status="Mock" title="Household">
          <p>Demo household metadata is loaded through the member repository. Future setup will support household invites, timezone, locale, and shared preferences.</p>
        </SettingsCard>
        <SettingsCard status="Mock" title="Members">
          <p>Member names, colors, and roles are represented in shared types and mock repository data. Editing and invitations are planned after durable auth and storage.</p>
        </SettingsCard>
        <SettingsCard status="Planned" title="Calendar sources">
          <p>Calendar cards already consume `CalendarEvent` data through a service. Google, Outlook, CalDAV, and ICS sync should be added as read-only source adapters.</p>
        </SettingsCard>
        <SettingsCard status="Planned" title="Home Assistant integration">
          <p>Home Assistant will be an integration layer for display, status, REST/MQTT/webhook automation, and Lovelace embedding—not the primary HomeBoard database.</p>
        </SettingsCard>
        <SettingsCard status="Prepared" title="RUNAI / API tokens">
          <p>Task source types and `/api/tasks` are prepared for API clients. Token-scoped auth, audit trails, and an OpenAPI contract are next-step work.</p>
        </SettingsCard>
        <SettingsCard status="Preview" title="Display / device settings">
          <p>Device types are modeled for wall, mobile, and admin modes. Future settings can manage default route, sleep schedule, brightness, and kiosk behavior.</p>
        </SettingsCard>
        <SettingsCard status="Preview mode" title="Data / backend status">
          <div className="space-y-3">
            <p className="font-bold text-stone-800">Storage mode: Local preview — no cloud sync yet.</p>
            <dl className="grid gap-2 rounded-2xl border border-stone-200/70 bg-stone-50 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="font-bold text-stone-500">UI task state</dt>
                <dd className="text-right font-black text-stone-900">Browser localStorage</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-bold text-stone-500">API task state</dt>
                <dd className="text-right font-black text-stone-900">Temporary in-memory</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-bold text-stone-500">Multi-device sync</dt>
                <dd className="text-right font-black text-amber-700">Not connected yet</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-bold text-stone-500">Next backend target</dt>
                <dd className="text-right font-black text-stone-900">Supabase/Postgres</dd>
              </div>
            </dl>
            <p>API writes from future RUNAI or Home Assistant clients do not yet appear in the wall/mobile UI. This is expected during the local preview and will be connected in the shared backend step.</p>
          </div>
        </SettingsCard>
      </div>
    </AppShell>
  );
}
