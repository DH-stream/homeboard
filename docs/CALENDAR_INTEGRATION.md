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
