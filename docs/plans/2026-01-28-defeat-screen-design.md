# Defeat Screen Redesign

## Overview

Replace the current instant-popup defeat modal with a full-viewport somber defeat experience. The battlefield darkens and desaturates, fallen heroes appear grayed out, and the player is given a quiet moment before choosing to retry or leave. Genus Loci defeats get additional treatment with the boss portrait looming over the fallen party.

## Problem

The current defeat screen is an 11-line modal with "Defeat" in red, one line of generic text, and two buttons. It snaps in instantly with no transition. Victory gets animated multi-step reward reveals, XP floaters, and item drops. Defeat gets a system notification. The result feels soulless and disconnected from the game's "gritty, spirited, unapologetic" brand.

## Design Decisions

- **Tone:** Somber. Let the loss land. Respect the fallen party.
- **Feedback:** Show fallen heroes (grayed out), no stats or enemy HP.
- **Transition:** Slow fade to dark (~1.5s) before content appears.
- **Boss defeats:** Genus Loci defeats are distinct, featuring the boss portrait.

## Files to Modify

1. `src/screens/BattleScreen.vue` - All changes are here. Replace defeat modal with full-viewport defeat scene, add phased transition logic, add defeat styles.

## Defeat Flow

### Phase 1: The Fade (~1.5s)

When `BattleState.DEFEAT` fires, instead of immediately showing a modal:

1. Set `defeatPhase = 'fading'`
2. Add a CSS class (`battle-defeat-fading`) to the battle container
3. The class transitions `filter: grayscale(1) brightness(0.3)` over 1.5s
4. No UI appears during this phase -- the player watches the battlefield drain of color
5. After 1.5s, advance to `defeatPhase = 'reveal'`

### Phase 2: The Reveal (~0.8s, staggered)

Defeat content fades in over the darkened battlefield. Elements appear in sequence, each 200-300ms after the previous:

1. **Fallen hero cards** (all at once as a group)
2. **Defeat heading + flavor text**
3. **Action buttons**

### Phase 3: Player Action

Player chooses "Try Again" (return to map) or "Home." No timers, no auto-dismiss.

## State Management

Replace `showDefeatModal` ref with a phased state:

```js
const defeatPhase = ref(null) // null | 'fading' | 'reveal' | 'complete'
const defeatFlavorText = ref('')

const DEFEAT_LINES = [
  'The darkness claims another party.',
  'Even legends fall.',
  'Silence where battle cries once echoed.',
  'The road ends here... for now.',
  'They gave everything. It wasn\'t enough.',
]
```

### handleDefeat() Changes

```js
function handleDefeat() {
  if (isGenusLociBattle.value) {
    // Key already consumed, no failRun needed
  } else {
    questsStore.failRun()
  }

  // Pick random flavor text
  defeatFlavorText.value = DEFEAT_LINES[Math.floor(Math.random() * DEFEAT_LINES.length)]

  // Phase 1: Start battlefield fade
  defeatPhase.value = 'fading'

  // Phase 2: After fade, reveal content
  setTimeout(() => {
    defeatPhase.value = 'reveal'

    // Phase 3: Mark complete after reveals finish
    setTimeout(() => {
      defeatPhase.value = 'complete'
    }, 800)
  }, 1500)
}
```

## Template Structure

Remove the defeat modal markup (lines 1326-1337). Replace with a full-viewport defeat scene:

```html
<!-- Defeat Scene (replaces modal) -->
<div v-if="defeatPhase" class="defeat-scene">
  <!-- Genus Loci: Boss portrait looming above -->
  <div v-if="isGenusLociBattle && genusLociPortraitUrl" class="defeat-boss-portrait"
       :class="{ visible: defeatPhase !== 'fading' }">
    <img :src="genusLociPortraitUrl" :alt="currentGenusLociName" />
  </div>

  <!-- Fallen party -->
  <div class="defeat-fallen-party" :class="{ visible: defeatPhase !== 'fading' }">
    <div
      v-for="(hero, index) in battleStore.heroes"
      :key="hero.instanceId"
      class="fallen-hero"
      :style="{ '--tilt': (index % 2 === 0 ? -2 : 2) + 'deg' }"
    >
      <HeroCard :hero="hero" compact />
    </div>
  </div>

  <!-- Defeat text -->
  <div class="defeat-text" :class="{ visible: defeatPhase === 'reveal' || defeatPhase === 'complete' }">
    <h2 class="defeat-heading">DEFEAT</h2>
    <p class="defeat-flavor">
      <template v-if="isGenusLociBattle">
        {{ currentGenusLociName }} stands victorious.
      </template>
      <template v-else>
        {{ defeatFlavorText }}
      </template>
    </p>
  </div>

  <!-- Actions -->
  <div class="defeat-actions" :class="{ visible: defeatPhase === 'complete' }">
    <button class="defeat-btn-primary" @click="returnToMap">Try Again</button>
    <button class="defeat-btn-secondary" @click="returnHome">Home</button>
  </div>
</div>
```

## Fallen Party Display

- Uses existing `HeroCard` component with `compact` prop
- Each card wrapped in `.fallen-hero` which applies:
  - `filter: grayscale(1)` and `opacity: 0.6` -- drained of rarity colors
  - Slight tilt via CSS custom property (`--tilt`), alternating 2-3 degrees
  - No HP/MP bars (compact mode, non-combat)
- Cards reveal as a group, not sequentially (sequential belongs to victory's reward anticipation)

## Genus Loci Defeat (Distinct Treatment)

- Boss portrait appears above the fallen party row, using `_portrait.png` assets
- Portrait has a dark red vignette around edges (box-shadow or radial gradient overlay)
- Flavor text replaced with: "{Boss Name} stands victorious."
- Same transition timing and button behavior

### Boss Portrait Loading

Use existing enemy portrait glob import pattern:

```js
const enemyPortraits = import.meta.glob('../assets/enemies/*_portrait.png', { eager: true, import: 'default' })

// In setup, compute the portrait URL when needed
const genusLociPortraitUrl = computed(() => {
  if (!isGenusLociBattle.value) return null
  const bossId = /* genus loci enemy id from battle */
  const path = `../assets/enemies/${bossId}_portrait.png`
  return enemyPortraits[path] || null
})
```

## Styles

```css
/* Battle container fade */
.battle-defeat-fading {
  transition: filter 1.5s ease-out;
  filter: grayscale(1) brightness(0.3);
}

/* Full-viewport defeat scene */
.defeat-scene {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 20px;
}

/* Boss portrait for Genus Loci defeats */
.defeat-boss-portrait {
  opacity: 0;
  transition: opacity 0.6s ease-out;
}

.defeat-boss-portrait.visible {
  opacity: 1;
}

.defeat-boss-portrait img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  box-shadow: 0 0 40px rgba(153, 27, 27, 0.5);
}

/* Fallen heroes */
.defeat-fallen-party {
  display: flex;
  gap: 8px;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.6s ease-out;
}

.defeat-fallen-party.visible {
  opacity: 1;
}

.fallen-hero {
  filter: grayscale(1);
  opacity: 0.6;
  transform: rotate(var(--tilt, 0deg));
}

/* Defeat text */
.defeat-text {
  text-align: center;
  opacity: 0;
  transition: opacity 0.5s ease-out 0.2s; /* 200ms delay after party */
}

.defeat-text.visible {
  opacity: 1;
}

.defeat-heading {
  color: #b91c1c;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0 0 8px 0;
}

.defeat-flavor {
  color: #9ca3af;
  font-size: 0.9rem;
  margin: 0;
}

/* Action buttons */
.defeat-actions {
  display: flex;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.5s ease-out 0.3s; /* 300ms delay after text */
}

.defeat-actions.visible {
  opacity: 1;
}

.defeat-btn-primary {
  padding: 10px 24px;
  border: 1px solid #6b7280;
  border-radius: 8px;
  background: transparent;
  color: #9ca3af;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.defeat-btn-primary:hover {
  background: #374151;
  color: #f3f4f6;
  border-color: #9ca3af;
}

.defeat-btn-secondary {
  padding: 10px 24px;
  border: 1px solid #4b5563;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.defeat-btn-secondary:hover {
  background: #1f2937;
  color: #9ca3af;
}
```

## What Changes

- `handleDefeat()` -- phased transition instead of instant modal
- Template -- full-viewport defeat scene replaces modal markup
- Styles -- defeat-specific classes, battlefield grayscale transition, staggered fade-ins
- Remove `.defeat-modal` markup and styles entirely

## What Doesn't Change

- `returnToMap()` and `returnHome()` navigation functions
- Battle store defeat detection logic
- Quest store `failRun()` behavior
- Victory modal (untouched)
