# Skill Panel V2 Design

> Redesign of the combat skill selection UI with a right-aligned panel, integrated description, and Dorf-authentic aesthetic.

## Overview

Replace the current bottom-sheet skill panel with a right-aligned overlay that:
- Hugs the right side of the content area (50% width)
- Shows skill descriptions on the left (50% width) on hover
- Never scrolls — panel grows to fit content
- Maintains Dorf's gritty, dark fantasy aesthetic

## Layout Structure

**Container:** Full-screen overlay with:
- **Backdrop:** 100% screen coverage, 60% opacity black, click-to-close
- **Content area:** Constrained to the 600px max-width content container

**Two zones within content area:**
- **Left zone (description):** 50% of content width, only visible when hovering a skill
- **Right zone (skills):** 50% of content width, always visible when panel is open

**Height behavior:**
- No max-height, no scrolling
- Panel height = skill list height (auto-sizing)
- Max 6-8 skills at ~40px each + gaps = ~350-400px worst case

## Visual Design

### Skills Panel (Right Zone)

**Shape & Surface:**
- Sharp edges with single **chamfered corner** (top-left, 45°) — torn page / weapon edge feel
- Background: `#111827` with 2-3% opacity noise texture
- **Left border accent:** 3px solid, hero's class color
- **1px inset border** in `#374151` — carved, not floating
- No drop shadow, no rounded corners

**Skill Rows:**
- No background on default — text on dark surface
- Separated by faint 1px horizontal rules (`#374151`)
- Skill name only — no cost badge (cost shows in description)
- Hover: name shifts right 4px (transform), left border lights up in class color
- Disabled: strikethrough on name + muted color

**Resource Display:**
- Single tight line above skill list
- Icon + value only (e.g., `⚡ 45/60`) — no label, no bar

### Description Panel (Left Zone)

**Entrance:**
- Slides in from left edge of content area
- 150ms, expo easing
- Skills column stays put

**Visual:**
- Same `#111827` background — continuous surface with skills panel
- Continuous noise texture, no visible seam
- Left edge: subtle vertical gradient fade (5% lighter → dark)

**Content:**
- **Skill name:** Bold, 1.1rem, class-colored
- **Cost line:** Compact — "25 MP" or "Consumes Focus" or "Free"
- **Description:** `#9ca3af`, line-height 1.5
- **Target type:** Small tag — "Single Enemy", "All Allies", "Self"
- Tight 12px padding

**Empty state:** Panel doesn't exist. No placeholder.

## ActionBar

**Simplified trigger:**
- Single element: `⚔️ Darl` (class icon + hero name)
- Tapping opens skill panel
- Below in muted text: "tap to select skill"
- When stunned: name struck through, not tappable

**Implicit attack:**
- Enemies remain tappable for basic attack when panel closed
- "tap enemy to attack" hint visible in ActionBar

## Interactions

**Panel open/close:**
- Open: Tap hero name → panel slides up from bottom-right
- Close: Tap backdrop, select a skill, or tap hero name again
- No X button

**Description hover:**
- Mouse: `mouseenter` shows, `mouseleave` hides
- Touch: `touchstart` shows, stays until another skill touched or panel closes

**Skill selection:**
- Tap skill → panel closes immediately → targeting mode begins

## Animation

| Element | Duration | Easing | Transform |
|---------|----------|--------|-----------|
| Panel entrance | 200ms | expo out | `translateY(100%)` → `translateY(0)` |
| Backdrop fade | 150ms | expo out | opacity 0 → 1 |
| Description slide | 150ms | expo out | `translateX(-100%)` → `translateX(0)` |
| Skill hover | 100ms | ease | `translateX(0)` → `translateX(4px)` |

**Expo easing:** `cubic-bezier(0.16, 1, 0.3, 1)`

## Reduced Motion

When `prefers-reduced-motion: reduce`:
- All transitions: `none`
- Transforms: reset to final state
- Functionality unchanged

## Class Colors (for borders/accents)

| Class | Color |
|-------|-------|
| Berserker | `#ef4444` (red) |
| Knight | `#3b82f6` (blue) |
| Mage | `#a855f7` (purple) |
| Cleric | `#22c55e` (green) |
| Ranger | `#f59e0b` (amber) |
| Bard | `#ec4899` (pink) |
| Paladin | `#fbbf24` (gold) |
| Druid | `#10b981` (emerald) |

## Files to Modify

- `src/components/SkillPanel.vue` — complete rewrite
- `src/components/ActionBar.vue` — simplify to hero name trigger
- `src/screens/BattleScreen.vue` — update integration, pass class color

## Out of Scope

- Basic Attack in skill list (implicit attack via enemy tap is sufficient)
- Skill reordering or grouping
- Keyboard navigation (future enhancement)
