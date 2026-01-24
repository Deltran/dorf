# Merge Component Heroes Design

## Overview

"Merge Component Heroes" (branded as "Build Copies") is a bulk-merge planner that lets players chain-merge lower-star copies of a hero to build up fodder for a higher-tier merge.

**Problem:** Players with many low-star duplicates must manually merge them one-by-one to build up copies for higher merges. This is tedious and error-prone.

**Solution:** A merge planner modal that shows all available lower-tier copies, lets users configure how many to merge at each tier, and executes all merges at once.

## Entry Points

1. **Hero Detail Panel** (HeroesScreen) - "Build Copies" button below existing "Merge" button
2. **Merge Screen** - "Build Copies" button in hero group sections

### Button States

- **Enabled**: At least one lower-star copy of the same template exists
- **Disabled + tooltip**: "No lower-star copies available"
- **Hidden**: Hero is already 5-star (max)

## Merge Requirements Reference

| Merge | Copies Needed | Gold Cost |
|-------|---------------|-----------|
| 1★ → 2★ | 1 copy | 2,000 |
| 2★ → 3★ | 2 copies | 3,000 |
| 3★ → 4★ | 3 copies + Dragon Heart Shard | 4,000 |
| 4★ → 5★ | 4 copies + Dragon Heart | 5,000 |

## UI Layout

### Header
```
┌─────────────────────────────────────────────────────┐
│  Build Copies for: ★★★ Salia                    [X] │
│  Goal: Need 3× ★★★ copies (have 1)                  │
└─────────────────────────────────────────────────────┘
```

### Tier Sections (stacked, lowest first)
```
┌─────────────────────────────────────────────────────┐
│  ★ → ★★  (1 copy each)                              │
│  Available: 20× ★ Salia                             │
│  [－]  12  [＋]  → Creates 12× ★★                   │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  ★★ → ★★★  (2 copies each)                          │
│  Available: 2× ★★ Salia  (+12 from above = 14)      │
│  [－]   6  [＋]  → Creates 6× ★★★                   │
└─────────────────────────────────────────────────────┘
```

### Footer
```
┌─────────────────────────────────────────────────────┐
│  Total Cost: 🪙 15,000 Gold                         │
│  Result: +6× ★★★ Salia (will have 7 total)         │
│                                                     │
│        [Cancel]            [Confirm Merges]         │
└─────────────────────────────────────────────────────┘
```

## Logic & Calculations

### Available Copies Per Tier

For each tier, available = existing copies + copies created from tier below:

```javascript
tier1Available = count of 1★ copies (excluding party/expedition)
tier2Available = count of 2★ copies + tier1MergeCount
tier3Available = count of 3★ copies + floor(tier2Used / 2)
```

### Constraints

- Cannot merge more than available at each tier
- Cannot merge heroes in party (excluded from counts)
- Cannot merge heroes on expedition (excluded from counts)
- Cannot select the target hero itself as fodder

### Gold Cost

```javascript
totalGold = (tier1Merges * 2000) + (tier2Merges * 3000) + (tier3Merges * 4000)
```

### Material Requirements

- 3★→4★: 1 Dragon Heart Shard per merge
- 4★→5★: 1 Dragon Heart per merge
- Show material requirements in footer, block confirm if insufficient

### Execution Order

Merges execute bottom-up (1★→2★ first) so newly created copies are available for subsequent tiers.

## Execution Flow

1. User clicks "Confirm Merges"
2. Button shows loading state ("Merging...")
3. Execute merges tier-by-tier using existing `mergeHero()` logic
4. Deduct gold and materials
5. Close modal, show success toast: "Created 6× ★★★ Salia"
6. Hero detail panel refreshes with updated counts

### Validation (pre-confirm)

- Total gold cost ≤ player's gold
- Required materials available
- At least one merge configured

### Error Handling

If failure mid-execution:
- Keep completed merges (already persisted)
- Show error with partial success: "Merged 12× ★→★★. Error: insufficient gold"

## Implementation Scope

### New Files

- `src/components/MergePlannerModal.vue` - The merge planner modal

### Modified Files

- `src/screens/HeroesScreen.vue` - Add "Build Copies" button
- `src/screens/MergeScreen.vue` - Add "Build Copies" button
- `src/stores/heroes.js` - Add helper functions

### New Store Functions

```javascript
// Get all lower-tier copies of a hero template
getLowerTierCopies(templateId, belowStarLevel)

// Execute a bulk merge plan
executeBulkMerge(templateId, mergeConfig)
// mergeConfig = { tier1Count: 12, tier2Count: 6, tier3Count: 0 }
```

### Not in Scope

- Auto-calculate optimal merge path
- Undo/rollback
- Merge animations
- Saving plans for later
