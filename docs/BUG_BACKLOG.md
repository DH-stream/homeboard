# HomeBoard bug backlog

This file tracks bugs, demo blockers, sharp edges, and reliability issues that must not get lost in chat.

Use this for things that are not product ideas, but real problems or demo risks.

## Priority labels

- P0: blocks core usage or makes the app feel broken
- P1: important UX/reliability issue before broader testing
- P2: polish or non-critical bug

## Open issues

### P0 — Adding tasks must never silently fail

Status: fixed in PR “Fix task creation feedback”

Context:

A real demo attempt failed because adding tasks did not work. This is a core HomeBoard flow and must be treated as a blocker.

Expected behavior:

- A user can add a simple task from the mobile/app task creator.
- A user can add a simple task from the wall quick task creator when enabled.
- The task appears immediately in the visible task list when it is due today.
- If Supabase is configured but unavailable, task creation falls back to local cache/offline queue.
- If Supabase is not configured, task creation works in local-only mode.
- The UI must not fail silently.

Required follow-up:

- Reproduce on the current Vercel production deployment and preview deployment.
- Test both `/app` AddTaskForm and `/wall` quick task creator.
- Check browser console for create/save errors.
- Check whether the device is running local-only mode or Supabase sync mode.
- Verify that `homeboard.taskCache.v1` is updated after task creation in local-only/offline mode.
- Verify that tasks due today are included by the today filtering logic.
- Add visible save/error feedback if the create path fails. ✅ Added saving states, success toast/check feedback, inline Swedish error copy, and form preservation on failure.

Acceptance:

- Adding `Packa gympapåse` from `/app` appears immediately in today’s task list.
- Adding `Packa gympapåse` from `/wall` quick task creator appears immediately in today’s wall task list.
- Works after reload.
- Works without Supabase configured.
- Works when Supabase is configured but temporarily unreachable by queueing locally.
- Failures show a clear Swedish error state and preserve entered text.


Verification notes for “Fix task creation feedback”:

- Verified `/app` local-only creation with `Packa gympapåse`: saving state appears, success check/toast appears, the task appears in today’s list, and it survives reload.
- Verified `/wall` quick task creator in `Snabbknapp` mode with `Ta fram jacka`: saving state appears, success check/toast appears, the task appears in the wall today list, the creator closes after save, and it survives reload.
- Verified `/wall` quick task creator in `Alltid framme` mode with `Ställ fram frukost`: saving state appears, success check/toast appears, the task appears in the wall today list, and it survives reload.
- Simulated a local cache write failure and verified the Swedish error is visible, input text is preserved, and retry remains possible.
- Verified route smoke checks for `/`, `/app`, `/wall`, `/settings`, and `/api/tasks`.
