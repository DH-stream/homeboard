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
        <SettingsCard status="Local" title="Data / backend status">
          <p>The current UI stores task instances in browser localStorage. API route data is an in-memory placeholder. Supabase/Postgres can replace repositories later.</p>
        </SettingsCard>
      </div>
    </AppShell>
  );
}
