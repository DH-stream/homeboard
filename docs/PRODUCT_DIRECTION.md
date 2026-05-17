# HomeBoard product direction

HomeBoard is a family wall calendar and task dashboard for self-hosted households. The product should feel calm, tactile, warm, and readable from across a room while keeping mobile task management fast and one-handed.

## Calendar integrations

HomeBoard should support multiple linked calendar accounts per household. A household may connect calendars for multiple people, shared family accounts, and public calendar feeds.

- A **calendar connection** is an authenticated provider/account connection, such as Max / Google, Felicia / iCloud, Family / Microsoft, or a public ICS source.
- A **calendar source** is an individual calendar inside a connection, such as Family, Personal, Work, Leah activities, or Swedish holidays.
- Settings should let users choose which calendar sources are visible on HomeBoard.
- Enabled calendar sources are merged into one household agenda for wall and mobile calendar views.
- Calendar events are read-only by default.
- Calendar events do not need task-style ownership in v1; household member filtering should affect tasks only.
- Google and Microsoft are the primary OAuth integrations for later provider work.
- iCloud should be supported through CalDAV later.
- ICS/public URL support can be a fallback import/read-only source later.
- Tokens and credentials must never be stored in browser `localStorage`.
- Provider credentials must be stored server-side only when real sync/auth is added.

## Preview implementation stance

The current calendar source selection is mock/local preview state only. It models the domain and UI behavior without OAuth, provider API calls, CalDAV, ICS parsing, auth, Supabase, or durable multi-device sync.
