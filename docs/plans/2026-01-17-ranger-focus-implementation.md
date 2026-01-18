# Ranger Focus System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace MP with a Focus boolean mechanic for Ranger class heroes.

**Architecture:** Add `resourceType` to class definitions, track `hasFocus` boolean per hero in battle state, hook into damage/effect/turn logic to manage focus state changes.

**Tech Stack:** Vue 3, Pinia stores, existing battle system

---

## Task 1: Add resourceType to Class Definitions

**Files:**
- Modify: `src/data/classes.js`

**Step 1: Add resourceType field to ranger class**

Update the ranger class definition to include `resourceType: 'focus'`:

```javascript
ranger: {
  id: 'ranger',
  title: 'Ranger',
  role: 'dps',
  resourceName: 'Focus',
  resourceType: 'focus'  // ADD THIS LINE
},
```

**Step 2: Verify other classes don't have resourceType (they default to MP)**

No changes needed - absence of `resourceType` means MP-based.

**Step 3: Commit**

```bash
git add src/data/classes.js
git commit -m "feat(classes): add resourceType field for ranger focus system"
```

---

## Task 2: Initialize Focus State in Battle

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Import getClass function**

At the top of battle.js, ensure `getClass` is imported:

```javascript
import { getClass } from '../data/classes.js'
```

**Step 2: Add hasFocus to hero initialization in initBattle**

Find the hero initialization loop in `initBattle()` (around line 400-413) and add `hasFocus`:

```javascript
heroes.value.push({
  instanceId,
  templateId: heroFull.templateId,
  level: heroFull.level,
  currentHp: savedState?.currentHp ?? heroFull.stats.hp,
  maxHp: heroFull.stats.hp,
  currentMp: savedState?.currentMp ?? Math.floor(heroFull.stats.mp * 0.3),
  maxMp: heroFull.stats.mp,
  stats: heroFull.stats,
  template: heroFull.template,
  class: heroFull.class,
  statusEffects: [],
  hasFocus: heroFull.class?.resourceType === 'focus' ? true : undefined  // ADD THIS
})
```

**Step 3: Test manually**

- Start a battle with a Ranger in party
- Add `console.log(heroes.value)` temporarily to verify `hasFocus: true` is set

**Step 4: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat(battle): initialize hasFocus for ranger heroes"
```

---

## Task 3: Add Focus Helper Functions

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Add isRanger helper function**

Add after the existing helper functions (around line 260):

```javascript
// Check if a unit is a Ranger (uses Focus)
function isRanger(unit) {
  return unit.class?.resourceType === 'focus'
}
```

**Step 2: Add Focus management functions**

Add these functions after `isRanger`:

```javascript
// Grant focus to a ranger
function grantFocus(unit) {
  if (!isRanger(unit)) return
  if (unit.hasFocus) return // Already has focus
  unit.hasFocus = true
  const unitName = unit.template?.name || 'Unknown'
  addLog(`${unitName} gains Focus!`)
}

// Remove focus from a ranger
function removeFocus(unit, silent = false) {
  if (!isRanger(unit)) return
  if (!unit.hasFocus) return // Already no focus
  unit.hasFocus = false
  if (!silent) {
    const unitName = unit.template?.name || 'Unknown'
    addLog(`${unitName} loses Focus!`)
  }
}
```

**Step 3: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat(battle): add isRanger, grantFocus, removeFocus helpers"
```

---

## Task 4: Remove Focus on Damage

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Create a centralized damage application helper**

Add this function after the focus helpers:

```javascript
// Apply damage to a unit and handle focus loss for rangers
function applyDamage(unit, damage, source = 'attack') {
  if (damage <= 0) return 0

  const actualDamage = Math.min(unit.currentHp, damage)
  unit.currentHp = Math.max(0, unit.currentHp - damage)

  // Rangers lose focus when taking damage
  if (isRanger(unit) && actualDamage > 0) {
    removeFocus(unit)
  }

  return actualDamage
}
```

**Step 2: Update executePlayerAction - basic attack damage to enemy**

Find the basic attack section (around line 609-616) and update:

```javascript
// BEFORE:
target.currentHp = Math.max(0, target.currentHp - damage)

// AFTER (enemies aren't rangers, but use helper for consistency):
applyDamage(target, damage)
```

**Step 3: Update thorns damage to heroes**

Find thorns damage sections (multiple locations) and update each instance where a hero takes damage. Example around line 623-628:

```javascript
// BEFORE:
hero.currentHp = Math.max(0, hero.currentHp - thornsDamage)

// AFTER:
applyDamage(hero, thornsDamage, 'thorns')
```

**Step 4: Update enemy attacks on heroes**

In `executeEnemyTurn`, find where heroes take damage (around line 1056-1058):

```javascript
// BEFORE:
target.currentHp = Math.max(0, target.currentHp - damage)

// AFTER:
applyDamage(target, damage)
```

**Step 5: Update DoT damage in processEndOfTurnEffects**

Find the DoT damage section (around line 333):

```javascript
// BEFORE:
unit.currentHp = Math.max(0, unit.currentHp - damage)

// AFTER:
applyDamage(unit, damage, 'dot')
```

**Step 6: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat(battle): remove ranger focus on all damage sources"
```

---

## Task 5: Remove Focus on Debuff

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Update applyEffect to remove focus on debuffs**

Find the `applyEffect` function. After the effect is added, check if it's a debuff and remove focus:

```javascript
// At the end of applyEffect, before the log message:
// Rangers lose focus when debuffed
if (isRanger(unit) && !definition.isBuff) {
  removeFocus(unit)
}

const unitName = unit.template?.name || 'Unknown'
addLog(`${unitName} gains ${definition.name}!`)
```

**Step 2: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat(battle): remove ranger focus when debuffed"
```

---

## Task 6: Grant Focus on Beneficial Effects (Ally Skills Only)

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Add sourceType parameter to applyEffect**

Update the `applyEffect` function signature:

```javascript
// BEFORE:
function applyEffect(unit, effectType, { duration = 2, value = 0, sourceId = null } = {})

// AFTER:
function applyEffect(unit, effectType, { duration = 2, value = 0, sourceId = null, fromAllySkill = false } = {})
```

**Step 2: Grant focus when receiving buff from ally skill**

In applyEffect, after adding the effect but before the debuff check:

```javascript
// Rangers gain focus when receiving beneficial effect from ally skill
if (isRanger(unit) && definition.isBuff && fromAllySkill) {
  grantFocus(unit)
}

// Rangers lose focus when debuffed
if (isRanger(unit) && !definition.isBuff) {
  removeFocus(unit)
}
```

**Step 3: Update ally skill effect calls to pass fromAllySkill: true**

In `executePlayerAction`, find the ally-targeting skill effects (around line 752-758):

```javascript
// BEFORE:
applyEffect(target, effect.type, { duration: effect.duration, value: effectValue, sourceId: hero.instanceId })

// AFTER:
applyEffect(target, effect.type, { duration: effect.duration, value: effectValue, sourceId: hero.instanceId, fromAllySkill: true })
```

Also update `all_allies` skill effects (around line 864):

```javascript
applyEffect(target, effect.type, { duration: effect.duration, value: effectValue, sourceId: hero.instanceId, fromAllySkill: true })
```

**Step 4: Grant focus on healing**

Find ally heal sections in `executePlayerAction` and add focus grant. Around line 714:

```javascript
// After healing is applied:
if (actualHeal > 0) {
  emitCombatEffect(target.instanceId, 'hero', 'heal', actualHeal)
  // Rangers gain focus when healed by ally
  if (isRanger(target)) {
    grantFocus(target)
  }
}
```

Also for `all_allies` healing (around line 840):

```javascript
if (actualHeal > 0) {
  emitCombatEffect(target.instanceId, 'hero', 'heal', actualHeal)
  // Rangers gain focus when healed
  if (isRanger(target)) {
    grantFocus(target)
  }
}
```

**Step 5: Grant focus on cleanse**

Find cleanse logic (around line 725-737) and add:

```javascript
if (removedEffects.length > 0) {
  target.statusEffects = target.statusEffects.filter(e => !isStatDebuff(e))
  for (const effect of removedEffects) {
    addLog(`${target.template.name}'s ${effect.definition.name} was cleansed!`)
  }
  emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
  // Rangers gain focus when cleansed
  if (isRanger(target)) {
    grantFocus(target)
  }
}
```

**Step 6: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat(battle): grant ranger focus on ally heals/buffs/cleanses"
```

---

## Task 7: Remove Focus on Skill Use & Grant on Basic Attack Turn

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Track if skill was used in executePlayerAction**

At the start of `executePlayerAction`, add a variable to track skill use:

```javascript
function executePlayerAction() {
  const hero = currentUnit.value
  if (!hero || hero.currentHp <= 0) return

  let usedSkill = false  // ADD THIS

  state.value = BattleState.ANIMATING
```

**Step 2: Remove focus when ranger uses skill**

After the skill MP deduction (around line 643), add focus removal:

```javascript
hero.currentMp -= skill.mpCost
usedSkill = true  // ADD THIS

// Rangers lose focus when using a skill
if (isRanger(hero)) {
  removeFocus(hero, true)  // silent - skill use is implied
}
```

**Step 3: Grant focus at end of turn if basic attack used**

Before `processEndOfTurnEffects(hero)` at the end of `executePlayerAction` (around line 876):

```javascript
// Rangers regain focus if they didn't use a skill this turn
if (isRanger(hero) && !usedSkill) {
  grantFocus(hero)
}

// Process end of turn effects
processEndOfTurnEffects(hero)
```

**Step 4: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat(battle): remove focus on skill use, grant on basic attack turn"
```

---

## Task 8: Create FocusIndicator Component

**Files:**
- Create: `src/components/FocusIndicator.vue`

**Step 1: Create the component**

```vue
<script setup>
defineProps({
  hasFocus: {
    type: Boolean,
    required: true
  },
  size: {
    type: String,
    default: 'sm' // sm, md
  }
})
</script>

<template>
  <div :class="['focus-indicator', size, { focused: hasFocus }]">
    <div class="focus-icon">
      <span class="focus-symbol">◎</span>
    </div>
    <span class="focus-label">{{ hasFocus ? 'Focused' : 'Unfocused' }}</span>
  </div>
</template>

<style scoped>
.focus-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  background: #374151;
  transition: all 0.3s ease;
}

.focus-indicator.sm {
  padding: 2px 6px;
  gap: 4px;
}

.focus-indicator.focused {
  background: linear-gradient(135deg, #f59e0b22, #d9770622);
  border: 1px solid #f59e0b55;
}

.focus-indicator:not(.focused) {
  background: #374151;
  border: 1px solid #4b5563;
  opacity: 0.7;
}

.focus-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.focus-symbol {
  font-size: 1rem;
  transition: all 0.3s ease;
}

.sm .focus-symbol {
  font-size: 0.85rem;
}

.focused .focus-symbol {
  color: #f59e0b;
  text-shadow: 0 0 8px #f59e0b88;
  animation: focusPulse 2s ease-in-out infinite;
}

.focus-indicator:not(.focused) .focus-symbol {
  color: #6b7280;
}

.focus-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #9ca3af;
}

.sm .focus-label {
  font-size: 0.6rem;
}

.focused .focus-label {
  color: #fbbf24;
}

@keyframes focusPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}
</style>
```

**Step 2: Commit**

```bash
git add src/components/FocusIndicator.vue
git commit -m "feat(ui): add FocusIndicator component"
```

---

## Task 9: Update HeroCard to Show Focus for Rangers

**Files:**
- Modify: `src/components/HeroCard.vue`

**Step 1: Import FocusIndicator**

```javascript
import StatBar from './StatBar.vue'
import FocusIndicator from './FocusIndicator.vue'  // ADD THIS
```

**Step 2: Add computed for checking if hero is ranger**

```javascript
const isRangerHero = computed(() => {
  return heroClass.value?.resourceType === 'focus'
})
```

**Step 3: Update the card-bars template**

Replace the existing card-bars section:

```vue
<div v-if="showBars && hero.currentHp !== undefined" class="card-bars">
  <StatBar
    :current="hero.currentHp"
    :max="hero.maxHp"
    label="HP"
    color="green"
    size="sm"
  />
  <!-- Focus indicator for Rangers, MP bar for others -->
  <FocusIndicator
    v-if="isRangerHero"
    :hasFocus="hero.hasFocus"
    size="sm"
  />
  <StatBar
    v-else
    :current="hero.currentMp"
    :max="hero.maxMp"
    :label="heroClass?.resourceName || 'MP'"
    color="blue"
    size="sm"
  />
</div>
```

**Step 4: Commit**

```bash
git add src/components/HeroCard.vue
git commit -m "feat(ui): show FocusIndicator for rangers in HeroCard"
```

---

## Task 10: Update Skill Availability for Rangers

**Files:**
- Modify: `src/screens/BattleScreen.vue`

**Step 1: Add isRanger computed**

In the script section, add:

```javascript
const isCurrentHeroRanger = computed(() => {
  return currentHero.value?.class?.resourceType === 'focus'
})
```

**Step 2: Update canUseSkill function**

```javascript
function canUseSkill(skill) {
  if (!currentHero.value || !skill) return false

  // Rangers use Focus instead of MP
  if (isCurrentHeroRanger.value) {
    return currentHero.value.hasFocus === true
  }

  return currentHero.value.currentMp >= skill.mpCost
}
```

**Step 3: Update skill button cost display in template**

Find the ActionButton for skills (around line 711-721) and update:

```vue
<ActionButton
  v-for="(skill, index) in availableSkills"
  :key="skill.name"
  :label="skill.name"
  :description="skill.description"
  :cost="isCurrentHeroRanger ? null : skill.mpCost"
  :costLabel="isCurrentHeroRanger ? null : currentHero.class.resourceName"
  :disabled="!canUseSkill(skill)"
  :selected="battleStore.selectedAction === `skill_${index}`"
  variant="primary"
  @click="selectAction(`skill_${index}`)"
/>
```

**Step 4: Add Focus requirement indicator**

Update the ActionButton to show "Requires Focus" for disabled ranger skills. This may require adding a `disabledReason` prop to ActionButton or showing it differently. Simple approach - add subtitle text:

```vue
<ActionButton
  v-for="(skill, index) in availableSkills"
  :key="skill.name"
  :label="skill.name"
  :description="isCurrentHeroRanger && !currentHero.hasFocus ? 'Requires Focus' : skill.description"
  :cost="isCurrentHeroRanger ? null : skill.mpCost"
  :costLabel="isCurrentHeroRanger ? null : currentHero.class.resourceName"
  :disabled="!canUseSkill(skill)"
  :selected="battleStore.selectedAction === `skill_${index}`"
  variant="primary"
  @click="selectAction(`skill_${index}`)"
/>
```

**Step 5: Commit**

```bash
git add src/screens/BattleScreen.vue
git commit -m "feat(ui): update skill availability checks for ranger focus"
```

---

## Task 11: Update Hero Inspect Dialog for Rangers

**Files:**
- Modify: `src/screens/BattleScreen.vue`

**Step 1: Import FocusIndicator in BattleScreen**

```javascript
import FocusIndicator from '../components/FocusIndicator.vue'
```

**Step 2: Add isInspectedHeroRanger computed**

```javascript
const isInspectedHeroRanger = computed(() => {
  return inspectedHero.value?.class?.resourceType === 'focus'
})
```

**Step 3: Update the inspect dialog MP bar section**

Find the MP bar row in the hero inspect dialog (around line 885-894) and update:

```vue
<!-- Replace the MP StatBar with conditional -->
<div v-if="isInspectedHeroRanger" class="inspect-bar-row">
  <span class="bar-label">Focus</span>
  <FocusIndicator :hasFocus="inspectedHero.hasFocus" size="md" />
</div>
<div v-else class="inspect-bar-row">
  <span class="bar-label">{{ inspectedHero.class?.resourceName || 'MP' }}</span>
  <StatBar
    :current="inspectedHero.currentMp"
    :max="inspectedHero.maxMp"
    color="blue"
    size="md"
  />
  <span class="bar-numbers">{{ inspectedHero.currentMp }} / {{ inspectedHero.maxMp }}</span>
</div>
```

**Step 4: Commit**

```bash
git add src/screens/BattleScreen.vue
git commit -m "feat(ui): show focus in hero inspect dialog for rangers"
```

---

## Task 12: Export Focus Functions from Battle Store

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Add focus functions to store return**

Find the return statement at the end of the store and add:

```javascript
return {
  // ... existing exports ...
  // Focus helpers (for UI)
  isRanger,
  grantFocus,
  removeFocus,
  // ... rest of exports ...
}
```

**Step 2: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat(battle): export focus helper functions"
```

---

## Task 13: Final Testing & Polish

**Manual Test Checklist:**

1. **Battle Start**: Ranger starts with Focus indicator lit
2. **Basic Attack**: Use basic attack → Focus remains → End of turn → Still have Focus
3. **Skill Use**: Have Focus → Use skill → Focus indicator dims
4. **Regain from Basic Attack**: No Focus → Use basic attack → End of turn → Focus regained
5. **Lose from Damage**: Have Focus → Take enemy attack → Focus lost
6. **Lose from DoT**: Have Focus → Poison tick → Focus lost
7. **Lose from Debuff**: Have Focus → Get ATK Down → Focus lost
8. **Gain from Heal**: No Focus → Ally heals you → Focus gained
9. **Gain from Buff**: No Focus → Ally buffs you → Focus gained
10. **Battle 2 Reset**: Lose focus in battle 1 → Battle 2 starts → Focus restored
11. **Inspect Dialog**: Double-click Ranger → Shows Focus state correctly
12. **Skill Buttons**: Without Focus → Skills show disabled with "Requires Focus"

**Step 1: Fix any issues found during testing**

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat: complete ranger focus system implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add resourceType to classes | classes.js |
| 2 | Initialize hasFocus in battle | battle.js |
| 3 | Add focus helper functions | battle.js |
| 4 | Remove focus on damage | battle.js |
| 5 | Remove focus on debuff | battle.js |
| 6 | Grant focus on ally beneficial effects | battle.js |
| 7 | Skill use removes focus, basic attack grants | battle.js |
| 8 | Create FocusIndicator component | FocusIndicator.vue |
| 9 | Update HeroCard for rangers | HeroCard.vue |
| 10 | Update skill availability | BattleScreen.vue |
| 11 | Update inspect dialog | BattleScreen.vue |
| 12 | Export focus functions | battle.js |
| 13 | Testing & polish | All |
