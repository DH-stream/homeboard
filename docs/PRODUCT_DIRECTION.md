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
