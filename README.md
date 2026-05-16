# HomeBoard

HomeBoard is an open-source family wall calendar and task dashboard inspired by dedicated family displays, but designed to be self-hostable, cloud-sync friendly, and ready for future Home Assistant and RUNAI integrations.

The first preview is a Vercel-ready Next.js app with a polished wall dashboard, a mobile task-management view, settings placeholders, shared TypeScript data models, and repository/service boundaries so persistence can be replaced later without rewriting the UI.

## Current status

This repository currently ships a usable product preview:

- `/` explains the project and links to the main preview routes.
- `/wall` is a landscape/tablet-oriented family dashboard with date/time, member indicators, agenda, week preview, and touch-friendly task completion.
- `/app` is a mobile-first task app with add, edit, complete/uncomplete, member filtering, status filtering, and an agenda preview.
- `/settings` shows practical setup areas for household, members, calendar sources, Home Assistant, RUNAI/API tokens, display settings, and backend status, including preview persistence limitations.
- `/api/tasks` provides basic GET, POST, and PATCH handlers for future API clients with predictable JSON errors for invalid requests.

No real provider sync, paid services, auth system, secrets, required environment variables, or external databases are required for this preview.

> **Preview mode:** the wall/mobile UI uses browser localStorage and the API uses temporary server memory. They do not share a persistence store yet, so API writes do not appear in the wall/mobile UI until the future shared Supabase/Postgres backend is added.

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

There are no required environment variables for the first preview version. `.env.example` only contains commented placeholders for future Supabase, Home Assistant, and RUNAI configuration.

Preview persistence behavior on Vercel:

- The wall/mobile UI stores task state in each browser's `localStorage`, so a reviewer can add and complete tasks and refresh the same browser without losing that preview state.
- `/api/tasks` uses temporary in-memory server state to shape future RUNAI/Home Assistant API behavior. In Vercel/serverless environments this state is not durable and can reset between invocations or deployments.
- The UI and API do **not** share the same persistence store in PR #1. API writes do not yet appear in the wall/mobile UI.
- True multi-device sync is the next backend milestone and should be implemented by replacing the repositories with a shared Supabase/Postgres persistence layer.

## Architecture overview

The app intentionally separates UI, hooks, services, repositories, shared types, and mock data:

- `types/` contains shared domain models for households, members, task templates, task schedules, task instances, calendar events, and devices.
- `data/` contains non-private mock household, member, task, and calendar data.
- `lib/repositories/` owns temporary persistence implementations.
- `lib/services/` owns task, member, and calendar service functions consumed by hooks and API routes.
- `lib/hooks/` exposes client hooks such as `useTasks`, `useCalendarEvents`, `useHousehold`, and `useMembers`.
- `components/` contains reusable layout, task, calendar, member, and settings UI components.
- `lib/integrations/home-assistant/` and `lib/integrations/runai/` document planned integration boundaries.

Task recurrence is intentionally modeled with templates, schedules, and instances. The UI operates on `TaskInstance` records for today's checklist instead of a single completed boolean on a recurring task template.

Design rules for the preview live in `docs/DESIGN_SYSTEM.md`, including motion, accessibility, wall-screen, and mobile interaction guidance.

## Persistence and backend plan

For the preview:

- Storage mode is **local preview**.
- Wall/mobile UI task state is stored in browser `localStorage` so added and completed tasks survive refreshes in the same browser.
- API task state is stored in a temporary in-memory server repository. This is useful for shaping the API but is not durable and should not be treated as production storage.
- The UI and API are intentionally not connected to the same store yet. API writes from future RUNAI/Home Assistant clients do **not** appear in the wall/mobile UI in PR #1.
- Mock calendar events are read-only and loaded through the calendar repository/service.
- Multi-device sync is not connected yet.
- The next backend target is Supabase/Postgres.

Future backend replacement should keep the public service/hook contracts stable while swapping repository implementations for durable storage.

## Future Supabase/Postgres plan

A production backend can replace the temporary repositories with Supabase or direct Postgres access:

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
