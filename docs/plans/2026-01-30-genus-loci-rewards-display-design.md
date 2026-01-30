# Genus Loci Rewards Display Design

## Problem

Genus Loci bosses have non-standard reward structures that break the current UI assumptions:

- **Great Troll**: Only drops gems, no gold — UI shows 0 gold
- **Pyroclast**: Low gold but valuable XP tome drops — looks like crappy rewards
- **Valinar**: Only drops gold — works fine currently but fragile

The current reward display hardcodes a gold-only row and ignores gems and item drops.

## Solution

1. Hide reward categories that don't exist (no gold = no gold row)
2. Show item drops inline with currency rewards

## Display Logic

**Currency display rules:**
- Show gold row only if `currencyRewards.base.gold > 0`
- Show gems row only if `currencyRewards.base.gems > 0`
- Calculate each dynamically: `base.X + perLevel.X * (level - 1)`

**Item drops display:**
- Show item rows when `itemDrops` array exists and has entries
- Format: icon + quantity range + item name (e.g., "1-3 Faded Tomes")
- For items with `perLevel: true`, indicate scaling with "/level" suffix

**Result by boss:**
- Valinar: `🪙 125` (gold only)
- Great Troll: `💎 12` (gems only)
- Pyroclast: `🪙 30`, `📜 1-3 Faded Tomes`, `📜 1-2 Knowledge Tomes`

## Visual Treatment

**Reward row styling:**

| Type | Icon | Color | Example |
|------|------|-------|---------|
| Gold | 🪙 | `#fbbf24` (amber) | `🪙 125` |
| Gems | 💎 | `#a78bfa` (purple) | `💎 12` |
| Items | 📜 | `#60a5fa` (blue) | `📜 1-3 Faded Tomes` |

**Layout:**
- Rewards stay in horizontal flex row
- Wrap to second row if more than 3 items
- Items with ranges show "min-max" format
- "/level" suffix for scaling items, slightly dimmed

## Implementation Changes

**File: `src/screens/GenusLociScreen.vue`**

**Script changes:**
1. Add `calculateGemsReward(level)` function mirroring gold logic
2. Add `getItemDropsDisplay(level)` function returning array of `{ icon, text, isPerLevel }`
3. Update `calculateGoldReward` to return `null` when gold doesn't exist

**Template changes:**
- Replace hardcoded gold-only `.detail-rewards` div (lines 189-194)
- Add conditional gold row (v-if gold reward > 0)
- Add conditional gems row (v-if gems reward > 0)
- Add v-for loop over item drops

**Style changes:**
- Add `.reward-item.gems` color variant (`#a78bfa`)
- Add `.reward-item.item` color variant (`#60a5fa`)
- Add `.per-level` suffix styling (smaller, dimmed)
- Allow flex-wrap on `.detail-rewards` for overflow

**No new files or dependencies.**
