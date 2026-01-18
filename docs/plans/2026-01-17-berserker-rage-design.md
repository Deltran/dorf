# Berserker Rage System Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace MP with a Rage mechanic for Berserker class heroes.

**Architecture:** Rage is a 0-100 resource that builds through combat (dealing/taking damage) and is spent to use skills. Unlike MP, Rage must be earned through fighting.

**Tech Stack:** Vue 3, Pinia stores, existing battle system

---

## Core Mechanics

### What Rage Is
- A 0-100 scale resource tracked per Berserker hero
- Starts at 0 at the beginning of each quest
- Persists across battles within a quest (doesn't reset between fights)
- Basic attack is always available regardless of Rage

### Gaining Rage

| Trigger | Amount |
|---------|--------|
| Each instance of damage dealt | +5 |
| Each instance of damage taken | +5 |

**Examples:**
- Single-hit skill dealing 100 damage → +5 Rage
- Multi-hit skill dealing 10 damage × 5 hits → +25 Rage
- AoE hitting 3 enemies → +15 Rage
- DoT tick (dealt or received) → +5 Rage

The gain amount is a single constant (`RAGE_GAIN_PER_TRIGGER = 5`) for easy tuning.

### Spending Rage
- Each skill defines its own `rageCost` (e.g., 30, 50, 75)
- Using a skill deducts its cost from current Rage
- Skill is unavailable if current Rage < cost

---

## Technical Implementation

### Class Definition (`src/data/classes.js`)
- Add `resourceType: 'rage'` to Berserker class
- Set `resourceName: 'Rage'` for display
- Consistent with Ranger's `resourceType: 'focus'`

### Battle State (`src/stores/battle.js`)

**Hero initialization in `initBattle()`:**
- For Berserkers, track `currentRage`
- On first battle of quest: initialize `currentRage: 0`
- On subsequent battles: preserve existing `currentRage`

**Rage gain hooks:**
- Create helper: `gainRage(heroInstanceId, amount)`
- Call at every damage instance point (not per-action, per-hit)
- Clamp to max 100

**Rage loss on death:**
- Reset `currentRage` to 0 when Berserker dies

**Skill availability:**
- For Berserkers, check `hero.currentRage >= skill.rageCost`
- Deduct `rageCost` after skill execution

### Hero Templates (`src/data/heroTemplates.js`)
- Berserker skills use `rageCost: X` instead of `mpCost`
- Example: `{ name: 'Reckless Swing', rageCost: 30, ... }`

---

## UI Changes

### Battle Screen Hero Cards
- Replace MP bar with Rage bar for Berserkers
- Color: Red/orange gradient (fury theme)
- Display: Filling bar showing current Rage out of 100
- Same position as MP bar for visual consistency

### Action Buttons
- Skills show Rage cost instead of MP cost for Berserkers
- Disabled state when `currentRage < rageCost`
- Label: "30 Rage" instead of "30 MP"

### Hero Inspect Dialog (in battle)
- Show Rage bar instead of MP bar for Berserkers

### Outside of Battle
- No Rage display (only exists in combat/quest context)

---

## Edge Cases

### Multi-hit and AoE interactions
- Each damage instance triggers Rage gain separately
- AoE skill hitting 3 enemies = 3 instances = +15 Rage
- Multi-hit skill (5 hits on 1 target) = 5 instances = +25 Rage

### DoT damage
- Each tick of a DoT (dealt or received) = +5 Rage
- Berserkers with DoTs become steady Rage generators

### Thorns/reflect damage
- Berserker attacks enemy with Thorns → deals damage (+5) → takes damage (+5) = +10 Rage total

### Overkill
- Rage capped at 100, excess is lost

### Death
- Rage resets to 0 if the Berserker dies
- Must rebuild from scratch if revived

### Quest boundaries
- Rage resets to 0 at the start of each new quest
- Persists across battles within the same quest

---

## Files to Modify

1. `src/data/classes.js` - Add resourceType to Berserker
2. `src/stores/battle.js` - Rage tracking, gain/spend logic, death reset
3. `src/data/heroTemplates.js` - Update Berserker skills with rageCost
4. `src/screens/BattleScreen.vue` - Skill availability checks, Rage cost display
5. `src/components/HeroCard.vue` - Rage bar display for Berserkers
6. `src/components/StatBar.vue` - Possibly add Rage color variant
