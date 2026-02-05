# Multiple Party System Design

## Overview

Allow players to create and switch between 3 preset party configurations. Parties can be named, have independent hero slots, and each has its own leader.

## Data Model

### Store Changes (`heroes.js`)

**Current structure:**
```js
const party = ref([null, null, null, null])
const partyLeader = ref(null)
```

**New structure:**
```js
const parties = ref([
  { id: 1, name: 'Party 1', slots: [null, null, null, null], leader: null },
  { id: 2, name: 'Party 2', slots: [null, null, null, null], leader: null },
  { id: 3, name: 'Party 3', slots: [null, null, null, null], leader: null }
])
const activePartyId = ref(1)
```

### Computed Helpers

- `activeParty` — returns the currently selected party object
- `party` — backward-compat alias pointing to `activeParty.slots`
- `partyLeader` — backward-compat alias pointing to `activeParty.leader`
- `partyHeroes` — already works via `party`, no change needed

### New Actions

- `setActiveParty(id)` — switch active party
- `renameParty(id, name)` — update party name

## UI Components

### HomeScreen — Swipe Carousel

- The `party-preview` section becomes a horizontal swipe carousel
- Swipe left/right to cycle through parties (wraps 1 → 2 → 3 → 1)
- Dot indicators below the party grid (3 dots, active highlighted)
- No tabs, no buttons — swipe and dots only

**Implementation:**
- CSS `scroll-snap` on horizontal container with 3 party "pages"
- `IntersectionObserver` or scroll position to detect active party
- On snap settle, call `setActiveParty()` to sync store

```
┌─────────────────────────┐
│      Your Party         │
│  ┌───┬───┬───┬───┐      │
│  │ 🧙 │ ⚔️ │ 🛡️ │ 💚 │      │  ← swipe left/right
│  └───┴───┴───┴───┘      │
│        ● ○ ○            │  ← dot indicators
└─────────────────────────┘
```

### HeroesScreen (Fellowship Hall) — Tabs

- Tabs appear above the party slots: `[ Party 1 | Party 2 | Party 3 ]`
- Active tab visually highlighted (underline or background accent)
- Tap tab → switch to that party
- Long-press tab → inline rename (text becomes input field)

```
┌─────────────────────────────────┐
│  Party 1   Party 2   Party 3   │  ← tabs
│  ────────                       │  ← active indicator
├─────────────────────────────────┤
│  ┌───┬───┬───┬───┐              │
│  │ 👑 │   │   │   │  Party slots│
│  └───┴───┴───┴───┘              │
└─────────────────────────────────┘
```

Leader badge (👑) continues to work since `partyLeader` points to active party's leader.

### Quest Details — Arrow Carousel

- Arrow buttons flank the party preview: `‹` on left, `›` on right
- Party name centered above the party preview
- Hero images: use portrait if available, otherwise scale down regular image

```
┌───────────────────────────────┐
│        Dark Thicket           │
│    Enemies: Goblin x3         │
├───────────────────────────────┤
│         Party 1               │
│   ‹  [🧙][⚔️][🛡️][💚]  ›      │
├───────────────────────────────┤
│      [ Start Battle ]         │  ← disabled if party empty
└───────────────────────────────┘
```

**Behavior:**
- Tap `‹` → previous party (wraps 1 → 3)
- Tap `›` → next party (wraps 3 → 1)
- Switching updates `activePartyId` in store
- Empty party → "Start Battle" button disabled

## Empty Party Handling

- All 3 parties always shown in all UI contexts
- Players can switch to empty parties freely
- Battle button disabled when active party has no heroes
- Encourages players to fill slots without blocking exploration

## Persistence & Migration

### Storage

- `parties` array and `activePartyId` saved via `storage.js`
- Saved on any party change (slot, leader, rename, active switch)

### Migration (existing players)

On load, if old `party` + `partyLeader` format detected:
1. Copy into `parties[0]` (Party 1)
2. Set `activePartyId = 1`
3. Parties 2 and 3 start empty
4. Clear old format from storage

### New Players

- 3 empty parties created on first load
- `activePartyId = 1` (Party 1 active)
- Intro flow uses `setPartySlot()` which writes to active party
- Town Guard → Party 1, slot 0
- Random 4-star → Party 1, slot 1
- Parties 2 and 3 remain empty

No changes needed to `intro.js` — backward-compat aliases handle it.

## Backward Compatibility

Existing code using `heroesStore.party` and `heroesStore.partyLeader` continues to work via computed aliases. Battle system, quest system, etc. don't need changes.

## Future Considerations (not in scope)

- HeroesScreen visual refresh — compact hero display in party slots instead of full cards
- More than 3 party slots (if players request)
