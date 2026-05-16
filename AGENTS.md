# HomeBoard agent instructions

These instructions apply to all AI/code-agent work in this repository.

## Project direction

HomeBoard is an open-source family wall calendar and task dashboard. It should feel like a real product for a wall-mounted touchscreen and a mobile web app, while staying self-hostable and integration-friendly.

Core priorities:

- Wall dashboard first: `/wall` should be readable from across a room and comfortable on a landscape tablet.
- Mobile task management: `/app` should feel fast, simple, and usable one-handed.
- HomeBoard owns tasks; external calendars are read/synced in later.
- Home Assistant and RUNAI are future integration layers, not the primary source of truth.
- Keep backend/persistence replaceable. Current preview storage is intentionally local/mock only.

## Design baseline

All HomeBoard UI work must follow the Emil Kowalski design-engineering skill as the design baseline:

https://github.com/emilkowalski/skill/blob/main/skills/emil-design-eng/SKILL.md

If the environment supports skills, use:

```bash
npx skills add https://github.com/emilkowalski/skill --skill emil-design-eng
```

Apply the skill naturally. Do not copy large chunks of the skill text into product docs or UI.

### Design rules

- Do not create generic SaaS dashboard UI.
- Prioritize calm, premium, warm, family-friendly product design.
- Make controls tactile and responsive.
- Use meaningful motion only; avoid flashy animation for its own sake.
- Prefer `transform` and `opacity` for motion.
- Keep common transitions short and responsive.
- Respect `prefers-reduced-motion`.
- Gate hover-only affordances behind hover-capable devices where practical.
- Preserve obvious focus states and accessible contrast.
- Use semantic buttons/links and large touch targets.
- Keep wall-screen typography and task state readable from a distance.
- Keep mobile flows simple and comfortable one-handed.

## Engineering rules

- Work from the current `main` unless explicitly told otherwise.
- Keep PRs small and focused.
- Do not resurrect or merge closed stale PRs unless explicitly requested.
- Do not add Supabase, auth, Home Assistant, RUNAI, or real calendar sync unless the task explicitly asks for it.
- Preserve `vercel.json` and keep the app Vercel-compatible.
- Avoid heavy animation/UI dependencies unless strongly justified.
- Prefer reusable primitives over repeated one-off Tailwind class piles when it improves maintainability.

## Preview persistence rules

Until shared backend sync is implemented:

- UI task state is browser `localStorage` preview state.
- `/api/tasks` uses temporary in-memory preview state.
- UI and API task stores are intentionally separate.
- Multi-device sync is not connected yet.
- The next backend target is Supabase/Postgres.

Make these limitations clear in README, settings, and PR summaries when relevant.

## Checks before finishing a PR

Run, when applicable:

```bash
npm run lint
npm run typecheck
npm run build
```

For UI changes, also smoke-check:

- `/`
- `/wall`
- `/app`
- `/settings`
- `/api/tasks`

PR summaries should mention commands run, routes verified, known limitations, and whether the Emil design-engineering baseline was applied.
