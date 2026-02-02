# Mobile-First Battle Screen Redesign

**Date:** 2026-02-02
**Status:** Approved

## Problem

Testing on physical Android device revealed the battle screen doesn't fit properly on mobile:
- Hero info cards overflow horizontally (left/right heroes cut off screen)
- Action bar skill buttons too close together, easy to mis-tap
- Skill tooltips shift button positions when they appear, causing mis-taps
- Overall: UI feels designed for desktop and squeezed onto mobile

## Design Direction

**Streamlined:** Show less, make what's visible bigger and tappable, hide details behind taps.

## Hero Display

### Current
- Large info cards below each hero showing: HP label + numbers, resource label + numbers, status icons
- Cards overflow screen width with 4 heroes

### New
- **Sprites stay as-is** in the battlefield area
- **Status icons** overlay the hero sprite (top-left or top-right corner)
- **Info panel shrinks to:**
  - HP bar (no label, no numbers visible)
  - Resource bar (thinner, below HP, no label)
- **Tap hero sprite** opens detail sheet (bottom drawer) with:
  - Full stats (ATK, DEF, SPD)
  - HP/MP numbers
  - Status effect details with durations
- **Active turn** indicated by glow/border on sprite (already exists)

### Result
All 4 heroes fit on screen without overflow. Details available on demand.

## Enemy Display

### Current
- Sprite with HP bar below
- Status badges (shield + buff indicators) below HP bar

### New
- **Status icons overlay** the enemy sprite (top corner, matching heroes)
- **HP bar** stays below sprite
- **Tap enemy** to basic attack or target for skill
- **Long-press enemy** for detail popup with full stats/status

### Result
Consistent with hero display. Slightly more compact vertically.

## Action Bar

### Current
- Wide bar showing: hero name, "tap enemy to attack" instruction, small "Skills" button
- Skills expand with buttons too close together
- Tooltips shift button positions when appearing

### New
- **Compact bar:** `[ class-icon  Hero Name          [Skills] ]`
- **Remove** "tap enemy to attack" instruction (learned naturally or via onboarding)
- **Skills button** opens overlay panel *above* the action bar
- **Skill grid:** 2 columns, dynamic rows
  - 4 skills: 2x2 grid
  - 5 skills: 2x3 grid (one empty)
  - 6 skills: 2x3 grid
- **Touch targets:** ~60px minimum, comfortable spacing
- **Tooltips** appear as floating overlay *above* skill buttons — **never shift button positions**
- **Collapse:** Tap outside panel or tap Skills button again

### ASCII Mockup

Default state:
```
[ shield-icon  Fennick                [Skills] ]
```

Skills expanded:
```
+-----------------------------+
|  [Skill 1]    [Skill 2]     |  <- overlay panel
|  [Skill 3]    [Skill 4]     |
+-----------------------------+
[ shield-icon  Fennick                [Skills] ]
```

## Combat Log

### Current
- Shows ~5 lines of combat history at bottom of screen
- Takes ~15% of screen real estate

### New
- **Single line by default** showing most recent action
- **Tap to expand** scrollable history
- Expanded history length TBD (likely 10-15 lines with scroll)

## Turn Tracker

**No changes.** Vertical portrait list on left side is working — compact and out of the way.

## Summary of Changes

| Element | Current | New |
|---------|---------|-----|
| Hero info panels | Large cards with labels + numbers | HP/resource bars only, no labels |
| Hero status icons | In info panel | Overlay on sprite corner |
| Enemy status icons | Below HP bar | Overlay on sprite corner |
| Action bar | Wide with instruction text | Compact name + Skills button |
| Skill panel | Inline expansion | Overlay above action bar |
| Skill tooltips | Shift buttons when appearing | Float above, fixed position |
| Combat log | 5 lines always visible | 1 line default, tap to expand |

## Implementation Notes

- Touch target minimum: 48-56px for important actions, 60px+ for skill buttons
- Status icon size: 16-20px when overlaid on sprites
- Hero info panel height target: ~30-40px (down from ~100px)
- Tooltips must be absolutely positioned overlays, not inline elements
