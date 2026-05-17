# HomeBoard idea backlog

This file is for product ideas that are interesting, valuable, or strategically useful, but not ready to build right now.

Ideas here are not commitments. They are parked so we can revisit them later without losing the thinking.

## Health-verified tasks

### Idea

HomeBoard could support tasks that are automatically completed by trusted integrations instead of only manual check-off.

Example:

- Task: `7500 steg per dag`
- Verification provider: Apple Health
- Metric: steps
- Target: 7500
- Period: daily
- Result: when the user reaches the target, HomeBoard automatically marks that day’s occurrence as complete.

### Product value

This would make some routines feel more automatic and rewarding:

- daily step goals
- exercise minutes
- movement streaks
- possibly sleep or mindfulness later, if handled carefully

The task card could show progress before completion, for example:

- `5 840 / 7 500 steg`
- progress bar
- `Verifierad av Apple Health` when complete

### Technical direction

Apple Health requires a native iOS/watchOS companion app using HealthKit. A normal web app/PWA cannot directly read Apple Health data.

Likely flow:

1. HomeBoard iOS companion app requests explicit HealthKit permission from the user.
2. The app reads only the specific metric needed, such as daily step count.
3. The app sends minimal verification/progress state to HomeBoard/Supabase.
4. HomeBoard marks or updates the matching task occurrence.

Suggested future schema direction:

```text
task_verification_rules
- id
- task_id
- provider: apple_health | home_assistant | runai | other
- metric: steps | exercise_minutes | custom
- operator: >=
- target_value
- period: day | week
- created_at
- updated_at
```

Occurrence state could store only what HomeBoard needs:

```text
- task_id / occurrence_key
- provider
- metric
- current_value
- target_value
- verified_at
```

### Privacy / safety notes

Health data is sensitive. This feature must be opt-in per user and should sync the minimum needed verification state, not raw detailed health history.

Do not expose private health details to the whole household by default. A user should understand exactly what is shared and why.

### Status

Parked idea. Do not build until HomeBoard has a clearer mobile/native companion strategy and a real auth/privacy model.
