# Design & Creative Improvements

Date: 2026-01-28

Combined design doc covering 7 items: 4 design/layout items and 3 creative items.

---

## Design / Layout Items

### #2 - Reusable Tooltip System

**Architecture:** Vue composable + global overlay component.

**Components:**
- `useTooltip()` composable -- returns `onPointerEnter(event, text)` and `onPointerLeave()`. Starts a 1-second timer on pointer enter. On fire, sets shared reactive state. On leave/touch end, clears timer and hides.
- `tooltipState` shared reactive -- `{ visible, text, x, y }`
- `TooltipOverlay.vue` -- mounted once in `App.vue`, reads `tooltipState`, renders positioned dark tooltip bubble. Auto-adjusts to stay within viewport bounds.
- Also supports `onClick(event, text)` variant for click-to-show tooltips (used by #13).

**Usage pattern:**
```js
const { onPointerEnter, onPointerLeave } = useTooltip()
```
```html
<div @pointerenter="onPointerEnter($event, 'HP determines...')"
     @pointerleave="onPointerLeave()">
```

**Stat tooltip texts:**
- HP: "Hit Points. Determines how much damage a hero can take before being knocked out."
- ATK: "Attack. Determines the damage dealt by skills and basic attacks."
- DEF: "Defense. Reduces incoming damage from enemy attacks."
- SPD: "Speed. Determines turn order in combat. Higher speed acts first."
- Mana (Mage): "Mana fuels spellcasting. Spent when using skills. Regenerates partially each turn."
- Faith (Paladin): "Faith powers holy abilities. Spent when using skills. Regenerates partially each turn."
- Divine Power (Cleric): "Divine Power channels healing magic. Spent when using skills. Regenerates partially each turn."
- Nature (Druid): "Nature energy sustains druidic skills. Spent when using skills. Regenerates partially each turn."
- Rage (Berserker): "Rage builds by dealing damage. Increases ATK but reduces DEF as it grows."
- Focus (Ranger): "Focus refreshes after using a basic attack or receiving a buff. Spent to unleash powerful shots."
- Valor (Knight): "Valor builds when protecting allies. Enables powerful defensive skills."
- Verse (Bard): "Verses build with each skill used. At 3 Verses, a Finale triggers automatically on the next turn."

**Files:** `src/composables/useTooltip.js`, `src/components/TooltipOverlay.vue`, `src/App.vue`, `src/screens/HeroesScreen.vue`

### #4 - Quest Details Dialog Redesign

**Problem:** The bottom-sheet quest dialog requires scrolling to reach the Start button on most phone screens.

**Current vertical budget:** ~440-480px (battle count card + enemies section + rewards grid + buttons + margins).

**Redesign:**

1. **Merge battle count into header** -- "Dark Thicket -- 2 Battles" on the same line as the quest name. Eliminates the standalone battle count card. Saves ~60px.

2. **Inline enemy list** -- Replace padded enemy cards with a compact horizontal row: `Goblin Scout (120 HP) · Forest Wolf (180 HP)`. Single line of text. Saves ~40px.

3. **Single-row rewards** -- Replace 2-column grid cards with compact inline: `💎 50  🪙 100  ⭐ 80`. First clear bonus shown as a subtle badge next to gems value. Saves ~50px.

4. **Buttons unchanged** -- Keep prominent call-to-action styling.

5. **Position higher** -- Reduce `max-height` from `75vh` to `60vh`. Add `bottom: 10vh` to lift the sheet off the screen edge.

**Estimated new total:** ~250-280px. No scroll needed.

**Files:** `src/screens/WorldMapScreen.vue`

### #13 - Combat Status Effect Tooltips

**Depends on:** #2 (tooltip system).

**Design:** Clicking a status effect item in the hero inspect dialog shows a tooltip with source and value details.

**Data change:** When effects are applied in `battle.js`, add a `sourceName` field to each effect object (the skill name or ability name that created it).

**Tooltip text generation:** A helper function maps effect type + properties to readable descriptions:
- `DAMAGE_REDUCTION` with `value: 30` -> "Reduces incoming damage by 30%"
- `BURN` with `atkPercent: 50` -> "Takes 50% ATK fire damage per turn"
- `GUARDIAN_LINK` with `redirectPercent: 40` -> "40% of damage redirected to guardian"
- `ATK_UP` with `value: 25` -> "Attack increased by 25%"
- etc.

**Tooltip format:**
```
From: Aurora's Guardian Link
40% of damage redirected to guardian
2 turns remaining
```

**Trigger:** Uses `onClick` variant of `useTooltip()` composable. Click effect item -> tooltip appears near it. Click elsewhere -> dismiss.

**Files:** `src/screens/BattleScreen.vue`, `src/stores/battle.js` (add sourceName), `src/composables/useTooltip.js`

### #15 - Shop Purchase Dialog with Quantity

**New flow:** Click any shop item -> purchase dialog opens (replaces both direct-buy and threshold confirm modal).

**Dialog layout (top to bottom):**
1. Item display -- icon/card + name + description
2. Quantity selector -- `-` button | editable text input | `+` button
   - Min: 1
   - Max: min(remaining stock, affordable quantity)
3. Cost line -- `Total: 🪙 500` (price * quantity, updates live). Red/grayed if unaffordable.
4. Buy button -- full width, disabled when unaffordable or qty is 0

**Backend change:** `purchase()` in `shops.js` gets an optional `quantity` parameter. Validates total cost and stock, then grants items in batch.

**Dismiss:** Click backdrop or X button.

**Replaces:** Current `confirmThreshold` modal entirely.

**Files:** `src/screens/ShopsScreen.vue`, `src/stores/shops.js`

---

## Creative Items

### #3 - Exploration Upgrade Celebration Animation

**Trigger:** When exploration rank upgrades (e.g., E -> D).

**Effect:** Particle burst from the rank badge.
- 15-20 small circle particles in the rank's theme color (green for D, blue for C, purple for B, orange for A, gold for S)
- Particles burst outward radially with random velocities, fade out over ~0.8s
- Rank badge does a quick scale bounce (1.0 -> 1.3 -> 1.0 over 0.4s)

**Implementation:** CSS `@keyframes` on absolutely-positioned spans. Uses shared `useParticleBurst()` composable.

**Files:** `src/composables/useParticleBurst.js`, `src/components/ExplorationDetailView.vue`

### #5 - Shadow King Skill Replacement: Consume Shadow

**Replaces:** Despair (slot 3, unlocks at level 3).

**New skill: Consume Shadow**
- Cost: 0 rage
- Target: self
- Description: "Devour your own afflictions. Remove all debuffs from self. For each debuff removed, gain 15 rage and deal 40% ATK damage to a random enemy."
- `noDamage: false` (deals damage per debuff removed)
- New mechanic: debuff consumption

**Synergy:** Mantle of Empty Hate applies ATK_UP + self-POISON. After buffing, Consume Shadow removes the poison, converts it to rage + damage, while the ATK buff stays (it's a buff, not a debuff). This rewards the self-destructive berserker playstyle.

**Implementation:**
- New skill property: `consumeDebuffs: true`
- Battle.js processing: iterate self debuffs, remove each, accumulate rage gain (15 per) and damage instances (40% ATK per, random enemy target)
- Visual: each removed debuff triggers a small dark particle + damage number on a random enemy

**Template definition:**
```js
{
  name: 'Consume Shadow',
  description: 'Devour your own afflictions. Remove all debuffs. For each debuff removed, gain 15 rage and deal 40% ATK damage to a random enemy.',
  rageCost: 0,
  targetType: 'self',
  skillUnlockLevel: 3,
  consumeDebuffs: { ragePerDebuff: 15, damagePercentPerDebuff: 40 }
}
```

**Files:** `src/data/heroTemplates.js`, `src/stores/battle.js`

### #16 - Hero Merge Celebration Animation

**Trigger:** When a hero is merged (not bulk merge).

**Effect:** Particle burst from the hero portrait in the detail panel.
- 20-25 small circle particles in the hero's rarity color
- Particles burst outward radially, fade out over ~0.8s
- Portrait gets a brief glow pulse (rarity-colored box-shadow expanding and fading over 0.6s)
- For 4-star and 5-star merges: mix in a few larger star-shaped particles

**Implementation:** Same `useParticleBurst()` composable as #3, targeting the detail panel portrait element with different color/count parameters.

**Files:** `src/composables/useParticleBurst.js`, `src/screens/HeroesScreen.vue`
