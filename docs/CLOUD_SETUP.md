# HomeBoard cloud setup

HomeBoard should feel simple for a household. The product language is **Cloud sync** / **Molnsynk** even though the current backend implementation uses Supabase/Postgres internally.

## Normal household setup direction

For normal families, setup should work like this:

1. Open HomeBoard.
2. Create a new home or choose an existing home in the app.
3. **Molnsynk** / **Cloud sync** is available automatically in the standard hosted HomeBoard app.
4. HomeBoard remembers the selected home on that device.
5. Open HomeBoard on the wall display or iPad.
6. Pair wall and mobile devices with a QR flow when that feature is implemented.

A parent should not need to know about Supabase projects, Vercel environment variables, SQL, RLS, UUIDs, or database tables. Household UUIDs are internal implementation details; normal setup should never require copying one from a backend dashboard.

## Built-in official HomeBoard cloud

The standard hosted app includes a bundled HomeBoard cloud client configuration for the official HomeBoard cloud project:

- Project URL: `https://bnnyrnsusqjqhtymfycm.supabase.co`
- Project ref: `bnnyrnsusqjqhtymfycm`

This bundled client configuration uses only a browser-safe publishable key. A publishable/anon client key is **not a secret**; it is expected to be visible in browser JavaScript. The service role key is different and must **never** be bundled, committed, or exposed to the browser.

Known HomeBoard cloud test household from the current review:

- Development household id: `d21d501c-5a02-40fb-8675-4a8dee9fa48e`
- Household name: Max HomeBoard
- Members: Max, Felicia, Leah
- Calendar source: Familjens testkalender
- Calendar events: Frukosttest i molnet, Hämta Leah, Handla inför veckan, Helgplan

## Developer and self-host overrides

Environment variables are optional overrides for development and self-hosting. They are no longer required for the standard hosted HomeBoard app.

Set these only when you want to point HomeBoard at another cloud project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (preferred) or `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy alias)
- `NEXT_PUBLIC_HOMEBOARD_HOUSEHOLD_ID` only as an optional development override. Normal setup should choose or create a home in the app instead of copying a UUID.

To disable the bundled official HomeBoard cloud during local development, set:

```bash
NEXT_PUBLIC_HOMEBOARD_DISABLE_BUILT_IN_CLOUD=true
```

Then HomeBoard behaves as local/device-only unless you also provide a complete self-host cloud override.

After configuring an override or using the built-in cloud, open HomeBoard and create or select a home in the in-app setup screen. Then open `/settings` and check **Cloud status** / **Molnstatus**. It should show the home name, member count, task count, and calendar-event count. `NEXT_PUBLIC_HOMEBOARD_HOUSEHOLD_ID` remains available only for development shortcuts.

## Supabase Auth email code setup

HomeBoard's parent/grown-up auth is a **code-first flow**. The app asks the parent to enter the 6-digit code from the email. It should not depend on the parent clicking a magic-link email.

Supabase email OTP and magic links share the same underlying implementation. To make the email match HomeBoard's UI, configure the Supabase email template to show the 6-digit OTP variable instead of making the confirmation link the primary action.

In Supabase, open **Authentication → Email Templates** and update the relevant sign-in / magic-link template so it includes:

```html
<h2>Your HomeBoard code</h2>
<p>Enter this code in HomeBoard:</p>
<p>{{ .Token }}</p>
```

Avoid making `{{ .ConfirmationURL }}` the primary user action for HomeBoard parent auth. It can exist as a fallback only if needed, but the product flow should be: send email → copy 6-digit code → enter code in HomeBoard.

## Supabase Auth redirect URLs

Even though HomeBoard is code-first, parent/grown-up auth still sends an explicit redirect target so any fallback email link returns to the app that requested the code.

The redirect target is the current app origin at `/settings`, for example:

```text
https://your-homeboard-domain.vercel.app/settings
http://localhost:3000/settings
```

`localhost` only matters for local development. It is not used when the user requests a code from a Vercel deployment.

The Supabase project must allow those redirect targets. In Supabase, open **Authentication → URL Configuration** and configure:

- **Site URL:** the primary production HomeBoard URL.
- **Additional Redirect URLs:** localhost development, the production URL, and Vercel preview URLs.

Recommended examples:

```text
http://localhost:3000/**
https://your-homeboard-domain.vercel.app/**
https://*.vercel.app/**
```

If a redirect URL is not allow-listed, Supabase can fall back to the configured Site URL. That can cause fallback verification links to open `localhost` or another stale deployment URL.

## Calendar events today

HomeBoard does **not** implement Google, Apple, Microsoft, or ICS provider login yet. Calendar provider connections and source creation are still manual/developer setup.

When cloud config and a household id are available, `TodayAgenda` and `WeekPreview` read from `public.calendar_events`. If enabled calendar sources exist, events from enabled sources are shown. If no sources exist, HomeBoard still reads household calendar events directly so developer-inserted test data is visible and debuggable.

### Insert a test calendar event

The schema requires a connection and source before inserting an event. Replace the household id if you are testing a different home.

```sql
insert into public.calendar_connections (household_id, provider, account_label, status)
values ('d21d501c-5a02-40fb-8675-4a8dee9fa48e', 'manual', 'Developer test calendar', 'connected')
returning id;

insert into public.calendar_sources (household_id, connection_id, provider_calendar_id, name, color, enabled)
values (
  'd21d501c-5a02-40fb-8675-4a8dee9fa48e',
  '<connection id from previous query>',
  'developer-test',
  'HomeBoard test',
  '#f59e0b',
  true
)
returning id;

insert into public.calendar_events (household_id, source_id, external_event_id, title, start_at, end_at, all_day, color)
values (
  'd21d501c-5a02-40fb-8675-4a8dee9fa48e',
  '<source id from previous query>',
  'developer-test-1',
  'HomeBoard cloud calendar test',
  now() + interval '1 hour',
  now() + interval '2 hours',
  false,
  '#f59e0b'
);
```

Then verify:

```sql
select count(*) from public.calendar_connections where household_id = 'd21d501c-5a02-40fb-8675-4a8dee9fa48e';
select count(*) from public.calendar_sources where household_id = 'd21d501c-5a02-40fb-8675-4a8dee9fa48e';
select count(*) from public.calendar_events where household_id = 'd21d501c-5a02-40fb-8675-4a8dee9fa48e';
```

The `/settings` **Cloud status** diagnostics should show the calendar-event count, and `/wall` or `/app` should show the event if it falls in the visible date range.

## Current limitations and security

- UI uses family-facing Cloud/Moln wording.
- Backend internals currently use Supabase/Postgres.
- The bundled publishable key is browser-safe and not a secret.
- Service role keys must never be exposed to browser code.
- RLS is currently not enabled for HomeBoard tables in the reviewed project. This is not safe for real public multi-household use.
- The current project must not be treated as public production until auth and RLS/security policies are implemented and verified.
- Auth, invite flows, QR pairing, calendar provider OAuth, encrypted provider tokens, and production RLS policies are follow-up work.
- Local-only mode remains supported by setting `NEXT_PUBLIC_HOMEBOARD_DISABLE_BUILT_IN_CLOUD=true` and omitting cloud override env vars.