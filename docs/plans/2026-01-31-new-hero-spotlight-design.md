# New Hero Spotlight Animation — Design Document

**Date:** 2026-01-31
**Status:** Approved

## Overview

When a player summons a hero they've never owned before, the normal card reveal pauses for a dramatic "spotlight" takeover. The hero announces themselves with theatrical flair before the reveal continues.

## Trigger Condition

The spotlight triggers on **first-time acquisition of a specific hero template**. If the player has never owned any instance of `aurora_the_dawn`, pulling Aurora triggers the spotlight. Pulling a duplicate Aurora later does not.

## User Flow

1. Player initiates a pull (single or 10-pull)
2. Summoning animation plays, results modal opens
3. Cards begin revealing sequentially (existing behavior)
4. When the reveal reaches a **new** hero:
   - Card-pop animation is skipped for that hero
   - Screen dims, spotlight takeover animates in
   - Hero image + cosmic background + text elements appear with rarity-appropriate drama
   - Player taps anywhere to dismiss
   - Graceful exit animation plays
   - Card reveal resumes from where it left off
5. If multiple new heroes exist in the pull, each gets their own spotlight when reached in sequence

## Visual Design

### Layout

- Full-screen modal overlaying the results screen
- Dark overlay (opacity ~0.95) dims content behind
- Hero image centered, scaled to **200%** (~128px displayed from 64x64 source)
- Cosmic starfield background fills viewport, slowly drifting
- Rarity color tints the starfield with soft vignette/glow around hero
- Text stacked vertically below hero: Name, Epithet, Quote

### Cosmic Background

- Particle field of small stars/motes drifting slowly upward
- Nebula-like color wash using rarity's signature color
- Subtle pulsing glow at center behind the hero
- **4★ enhancement:** Floating arcane particles, slightly faster drift
- **5★ enhancement:** Radiating light rays from behind hero, more particles, gentle golden shimmer overlay

### Rarity Colors

| Rarity | Starfield Tint | Hex |
|--------|----------------|-----|
| 1★ Common | Grey/silver mist | `#9ca3af` |
| 2★ Uncommon | Green nebula | `#22c55e` |
| 3★ Rare | Blue arcane | `#3b82f6` |
| 4★ Epic | Purple magic | `#a855f7` |
| 5★ Legendary | Golden divine | `#f59e0b` |

## Animation Sequence

### Phase 1: Takeover (0.3s)
- Dark overlay fades in quickly
- Starfield begins drifting immediately

### Phase 2: Hero Arrives (0.4s)
- Hero image scales from 0 → 220% → 200% (overshoot bounce)
- Rarity glow pulses outward from behind image
- **4★:** Brief purple flash on arrival
- **5★:** Screen shake (~3px) and golden burst particles radiating outward

### Phase 3: Text Slams In (~0.8s total, staggered)
- **Name** (0.2s): Punches in from slight scale-up, lands with weight
- **Epithet** (0.2s, 0.15s delay): Sweeps in from right, settles beneath name
- **Quote** (0.3s, 0.3s delay): Fades in softly, italicized, smaller text
- **5★:** Name arrival triggers second micro-shake

### Phase 4: Idle
- Background continues drifting
- Subtle breathing pulse on hero glow
- "Tap to continue" hint fades in after 1.5s (small, unobtrusive)

### Phase 5: Exit (0.3s, on tap)
- Hero image scales down slightly while fading
- Text fades out quickly
- Overlay dissolves
- Card reveal resumes after ~0.25s (slight overlap with final fade only)

## Data Model

### New Hero Template Fields

```js
{
  id: 'aurora_the_dawn',
  name: 'Aurora',
  // ... existing fields ...

  epithet: 'The Dawn',
  introQuote: 'Light breaks even the longest darkness.'
}
```

### Fallback Behavior

- Missing `epithet`: Skip that line, show name + quote only
- Missing `introQuote`: Skip that line, show name + epithet only
- Both missing: Show name only (still gets dramatic entrance)

### Tracking "New" Status

- Heroes store already tracks owned instances
- On pull, check if any existing instance shares the same `templateId`
- No match → hero is new → trigger spotlight

## Implementation

### New Component

**`HeroSpotlight.vue`** — Self-contained modal handling:
- Spotlight state and visibility
- All entrance/exit animations
- Starfield background rendering
- Text animation sequencing
- Tap-to-dismiss handling
- Rarity-based styling variants

### GachaScreen.vue Changes

1. Import and mount `HeroSpotlight` component
2. Modify `revealHeroesSequentially()`:
   - Before revealing each hero, check if new (no existing instance with templateId)
   - If new: pause reveal, set `spotlightHero`, wait for dismissal
3. Add state: `spotlightHero` ref (hero being spotlighted, or null)
4. Add handler: `onSpotlightDismiss()` — clears spotlight, resumes reveal

### Heroes Store Addition

```js
// Returns true if player owns any instance of this template
function hasTemplate(templateId) {
  return heroes.value.some(h => h.templateId === templateId)
}
```

### Hero Template Updates

Add `epithet` and `introQuote` to existing hero templates. Can be done incrementally — spotlight functions without them.

### CSS Approach

- All animations via scoped CSS keyframes in `HeroSpotlight.vue`
- Screen shake via CSS transform on wrapper element
- Starfield via CSS animated background or particle divs with animation
