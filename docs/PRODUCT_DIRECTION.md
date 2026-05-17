# HomeBoard product direction

HomeBoard is a family wall calendar and task dashboard for self-hosted households. The product should feel calm, tactile, warm, and readable from across a room while keeping mobile task management fast and one-handed.

## Calendar integrations

HomeBoard should support multiple linked calendar accounts per household. A household may connect calendars for multiple people, shared family accounts, and public calendar feeds.

- A **calendar connection** is an authenticated provider/account connection, such as a household member's Google account, an iCloud CalDAV account, a Microsoft account, or a public ICS source.
- A **calendar source** is an individual calendar inside a connection, such as Family, Personal, Work, Leah activities, or Swedish holidays.
- Settings should let users choose which calendar sources are visible on HomeBoard.
- Enabled calendar sources are merged into one household agenda for wall and mobile calendar views.
- Calendar events are read-only by default.
- Calendar events do not need task-style ownership in v1; household member filtering should affect tasks only.
- Google and Microsoft are the primary OAuth integrations for later provider work.
- iCloud should be supported through CalDAV later.
- ICS/public URL support can be a fallback import/read-only source later.
- Tokens and credentials must never be stored in browser `localStorage`.
- Provider credentials must be stored server-side only and encrypted/secured when real sync/auth is added.
- The Supabase schema in `supabase/migrations/` is the durable foundation for households, members, calendar connections, calendar sources, and calendar events.

## Preview implementation stance

The current calendar source selection UI is production-shaped but setup-gated. It returns empty calendar data until Supabase env vars are configured, the database migration is run, a household is configured, and future provider login creates calendar connection/source rows. It does not implement OAuth, provider API calls, CalDAV, ICS parsing, auth UI, credential storage, or calendar writes.

## Household setup and wall device pairing direction

HomeBoard should not depend on a hardcoded household id forever. `NEXT_PUBLIC_HOMEBOARD_HOUSEHOLD_ID` is only a development override while the product grows toward household setup, device selection, and later auth.

The intended setup path is:

- A mobile/admin device creates or selects the household first.
- Wall devices should not require login, typing UUIDs, or editing environment variables.
- An unpaired wall device should create or reuse a local device id, then show a QR code and short pairing code.
- The mobile/admin device scans the QR code and reviews the pairing request.
- Mobile confirms which household should own the wall device.
- The wall device is linked to that household and then loads the wall dashboard.
- Pairing sessions should expire quickly, for example after 10 minutes.
- Paired devices should be manageable later from Settings, including name, mode, last seen status, and unpairing.
- A wall device should store a local device id and resolve its household through the pairing/device record, not through a hardcoded household id.

Security-sensitive pairing work should be implemented through scoped API routes and clear RLS/server-side rules. QR generation, pairing claims, session expiry, and device management should not rely on public browser writes alone.
