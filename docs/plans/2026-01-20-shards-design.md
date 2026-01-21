# Shard System Design

## Overview

Shards provide a long-term progression layer for dedicated players. Unlike merging (which requires gacha luck), shards reward consistent play by letting players target specific heroes to upgrade through quest grinding.

## Core Mechanics

Each hero has their own shard type (e.g., "Darl Shards", "Aurora Shards"). Players collect shards through quest battles in Aquaria and beyond. Shards are spent to upgrade a hero's skills through three tiers:

| Tier | Cost | Bonus | Running Total |
|------|------|-------|---------------|
| 1 | 50 shards | +5% to all % effects | 50 |
| 2 | 100 shards | +10% to all % effects | 150 |
| 3 | 200 shards | +15% to all % effects | 350 |

Bonuses are **additive** and apply to all percentage-based values in a hero's skills: damage, healing, buff values, and status effect chances. A skill dealing "30% of ATK" becomes 35%/40%/45% at tiers 1/2/3.

## Shard Hunting

Players configure a 5-slot "hunting loadout" to target which heroes' shards can drop. When a quest drops shards, one slot is randomly selected. Empty slots roll a random hero from the player's roster.

## Drop Mechanics

Shard drops work like existing item drops - each quest node can have a shard drop chance defined. When the chance triggers:

1. System selects a random slot from the player's 5-slot hunting loadout
2. If the slot has a hero assigned, that hero's shards drop
3. If the slot is empty, a random hero from the player's roster is selected
4. **3-7 shards** drop (random within range)

Drop chances are configured per-node in `questNodes.js`:

```js
// Example node configuration
{
  id: 'aquaria_reef_03',
  name: 'Coral Maze',
  // ... other properties
  shardDropChance: 0.25  // 25% chance per clear
}
```

## Unlock Gating

The shard system is tied to reaching **Aquaria**:

- **Before Aquaria**: Shards screen appears in navigation but shows a locked state with "Reach Aquaria to unlock" messaging
- **After Aquaria**: Full access to the Shards screen; shard drops begin appearing from Aquaria nodes onward
- **Earlier regions**: Never drop shards, even after unlock (encourages forward progression)

## User Interface

### Shards Screen (New)

A dedicated screen accessible from main navigation with two main sections:

**Hunting Loadout** (top section)
- 5 horizontal slots showing currently selected heroes
- Tap a slot to open hero picker (filtered to owned heroes)
- Tap again to clear slot (revert to random)
- Empty slots display a "?" or dice icon indicating random selection

**Shard Progress** (bottom section)
- Grid or list of all owned heroes
- Each entry shows: hero portrait, name, current shard count, upgrade tier indicator (0/1/2/3 stars or pips)
- Heroes with enough shards to upgrade are highlighted
- Tapping a hero navigates to their detail panel for upgrading

### Hero Detail Panel (Existing - Modified)

Add a "Shards" section below existing stats:
- Shows current shard count and tier (e.g., "47/50 shards - Tier 1")
- Progress bar visualizing progress to next tier
- "Upgrade" button appears when threshold is met
- Upgrade confirmation shows the skill boost preview (+5%/+10%/+15%)
- After tier 3, displays "MAX" with no further upgrades available

## Combat & Skill Integration

### Applying Shard Bonuses

During battle, the shard tier bonus modifies all percentage-based values in a hero's skills. The bonus is calculated once when battle starts and cached on each hero's battle state.

### What Gets Boosted

Any numeric value in a skill that represents a percentage:
- Damage: "Deal 120% of ATK" → 125%/130%/135%
- Healing: "Heal 25% of max HP" → 30%/35%/40%
- Buffs: "Allies gain +20% DEF" → 25%/30%/35%
- Status chances: "40% chance to stun" → 45%/50%/55%

### What Doesn't Get Boosted

- Flat values (e.g., "Deal 50 damage", "Heal 100 HP")
- Durations (e.g., "for 2 turns")
- Resource costs (e.g., "Costs 30 MP")
- Target counts (e.g., "hits 3 enemies")

### Implementation Approach

Skills in `heroTemplates.js` already define percentage values. The battle store will apply the shard modifier when calculating final values:

```js
const shardBonus = [0, 5, 10, 15][hero.shardTier] // 0-3
const effectivePercent = basePercent + shardBonus
```

## Data Model & Storage

### Heroes Store (Modified)

Track shard data per hero instance in `heroes.js`:

```js
// Each hero instance gains:
{
  instanceId: 'hero_123',
  templateId: 'aurora_the_dawn',
  // ... existing properties
  shards: 0,       // Current shard count (resets after upgrade)
  shardTier: 0     // 0 = none, 1/2/3 = upgraded tiers
}
```

### Shard Hunting Store (New)

A small dedicated store or addition to an existing store:

```js
// shardHunting state
{
  huntingSlots: [null, null, null, null, null],  // templateId or null for random
  unlocked: false  // Set true when player reaches Aquaria
}
```

### Persistence

Both shard counts and hunting loadout are saved to localStorage alongside existing game state. The `shards` and `shardTier` fields persist on hero instances; `huntingSlots` persists separately.

### Unlock Trigger

When player completes their first node in Aquaria (or enters the region), set `unlocked: true`. This enables the Shards screen and activates drop logic.

## Victory Screen Integration

When shards drop from a quest, display them in the rewards section:

- Show after item drops in the sequential reveal animation
- Display the hero portrait, shard icon, and count (e.g., "Darl Shards x5")
- If multiple heroes' shards drop (unlikely but possible with future features), show each separately

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| All 5 slots empty | Random hero from entire owned roster |
| Player owns only 1 hero | That hero's shards always drop (regardless of slots) |
| Hunting hero not owned | Slot is treated as empty (random) |
| Hero at max tier (3) | Can still receive shards, but they accumulate with no use (future-proofing) |
| Shards drop for hero not in roster | Shouldn't happen - only owned heroes are eligible |

## Future Considerations (Not In Scope)

- Trading excess shards for universal currency
- "Universal shards" that work for any hero
- Shard drop rate boosts from items or events

These are noted but explicitly **not** part of this design.
