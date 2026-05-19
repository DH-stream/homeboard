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
- Pairing sessions should expire quickly, with a 2-minute target in the current MVP.
- Paired devices should be manageable later from Settings, including name, mode, last seen status, and unpairing.
- A wall device should store a local device id and resolve its household through the pairing/device record, not through a hardcoded household id.

Security-sensitive pairing work should be implemented through scoped API routes and clear RLS/server-side rules. QR generation, pairing claims, session expiry, and device management should not rely on public browser writes alone.

## Per-device start views

HomeBoard should remember how each physical screen is used. A wall-mounted iPad or tablet should behave like an appliance and open `/wall` directly, while a family phone can open `/app` and an admin laptop can open `/settings`. This start view is a per-device preference, not a household-global setting.

The current implementation stores `homeboard.deviceMode.v1` and `homeboard.defaultRoute.v1` in browser `localStorage`. Until QR/device pairing exists, that local preference controls the root route. First-run setup is intentionally a special one-time HomeBoard experience, including original in-project SVG clouds inspired by a soft rounded cloud style. Later, paired wall devices may keep a local device id and resolve a durable `devices.defaultView` value from Supabase.

## Unified setup and routing direction

Wall, mobile, and adult/admin should not drift into three separate setup systems. HomeBoard should have one shared setup/onboarding model where device mode changes copy, permissions, and the final landing route, but not the underlying setup logic.

The intended routing model is:

- `/` is the device entry point. It resolves an existing per-device start view, or starts the shared first-run setup flow.
- `/wall` is the wall appliance view for shared household display and one-touch task completion.
- `/app` is the mobile family view for lighter task/calendar use.
- `/settings` is the adult/admin surface. Adult view should effectively be the mobile view plus full settings/admin access, not a completely separate product path.
- `/setup/adult` and future setup routes should participate in the same setup state machine as wall/mobile setup rather than becoming their own parallel onboarding world.

The shared setup state should cover:

- first-run device mode selection: wall, mobile, or adult/admin;
- auth state: unauthenticated, authenticated, adult verified;
- household state: no home, create home, join/select home, linked home;
- device registration state: local device id, pending pairing, paired device, selected default route;
- access level: wall/shared, mobile lightweight, adult/admin;
- local-only fallback without claiming real security;
- back/cancel/recovery paths that do not leave half-configured local/cloud state.

Product rules:

- A signed-in adult user should connect to their household once, then route into the correct surface based on device mode and access.
- Adult access is based on the authenticated user being linked to the household as an adult member, not simply on having chosen the adult device card.
- Wall and mobile should use the same household/device resolution foundation as adult/admin.
- Resetting the device choice should only reset this device's preferred start route; it must not log the user out or delete household data.
- Language selection in setup should be available before choosing a screen mode and should use the same i18n provider as the rest of the app.
- The adult-lock helper text should not be shown permanently in the initial chooser. It should appear when the adult view is attempted or inside the adult locked step/panel.

Acceptance for later cleanup:

- New user setup feels like one coherent HomeBoard flow regardless of whether the user starts from wall, mobile, or adult.
- Existing-home join/login uses the same household-linking logic across modes.
- Device setup writes/resolves the same underlying device and household state for wall, mobile, and adult.
- Adult view routes to the same core app surface as mobile, with full settings/admin enabled.
- Wall/mobile keep lighter settings, but do not fork the core setup/auth/household state logic.
- Local-only mode remains supported and honest about its limitations.

## Task persistence and offline sync direction

HomeBoard owns household tasks. The durable task model should treat `tasks` as what the task is and `task_schedules` as when it should appear. `task_instances` are not a future backlog; they store per-occurrence state only, such as `completed_at`, `completed_by_member_id`, future skip/snooze state, or an instance-specific title edit. Visible task cards can still be rendered as `TaskInstance`-shaped view models, but the read layer derives those occurrences from the task and schedule source data and merges saved state by a deterministic occurrence key (`taskId::YYYY-MM-DD::HH:mm`).

Browser `localStorage` is part of the product persistence story, not only a mock fallback:

- In local-only mode, when Supabase is not configured, it stores task source data and occurrence state on this device without cross-device sync.
- In Supabase sync mode, it stores the latest task cache so HomeBoard can show cached data if Supabase or the network is temporarily unavailable.
- It also stores a v1 pending write queue for later replay. Queue v1 is deliberately simple: it retries on app load/refresh and browser `online`, does not silently drop failed operations, and treats completion toggles as last local action wins. Full conflict resolution UI is future work.

Supabase Auth, RLS, and API policies are still required before public multi-household production use. Until then, Supabase mode is a durable sync foundation but not a complete security model.

## Admin and föräldrakontroll direction

HomeBoard should support two operating modes with honest security expectations:

- **Supabase sync mode:** durable admin permissions should eventually come from Supabase Auth plus `household_members.role`. Adult members can manage settings, members, recurring tasks, rewards, integrations, and device pairing. Child members can view tasks and complete allowed tasks, but should not manage household/admin settings. Full enforcement belongs in Auth/RLS/API policies later.
- **Local-only mode:** there is no real account security. A local parent PIN can later act as a practical household UX guard for Settings/Admin and wall/kiosk unlock, but it must not be presented as cloud-grade security or a replacement for real auth.

## Device pairing and child access direction

Device pairing connects a device to a household and audience mode; it is not a member invite.

- Pairing model direction: `deviceMode` (`wall` or `mobile`), `deviceAudience` (`adult`, `child`, `shared`), optional `linkedMemberId`, `householdId`, `approvedByUserId`, and `expiresAt`.
- Grown-up auth is required for pairing approval and household administration.
- Child devices should not require email/login for daily use.
- Child devices should open HomeBoard with child-safe access and no Settings/admin routes.
- Adult member linking/invite and stronger permission enforcement are follow-up work after this MVP.
