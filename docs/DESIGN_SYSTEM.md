# HomeBoard Design System

HomeBoard should feel calm, premium, and purpose-built for families. The interface is used in two very different contexts: a wall display seen from across a room and a phone used quickly while moving through the day. The design system favors clarity, warmth, restrained motion, and touch-friendly defaults.

## Emil Kowalski design-engineering baseline

HomeBoard follows Emil Kowalski design-engineering principles as the baseline for restrained product polish. Apply those principles naturally in these areas:

- **Interaction polish:** controls should feel tactile and responsive through semantic elements, precise state styling, and subtle active feedback.
- **Motion restraint:** motion should clarify feedback or state changes, stay lightweight, and prefer transform/opacity over layout-heavy animation.
- **Touch-first UI:** wall and mobile controls should preserve generous hit areas, immediate press feedback, and hover effects only on hover-capable devices.
- **Accessible focus/contrast:** keyboard focus must remain obvious, contrast should hold on warm surfaces, and completed/error states should not rely on color alone.
- **Wall-screen readability:** typography, spacing, progress, and task states should remain legible from across the room.
- **Mobile responsiveness:** the phone experience should stay comfortable one-handed with compact hierarchy, clear filters, and stable app-like interactions.

## Design principles

- **Calm first:** the dashboard should reduce household friction, not add noise.
- **Readable from a distance:** wall UI type, controls, and status should remain legible on a mounted tablet or display.
- **Fast and tactile:** mobile interactions should feel immediate, especially adding and completing tasks.
- **Details compound:** focus rings, touch targets, shadows, and completed states should all quietly reinforce quality.
- **Preview honestly:** mock/local-only behavior should be clear without making the product feel broken.

## Visual tone

- Warm off-white backgrounds with subtle amber and teal atmosphere.
- Dark stone surfaces for primary emphasis and progress moments.
- Soft white cards with gentle borders instead of heavy outlines.
- Rounded geometry that feels family-friendly but still crisp.

## Color palette

- Background: `#fbf7ef`
- Text: `#241c15`
- Primary dark: Tailwind `stone-950`
- Warm accent: Tailwind `amber-300` / `amber-700`
- Success: Tailwind `emerald-500` / `emerald-700`
- Supporting member colors come from mock/member data and should remain saturated enough to identify people quickly.

## Typography

- Use the Geist sans font loaded in the app layout.
- Prefer bold, high-confidence headings for glanceability.
- Wall headings can be very large (`text-6xl` to `text-8xl`) because the wall view is read from a distance.
- Body text should stay relaxed (`leading-6` to `leading-8`) and avoid dense paragraphs in cards.

## Spacing

- Use generous card padding (`p-4` to `p-8`) and consistent gaps (`gap-3`, `gap-4`, `gap-5`).
- Wall sections should breathe more than mobile sections.
- Mobile controls should maintain at least a 44px touch target; `min-h-11` and `min-h-12` are preferred.

## Radius, shadow, and surfaces

- Primary cards use large radii: `rounded-[2rem]` to `rounded-[3rem]`.
- Inner task/event cards use slightly smaller radii: `rounded-[1.35rem]` to `rounded-[1.75rem]`.
- Use the shared `.surface-card` utility for premium white surfaces.
- Avoid heavy blur everywhere. Blur is acceptable on large shells, but cards should rely mostly on opacity, borders, and soft shadows.

## Interaction rules

- Pressable elements should use the shared `.pressable` utility.
- Buttons and interactive cards scale to `0.97` on active press so the UI feels responsive.
- Keep controls semantic: use real `button`, `a`, `input`, and `select` elements.
- Completed tasks should not rely on color alone: use a checkmark, line-through title, changed surface, and `aria-pressed`.
- Focus states must be visible and high contrast.

## Motion rules

HomeBoard motion follows a restrained design-engineering standard inspired by Emil Kowalski's UI craft guidance:

- Animate only when it improves feedback, state clarity, or prevents jarring changes.
- Prefer CSS transitions over JavaScript animation for common UI.
- Use custom easing tokens:
  - `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` for responsive UI feedback.
  - `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` for movement between states.
  - `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` for future drawer-like surfaces.
- Keep button feedback around `100–160ms`.
- Keep card/state transitions around `150–250ms`.
- Avoid normal UI animations over `300ms`.
- Do not use `ease-in` for responsive controls.
- Animate transform, opacity, color, border, and shadow; avoid layout-property animation.
- Gate hover lift effects behind hover-capable devices.
- Respect `prefers-reduced-motion` globally.

## Accessibility rules

- All interactive elements need visible focus states.
- Touch targets should generally be at least 44px tall/wide.
- Maintain text contrast on warm surfaces.
- Do not communicate important state with color alone.
- Keep wall controls large enough for fingers and readable enough for distance viewing.

## Wall screen rules

- The wall route is the main product surface.
- Prioritize today's date, current time, household progress, agenda, and grouped tasks.
- Avoid tiny controls, dense metadata, or noisy filter controls.
- Use high-contrast task completion affordances.
- The wall should feel like a mounted family hub, not an admin dashboard.

## Mobile rules

- The mobile route should feel app-like and fast.
- Add-task flow should stay visible and quick.
- Filters should be compact but not cramped.
- Task cards should feel tactile with immediate feedback.
- Keep controls comfortable for one-handed use.

## Future dark mode notes

Dark mode should not simply invert colors. It should preserve the warm HomeBoard tone with deep stone backgrounds, softer amber accents, lower-contrast borders, and member colors tuned for readability on dark surfaces. Add dark mode after the core product states are stable.
