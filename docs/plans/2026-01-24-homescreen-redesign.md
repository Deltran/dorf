# Homescreen Redesign

## Overview

Reorganize the homescreen to group related features into category hubs, reducing clutter and improving navigation clarity.

## Design Goals

- Group like items together under thematic "rooms"
- Keep core actions (Summon, Party preview) accessible from home
- Create clear navigation hierarchy with intuitive back-button flow

## Homescreen Layout

### Header (unchanged)
- Game title "Dorf - Heroes of the Realm"
- Currency display (gems, gold)

### Party Preview (unchanged)
- Background image from last visited node
- 4 party slots showing hero portraits
- Tap slot to navigate to Heroes screen

### Action Buttons

**Summon** (prominent, stays on home)
- Purple summoning background
- Navigates to GachaScreen

**Room Buttons** (horizontal row, large icon cards)

| Room | Icon | Hint | Action |
|------|------|------|--------|
| Fellowship Hall | 🏰 | "Manage your heroes" | → Hub screen |
| Map Room | 🗺️ | "Explore the world" | → Hub screen |
| Store Room | 📦 | "Items & Equipment" | → InventoryScreen (direct) |

### Footer Stats (unchanged)
- Total Pulls, Heroes count, Quests cleared

### Removed from Homescreen
- Individual nav buttons (Heroes, Quests, Inventory, Shards, Explorations)
- Genus Loci section (moved to Map Room)

## Hub Screens

### Fellowship Hall

Hub for hero management features.

| Button | Icon | Hint | Destination |
|--------|------|------|-------------|
| Heroes | ⚔️ | "X owned · Y total" | HeroesScreen |
| Party | 🛡️ | "Manage your team" | PartyScreen |
| Fusion | ⭐ | "Upgrade stars" | MergeScreen |
| Shards | 💎 | "Hero fragments" | ShardsScreen |

### Map Room

Hub for world exploration and combat.

| Button | Icon | Hint | Destination |
|--------|------|------|-------------|
| Quests | 🗺️ | "X cleared" | WorldMapScreen |
| Explorations | 🧭 | "X active" | ExplorationsScreen |
| Genus Loci | 👹 | "Challenge bosses" | GenusLociListScreen |

## New Screens

### FellowshipHallScreen.vue
- Header with back button → Home
- Title: "Fellowship Hall"
- Four nav buttons (Heroes, Party, Fusion, Shards)
- Same visual style as current nav buttons

### MapRoomScreen.vue
- Header with back button → Home
- Title: "Map Room"
- Three nav buttons (Quests, Explorations, Genus Loci)
- Same visual style as current nav buttons

### PartyScreen.vue
Extract party management from HeroesScreen:
- Header with back button → Fellowship Hall
- Title: "Party"
- 4 party slots with hero cards
- Add/remove hero functionality
- Auto-fill button
- Leader selection (crown icon on 5-star heroes)

### GenusLociListScreen.vue
- Header with back button → Map Room
- Title: "Genus Loci"
- List of unlocked bosses (same card style as current homescreen)
- Empty state: "Powerful guardians await in the world"
- Tap boss → navigate to boss battle screen

## Modified Screens

### HeroesScreen.vue
- Remove tab bar (Collection/Party/Fusion tabs)
- Show only hero collection grid
- Back button → Fellowship Hall (was Home)
- "Add to Party" button → navigates to PartyScreen with hero queued

### InventoryScreen.vue
- Screen title can stay "Inventory" or change to "Store Room"
- Back button → Home (direct link, no hub)

### MergeScreen.vue
- Back button → Fellowship Hall (was Heroes)

### ShardsScreen.vue
- Back button → Fellowship Hall (was Home)

### WorldMapScreen.vue
- Back button → Map Room (was Home)

### ExplorationsScreen.vue
- Back button → Map Room (was Home)

## Navigation Flow

```
Home
├── Summon → GachaScreen → back to Home
├── Fellowship Hall (hub)
│   ├── Heroes → HeroesScreen → back to Fellowship Hall
│   ├── Party → PartyScreen → back to Fellowship Hall
│   ├── Fusion → MergeScreen → back to Fellowship Hall
│   └── Shards → ShardsScreen → back to Fellowship Hall
├── Map Room (hub)
│   ├── Quests → WorldMapScreen → back to Map Room
│   ├── Explorations → ExplorationsScreen → back to Map Room
│   └── Genus Loci → GenusLociListScreen → back to Map Room
└── Store Room → InventoryScreen → back to Home
```

## Cross-Navigation

### Add to Party Flow
1. User in HeroesScreen selects a hero
2. Taps "Add to Party" button
3. Navigates to PartyScreen with `placingHero` set
4. User taps empty slot to place hero
5. Stays on PartyScreen

### Battle Victory
- Return button goes to Map Room (parent hub)
- Or could go directly to the quest node for replay

## New Routes

| Route | Screen |
|-------|--------|
| `/fellowship-hall` | FellowshipHallScreen |
| `/map-room` | MapRoomScreen |
| `/party` | PartyScreen |
| `/genus-loci` | GenusLociListScreen |

## Visual Design Notes

### Room Buttons on Homescreen
- Large icon cards (larger than current nav buttons)
- Horizontal row of 3
- Each has:
  - Icon in colored wrapper (like current nav buttons)
  - Room name
  - Short hint text
  - Arrow indicator

### Hub Screen Layout
- Same animated background as other screens
- Header: back button, title, optional badge
- Nav buttons: same style as current homescreen buttons
- Vertical stack with gaps

## Implementation Order

1. Create FellowshipHallScreen and MapRoomScreen (hub screens)
2. Create PartyScreen (extract from HeroesScreen)
3. Create GenusLociListScreen (extract from HomeScreen)
4. Modify HeroesScreen (remove tabs)
5. Update HomeScreen (new room buttons, remove old nav)
6. Update all back button targets
7. Add new routes to App.vue
