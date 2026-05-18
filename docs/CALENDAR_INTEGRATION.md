# Calendar Integration Foundation

Current provider: **ICS URL**.

HomeBoard uses a provider-agnostic model:
- `calendar_connections` (account/provider link)
- `calendar_sources` (calendar/feed inside a connection)
- `calendar_events` (normalized household events)

## Provider roadmap
- Google Calendar OAuth (future)
- Microsoft/Outlook OAuth (future)
- Apple/iCloud via CalDAV or ICS (future)

## Household behavior
Calendar data belongs to the selected household. Wall/shared devices read the household agenda. Child-specific filtered views are future work.

## Security notes
- Provider secrets and OAuth tokens must remain server-side only.
- ICS URLs can be sensitive and should be masked in normal UI.
- Multi-household public production still requires strict RLS and device access-token hardening.


## Sync behavior
- HomeBoard treats each calendar source as a live connection, not a one-time import.
- On calendar load, enabled sources that never synced or are stale (>30 min) are auto-synced server-side.
- Failed sources are retried with a longer cooldown (2h) to avoid repeated noisy retries.
- Manual **Synka nu** remains available in Settings.

## Future background sync
- Later we can run scheduled sync via Vercel Cron or Supabase Edge Functions calling `/api/calendar/sync-all` for active households.
