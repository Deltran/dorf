# Summon Screen Redesign

## Overview

Redesign the GachaScreen to prioritize the thrill of summoning over information display. Replace the scrolling dashboard layout with an immersive dark altar ritual that fits in viewport and matches the HeroSpotlight aesthetic.

## Design Goals

1. **No scrolling** — Everything fits in viewport, pull buttons always visible
2. **Thrill-first** — Rates/pity/pool hidden until requested
3. **Dark altar aesthetic** — Stone, embers, warm light on black (matches HeroSpotlight)
4. **Black Market as discovery** — Hidden door, not a tab

## Layout Structure

```
┌─────────────────────────────────┐
│  ‹ Back          💎 1,234       │  ← Header (compact)
├─────────────────────────────────┤
│                                 │
│      ┌─────────────────┐        │
│      │                 │        │  ← Banner in stone frame
│      │  [Banner Image] │        │
│      │                 │        │
│      └─────────────────┘        │
│   ◂                        ▸    │  ← Styled stone arrow buttons
│                                 │
│      "Wanderer's Call"          │  ← Banner name (plaque style)
│       5 days remaining          │  ← Availability text
│                                 │
│  ┌────────────────────────────┐ │
│  │ ░░░░░░░▓▓▓▓▓ Altar ▓▓▓▓▓░░ │ │  ← Altar surface with embers
│  └────────────────────────────┘ │
│                                 │
│  ┌────┐  ┌────────────────────┐ │
│  │ ×1 │  │   ×10  ·  💎 1600  │ │  ← Pull buttons (30/70 split)
│  └────┘  └────────────────────┘ │
│                                 │
│              (?)                │  ← Info button (rates/pity/pool)
└─────────────────────────────────┘
          ◐ (shadow/door)           ← Black Market entrance (subtle)
```

## Visual Aesthetic

### Palette

| Element | Color |
|---------|-------|
| Background | Near-black `#0a0a0a` to `#121212` gradient |
| Stone frame | Dark grays `#1a1a1a` with subtle `#2a2520` warm tint |
| Embers | `#ffb020` (gold), `#ff6030` (orange), `#ff3010` (red) |
| Text | `#e5e5e5` primary, `#6b6b6b` secondary |
| Accents | Rarity colors only — no purple cosmic glow |

### Textures

- Stone frame: beveled edges, weathered look (CSS gradients + shadows)
- Altar surface: faint cracks/texture, ember particles drift upward
- Vignette around edges darkens corners
- No twinkling stars, no pulsing glows, no gradient backgrounds

### Banner Frame

- Thick stone border (~12px visual weight)
- Inner shadow to make banner image feel recessed
- Faint warm glow from below (as if lit by altar fire)

### Pull Buttons

- Single pull (30% width): Flat dark stone, minimal styling
- 10-pull (70% width): Richer texture, ember glow on edges, "Guaranteed 4★+" badge
- Disabled state: Desaturated, embers extinguished, `opacity: 0.4`

## Interactions

### Banner Navigation

- Stone chevron arrows, inset into frame edges
- Hover/tap: warm glow, slight scale up
- Swipe gesture works on touch (banner image area)
- Banner transition: crossfade, ~0.3s ease-out

### Pull Button States

- Idle: 10-pull has faint ember particles along bottom edge
- Hover: Glow intensifies, button lifts (`translateY(-2px)`)
- Pressed: Button depresses, embers flare

### The Summon Ritual

1. Button depresses, gems float from counter toward altar (~0.4s)
2. Altar surface flares — ember burst, light blooms (~0.6s)
3. Screen darkens to black (~0.3s fade)
4. Transition to reveal sequence

### Info Sheet

- Slides up from bottom (standard mobile sheet pattern)
- Contains: current banner pool, pity bars, rate table
- Tap outside or swipe down to dismiss
- Contextual: shows pool for selected banner, pity for banner type

## Reveal Sequence

### Single Pull

Altar ignites → fade to black → full HeroSpotlight

### 10-Pull

1. Altar ignites → fade to black
2. Card reveal stage (dark background):
   - Cards fly in from above, land with subtle impact
   - Timing: ~0.25s for 1-3★, ~0.4s for 4★, ~0.5s for 5★
   - Card shows portrait, name, stars, rarity glow
   - Tap to speed up / advance
3. NEW hero appears → sequence pauses:
   - Card flashes, zooms to full HeroSpotlight
   - After dismiss, returns to sequence
4. After all 10: compact 2×5 summary grid, "Continue" button

### Skip Option

- "Skip" button visible during sequence
- Skipping shows summary grid immediately
- NEW heroes can still be tapped in grid to trigger spotlight

## Black Market

### Discovery

- Small shadow/crack icon in bottom-right corner
- Only visible after `blackMarketUnlocked` is true
- Icon: `🌑` or subtle fissure
- Faint red/green ember occasionally drifts from it

### Transition

- Tap shadow → main altar slides left, Black Market slides in from right
- ~0.4s transition, feels like entering hidden alcove

### Visual Corruption

Same layout, corrupted palette:
- Stone darker, cracked, green-black tint
- Embers become sickly green `#40ff60` or blood red `#ff2020`
- Frame has thorned or corroded edges

### Navigation

- Back arrow or swipe right to return to normal altar
- Black Market banners cycle with same arrow/swipe pattern
- Info sheet shows Black Market pity (separate from normal)

## What's Removed

- Tab bar (Summon / Black Market)
- Scrolling
- Rates section on main view
- Pity progress bars on main view
- Purple gradient background
- Twinkling star particles
- Pulsing ring summon animation

## Technical Notes

- Reuse ember particle system from HeroSpotlight
- Banner images already exist, just need new frame styling
- BlackMarketContent component can be adapted for new layout
- Info sheet is new component (SummonInfoSheet.vue)
- Swipe detection: use touch events, not a library

## Success Criteria

1. No vertical scrolling required on any mobile viewport (≥568px height)
2. Pull buttons visible without scrolling on load
3. Visual cohesion with HeroSpotlight (same palette, ember system)
4. Black Market discoverable but not competing for attention
5. 10-pull reveal completes in <15s without skipping
6. All existing functionality preserved (pulls, pity, banners, pool view)
