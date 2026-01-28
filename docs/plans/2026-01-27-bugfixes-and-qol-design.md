# Bugfixes and QoL Improvements Design

Date: 2026-01-27

Combined design doc covering 9 items: 4 bug fixes and 5 quality-of-life improvements.

---

## Bug Fixes

### #1 - Berserker Rage NaN Display

**Problem:** Viewing Berserker hero details in HeroesScreen shows "NaN" labeled as "Rage".

**Root cause:** Berserker heroes (Shadow King, Darl) don't define `baseStats.mp`. The `getHeroStats()` function in `heroes.js:272` computes `Math.floor(undefined + starBonus)` = `NaN`. The detail panel in `HeroesScreen.vue:868-872` displays `stats.mp` with label `class.resourceName`.

**Fix:**
- In `heroes.js` `getHeroStats()`: default `baseStats.mp` to 0 when undefined
- In `HeroesScreen.vue`: when `class.resourceType === 'rage'`, display "0/100 Rage" (rage is a 0-100 combat resource, not derived from mp stats)

**Files:** `src/stores/heroes.js`, `src/screens/HeroesScreen.vue`

### #6 - Yggra Healing Not Working

**Problem:** Yggra's first skill "Blessing of the World Root" doesn't heal anyone.

**Root cause:** The skill definition is missing `healPercent: 75`. The battle logic (`battle.js:2593`) checks `skill.healPercent || skill.description.includes('heal')` -- the skill has neither (`description` says "restore", not "heal").

**Fix:** Add `healPercent: 75` to the skill definition in `heroTemplates.js`.

**Files:** `src/data/heroTemplates.js`

### #7 - Yggra Grasping Roots Description

**Current:** "Poison one enemy (50% ATK per turn for 2 turns)"
**New:** "Poison an enemy for 50% ATK for 2 turns."

**Files:** `src/data/heroTemplates.js`

### #11 - Shasha Ignite Description

**Current:** "Set an enemy ablaze for 3 turns (burns for ATK×0.5 per turn)."
**New:** "Set an enemy ablaze for 3 turns, dealing 50% ATK per turn."

**Files:** `src/data/heroTemplates.js`

---

## Quality-of-Life Improvements

### #8 + #12 - First-Time Combat Help Dialogs

**Goal:** Show one-time help dialogs when players first enter combat on specific nodes.

**Approach:** Use the existing tips system (`src/stores/tips.js`, `src/components/TipPopup.vue`) which already provides show-once persistence via localStorage.

**New tip definitions:**

- `combat_intro` (triggered on `forest_01` / Dark Thicket):
  > "Choose a skill for the hero below, then select the monster you wish to attack. If you click a monster before you select a skill, the Basic Attack will be selected for you automatically. Click again to attack!"

- `hero_inspect_intro` (triggered on `forest_02` / Wolf Den):
  > "Double-click on a hero's combat card to get detailed information about their current stats and the different effects that are currently affecting them."

**Trigger:** In `BattleScreen.vue`, after `startCurrentBattle()`, check `questsStore.currentRun?.nodeId` and call `tipsStore.showTip()` with the appropriate tip ID.

**Encapsulation:** Already handled by the tips system -- define tip, call `showTip(id)`, done.

**Files:** `src/data/tips.js`, `src/screens/BattleScreen.vue`

### #9 - Exploration Hero Selection Filtering

**Goal:** Add the same filter/sort controls from HeroesScreen to ExplorationDetailView.

**Filters to port:**
- Sort dropdown (default, rarity, level, ATK, DEF, SPD)
- Role toggle chips (Tank, DPS, Healer, Support)
- Class toggle chips (Berserker, Ranger, Knight, etc.)

**Already excluded by `availableForExploration`:**
- Heroes in the main party
- Heroes on other explorations

**Key behavior:**
- Filters only affect the visible hero grid, NOT the `selectedHeroes` array
- A filtered-out hero that's already selected stays selected (just hidden from grid)
- If filters change to reveal a selected hero again, it shows as highlighted via existing `isHeroSelected()` check

**UI:** Filter controls above the hero grid, same compact chip style as HeroesScreen.

**Files:** `src/components/ExplorationDetailView.vue`

### #10 - Victory Display Panel Jitter

**Problem:** Switching between reward and hero XP panels causes the modal to resize because content heights differ.

**Fix:**
- Set a consistent `height` on `.victory-step` (instead of `min-height: 200px`)
- Add `overflow-y: auto` as safety valve
- Use `display: flex; flex-direction: column` with `margin-top: auto` on the nav button to anchor it at the bottom

**Files:** `src/screens/BattleScreen.vue` (CSS only)

### #14 - Guaranteed First Key Drop on Genus Loci Feeder Nodes

**Goal:** First time a player clears a quest node, any key-type item drops are guaranteed (chance = 1.0). Subsequent clears use normal drop chance.

**Approach:** Modify `rollItemDrops()` in `quests.js` to accept `isFirstClear` and override chance for items with `type === 'key'`.

```js
function rollItemDrops(node, isFirstClear) {
  const drops = []
  for (const drop of node.itemDrops || []) {
    const item = getItem(drop.itemId)
    const effectiveChance = (isFirstClear && item?.type === 'key') ? 1.0 : drop.chance
    if (Math.random() > effectiveChance) continue
    const count = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min
    drops.push({ itemId: drop.itemId, count })
  }
  return drops
}
```

**Files:** `src/stores/quests.js`
