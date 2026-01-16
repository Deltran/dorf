# Hero Merging System Design

## Overview

A progression system that allows players to merge duplicate heroes to increase their star level, improving their stats and making lower-rarity heroes competitive with higher-rarity ones.

## Core Mechanics

### Merging Requirements

- Merge identical heroes (same hero template) to increase star level
- Copies needed = current star level (1-star needs 1 copy, 3-star needs 3 copies)
- Total copies to max a Common from 1→5 star: 1+2+3+4 = 10 additional copies
- Heroes at 5-star cannot be merged further

### Star Level vs Base Rarity

- **Base rarity** (Common→Legendary): Fixed at pull time. Affects visuals, pull rate, starting star level, and skill kit design
- **Star level** (1-5): Upgradeable through merging. Affects stat growth multiplier and base stats

### Starting Star Levels

| Rarity    | Starting Stars | Copies to Max |
|-----------|----------------|---------------|
| Common    | 1-star         | 10            |
| Uncommon  | 2-star         | 9             |
| Rare      | 3-star         | 7             |
| Epic      | 4-star         | 4             |
| Legendary | 5-star         | 0 (already maxed) |

## Stat & Skill Scaling

### Stat Growth Multipliers

- Each star level has a stat growth multiplier (how much stats increase per level)
- Higher star level = better growth multiplier
- A 3-star Common uses the same growth multiplier as a natural 3-star Rare

### Retroactive Stat Recalculation

- On merge, all previous levels are recalculated with the new growth rate
- A level 40 hero merged from 2-star to 3-star has levels 2-40 recalculated at 3-star rates
- This also includes the flat +1 to all base stats from the star level increase

### Base Stat Bonus

- Each star level adds +1 to all base stats (HP, ATK, DEF, etc.)
- This stacks with the improved growth multiplier

### Level Inheritance

- Merged hero takes the highest level among all copies used
- XP from consumed heroes is lost entirely

### Merge Cost

- Gold cost scales with target star level (e.g., 1000g × target star)

## UI & Merge Flow

### Merge Access Points

1. **Hero Detail Screen** - "Merge" button appears when viewing a hero below 5-star with available duplicates
2. **Dedicated Merge Screen** - Accessible from main menu, shows all heroes grouped by template with merge potential

### Dedicated Merge Screen Layout

- Heroes grouped by template (all copies of Militia Soldier together, etc.)
- Each group shows: current highest star level, total copies owned, progress toward next merge
- Tap a group to enter merge flow for that hero

### Merge Flow (from either access point)

1. Select the "base" hero (highest level copy auto-selected, can change)
2. System auto-selects lowest-level duplicates as fodder (required count = current star level)
3. Player can tap to swap in different copies
4. Gold cost displayed
5. Confirm button with summary: "Merge to X-star?"

### Party Member Handling

- Party members can be selected as fodder with a warning: "This hero is in your party and will be removed"
- If a party member is consumed (not the base), they are automatically removed from the party

## Edge Cases & Constraints

### Merge Restrictions

- 5-star heroes cannot be merged further (button disabled/hidden)
- Cannot merge if insufficient duplicates
- Cannot merge if insufficient gold
- Duplicate heroes must be the same template (same `heroId`), not just same class or role

### Duplicate Legendaries

- Since Legendaries start at 5-star, duplicate pulls accumulate without merge use
- No special handling for now (deferred to future design)

### Visual Distinction

- Base rarity remains visible on card (border color, rarity label)
- Star level shown separately (star icons)
- Players can see both: "Legendary (5-star)" vs "Common (5-star)"

### State After Merge

- Consumed heroes are permanently deleted
- Base hero's star level increases by 1
- Base hero's stats are retroactively recalculated
- Gold is deducted
- Any consumed party members are removed from party

## Design Rationale

**Core Loop:**
Pull duplicates → Merge to raise star level → Stats retroactively improve → Hero becomes competitive with higher-rarity heroes

**Key Design Points:**

- Base rarity is permanent (cosmetic, pull rate, starting stars, skill kit)
- Star level is upgradeable (stat growth, base stats)
- Copies needed = current star level
- Fully merged Commons match Legendaries in raw stats, but Legendaries have better abilities
- Legendaries start maxed, creating rarity through scarcity rather than grind

**Economy:**

- Gold sink that scales with progression
- Encourages keeping fodder unleveled (XP is lost)
- Creates value for duplicate pulls
