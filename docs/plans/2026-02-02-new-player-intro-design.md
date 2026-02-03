# New Player Introduction Design

## Overview

A cinematic introduction sequence for new players that establishes the world of Veros, gives them two starter heroes via spotlight reveals, and guides them into their first battle.

## Flow

```
App Launch (new player detected)
        ↓
┌─────────────────────────┐
│   NARRATIVE SCREEN 1    │  "The land of Veros is dying..."
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│   NARRATIVE SCREEN 2    │  "The kingdoms have fallen silent..."
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│   NARRATIVE SCREEN 3    │  "Your journey begins..."
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│   KENSIN SPOTLIGHT      │  3-star starter hero reveal
│   "Kensin joins your    │
│    cause."              │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│   4-STAR SPOTLIGHT      │  Random 4-star gift reveal
│   "[Name] joins your    │
│    cause."              │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│   BATTLE PROMPT         │  "Dark Thicket awaits..." → [Begin]
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│   FIRST BATTLE          │  forest_01 (standard battle flow)
└─────────────────────────┘
        ↓
   Victory?
   ├── Yes → VICTORY OUTRO → Home Screen
   └── No  → DEFEAT MESSAGE → [Try Again] [Go Home]
```

## Narrative Content

### Screen 1
> *The land of Veros is dying.*
>
> *A creeping darkness spreads from the east — corrupting forests, twisting beasts, waking ancient evils that should have slept forever.*

### Screen 2
> *The kingdoms have fallen silent. Their armies broken. Their heroes scattered.*
>
> *But not all hope is lost. Those who still fight seek a commander worthy of leading them against the shadow.*

### Screen 3
> *Your journey begins in the Whispering Woods — where the corruption first took root, and where the first blow against it must be struck.*
>
> *Rally the fallen. Command the brave. Reclaim Veros.*

## Hero Reveals

### Kensin (Starter Hero)
- Transition text: *"A stalwart defender stands ready..."*
- Reuse `HeroSpotlight.vue` component
- 3-star silver glow treatment
- Add text overlay: *"Kensin joins your cause."*
- Auto-added to party slot 1

### Random 4-Star (Gift Hero)
- Transition text: *"...and another answers your call."*
- Reuse `HeroSpotlight.vue` component
- 4-star purple glow with enhanced effects
- Add text overlay: *"[Hero Name] joins your cause."*
- Random selection from existing 4-star pool (normal gacha pool)
- Auto-added to party slot 2

## Battle Prompt

After hero reveals:
- Text: *"The Whispering Woods await. Darkness gathers at the Dark Thicket..."*
- Single button: **[Begin]**
- Loads `forest_01` battle directly (skips world map navigation)

## Post-Battle

### Victory Outro
After standard victory rewards screen, one additional narrative screen:

> *The first shadow has fallen. But the darkness runs deep.*
>
> *Your journey has only begun.*

- "Continue" button leads to home screen
- Player now has full app access

### Defeat Screen
Custom defeat overlay for intro battle only:

- Text: *"The shadow is strong... but so are you."*
- Two buttons:
  - **[Try Again]** — Restarts forest_01 battle
  - **[Go Home]** — Exits to home screen

Either choice marks intro as complete.

## Visual Treatment

### Narrative Screens
- Full-screen overlay
- Dark atmospheric background (Whispering Woods map art, dimmed)
- Centered text, readable font
- Text fades in (0.5s per paragraph)
- Subtle particle effect (floating ash/embers)
- Dark vignette around edges
- No UI chrome — immersive, cinematic feel
- Tap anywhere or "Continue" button to advance

### Hero Spotlights
- Reuse existing `HeroSpotlight.vue` from gacha system
- Add "joins your cause" text overlay for intro context
- Kensin: 3-star silver glow
- 4-star: Purple flash, enhanced glow effects

## Technical Notes

### Trigger Condition
- Intro triggers when `hasSaveData()` returns false (new player)
- Uses existing detection in `App.vue`

### State Management
- Both heroes added to `heroesStore` during reveal sequence
- Both heroes placed in party (slot 1: Kensin, slot 2: 4-star)
- Intro completion tracked to prevent re-triggering

### Skippability
- Not skippable
- Sequence is brief (~45 seconds) and includes useful rewards

### Party State After Intro
- Slot 1: Kensin (3-star Knight, starter)
- Slot 2: Random 4-star (intro gift)
- Slots 3-4: Empty

## Implementation Components

1. **IntroScreen.vue** — New component managing the intro flow
2. Reuse **HeroSpotlight.vue** — Existing component for hero reveals
3. Modify **App.vue** — Route new players to intro instead of home
4. Modify **initNewPlayer()** — Coordinate with intro flow for hero creation
