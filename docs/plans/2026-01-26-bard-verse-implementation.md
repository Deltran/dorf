# Bard Verse Resource System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Bard MP with a unique Verse resource — free skills build 3 verses toward a per-hero Finale effect.

**Architecture:** Bards use `resourceType: 'verse'` in the class system. Skills have no cost but can't repeat consecutively. Each skill adds +1 verse (0-3). At 3/3, Finale auto-triggers at start of next turn. Finale is defined per hero template.

**Tech Stack:** Vue 3, Pinia stores, Vitest

---

### Task 1: Update Bard Class Definition

**Files:**
- Modify: `src/data/classes.js:47-52`

**Step 1: Update bard class**

Change the bard class to use the verse resource type:

```js
bard: {
  id: 'bard',
  title: 'Bard',
  role: 'support',
  resourceName: 'Verse',
  resourceType: 'verse'
}
```

**Step 2: Commit**

```bash
git add src/data/classes.js
git commit -m "feat(bard): add verse resourceType to bard class"
```

---

### Task 2: Add Bard Helpers to Battle Store

**Files:**
- Modify: `src/stores/battle.js`
- Test: `src/stores/__tests__/battle-verse.test.js`

**Step 1: Write failing tests**

Create `src/stores/__tests__/battle-verse.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('battle store - verse helpers', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('isBard', () => {
    it('returns true for units with verse resourceType', () => {
      const bard = { class: { resourceType: 'verse' } }
      expect(store.isBard(bard)).toBe(true)
    })

    it('returns false for non-bards', () => {
      const knight = { class: { resourceType: 'valor' } }
      expect(store.isBard(knight)).toBe(false)
    })

    it('returns false for units without class', () => {
      const unit = {}
      expect(store.isBard(unit)).toBe(false)
    })
  })

  describe('gainVerse', () => {
    it('increases currentVerses by 1', () => {
      const unit = { currentVerses: 0 }
      store.gainVerse(unit)
      expect(unit.currentVerses).toBe(1)
    })

    it('caps verses at 3', () => {
      const unit = { currentVerses: 3 }
      store.gainVerse(unit)
      expect(unit.currentVerses).toBe(3)
    })

    it('does nothing if unit has no currentVerses property', () => {
      const unit = {}
      store.gainVerse(unit)
      expect(unit.currentVerses).toBeUndefined()
    })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/stores/__tests__/battle-verse.test.js`
Expected: FAIL — `isBard` and `gainVerse` not found on store

**Step 3: Implement isBard and gainVerse**

In `src/stores/battle.js`, after the Berserker helpers section (after line ~567), add:

```js
// ========== VERSE HELPERS (Bards) ==========

// Check if a unit is a Bard (uses Verse)
function isBard(unit) {
  return unit.class?.resourceType === 'verse'
}

// Gain a verse for a bard (capped at 3)
function gainVerse(unit) {
  if (unit.currentVerses === undefined) return
  unit.currentVerses = Math.min(3, unit.currentVerses + 1)
}
```

Add to the return/exports section (around line ~2870, after `spendRage,`):

```js
// Verse helpers (for UI)
isBard,
gainVerse,
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/stores/__tests__/battle-verse.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-verse.test.js
git commit -m "feat(bard): add isBard and gainVerse helpers to battle store"
```

---

### Task 3: Initialize Bard State and Update Resource Checks

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Initialize Bard state in hero setup**

In the `initBattle` function, in the hero initialization block (around line ~1150), after the `currentRage` line, add:

```js
currentVerses: heroFull.class?.resourceType === 'verse' ? 0 : undefined,
lastSkillName: heroFull.class?.resourceType === 'verse' ? null : undefined,
```

**Step 2: Update canUseSkill for Bards**

In the `canUseSkill` function (around line ~570), add a Bard check before the MP fallback:

```js
// Bards can always use skills (no cost) - repeat restriction checked in executePlayerAction
if (isBard(unit)) {
  return true
}
```

**Step 3: Update executePlayerAction resource checks**

In `executePlayerAction` (around line ~1432-1470), add a Bard branch before the final `else` (MP check). Between the Berserker `}` and the `else {`:

```js
} else if (isBard(hero)) {
  // Bards have no resource cost — skills are free
  // Repeat restriction is handled by BattleScreen canUseSkill
```

**Step 4: Add verse gain after Bard skill use**

After the existing Ranger focus loss block (around line ~1484), add:

```js
// Bards gain a verse when using a skill
if (isBard(hero)) {
  gainVerse(hero)
  hero.lastSkillName = skill.name
  addLog(`${hero.template.name} plays ${skill.name}! (Verse ${hero.currentVerses}/3)`)
}
```

**Step 5: Skip MP recovery for Bards**

In the round-end MP recovery loop (in `advanceTurnIndex`, around line ~1335), add a Bard check to skip MP recovery:

```js
for (const hero of heroes.value) {
  if (hero.currentHp > 0 && !isBard(hero)) {  // Add !isBard(hero) check
    const recovery = Math.floor(hero.maxMp * 0.1)
    hero.currentMp = Math.min(hero.currentMp + recovery, hero.maxMp)
  }
}
```

**Step 6: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat(bard): initialize verse state and skip MP checks for bards"
```

---

### Task 4: Implement Finale Trigger

**Files:**
- Modify: `src/stores/battle.js`

This is the core mechanic. When a Bard starts their turn with 3/3 verses, Finale triggers automatically, then the Bard gets their normal turn.

**Step 1: Add finaleActivation reactive ref**

Near the other reactive state declarations (around line ~30), add:

```js
const finaleActivation = ref(null) // { bardId, finaleName } - for visual announcement
```

**Step 2: Create executeFinale function**

Add this function after the `processStartOfTurnEffects` function (around line ~418):

```js
// Execute a Bard's Finale effect
function executeFinale(bard) {
  const finale = bard.template.finale
  if (!finale) return

  addLog(`${bard.template.name}'s Finale: ${finale.name}!`)
  finaleActivation.value = { bardId: bard.instanceId, finaleName: finale.name }

  // Reset verses
  bard.currentVerses = 0
  bard.lastSkillName = null

  if (!finale.effects) return

  for (const effect of finale.effects) {
    if (finale.target === 'all_allies') {
      for (const hero of heroes.value) {
        if (hero.currentHp <= 0) continue
        applyFinaleEffect(bard, hero, effect)
      }
    } else if (finale.target === 'all_enemies') {
      for (const enemy of enemies.value) {
        if (enemy.currentHp <= 0) continue
        applyFinaleEffectToEnemy(bard, enemy, effect)
      }
    }
  }
}

function applyFinaleEffect(bard, target, effect) {
  // Resource grants
  if (effect.type === 'resource_grant') {
    if (effect.rageAmount && isBerserker(target)) {
      gainRage(target, effect.rageAmount)
      addLog(`${target.template.name} gains ${effect.rageAmount} Rage!`)
      emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
    }
    if (effect.focusGrant && isRanger(target)) {
      grantFocus(target)
      emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
    }
    if (effect.valorAmount && isKnight(target)) {
      gainValor(target, effect.valorAmount)
      addLog(`${target.template.name} gains ${effect.valorAmount} Valor!`)
      emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
    }
    if (effect.mpAmount && !isBerserker(target) && !isRanger(target) && !isKnight(target) && !isBard(target)) {
      const oldMp = target.currentMp || 0
      target.currentMp = Math.min(target.maxMp || 100, oldMp + effect.mpAmount)
      const actual = target.currentMp - oldMp
      if (actual > 0) {
        addLog(`${target.template.name} gains ${actual} MP!`)
        emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
      }
    }
    if (effect.verseAmount && isBard(target) && target.instanceId !== bard.instanceId) {
      gainVerse(target)
      addLog(`${target.template.name} gains 1 Verse!`)
      emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
    }
  }

  // Heal (percentage of Bard's ATK)
  if (effect.type === 'heal' && effect.value) {
    const bardAtk = getEffectiveStat(bard, 'atk')
    const healAmount = Math.floor(bardAtk * (effect.value / 100))
    const oldHp = target.currentHp
    target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount)
    const actual = target.currentHp - oldHp
    if (actual > 0) {
      emitCombatEffect(target.instanceId, 'hero', 'heal', actual)
    }
  }
}

function applyFinaleEffectToEnemy(bard, enemy, effect) {
  // Damage (percentage of Bard's ATK)
  if (effect.type === 'damage' && effect.damagePercent) {
    const bardAtk = getEffectiveStat(bard, 'atk')
    const damage = Math.floor(bardAtk * (effect.damagePercent / 100))
    applyDamage(enemy, damage, 'skill', bard)
    emitCombatEffect(enemy.id, 'enemy', 'damage', damage)
  }

  // Status effects
  if (effect.type && effect.duration) {
    const definition = statusEffects[effect.type]
    if (definition) {
      enemy.statusEffects = enemy.statusEffects || []
      enemy.statusEffects.push({
        type: effect.type,
        definition,
        duration: effect.duration,
        value: effect.value,
        sourceId: bard.instanceId
      })
      addLog(`${enemy.template.name} receives ${definition.name}!`)
      emitCombatEffect(enemy.id, 'enemy', 'debuff', 0)
    }
  }
}
```

**Step 3: Trigger Finale at start of Bard's turn**

In the `startNextTurn` function (around line ~1250), in the hero turn block, after `processStartOfTurnEffects` returns true and before `state.value = BattleState.PLAYER_TURN`, add the Finale check:

```js
if (hero && hero.currentHp > 0) {
  // Check for stun
  if (!processStartOfTurnEffects(hero)) {
    processEndOfTurnEffects(hero)
    advanceTurnIndex()
    setTimeout(() => startNextTurn(), 600)
    return
  }

  // Check for Bard Finale (auto-trigger at 3 verses)
  if (isBard(hero) && hero.currentVerses >= 3 && hero.template.finale) {
    executeFinale(hero)
  }

  state.value = BattleState.PLAYER_TURN
  selectedAction.value = null
  selectedTarget.value = null
  addLog(`${hero.template.name}'s turn`)
  return
}
```

**Step 4: Export finaleActivation**

In the return block, add `finaleActivation` to the State section:

```js
finaleActivation,
```

**Step 5: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat(bard): implement Finale trigger and effect execution"
```

---

### Task 5: Update Bard Hero Templates

**Files:**
- Modify: `src/data/heroTemplates.js`

**Step 1: Update Harl the Handsom**

Remove all `mpCost` from Harl's skills. Add `finale` property. Keep `mp` in `baseStats` (it's ignored but removing it would require wider changes to stat display).

```js
wandering_bard: {
  id: 'wandering_bard',
  name: 'Harl the Handsom',
  rarity: 3,
  classId: 'bard',
  baseStats: { hp: 75, atk: 20, def: 20, spd: 15, mp: 70 },
  finale: {
    name: 'Standing Ovation',
    description: 'Restore resources to all allies based on their class and heal for 5% of ATK.',
    target: 'all_allies',
    effects: [
      { type: 'resource_grant', rageAmount: 15, focusGrant: true, valorAmount: 10, mpAmount: 15, verseAmount: 1 },
      { type: 'heal', value: 5 }
    ]
  },
  skills: [
    {
      name: 'Inspiring Song',
      description: 'Increase all allies ATK by 15% for 2 turns',
      targetType: 'all_allies',
      effects: [
        { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 15 }
      ]
    },
    {
      name: 'Mana Melody',
      description: 'Restore 10 MP to all allies',
      skillUnlockLevel: 1,
      targetType: 'all_allies',
      mpRestore: 10
    },
    {
      name: 'Soothing Serenade',
      description: 'Heal all allies for 15% of ATK',
      skillUnlockLevel: 3,
      targetType: 'all_allies',
      healFromStat: { stat: 'atk', percent: 15 }
    },
    {
      name: 'Ballad of Blackwall',
      description: 'Grant all allies DEF +20% for 2 turns',
      skillUnlockLevel: 6,
      targetType: 'all_allies',
      effects: [
        { type: EffectType.DEF_UP, target: 'all_allies', duration: 2, value: 20 }
      ]
    },
    {
      name: 'Encore',
      description: 'Extend buff durations on ally by 2 turns. Grant +15 MP, +10 Rage, +10 Valor, +15% SPD for 1 turn.',
      skillUnlockLevel: 12,
      targetType: 'ally',
      extendBuffs: 2,
      grantMp: 15,
      grantRage: 10,
      grantValor: 10,
      effects: [
        { type: EffectType.SPD_UP, target: 'ally', duration: 1, value: 15 }
      ]
    }
  ]
}
```

**Step 2: Update Penny Whistler**

Remove all `mpCost` from Penny Whistler's skills. Add `finale` property. Penny Whistler is 1-star with only 1 skill at level 1, so the Verse system won't activate until level 3 when the second skill unlocks. No finale needed — but add one anyway for when they eventually have 2+ skills.

Note: Penny Whistler's last skill is called "Ear-Splitting Finale" — rename it to avoid confusion with the Verse Finale mechanic. Change to "Ear-Splitting Crescendo".

```js
street_busker: {
  id: 'street_busker',
  name: 'Penny Whistler',
  rarity: 1,
  classId: 'bard',
  baseStats: { hp: 65, atk: 15, def: 18, spd: 14, mp: 55 },
  finale: {
    name: 'Discordant Shriek',
    description: 'A piercing wave of sound that weakens all enemies.',
    target: 'all_enemies',
    effects: [
      { type: EffectType.ATK_DOWN, duration: 2, value: 10 },
      { type: EffectType.DEF_DOWN, duration: 2, value: 10 }
    ]
  },
  skills: [
    {
      name: 'Jarring Whistle',
      description: 'A piercing off-key note that makes enemies flinch',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'enemy', duration: 2, value: 15 }
      ]
    },
    {
      name: 'Distracting Jingle',
      description: 'An annoying tune that throws off enemy timing',
      skillUnlockLevel: 3,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'enemy', duration: 2, value: 15 }
      ]
    },
    {
      name: 'Street Racket',
      description: 'A cacophony of noise that disrupts all foes',
      skillUnlockLevel: 6,
      targetType: 'all_enemies',
      noDamage: true,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'all_enemies', duration: 2, value: 10 },
        { type: EffectType.DEF_DOWN, target: 'all_enemies', duration: 2, value: 10 }
      ]
    },
    {
      name: 'Ear-Splitting Crescendo',
      description: "A piercing note that's unbearable to those already off-balance",
      skillUnlockLevel: 12,
      targetType: 'enemy',
      noDamage: true,
      stunIfDebuffed: true,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'enemy', duration: 2, value: 20 }
      ]
    }
  ]
}
```

**Step 3: Commit**

```bash
git add src/data/heroTemplates.js
git commit -m "feat(bard): add Finale to Harl and Penny, remove mpCost from bard skills"
```

---

### Task 6: Create VerseIndicator Component

**Files:**
- Create: `src/components/VerseIndicator.vue`

**Step 1: Create the component**

Follow the pattern of `FocusIndicator.vue` — a compact display showing 3 verse pips.

```vue
<script setup>
defineProps({
  currentVerses: {
    type: Number,
    required: true
  },
  size: {
    type: String,
    default: 'sm'
  }
})
</script>

<template>
  <div
    :class="['verse-indicator', size, { primed: currentVerses >= 3 }]"
    role="status"
    :aria-label="`Verse: ${currentVerses} of 3`"
  >
    <div class="verse-pips">
      <span
        v-for="i in 3"
        :key="i"
        :class="['verse-pip', { filled: i <= currentVerses }]"
      >&#9679;</span>
    </div>
    <span class="verse-label">{{ currentVerses }}/3</span>
  </div>
</template>

<style scoped>
.verse-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  background: #374151;
  border: 1px solid #4b5563;
  transition: all 0.3s ease;
}

.verse-indicator.sm {
  padding: 2px 6px;
  gap: 4px;
}

.verse-indicator.primed {
  background: linear-gradient(135deg, #f59e0b22, #d9770622);
  border-color: #f59e0b55;
}

.verse-pips {
  display: flex;
  gap: 4px;
  align-items: center;
}

.verse-pip {
  font-size: 0.7rem;
  color: #4b5563;
  transition: all 0.3s ease;
  user-select: none;
}

.sm .verse-pip {
  font-size: 0.6rem;
}

.md .verse-pip {
  font-size: 0.8rem;
}

.verse-pip.filled {
  color: #fbbf24;
  text-shadow: 0 0 6px #f59e0b88;
  animation: versePulse 2s ease-in-out infinite;
}

.primed .verse-pip.filled {
  animation: versePrimePulse 1s ease-in-out infinite;
  text-shadow: 0 0 10px #f59e0bcc;
}

.verse-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #9ca3af;
}

.sm .verse-label {
  font-size: 0.6rem;
}

.primed .verse-label {
  color: #fbbf24;
}

@keyframes versePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

@keyframes versePrimePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.15); }
}
</style>
```

**Step 2: Commit**

```bash
git add src/components/VerseIndicator.vue
git commit -m "feat(bard): create VerseIndicator component"
```

---

### Task 7: Update HeroCard to Display Verses

**Files:**
- Modify: `src/components/HeroCard.vue`

**Step 1: Add isBardHero computed**

After the `isBerserkerHero` computed (around line ~77), add:

```js
const isBardHero = computed(() => {
  return heroClass.value?.resourceType === 'verse'
})
```

**Step 2: Import VerseIndicator**

Add to the imports at the top of the script:

```js
import VerseIndicator from './VerseIndicator.vue'
```

**Step 3: Add VerseIndicator to template**

In the resource bar section (around line ~187-192), add a Bard branch before the Rage bar:

```html
<!-- Verse indicator for Bards -->
<VerseIndicator
  v-else-if="isBardHero"
  :currentVerses="hero.currentVerses || 0"
  size="sm"
/>
```

Place it after `ValorBar` and before `RageBar` (or after RageBar — just before the `v-else` MP StatBar).

**Step 4: Commit**

```bash
git add src/components/HeroCard.vue
git commit -m "feat(bard): display VerseIndicator on bard hero cards"
```

---

### Task 8: Update BattleScreen for Bard Support

**Files:**
- Modify: `src/screens/BattleScreen.vue`

**Step 1: Add Bard computed properties**

After `isCurrentHeroBerserker` (around line ~108), add:

```js
const isCurrentHeroBard = computed(() => {
  return currentHero.value?.class?.resourceType === 'verse'
})
```

After `isInspectedHeroBerserker` (around line ~123), add:

```js
const isInspectedHeroBard = computed(() => {
  return inspectedHero.value?.class?.resourceType === 'verse'
})
```

**Step 2: Update getSkillDescription**

Add Bard repeat check in `getSkillDescription` (around line ~126). After the Berserker check, before `return skill.description`:

```js
if (isCurrentHeroBard.value && currentHero.value.lastSkillName === skill.name) {
  return 'Cannot repeat the same song!'
}
```

**Step 3: Update getSkillCost**

In `getSkillCost` (around line ~142), add Bard check before the MP fallback:

```js
if (isCurrentHeroBard.value) {
  return null  // Bard skills have no cost
}
```

**Step 4: Update getSkillCostLabel**

In `getSkillCostLabel` (around line ~155), add Bard check:

```js
if (isCurrentHeroBard.value) {
  return null  // No cost label for bards
}
```

**Step 5: Update canUseSkill**

In `canUseSkill` (around line ~169), add Bard check before the MP fallback:

```js
// Bards can always use skills, except can't repeat same skill consecutively
if (isCurrentHeroBard.value) {
  if (currentHero.value.lastSkillName === skill.name) {
    return false
  }
  return true
}
```

Note: For Bards with only 1 unlocked skill, the repeat restriction should be waived. But per the design, 1-skill Bards don't use the Verse system — they can repeat freely. Update the check:

```js
if (isCurrentHeroBard.value) {
  // 1-skill bards have no restrictions
  if (availableSkills.value.length <= 1) return true
  // Can't repeat same skill consecutively
  if (currentHero.value.lastSkillName === skill.name) return false
  return true
}
```

**Step 6: Import VerseIndicator and add to inspected hero panel**

Import at top of script:
```js
import VerseIndicator from '../components/VerseIndicator.vue'
```

In the inspected hero resource bars section (around line ~1263), after the Berserker RageBar block and before the `v-else` MP block, add:

```html
<div v-else-if="isInspectedHeroBard" class="inspect-bar-row">
  <span class="bar-label">Verse</span>
  <VerseIndicator :currentVerses="inspectedHero.currentVerses || 0" size="md" />
</div>
```

**Step 7: Add Finale visual effect**

Add a `finaleActivating` ref and `finaleName` ref near the leader skill refs:

```js
const finaleActivating = ref(null)  // bardId
const finaleName = ref(null)
```

Add a watcher for `finaleActivation` (similar to the `leaderSkillActivation` watcher around line ~755):

```js
// Watch for Bard Finale activation
watch(() => battleStore.finaleActivation, (activation) => {
  if (!activation) return

  finaleActivating.value = activation.bardId
  finaleName.value = activation.finaleName

  setTimeout(() => {
    finaleActivating.value = null
    finaleName.value = null
    battleStore.finaleActivation = null
  }, 1500)
})
```

In the hero-wrapper template (around line ~965), add the finale-activating class:

```js
'finale-activating': finaleActivating === hero.instanceId,
```

Add the finale name announce element inside the hero-wrapper (similar to the leader skill announce):

```html
<div v-if="finaleActivating === hero.instanceId" class="finale-announce">
  {{ finaleName }}
</div>
```

**Step 8: Add Finale CSS**

Add these styles (similar to leader skill glow but distinct):

```css
.hero-wrapper.finale-activating {
  animation: finaleGlow 1.5s ease-out;
  z-index: 20;
}

@keyframes finaleGlow {
  0% {
    filter: drop-shadow(0 0 0 transparent);
    transform: scale(1);
  }
  30% {
    filter: drop-shadow(0 0 20px #fbbf24) drop-shadow(0 0 40px #fbbf24);
    transform: scale(1.05);
  }
  70% {
    filter: drop-shadow(0 0 15px #fbbf24) drop-shadow(0 0 30px #fbbf24);
    transform: scale(1.03);
  }
  100% {
    filter: drop-shadow(0 0 0 transparent);
    transform: scale(1);
  }
}

.finale-announce {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 0.9rem;
  font-weight: 700;
  color: #fbbf24;
  text-shadow: 0 0 10px #f59e0b, 0 2px 4px rgba(0, 0, 0, 0.8);
  z-index: 30;
  animation: finaleNameFloat 1.5s ease-out forwards;
  pointer-events: none;
  user-select: none;
}

@keyframes finaleNameFloat {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  15% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-15px);
  }
}
```

**Step 9: Commit**

```bash
git add src/screens/BattleScreen.vue
git commit -m "feat(bard): add verse UI, repeat restriction, and Finale visual to BattleScreen"
```

---

### Task 9: Integration Test

**Files:**
- Modify: `src/stores/__tests__/battle-verse.test.js`

**Step 1: Add integration tests**

Append to the existing test file:

```js
describe('Bard verse system - integration', () => {
  let store
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
    heroesStore = useHeroesStore()
  })

  function createMockBard(overrides = {}) {
    return {
      instanceId: 'bard_1',
      templateId: 'wandering_bard',
      level: 6,
      currentHp: 100,
      maxHp: 100,
      currentMp: 70,
      maxMp: 70,
      stats: { hp: 100, atk: 20, def: 20, spd: 15 },
      template: {
        name: 'Harl the Handsom',
        skills: [
          { name: 'Inspiring Song', targetType: 'all_allies', effects: [] },
          { name: 'Mana Melody', skillUnlockLevel: 1, targetType: 'all_allies', mpRestore: 10 },
          { name: 'Soothing Serenade', skillUnlockLevel: 3, targetType: 'all_allies', healFromStat: { stat: 'atk', percent: 15 } }
        ],
        finale: {
          name: 'Standing Ovation',
          target: 'all_allies',
          effects: [
            { type: 'resource_grant', rageAmount: 15, focusGrant: true, valorAmount: 10, mpAmount: 15, verseAmount: 1 },
            { type: 'heal', value: 5 }
          ]
        }
      },
      class: { resourceType: 'verse', resourceName: 'Verse' },
      statusEffects: [],
      currentVerses: 0,
      lastSkillName: null,
      ...overrides
    }
  }

  it('bard starts with 0 verses', () => {
    const bard = createMockBard()
    expect(bard.currentVerses).toBe(0)
  })

  it('gainVerse increments verse count', () => {
    const bard = createMockBard()
    store.gainVerse(bard)
    expect(bard.currentVerses).toBe(1)
    store.gainVerse(bard)
    expect(bard.currentVerses).toBe(2)
    store.gainVerse(bard)
    expect(bard.currentVerses).toBe(3)
  })

  it('verses cap at 3', () => {
    const bard = createMockBard({ currentVerses: 3 })
    store.gainVerse(bard)
    expect(bard.currentVerses).toBe(3)
  })

  it('canUseSkill returns true for bard skills (no cost)', () => {
    const bard = createMockBard()
    bard.skill = bard.template.skills[0]
    expect(store.canUseSkill(bard)).toBe(true)
  })
})
```

**Step 2: Run all verse tests**

Run: `npx vitest run src/stores/__tests__/battle-verse.test.js`
Expected: PASS

**Step 3: Run full test suite to check for regressions**

Run: `npx vitest run`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/stores/__tests__/battle-verse.test.js
git commit -m "test(bard): add verse system integration tests"
```

---

### Task 10: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add Verse system documentation**

Add a new section after the "Class Resource Systems" table documenting the Verse mechanic, similar to how Rage, Focus, and Valor mechanics are documented elsewhere in the file. Update the resource table to show Verse for Bard instead of "Standard MP".

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add bard verse resource system to CLAUDE.md"
```
