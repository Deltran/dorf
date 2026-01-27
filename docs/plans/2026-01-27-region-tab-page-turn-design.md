# Region Tab Page Turn Animation Design

## Overview

Add a 3D book-flip animation when clicking region tabs in WorldMapScreen. Currently, tab clicks instantly swap the map (no transition). Region link node clicks already have a horizontal slide animation — the page turn gives tab clicks their own distinct feel.

## How It Works

When a player clicks a region tab, the current map rotates out around its left edge like a book page (rotateY from 0 to -90deg), and the new map rotates in from behind (rotateY from 90deg to 0). Both fade slightly during the turn. `transform-origin: left center` makes the left edge act as the book spine.

## Implementation

### New ref and handler

Add `isTabSwitching` ref alongside the existing `isSliding` ref. Replace the direct `selectedRegion = region.id` tab click with a `handleTabSwitch(region.id)` function that guards against double-clicks, sets the flag, waits for the leave animation (350ms), switches the region, then clears the flag.

```js
const isTabSwitching = ref(false)

function handleTabSwitch(regionId) {
  if (regionId === selectedRegion.value) return
  if (isTabSwitching.value || isSliding.value) return

  isTabSwitching.value = true
  setTimeout(() => {
    selectedRegion.value = regionId
    setTimeout(() => {
      isTabSwitching.value = false
    }, 50)
  }, 350)
}
```

### Transition name

Change the existing `<Transition>` from:

```
:name="isSliding ? 'region-slide' : 'none'"
```

to:

```
:name="isSliding ? 'region-slide' : isTabSwitching ? 'page-turn' : 'none'"
```

### Template change

Change tab click from `@click="selectedRegion = region.id"` to `@click="handleTabSwitch(region.id)"`.

### CSS

```css
.map-section {
  perspective: 1200px;
}

.page-turn-leave-active {
  transition: transform 0.35s ease-in, opacity 0.35s ease-in;
  transform-origin: left center;
}
.page-turn-leave-to {
  transform: rotateY(-90deg);
  opacity: 0;
}

.page-turn-enter-active {
  transition: transform 0.35s ease-out, opacity 0.35s ease-out;
  transform-origin: left center;
}
.page-turn-enter-from {
  transform: rotateY(90deg);
  opacity: 0;
}
```

## Files Modified

- `src/screens/WorldMapScreen.vue` — one new ref, one new function, one template attribute change, CSS additions
