# HomeBoard – Roadmap & Review

> Last updated: 2026-05-26  
> Based on code review of `main` branch, screenshots of `/`, `/wall`, and `/app`, and reading of README, AGENTS.md, and BOOTLOADER.md.

---

## Overall assessment

The architecture is solid and the product thinking is clear. The local-first + cloud-optional model is the right choice for a family dashboard. The `tasks → task_schedules → task_instances` separation with `occurrenceKey`-based derivation is elegant and avoids pre-generating recurring task backlogs. The BOOTLOADER.md is better product documentation than most commercial projects.

The gap between current state and a polished family product is mostly **kid engagement polish** and **settings UX cleanup** — both of which are already identified in BOOTLOADER.md.

---

## 🔴 High priority

### 1. Add task completion feedback for kids
There is currently no visual or audio response when a chore is checked off. This is the single biggest missing piece for child motivation. Even a small `transform` + `opacity` pulse on the checkbox row would help. Consider confetti or a star animation for wall view. Gate all animations behind `prefers-reduced-motion`.

### 2. Fix dual-checkmark bug in mode chooser
On the first-run chooser screen (`/`), both **Väggvy** and **Mobilvy** display a ✓ checkmark simultaneously. This is likely a `deviceMode` localStorage key initialising in a state that marks both as selected. Only the active/selected mode should show a checkmark.

### 3. Add unlock hint to "Vuxenvy är låst"
The lock badge is visible but there is no affordance for how to unlock it. A first-time user has no idea whether to tap it, enter a PIN, or log in. Add a small "Logga in som vuxen →" link or tooltip directly under or on the badge.

### 4. Replace `yyyy-mm-dd` date input with a date picker
The add-task form uses a raw text field with `yyyy-mm-dd` placeholder. This is a developer format that will confuse non-technical parents and children. Replace with a calendar popup or native `<input type="date">`.

---

## 🟡 Medium priority

### 5. Settings cleanup – collapsible sections (already planned)
Settings is currently too long and too technical for a non-technical family member. The collapsible section structure already described in BOOTLOADER.md is the right fix. Recommended sections:

- **Den här enheten** – language, start view, local reset
- **Moln & synk** – cloud status, connect/disconnect, sync health
- **Hem** – household name, members, devices, pairing
- **Kalender** – calendar sources, connection status
- **Väggskärm** – wall-specific display settings
- **Integrationer** – Home Assistant, RUNAI/API tokens (clearly marked as advanced/planned)
- **Tekniskt / Avancerat** – collapsed by default; debug info only

Copy rule: never show Supabase, UUID, RLS, or backend terms to the user.

### 6. Add a local-mode banner in wall/app UI
When running without Supabase, the UI and `/api/tasks` use completely separate state stores. A task written via the API will not appear on the wall. There is no user-visible warning about this. Add a subtle dev/info banner on `/wall` and `/app` when in local-only mode:

> "Lokal läge – uppgifter från externa integrationer visas inte här ännu."

### 7. Verify wall unlink detection end-to-end
BOOTLOADER.md lists wall-side device validation as "verifiera manuellt". If a wall screen is removed from the household in the cloud, it must detect this and reset to the chooser/setup screen. The mobile doing the unlinking must remain logged in. This should be smoke-tested before any public launch.

### 8. Make the streak counter more prominent
The 🔥 streak counter is a great motivational feature but is currently tucked in the top-right corner of the wall view. For kids to notice and care about it, it should be larger and more visually rewarding – consider a central placement or a growing flame visual tied to the streak number.

---

## 🟢 Low priority / polish

### 9. Increase task checkbox tap target size
The checkbox on task rows in the wall view is approximately 40×40px. For a child tapping a wall-mounted tablet, the minimum recommended touch target is 60–80px. The entire task row should be tappable, not just the checkbox square.

### 10. Color-tint task cards per assigned person
The colored avatar chips (Felicia, Leah, Max) are a good start for person identification. Consider applying a subtle background tint to each task card matching the assigned member's color. This makes it instantly clear at a glance whose tasks are whose, especially useful on the wall view from across a room.

### 11. Kid-friendlier language on status widget
The "0/2 klara · 2 kvar" status widget uses neutral adult language. For a kid-facing wall view, something more encouraging works better:

> "2 saker kvar idag! 💪"

### 12. Soften the dark add-task form on mobile
The add-task form in `/app` uses a dark/black card that is jarring against the warm pastel design used elsewhere. A lighter styled form would be more consistent with the overall tone.

### 13. Verify `prefers-reduced-motion` before adding animations
AGENTS.md correctly calls for respecting `prefers-reduced-motion`. Before adding any completion animations (see item 1), ensure all motion is gated behind a check:

```css
@media (prefers-reduced-motion: reduce) { ... }
```

or in React:

```ts
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

### 14. Pairing QR copy must match device mode
BOOTLOADER.md already flags this. Verify manually:
- QR from `/wall?setup=1` → must say "Koppla väggskärm"
- QR from `/app?setup=1` → must say "Koppla mobil"
- Unknown device mode → fall back to "Koppla enhet", never wall-specific copy

---

## ⚠️ Known architectural limitations (documented, not bugs)

| Limitation | Status | Notes |
|---|---|---|
| UI and `/api/tasks` use separate state stores | Intentional for now | API writes don't appear in wall/app UI. Needs surfacing to users. |
| `/api/tasks` in-memory state resets on Vercel cold start | Intentional for now | Not durable. Will silently lose state. Document clearly in integration guides. |
| `localStorage` key collision on same origin | Low risk | Multiple HomeBoard preview instances on same domain will bleed state. |
| No conflict resolution for offline sync queue | Intentional for now | Last local action wins. No UI for conflicts. Track as known issue. |
| Supabase Auth and RLS not implemented | Planned | Required before public multi-household production use. |
| Calendar provider login not implemented | Planned | Calendar views return empty until provider integration work is done. |

---

## Suggested PR order

1. `fix/mode-chooser-checkmark` – fix dual-checkmark bug on `/`
2. `fix/adult-view-unlock-hint` – add unlock affordance to Vuxenvy
3. `feat/task-completion-animation` – completion feedback for kids
4. `feat/settings-collapsible-sections` – settings UX cleanup (already planned in BOOTLOADER)
5. `fix/date-picker-input` – replace yyyy-mm-dd with a proper date picker
6. `feat/local-mode-banner` – surface local-mode limitation in UI
7. `polish/task-row-tap-target` – larger touch targets
8. `polish/streak-counter-prominent` – make streak more kid-visible

---

## Mental model (from BOOTLOADER.md – worth keeping visible)

> "Jag sätter upp en familjetavla. Den funkar direkt lokalt. När jag vill kan jag slå på molnsynk och få mobilen/väggskärmen att dela samma hem. Om jag ångrar något är det tydligt vad som händer, och inget viktigt försvinner av misstag."

This should remain the north star for every UX and settings decision.
