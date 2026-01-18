# Turn Order Portrait Strip Design

**Goal:** Replace the text-based turn order list with a scannable vertical strip of portraits.

---

## Layout

- **Position:** Fixed to left side of battle screen (same location as current)
- **Width:** ~50px total (32px portraits + padding)
- **Portraits:** 32px circular, stacked vertically with 6px gap
- **Current unit:** Shifts 8px right with a subtle highlight pill behind it

---

## Portrait Sourcing

Fallback chain (in order):

1. Check `src/assets/heroes/{heroId}_portrait.png` or `src/assets/enemies/{enemyId}_portrait.png`
2. Fall back to existing full image (`{id}.png`) cropped/scaled to fit
3. Final fallback: Generic silhouette icon, tinted blue for heroes, red for enemies

---

## Visual Distinction

| State | Treatment |
|-------|-----------|
| Hero | Subtle blue border (2px, `#3b82f6`) |
| Enemy | Subtle red border (2px, `#ef4444`) |
| Current unit | White/gold border + background pill + slight scale (1.1x) |
| Dead unit | Grayscale filter (consistent with existing dead hero treatment) |

---

## Technical Implementation

**Files to modify:**
- `src/screens/BattleScreen.vue` - Replace turn order template and styles

**Data changes:**
- Extend `rotatedTurnOrder` computed to include `templateId` for image lookup
- Add helper function `getTurnOrderPortrait(unit)` to handle fallback chain

**Component structure:**
```
.turn-order-strip
  .turn-order-entry (v-for)
    .portrait-wrapper
      img.portrait (or .portrait-fallback if no image)
```

No new components needed - contained change within BattleScreen.

---

## Decisions

| Aspect | Decision |
|--------|----------|
| Position | Left side, vertical strip |
| Portrait size | 32px circular, compact |
| Current indicator | Pop out right + highlight background |
| Image fallback | `_portrait.png` → full image → tinted silhouette |
| Hero/enemy distinction | Blue border vs red border |
| Health info | None - keep it clean |
