# HomeBoard milestone motion

Daily interactions should stay calm, fast, and predictable.

Rare setup moments should be more visible. Examples include creating a home, turning on cloud sync, adding a member, pairing a wall display, accepting an invite, or finishing first-run setup.

For these moments, show a clear transformation from the old state to the new state. The change should be visible and thoughtfully staged, not only a small toast or a generic spinner.

For cloud sync activation, the UI should visibly move from local-only/device-only to cloud-active/shared-home. The user should understand that HomeBoard has become more capable.

Use lightweight CSS and React state. Avoid heavy animation dependencies. Respect reduced-motion preferences.

Do not apply this level of motion to routine actions such as completing a task, filtering members, opening settings, editing text, or refreshing status.