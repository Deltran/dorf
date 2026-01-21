# Merge Requirements Display Design

Improve visibility of merge material requirements (Shard of Dragon Heart for 3★→4★, Dragon Heart for 4★→5★) across three UI locations.

## Changes

### 1. Merge Button Enhancement

Replace generic disabled text with context-aware messaging:

| State | Button Text |
|-------|-------------|
| Can merge | `⭐ Merge` |
| Need copies | `⭐ Need X copies` |
| Have copies, need shard | `💎 Need Shard` |
| Have copies + shard, need gold | `🪙 Need Gold` |

Priority order: copies → material → gold (show first unmet requirement).

### 2. Merge Modal Requirements Section

Replace simple gold cost display with expanded requirements list:

```
Requirements
────────────────────────────────
🪙 4,000 Gold           ✓ (12,450)
💎 Shard of Dragon Heart      ✗
```

- Each requirement on its own line
- Green ✓ with current amount if met
- Red ✗ if not met
- Confirm button disabled until ALL requirements met

### 3. Hero Detail Panel - Next ★ Requirements

New section below stats, above merge button (only for heroes < 5★):

```
Next ★ Requirements
────────────────────────────────
3× ★★★ copies              2/3
🪙 4,000 Gold                ✓
💎 Shard of Dragon Heart     ✗
```

- Shows copy progress (have/need)
- Shows gold with ✓/✗
- Shows material requirement if applicable (3★+ only)

## Files to Modify

1. `src/screens/HeroesScreen.vue` - All three UI changes
2. `src/stores/heroes.js` - Already returns material info from `canMergeHero()`

## Notes

- Use 💎 emoji for shard materials, 🪙 for gold
- 1★→2★ and 2★→3★ don't require materials (only copies + gold)
- 3★→4★ requires Shard of Dragon Heart
- 4★→5★ requires Dragon Heart
