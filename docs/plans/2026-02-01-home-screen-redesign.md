# Home Screen Redesign

**Date:** 2026-02-01
**Status:** Ready for implementation

## Summary

Redesign the home screen to be party-centric, visually confident, and free of AI-generated aesthetic patterns. The goal is a gritty, scrappy home screen that makes players feel connected to THEIR heroes, not a generic gacha menu.

## Context

The current home screen suffers from:
- AI slop aesthetic (12+ gradients, glowing accents, shimmer animations)
- Visual competition (four nav buttons all fighting for attention)
- Redundant UI (footer stats, button hints that explain obvious labels)
- Generic feel (could be any gacha game, nothing says "Dorf")

Brand target: **Gritty. Spirited. Unapologetic.**

## Design Decisions

### 1. Party as Centerpiece

The party IS the home screen. Heroes are the product — what players collected, invested in, want to show off.

- Party section expands to dominate the screen
- Large hero art (not cramped 100x100 slots)
- Heroes are the visual focus, not chrome around them
- Static art for now; 5-star heroes already have animated GIFs

### 2. Battle Background Bleeds Out

The `lastVisitedNode` battle background becomes THE home screen background (heavily darkened at edges).

- Creates personal connection: "This is where I've been fighting"
- Contextual, not generic
- Replaces the animated gradient, dot pattern, and vignette layers
- Falls back to default battle background for new players

### 3. Flatter, 2019-Style Aesthetic

Strip the AI-era visual patterns:

| Remove | Replace With |
|--------|--------------|
| 12+ gradient backgrounds | Solid dark colors, tinted from base palette |
| Glowing icon wrappers | Flat colored backgrounds, subtle borders |
| Shimmer animation on title | Static gold/amber text, heavier weight |
| Pulsing/bouncing gem icon | Static icon, number is the focus |
| Text shadows on colored text | Clean text, proper contrast |
| `box-shadow` glows everywhere | Shadows only for depth, sparingly |

Keep exactly ONE accent glow: on the Summon button (primary action).

### 4. Summon is Primary Action

Visual hierarchy:
1. **Summon** — Dramatically prominent. Unmissable. The thing players tap.
2. **Map Room** — Clearly accessible, but doesn't compete visually.
3. **Fellowship Hall / Goods & Markets** — Tertiary. Present but quiet.

Rationale: Summon is the gacha loop. Map Room is always there; FOMO drives summons.

### 5. Kill Button Hints

Current:
- "Summon" / *"Get new heroes"*
- "Fellowship Hall" / *"Manage heroes"*

New:
- "Summon"
- "Fellowship Hall"

Trust the player. An unapologetic UI doesn't explain obvious labels.

### 6. Remove Footer Stats

The "Total Pulls / Heroes / Quests" footer is:
- Hero metric layout anti-pattern
- Not actionable on a home screen
- Wasted screen real estate

Delete entirely. Show these stats in relevant contexts (pulls on gacha screen, etc.).

### 7. Remove Title Subtitle

"Heroes of the Realm" is placeholder-level copy that adds nothing. Just "Dorf" — confident, minimal.

## Technical Notes

- **Web + Mobile:** Must work with both touch and mouse. No touch-only gestures.
- **No CSS frameworks:** All styling is component-scoped `<style scoped>`
- **Max width:** 600px mobile-first layout
- **Dark only:** No light mode

## What to Keep

- Information architecture (party at top, nav in middle) is sound
- Party section using `lastVisitedNode` background — expand this concept
- Empty state with CTA ("No heroes in party" → Summon button)
- Emoji icons (fits the scrappy brand)

## Implementation Approach

1. Remove cruft first (footer stats, hints, subtitle, animations)
2. Simplify backgrounds (kill gradient layers, extend battle background)
3. Flatten visual styling (solid colors, remove glows)
4. Establish hierarchy (make Summon loud, others quiet)
5. Expand party section (larger hero art, more prominence)
6. Polish pass (spacing, alignment, final details)

## Success Criteria

- [ ] Opening the app feels like looking at YOUR party, not a menu
- [ ] Summon button is unmissable — clear primary action
- [ ] No one would say "AI made this" on first glance
- [ ] Feels gritty and confident, not polished and generic
- [ ] Works on web and mobile without gesture-only interactions

## Out of Scope

- Onboarding flow (first-time summoning tutorial)
- Animated idles for all heroes (5-star only for now)
- Party interactivity (tap hero for options)
