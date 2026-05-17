# HomeBoard

HomeBoard is an open-source family wall calendar and task dashboard inspired by dedicated family displays, but designed to be self-hostable, cloud-sync friendly, and ready for future Home Assistant and RUNAI integrations.

The first preview is a Vercel-ready Next.js app with a polished wall dashboard, a mobile task-management view, settings placeholders, shared TypeScript data models, and repository/service boundaries so persistence can be replaced later without rewriting the UI.

## Current status

This repository currently ships a usable product preview:

- `/` reads this browser's per-device start view from `localStorage`, redirects to `/wall`, `/app`, or `/settings` when configured, and otherwise asks how this device should be used.
- `/wall` is a landscape/tablet-oriented family dashboard with date/time, member indicators, agenda, week preview, and touch-friendly task completion.
- `/app` is a mobile-first task app with add, edit, complete/uncomplete, member filtering, status filtering, and an agenda preview.
- `/settings` shows practical setup areas for this device, household, members, calendar sources, Home Assistant, RUNAI/API tokens, and backend status, including preview persistence limitations.
- `/api/tasks` provides basic GET, POST, and PATCH handlers for future API clients with predictable JSON errors for invalid requests.

No real provider sync, paid services, auth system, secrets, or external databases are required to build and run the preview. Calendar source selection is Supabase-ready but remains disabled until Supabase env vars are configured and migrations are run.

> **Persistence mode:** when Supabase is not configured, the wall/mobile UI works local-only from browser `localStorage` on that device. When Supabase is configured, `localStorage` is also used as an offline cache and pending write queue so cached tasks can still be shown while the network is unavailable. The API route still uses temporary server memory and does not share the wall/mobile store yet.

> **Per-device start view:** HomeBoard also stores `homeboard.deviceMode.v1` and `homeboard.defaultRoute.v1` in browser `localStorage`. This lets a wall/iPad device open `/wall` like an appliance, while mobile and admin devices can choose `/app` or `/settings`. Future QR-paired devices may store a local device id and sync `devices.defaultView` through Supabase; the current preview is local-only.

## How to run locally

Requirements:

- Node.js 20 or newer
- npm

```bash
npm install
npm run dev
```

Then open:

- http://localhost:3000
- http://localhost:3000/wall
- http://localhost:3000/app
- http://localhost:3000/settings

Useful checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Deploy to Vercel

HomeBoard is structured as a standard Next.js App Router project and is ready to deploy as a Vercel preview.

1. Import the GitHub repository into Vercel.
2. Use the **Next.js** framework preset.
3. Use Node.js 20 or newer. The project also declares `"node": ">=20.0.0"` in `package.json`.
4. Install dependencies with `npm install`.
5. Run locally with `npm run dev` when developing.
6. Verify production output with `npm run build`.

There are no required environment variables to build the preview. To enable Supabase-backed household data, create a Supabase project, copy `.env.example`, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then either select a household in the app or set the optional `NEXT_PUBLIC_HOMEBOARD_HOUSEHOLD_ID` development override.

Preview persistence behavior on Vercel:

- When Supabase is not configured or no household id is resolved, the wall/mobile UI keeps using browser `localStorage` as local-only task storage. It works on this device, but there is no cross-device sync.
- When Supabase is configured and a household id is resolved, the wall/mobile UI reads source task data from Supabase, writes to Supabase, mirrors successful reads into `homeboard.taskCache.v1`, and retries queued writes from `homeboard.taskSyncQueue.v1` after refresh or the browser `online` event.
- If Supabase is temporarily unavailable, HomeBoard falls back to the latest local task cache where available and queues create/update writes for later replay. Queue v1 is intentionally simple: completion toggles use last local action wins and no conflict-resolution UI is implemented yet.
- `/api/tasks` still uses temporary in-memory server state to shape future RUNAI/Home Assistant API behavior. In Vercel/serverless environments this state is not durable and can reset between invocations or deployments.
- The UI and API do **not** share the same persistence store yet. API writes do not yet appear in the wall/mobile UI.
- Calendar source selection is backed by the Supabase-ready repository and schema, but provider login is not implemented yet, so the Settings UI will be empty until calendar connections/sources are created by future integration work.
- Supabase Auth and RLS are not implemented yet. They must be added before public multi-household production use.

## Architecture overview

The app intentionally separates UI, hooks, services, repositories, shared types, Supabase schema, and mock preview data:

- `types/` contains shared domain models for households, members, task templates, task schedules, task instances, calendar connections, calendar sources, calendar events, and devices.
- `data/` contains non-private mock household, member, and task data for the preview. Calendar connections/sources/events are not mocked as connected provider data.
- `lib/repositories/` owns the local preview task repository, the Supabase task repository adapter, temporary API task persistence, and Supabase-ready calendar persistence adapters.
- `lib/services/` owns task, member, and calendar service functions consumed by hooks and API routes.
- `lib/hooks/` exposes client hooks such as `useTasks`, `useCalendarEvents`, `useHousehold`, and `useMembers`.
- `components/` contains reusable layout, task, calendar, member, and settings UI components.
- `supabase/migrations/` contains the durable SQL schema foundation for households, members, calendar connections, calendar sources, and calendar events.
- `lib/integrations/home-assistant/` and `lib/integrations/runai/` document planned integration boundaries.

Task recurrence is intentionally modeled with templates, schedules, and instances. `tasks` describe what the task is, `task_schedules` describe when it should appear, and `task_instances` store saved state for a specific occurrence only, such as completion or an instance-specific title edit. The read layer derives visible occurrences from tasks + schedules and merges any saved instance state by stable `occurrenceKey` (`taskId::YYYY-MM-DD::HH:mm`), so Supabase does not need a pre-generated backlog of future instances just to render today.

Design rules for the preview live in `docs/DESIGN_SYSTEM.md`, including motion, accessibility, wall-screen, and mobile interaction guidance.

## Persistence and backend plan

For the preview:

- Storage mode is **local-only** unless Supabase is configured and a household id is resolved.
- Wall/mobile UI task state is stored in browser `localStorage` in local-only mode, so refreshes on the same device keep working without cross-device sync.
- With Supabase env vars and a selected household, wall/mobile task reads load `tasks`, `task_schedules`, and saved `task_instances` from Supabase, cache the latest source data locally, and derive visible occurrences in the read layer. Writes go to Supabase when reachable and are queued in localStorage when temporarily offline.
- API task state is stored in a temporary in-memory server repository. This is useful for shaping the API but is not durable and should not be treated as production storage.
- The UI and API are intentionally not connected to the same store yet. API writes from future RUNAI/Home Assistant clients do **not** appear in the wall/mobile UI yet.
- Calendar connections, sources, and events are modeled through a Supabase-ready schema and repository. Without Supabase env vars or a configured household, calendar views safely return no events and Settings explains the setup steps.
- Calendar provider login is not implemented yet. Calendar source UI will remain empty until Google, Microsoft, iCloud, or ICS integration work creates connection/source rows.
- Supabase Auth and RLS are not implemented yet and are required before public multi-household production use.
- Provider credentials and OAuth tokens must never be stored in browser `localStorage`; future credential storage must be server-side only and encrypted/secured.
- A full task generation scheduler/cron is intentionally not needed for the current read model; recurring occurrences are derived on read and `task_instances` are created only when per-occurrence state is saved.
- Full recurring edit semantics are future work. Editing a visible title remains instance-specific for now.
- The next backend target remains hardening the Supabase/Postgres path with Auth/RLS before public multi-household production use.

Future backend replacement should keep the public service/hook contracts stable while swapping repository implementations for durable storage.

## Future Supabase/Postgres plan

The first durable schema lives in `supabase/migrations/0001_homeboard_calendar_foundation.sql` and can be applied to a Supabase project. A production backend can continue expanding these tables:

- `households`
- `household_members`
- `tasks`
- `task_schedules`
- `task_instances`
- `calendar_sources`
- `calendar_events`
- `devices`
- API token and audit tables

The current TypeScript models are intended to map closely to those future tables.

## Future Home Assistant plan

Home Assistant should be an integration layer, not the main database. Planned integration points include:

- REST endpoints for reading wall status and completing task instances.
- MQTT status/control topics for automations.
- Webhooks for automation-created tasks.
- Lovelace or panel embedding of `/wall`.
- Device presence and display health reporting.

## Future RUNAI plan

RUNAI should act as an API client rather than being hardcoded into task logic. Planned work includes:

- Token-scoped API authentication.
- OpenAPI documentation for task endpoints.
- Create/read/update/complete task flows.
- Source and audit metadata for AI-created or automation-created tasks.

## Contributing

HomeBoard aims to be a practical open-source household dashboard. Contributions should favor readable code, replaceable integration seams, no private data, no required paid services, and a polished family-friendly UX.
