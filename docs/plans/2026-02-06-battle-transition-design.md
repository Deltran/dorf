# Battle Transition Animation Design

## Overview

A "closing doors" transition animation that plays every time the player enters combat. Two dark panels slide in from left and right, meet in the center, the battle screen loads behind them, then the doors open to reveal the battlefield.

## Timing

| Phase | Duration | Total elapsed |
|-------|----------|---------------|
| Doors close | 0.4s | 0.4s |
| Hold (closed) | 0.4s | 0.8s |
| Doors open | 0.7s | 1.5s |

Total: ~1.5 seconds.

## Assets

- **Image**: `src/assets/backgrounds/battle_door.png` (300x1000, user-provided)
- Left panel uses the image as-is
- Right panel mirrors it with `transform: scaleX(-1)`
- Displayed with `background-size: cover; background-position: center`

## Architecture

### Component: `BattleTransitionOverlay.vue`

A full-screen overlay with two door panels. Placed in App.vue *outside* the screen switcher so it renders on top of everything.

**Props:**
- `active` (Boolean) — triggers the close/open sequence

**Emits:**
- `screenSwap` — fired when doors are fully closed (App.vue switches screen here)
- `complete` — fired when doors are fully open (battle can start turns)

**Internal state machine:**
- `idle` → `closing` → `closed` → `opening` → `idle`

**Animation approach:** CSS transitions on `transform: translateX()`. Left door starts at `-100%` (off-screen left), animates to `0`. Right door starts at `100%`, animates to `0`. Opening reverses this. The `transition-duration` changes per phase (0.4s close, 0.7s open). The hold phase is a `setTimeout` between closed→opening.

### App.vue Changes

**New state:**
```js
const battleTransitionActive = ref(false)
const battleTransitionCallback = ref(null)
```

**New helper:**
```js
function transitionToBattle(setupFn) {
  if (setupFn) setupFn()          // set context refs
  battleTransitionActive.value = true
}
```

**Replace all 5 battle entry points** to use `transitionToBattle`:

```js
function startBattle() {
  transitionToBattle(() => {
    genusLociBattleContext.value = null
    colosseumBattleContext.value = null
  })
}

function startColosseumBattle(bout) {
  transitionToBattle(() => {
    genusLociBattleContext.value = null
    colosseumBattleContext.value = { bout }
  })
}
// ... same pattern for startMawBattle, startGenusLociBattle, handleIntroStartBattle
```

**Event handlers on the overlay:**
```html
<BattleTransitionOverlay
  :active="battleTransitionActive"
  @screenSwap="currentScreen = 'battle'"
  @complete="onBattleTransitionComplete"
/>
```

`onBattleTransitionComplete` sets `battleTransitionActive = false` and signals the battle store to begin turns.

### Battle Store Changes

**New ref and function:**
```js
const waitingForTransition = ref(false)

function signalTransitionComplete() {
  if (waitingForTransition.value) {
    waitingForTransition.value = false
    startNextTurn()
  }
}
```

**Modify `initBattle` ending** (line 2679-2682):
```js
// Before:
state.value = BattleState.STARTING
setTimeout(() => startNextTurn(), 500)

// After:
state.value = BattleState.STARTING
waitingForTransition.value = true
```

If `signalTransitionComplete` is never called (e.g., multi-battle sequences within BattleScreen where there's no App.vue transition), we add a fallback: BattleScreen calls `signalTransitionComplete()` directly for mid-node battle restarts (the `startCurrentBattle()` calls on lines 627 and 1012).

### BattleScreen Changes

For **multi-battle sequences** (next wave within same node) and **replays**, BattleScreen calls `battleStore.signalTransitionComplete()` after `startCurrentBattle()` since those don't go through App.vue's transition:

```js
// In nextBattle() and handleReplay()
startCurrentBattle()
nextTick(() => battleStore.signalTransitionComplete())
```

The initial mount does NOT call this — App.vue's transition handles it.

## Sequence Diagram

```
Player taps Fight
  → App.vue: transitionToBattle()
    → battleTransitionActive = true
    → Overlay: state = 'closing', doors slide in (0.4s)
    → Overlay emits 'screenSwap'
      → App.vue: currentScreen = 'battle'
      → BattleScreen mounts, runs initBattle()
      → Battle state = STARTING, waitingForTransition = true
    → Overlay: hold (0.4s)
    → Overlay: state = 'opening', doors slide out (0.7s)
    → Overlay emits 'complete'
      → App.vue: battleStore.signalTransitionComplete()
      → Battle: startNextTurn() fires, combat begins
```

## Edge Cases

- **Multi-battle nodes**: BattleScreen handles internally — calls `signalTransitionComplete()` directly after `startCurrentBattle()`, no door animation for wave transitions.
- **Replay button**: Same as multi-battle — direct signal, no doors.
- **Intro battle**: Uses same `transitionToBattle()` path as all others.
- **Fast tapping**: `transitionToBattle` is a no-op if `battleTransitionActive` is already true.
- **Missing image**: Doors fall back to solid `#0a0e17` background color.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/BattleTransitionOverlay.vue` | **Create** — transition overlay component |
| `src/App.vue` | **Modify** — add overlay, refactor battle entry points |
| `src/stores/battle.js` | **Modify** — add `waitingForTransition`, `signalTransitionComplete`, change `initBattle` ending |
| `src/screens/BattleScreen.vue` | **Modify** — call `signalTransitionComplete` for multi-battle/replay paths |
| `src/stores/__tests__/battle-transition.test.js` | **Create** — test transition signaling in battle store |
| `src/components/__tests__/BattleTransitionOverlay.test.js` | **Create** — test overlay state machine and emissions |

## Testing Strategy

**Unit tests (battle store):**
- `initBattle` sets `waitingForTransition = true` and does NOT call `startNextTurn`
- `signalTransitionComplete` calls `startNextTurn` when `waitingForTransition` is true
- `signalTransitionComplete` is a no-op when `waitingForTransition` is false
- Exported from store for external callers

**Component tests (overlay):**
- Setting `active=true` emits `screenSwap` after close duration
- Emits `complete` after full sequence (close + hold + open)
- Does not emit when `active=false`
- Re-triggering while active is ignored

**Integration (manual):**
- Transition plays from WorldMap → Battle
- Transition plays from Colosseum → Battle
- Transition plays from Maw → Battle
- Transition plays from GenusLoci → Battle
- Transition plays from Intro → Battle
- Multi-battle waves within a node do NOT show doors
- Replay does NOT show doors
