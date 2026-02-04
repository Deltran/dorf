# The Colosseum

## Overview

A 50-bout PvP-style gauntlet where players fight against fixed teams of 4 heroes. Unlike quests (fight monsters) and Genus Loci (fight bosses), the colosseum pits your party against rival hero squads — mirror-match style combat using the full hero system.

**Core loop:** Push your highest bout to increase your daily Laurel income, then spend Laurels in the colosseum shop on exclusive heroes, merge materials, and resources.

## Key Decisions

- **50 fixed bouts**, each a single 4v4 hero fight
- **Full HP/MP/resource reset** between bouts
- **Hard wall progression** — progress saves, unlimited retries
- **Hybrid AI** — real resource systems, simple heuristic decisions
- **Laurels** — colosseum-exclusive currency earned passively based on highest cleared bout
- **Colosseum shop** — exclusive heroes (3/4/5-star), Dragon Hearts, materials
- **Unlock** — quest node in Whisper Lake region

## Enemy Team Scaling

### Star Rating Progression

| Bout Range | Star Rating |
|------------|-------------|
| 1-8 | 1-star heroes |
| 9-16 | 2-star heroes |
| 17-28 | 3-star heroes |
| 29-40 | 4-star heroes |
| 41-50 | 5-star heroes |

### Level Progression

Roughly linear from ~5 (bout 1) to 250 (bout 50).

### Shard Tiers

Phase in during 4-star and 5-star ranges:

| Bout Range | Shard Tier |
|------------|------------|
| 29-33 | No shards |
| 34-38 | Tier 1 (+5% stats) |
| 39-43 | Tier 2 (+10% stats) |
| 44-50 | Tier 3 (+15% stats) |

### Leader Skills

Activate once 5-star heroes appear (bout 41+). Enemy team has a designated leader with an active leader skill.

### Merge Levels

Early bouts in each star range use base copies. Later bouts use ascended heroes (merged up from lower stars, getting stat growth multiplier bonuses).

## Hybrid Combat AI

Enemy heroes use **real resource systems** with **simple decision-making heuristics**.

### What's Real (Shared with Player Hero Code)

- Rage builds on attack and when hit
- Focus is lost when hit or debuffed
- Verses increment on skill use, finale auto-triggers at 3
- Essence regenerates each turn, volatility tiers apply
- MP costs and regeneration
- All status effects, buffs, debuffs work identically
- Leader skill passives and timed triggers fire normally

### Heuristic Decision Layer

| Class | Heuristic |
|-------|-----------|
| Berserker | Spend rage when above 50. Use `rageCost: 'all'` skill when above 80. |
| Ranger | Use strongest available skill while focused. Basic attack if no focus. |
| Knight | Use valor skill at lowest available tier. Prioritize defensive skills when any ally below 40% HP. |
| Bard | Cycle skills in order (no repeats enforced by system). Finale fires automatically. |
| Alchemist | Spend essence freely. No self-preservation around volatile threshold. |
| Paladin/Mage/Cleric/Druid | Use highest-impact available skill. Healers target lowest-HP ally. |

### Target Selection

- **Damage skills:** Target lowest-HP enemy (finish off wounded)
- **Healing skills:** Target lowest-HP ally
- **Buff skills:** Target highest-ATK ally (damage buffs) or lowest-DEF ally (defensive buffs)
- **AoE:** Always use when available

## Rewards & Economy

### Currency: Laurels

**Daily allowance** — earned automatically each day based on highest cleared bout:

| Bout Range | Laurels Per Bout | Max Daily at Range End |
|------------|------------------|----------------------|
| 1-10 | 2 per bout | 20/day |
| 11-25 | 3 per bout | 65/day |
| 26-40 | 4 per bout | 125/day |
| 41-50 | 5 per bout | 175/day |

**First-clear bonus** — one-time Laurel payout per bout (10-50 Laurels scaling with bout number).

### Colosseum Shop

| Item | Cost | Stock |
|------|------|-------|
| Exclusive 3-star Hero | 2,000 | One-time purchase |
| Exclusive 4-star Hero | 5,000 | One-time purchase |
| Exclusive 5-star Hero | 12,000 | One-time purchase |
| Dragon Heart | 3,000 | 1/month |
| Dragon Heart Shard | 800 | 2/week |
| Knowledge Tome (Large) | 150 | 5/week |
| Gold (5,000) | 100 | 3/week |
| Gems (100) | 200 | 2/week |

**Time-to-purchase at max income (175/day):**
- 3-star hero: ~12 days
- 4-star hero: ~29 days
- 5-star hero: ~69 days
- Dragon Heart: ~17 days

Exclusive heroes are purchased directly (not via shards). Hero designs are out of scope for initial implementation — shop displays placeholder slots.

## Unlock

A new quest node in **Whisper Lake** region, branching off the existing chain as a side path.

```js
{
  id: 'lake_colosseum',
  name: 'The Colosseum Gate',
  region: 'Whisper Lake',
  type: 'standard',
  battles: [{ enemies: [...] }],  // Thematic gladiator-style fight
  connections: [],
  rewards: { gems: 100, gold: 500 },
  unlocks: 'colosseum',
}
```

Connected from `lake_01` or `lake_02`.

## UI & Screen Flow

### Access

Colosseum is accessed from the **Map Room** hub (alongside World Map, Explorations, Genus Loci).

### Colosseum Screen

Main view shows:
- Current bout number and opponent team preview (4 hero cards with levels, stars, classes)
- Enemy leader indicated with crown icon (bout 41+)
- Daily Laurel income display ("Earning 65/day")
- Total Laurel balance
- **"Fight"** button to challenge current bout
- **"Shop"** button to open colosseum shop

### Bout Preview

Shows enough info to strategize: hero names, classes, star ratings, levels. Leader marked with crown. Full skill lists are NOT revealed — players discover those in combat.

### After Winning

- Victory screen shows Laurels earned (first-clear bonus)
- Daily income increase notification ("Daily income: 62 → 65")
- Advances to next bout preview

### After Losing

- Standard defeat screen
- Returns to colosseum main view, same bout

### Shop

Similar layout to existing Crest Shop. Items with costs, stock limits, and refresh timers. Exclusive heroes displayed prominently at top (grayed out with "Coming Soon" until designed).

## Data Structure

### Bout Definitions (`src/data/colosseum.js`)

```js
export const colosseumBouts = [
  {
    bout: 1,
    name: 'Fresh Recruits',
    heroes: [
      { templateId: 'farm_hand', level: 5, stars: 1, shardTier: 0 },
      { templateId: 'street_urchin', level: 5, stars: 1, shardTier: 0 },
      { templateId: 'beggar_monk', level: 8, stars: 1, shardTier: 0 },
      { templateId: 'street_busker', level: 6, stars: 1, shardTier: 0 },
    ],
    leader: null,
    firstClearReward: 10,
    dailyCoins: 2,
  },
  // ... 48 more bouts ...
  {
    bout: 45,
    name: 'The Unbreakable',
    heroes: [
      { templateId: 'rosara_the_unmoved', level: 230, stars: 5, shardTier: 3 },
      { templateId: 'aurora_the_dawn', level: 225, stars: 5, shardTier: 2 },
      { templateId: 'cacophon', level: 220, stars: 5, shardTier: 2 },
      { templateId: 'ember_witch', level: 215, stars: 5, shardTier: 2 },
    ],
    leader: 'rosara_the_unmoved',
    firstClearReward: 45,
    dailyCoins: 5,
  },
]
```

### Colosseum Store (`src/stores/colosseum.js`)

Tracks:
- `highestBout` — highest cleared bout number (drives daily income)
- `laurels` — current Laurel balance
- `shopPurchases` — tracks stock and refresh timers
- `lastDailyCollection` — date of last automatic collection

### Key Functions

- `collectDailyLaurels()` — calculate and award daily income based on `highestBout`
- `completeBout(boutNumber)` — mark bout as cleared, award first-clear bonus, advance `highestBout`
- `purchaseShopItem(itemId)` — spend Laurels, update stock
- `getShopItems()` — return available items with current stock and prices

## Implementation Scope

### In Scope
- Colosseum data structure (50 bout definitions)
- Colosseum store (progression, Laurels, shop)
- Colosseum screen (bout preview, fight flow, shop)
- Hero-as-enemy battle integration (hybrid AI)
- Unlock quest node in Whisper Lake
- Map Room navigation entry

### Out of Scope
- Exclusive hero designs (placeholder slots in shop)
- Battle background art for colosseum
- Sound effects
