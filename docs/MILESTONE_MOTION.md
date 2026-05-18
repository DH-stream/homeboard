# Milestone motion

HomeBoard should feel calm and fast during daily family use, but rare setup milestones should feel like the product transforms in front of the user.

## Everyday motion

Use restrained, responsive motion for actions families do often:

- completing tasks
- filtering members
- opening Settings
- refreshing cloud status
- changing small device preferences

Everyday motion should be short, tactile, and mostly use `transform` and `opacity`. It should confirm the UI heard the user without slowing the household down.

## Milestone motion

Milestone motion is allowed to be longer and more ceremonial because the user sees it rarely. Examples:

- activating cloud sync
- creating a home
- adding the first member
- pairing a wall screen
- first setup
- inviting someone
- completing an invite or pairing approval

Milestones should not feel like a generic form submit, toast, or spinner. They should show a clear before → during → after transformation with purposeful copy, color, and spatial cues.

## Reference implementation: Settings cloud activation

The first reference milestone is activating cloud sync from Settings.

- Before: amber/local/device-only state.
- During: a staged transformation that prepares cloud sync, connects this device to the home, builds the shared family view, and confirms cloud sync is active.
- After: calm emerald/cloud-active/shared-home state.

This uses lightweight React state plus CSS animation only. It intentionally avoids heavy animation dependencies and keeps daily Settings actions fast.

## Reduced motion

Respect `prefers-reduced-motion`. Reduced-motion users should still get the same state progression through color, status, and copy changes, but movement, shine, and scaling should be minimized.
