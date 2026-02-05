# Party Screen Redesign

## Overview

Redesign the party management screen to be less cramped, eliminate layout jitter, and show hero images more prominently without card chrome.

## Goals

1. Replace full HeroCard components with frameless hero images
2. Eliminate jitter caused by leader skill bar appearing/disappearing
3. Maintain all existing functionality (tabs, picker, leader selection, removal)

## Layout Structure (top to bottom)

1. **Header** — Back button + "Party" title (unchanged)
2. **Party tabs** — Party 1/2/3 with long-press rename (unchanged)
3. **Synergy bar** — Role counts + synergy message (unchanged)
4. **Leader skill bar** — Always visible, reserved space
5. **Party grid** — 2x2 frameless hero images
6. **Action buttons** — Auto-Fill, Manage Heroes (unchanged)

## Hero Slots

### Filled Slot
- Hero image/GIF displayed directly, no background box or border
- Image sized to fill slot area
- Rarity indicated by subtle glow/drop-shadow in rarity color
- Leader crown (👑) floats top-right when hero is party leader
- Tap image to toggle leader status
- Visible "Remove" button below image

### Empty Slot
- Dashed border box (current style)
- "+" icon and "Add Hero" label
- Tap to open hero picker sheet

## Leader Skill Bar

Always-visible bar with fixed height to prevent layout reflow.

### When leader is set:
- Crown icon + skill name + description
- Gold gradient border, subtle glow (current styling)

### When no leader:
- Same height/padding reserved
- Dimmed crown + "Tap a hero to set as leader"
- Muted gray styling

## Unchanged Elements

- Party tabs with long-press rename
- Synergy bar layout (role icons + counts left, message right)
- Hero picker bottom sheet
- Action buttons (Auto-Fill, Manage Heroes)
- Placement bar (when placing from Heroes screen)

## Future Work

- Dorf-flavored synergy messages (terse, thematic copy)
