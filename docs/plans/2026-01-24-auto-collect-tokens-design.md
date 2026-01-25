# Auto-Collect Tokens Design

## Overview

Auto-collect tokens are consumable items that let players instantly collect rewards from a completed quest without re-running the battles. Each token is region-specific and grants full rewards including random item/shard drops.

## Item Definitions

**New Items (one per region):**

| Item ID | Name | Usable In Region |
|---------|------|------------------|
| `token_whispering_woods` | Whispering Woods Token | Whispering Woods |
| `token_whisper_lake` | Whisper Lake Token | Whisper Lake |
| `token_echoing_caverns` | Echoing Caverns Token | Echoing Caverns |
| `token_stormwind_peaks` | Stormwind Peaks Token | Stormwind Peaks |
| `token_blistering_cliffs` | Blistering Cliffs Token | Blistering Cliffsides |

**Item Properties:**
- Type: `token`
- Rarity: 3 (rare - blue)
- Not sellable (or very low sell value)
- Stacks in inventory

## Usage Flow

1. Player opens a completed quest node on the map
2. Quest detail popup shows a "Use Token" button (if they have the matching token)
3. Player taps "Use Token"
4. System instantly calculates rewards:
   - Base gold, gems, exp from node
   - Rolls item drops (same chances as normal)
   - Rolls shard drops (same chances as normal)
   - No first-clear bonus (already claimed)
5. Token is consumed from inventory
6. Rewards are granted and displayed in a results popup

**Button States:**
- **Visible + enabled**: Quest completed AND player has matching token
- **Visible + disabled**: Quest completed but no matching token (show "No token" tooltip)
- **Hidden**: Quest not yet completed

**Restrictions:**
- Cannot use on Genus Loci nodes
- Cannot use on Exploration nodes
- Only works on normal quest nodes already completed

## Results Display

After using a token, show a simplified victory screen:

```
┌─────────────────────────────────────────┐
│         Token Rewards Collected         │
│            Dark Thicket                 │
├─────────────────────────────────────────┤
│                                         │
│   🪙 100 Gold    💎 50 Gems    ✨ 80 XP │
│                                         │
│   Items:                                │
│   ┌─────┐ ┌─────┐                       │
│   │Tome │ │Rock │                       │
│   │ x1  │ │ x1  │                       │
│   └─────┘ └─────┘                       │
│                                         │
│              [Collect]                  │
└─────────────────────────────────────────┘
```

- No battle stats or party HP shown
- Simpler header ("Token Rewards Collected")
- Same item reveal animation as normal victory
- Single "Collect" button to dismiss
- If no items dropped, show "No items dropped"

## Token Drop Locations

**Drop pattern:** Tokens drop from the *next* region (rewards progression).

| Token | Drops From | Drop Chance |
|-------|------------|-------------|
| `token_whispering_woods` | Whisper Lake quests | 10% |
| `token_whisper_lake` | Echoing Caverns quests | 10% |
| `token_echoing_caverns` | Stormwind Peaks quests | 10% |
| `token_stormwind_peaks` | Blistering Cliffsides quests | 10% |
| `token_blistering_cliffs` | (Future region) | - |

Drops are configurable per quest node like any other item.

## Implementation Scope

### Modified Files

- `src/data/items.js` - Add 5 token item definitions
- `src/data/questNodes.js` - Add token drops to appropriate quests
- `src/stores/quests.js` - Add `collectWithToken(nodeId)` function
- Quest detail popup component - Add "Use Token" button
- `src/screens/MapScreen.vue` - Handle token results display

### New Store Function

```javascript
collectWithToken(nodeId) {
  // Validate: node completed, not genus loci, has matching token
  // Consume token from inventory
  // Roll rewards (reuse existing rollItemDrops logic)
  // Grant rewards
  // Return rewards object for display
}
```

### Out of Scope

- Batch usage (use multiple tokens at once)
- Auto-repeat (keep using tokens until empty)
- Token crafting or combining
