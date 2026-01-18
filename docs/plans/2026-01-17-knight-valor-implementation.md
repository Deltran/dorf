# Knight Valor System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace MP with a Valor threshold system for Knight class heroes.

**Architecture:** Valor is a 0-100 gauge with thresholds at 25/50/75/100. Knights build Valor through passive gains at round end and defensive skill use. Skills can require minimum Valor and have values that scale per threshold. Valor is checked, not spent.

**Tech Stack:** Vue 3, Pinia stores, existing battle system patterns from Ranger Focus

---

## Task 1: Add resourceType to Knight class

**Files:**
- Modify: `src/data/classes.js:8-13`

**Step 1: Add resourceType to knight class definition**

```js
knight: {
  id: 'knight',
  title: 'Knight',
  role: 'tank',
  resourceName: 'Valor',
  resourceType: 'valor'
},
```

**Step 2: Verify change**

Run: Open the app and check that Knight class still loads correctly.

**Step 3: Commit**

```bash
git add src/data/classes.js
git commit -m "feat(classes): add resourceType 'valor' to Knight class"
```

---

## Task 2: Add Valor helpers to battle store

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Add isKnight helper after isRanger helper (~line 408)**

```js
// ========== VALOR HELPERS (Knights) ==========

// Check if a unit is a Knight (uses Valor)
function isKnight(unit) {
  return unit.class?.resourceType === 'valor'
}
```

**Step 2: Add Valor gain helper**

```js
// Gain valor for a knight (clamped to 100)
function gainValor(unit, amount) {
  if (!isKnight(unit)) return
  if (unit.currentValor === undefined) unit.currentValor = 0
  unit.currentValor = Math.min(100, unit.currentValor + amount)
}
```

**Step 3: Add getValorTier helper**

```js
// Get current valor tier (0, 25, 50, 75, or 100)
function getValorTier(unit) {
  if (!isKnight(unit)) return 0
  const valor = unit.currentValor || 0
  if (valor >= 100) return 100
  if (valor >= 75) return 75
  if (valor >= 50) return 50
  if (valor >= 25) return 25
  return 0
}
```

**Step 4: Add resolveValorScaling helper**

```js
// Resolve a valor-scaled value to its current tier value
function resolveValorScaling(scalingObj, valorTier) {
  if (typeof scalingObj !== 'object' || scalingObj === null) {
    return scalingObj // Not a scaling object, return as-is
  }
  if (scalingObj.base === undefined) {
    return scalingObj // Not a scaling object, return as-is
  }

  // Find the highest tier at or below current
  const tiers = [100, 75, 50, 25]
  for (const tier of tiers) {
    if (valorTier >= tier && scalingObj[`at${tier}`] !== undefined) {
      return scalingObj[`at${tier}`]
    }
  }
  return scalingObj.base
}
```

**Step 5: Export the new helpers in the return statement**

Add to the return object:
```js
// Valor helpers (for UI)
isKnight,
getValorTier,
```

**Step 6: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat(battle): add Knight Valor helper functions"
```

---

## Task 3: Initialize Valor for Knights in battle

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Add currentValor initialization in initBattle hero setup (~line 475-488)**

After the `hasFocus` line, add:
```js
currentValor: heroFull.class?.resourceType === 'valor' ? 0 : undefined
```

The full hero object push should look like:
```js
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
  hasFocus: heroFull.class?.resourceType === 'focus' ? true : undefined,
  currentValor: heroFull.class?.resourceType === 'valor' ? 0 : undefined
})
```

**Step 2: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat(battle): initialize Valor to 0 for Knights at battle start"
```

---

## Task 4: Add round-end Valor gains

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Add processRoundEndValor function before advanceTurnIndex**

```js
// Process end-of-round Valor gains for all Knights
function processRoundEndValor() {
  const livingAllies = aliveHeroes.value.length

  for (const hero of heroes.value) {
    if (!isKnight(hero) || hero.currentHp <= 0) continue

    const oldValor = hero.currentValor || 0
    let gained = 0

    // +5 passive per round
    gained += 5

    // +5 per living ally (not counting self)
    gained += (livingAllies - 1) * 5

    // +10 if below 50% HP
    if (hero.currentHp < hero.maxHp * 0.5) {
      gained += 10
    }

    gainValor(hero, gained)

    if (hero.currentValor > oldValor) {
      const heroName = hero.template?.name || 'Knight'
      addLog(`${heroName} gains ${hero.currentValor - oldValor} Valor! (${hero.currentValor}/100)`)
    }
  }
}
```

**Step 2: Call processRoundEndValor in advanceTurnIndex**

In the `advanceTurnIndex` function, after the round number increment and before MP recovery (~line 617-629), add:

```js
// Valor gains at round end for Knights
processRoundEndValor()
```

**Step 3: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat(battle): add round-end Valor gains for Knights"
```

---

## Task 5: Add defensive skill Valor gain

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Add Valor gain for defensive skills in executePlayerAction**

After the skill is successfully used (after MP deduction for non-rangers, ~line 733-735), add:

```js
// Knights gain Valor for using defensive skills
if (isKnight(hero) && skill.defensive) {
  const oldValor = hero.currentValor || 0
  gainValor(hero, 5)
  if (hero.currentValor > oldValor) {
    addLog(`${hero.template.name} gains 5 Valor from defensive action! (${hero.currentValor}/100)`)
  }
}
```

**Step 2: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat(battle): Knights gain Valor when using defensive skills"
```

---

## Task 6: Add Valor-based skill availability check

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Add Knight Valor check in executePlayerAction**

In the skill resource check section (~line 720-734), add a Knight check before the Ranger check:

```js
// Check resource availability: Valor for knights, Focus for rangers, MP for others
if (isKnight(hero)) {
  if (skill.valorRequired && (hero.currentValor || 0) < skill.valorRequired) {
    addLog(`Requires ${skill.valorRequired} Valor!`)
    state.value = BattleState.PLAYER_TURN
    return
  }
  // Knights don't spend MP
} else if (isRanger(hero)) {
  // ... existing ranger code
}
```

**Step 2: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat(battle): check Valor requirements for Knight skills"
```

---

## Task 7: Create ValorBar component

**Files:**
- Create: `src/components/ValorBar.vue`

**Step 1: Create the component file**

```vue
<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentValor: {
    type: Number,
    required: true
  },
  size: {
    type: String,
    default: 'sm' // sm, md
  }
})

const percentage = computed(() => {
  return Math.min(100, Math.max(0, props.currentValor))
})

const currentTier = computed(() => {
  const valor = props.currentValor
  if (valor >= 100) return 4
  if (valor >= 75) return 3
  if (valor >= 50) return 2
  if (valor >= 25) return 1
  return 0
})
</script>

<template>
  <div :class="['valor-bar', size]">
    <div class="valor-container">
      <div class="valor-fill" :style="{ width: percentage + '%' }"></div>
      <!-- Threshold markers -->
      <div class="threshold-marker" style="left: 25%"></div>
      <div class="threshold-marker" style="left: 50%"></div>
      <div class="threshold-marker" style="left: 75%"></div>
      <span class="valor-text">{{ currentValor }}/100</span>
    </div>
    <div class="valor-tiers">
      <span :class="['tier-pip', { active: currentTier >= 1 }]">◆</span>
      <span :class="['tier-pip', { active: currentTier >= 2 }]">◆</span>
      <span :class="['tier-pip', { active: currentTier >= 3 }]">◆</span>
      <span :class="['tier-pip', { active: currentTier >= 4 }]">◆</span>
    </div>
  </div>
</template>

<style scoped>
.valor-bar {
  width: 100%;
}

.valor-container {
  position: relative;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
  height: 12px;
}

.valor-bar.md .valor-container {
  height: 18px;
}

.valor-fill {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #3b82f6);
  transition: width 0.3s ease;
}

.threshold-marker {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-1px);
}

.valor-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.6rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.valor-bar.md .valor-text {
  font-size: 0.7rem;
}

.valor-tiers {
  display: flex;
  justify-content: space-around;
  margin-top: 2px;
}

.tier-pip {
  font-size: 0.5rem;
  color: #4b5563;
  transition: all 0.3s ease;
}

.valor-bar.md .tier-pip {
  font-size: 0.6rem;
}

.tier-pip.active {
  color: #60a5fa;
  text-shadow: 0 0 4px #60a5fa88;
}
</style>
```

**Step 2: Commit**

```bash
git add src/components/ValorBar.vue
git commit -m "feat(ui): add ValorBar component for Knight Valor display"
```

---

## Task 8: Display ValorBar in HeroCard

**Files:**
- Modify: `src/components/HeroCard.vue`

**Step 1: Import ValorBar component**

Add after the FocusIndicator import (~line 5):
```js
import ValorBar from './ValorBar.vue'
```

**Step 2: Add isKnightHero computed**

After isRangerHero computed (~line 62-64):
```js
const isKnightHero = computed(() => {
  return heroClass.value?.resourceType === 'valor'
})
```

**Step 3: Update the card-bars template section**

Replace the current Focus/MP conditional (~line 156-169) with:
```vue
<!-- Focus indicator for Rangers -->
<FocusIndicator
  v-if="isRangerHero"
  :hasFocus="hero.hasFocus"
  size="sm"
/>
<!-- Valor bar for Knights -->
<ValorBar
  v-else-if="isKnightHero"
  :currentValor="hero.currentValor || 0"
  size="sm"
/>
<!-- MP bar for others -->
<StatBar
  v-else
  :current="hero.currentMp"
  :max="hero.maxMp"
  :label="heroClass?.resourceName || 'MP'"
  color="blue"
  size="sm"
/>
```

**Step 4: Commit**

```bash
git add src/components/HeroCard.vue
git commit -m "feat(ui): show ValorBar for Knights in HeroCard"
```

---

## Task 9: Update BattleScreen skill availability for Knights

**Files:**
- Modify: `src/screens/BattleScreen.vue`

**Step 1: Import the battle store's isKnight helper or add local check**

Add after isCurrentHeroRanger computed (~line 75-77):
```js
// Check if current hero is a knight (uses Valor)
const isCurrentHeroKnight = computed(() => {
  return currentHero.value?.class?.resourceType === 'valor'
})
```

**Step 2: Update canUseSkill function**

Update the function (~line 85-94) to handle Knights:
```js
function canUseSkill(skill) {
  if (!currentHero.value || !skill) return false

  // Knights check Valor requirement
  if (isCurrentHeroKnight.value) {
    if (skill.valorRequired) {
      return (currentHero.value.currentValor || 0) >= skill.valorRequired
    }
    return true // No valorRequired means always available
  }

  // Rangers use Focus instead of MP
  if (isCurrentHeroRanger.value) {
    return currentHero.value.hasFocus === true
  }

  return currentHero.value.currentMp >= skill.mpCost
}
```

**Step 3: Update ActionButton display for Knights**

Update the ActionButton in the template (~line 729-739) to show Valor requirements:
```vue
<ActionButton
  v-for="(skill, index) in availableSkills"
  :key="skill.name"
  :label="skill.name"
  :description="getSkillDescription(skill)"
  :cost="getSkillCost(skill)"
  :costLabel="getSkillCostLabel(skill)"
  :disabled="!canUseSkill(skill)"
  :selected="battleStore.selectedAction === `skill_${index}`"
  variant="primary"
  @click="selectAction(`skill_${index}`)"
/>
```

**Step 4: Add helper functions for skill display**

Add before the canUseSkill function:
```js
function getSkillDescription(skill) {
  if (isCurrentHeroKnight.value && skill.valorRequired && (currentHero.value.currentValor || 0) < skill.valorRequired) {
    return `Requires ${skill.valorRequired} Valor`
  }
  if (isCurrentHeroRanger.value && !currentHero.value.hasFocus) {
    return 'Requires Focus'
  }
  return skill.description
}

function getSkillCost(skill) {
  if (isCurrentHeroKnight.value) {
    return skill.valorRequired || null
  }
  if (isCurrentHeroRanger.value) {
    return null
  }
  return skill.mpCost
}

function getSkillCostLabel(skill) {
  if (isCurrentHeroKnight.value && skill.valorRequired) {
    return 'Valor'
  }
  if (isCurrentHeroRanger.value) {
    return null
  }
  return currentHero.value?.class?.resourceName
}
```

**Step 5: Commit**

```bash
git add src/screens/BattleScreen.vue
git commit -m "feat(ui): update BattleScreen skill display for Knight Valor"
```

---

## Task 10: Update hero inspect dialog for Knights

**Files:**
- Modify: `src/screens/BattleScreen.vue`

**Step 1: Import ValorBar**

Add to imports (~line 11):
```js
import ValorBar from '../components/ValorBar.vue'
```

**Step 2: Add isInspectedHeroKnight computed**

After isInspectedHeroRanger (~line 80-82):
```js
const isInspectedHeroKnight = computed(() => {
  return inspectedHero.value?.class?.resourceType === 'valor'
})
```

**Step 3: Update hero inspect dialog template**

In the hero-inspect-bars section (~line 903-916), add Knight handling:
```vue
<div v-if="isInspectedHeroRanger" class="inspect-bar-row">
  <span class="bar-label">Focus</span>
  <FocusIndicator :hasFocus="inspectedHero.hasFocus" size="md" />
</div>
<div v-else-if="isInspectedHeroKnight" class="inspect-bar-row">
  <span class="bar-label">Valor</span>
  <ValorBar :currentValor="inspectedHero.currentValor || 0" size="md" />
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
git commit -m "feat(ui): show ValorBar in hero inspect dialog for Knights"
```

---

## Task 11: Add defensive tag to existing Knight skills

**Files:**
- Modify: `src/data/heroTemplates.js`

**Step 1: Update Sir Gallan's Challenge skill**

Add `defensive: true` to the Challenge skill (~line 119-127):
```js
{
  name: 'Challenge',
  description: 'Force all enemies to target Sir Gallan until the end of his next turn',
  mpCost: 12,
  targetType: 'self',
  noDamage: true,
  defensive: true,
  effects: [
    { type: EffectType.TAUNT, target: 'self', duration: 2 }
  ]
}
```

**Step 2: Update Kensin Squire's Defensive Stance skill**

Add `defensive: true` (~line 216-224):
```js
{
  name: 'Defensive Stance',
  description: 'Increase own DEF by 50% for 2 turns',
  mpCost: 12,
  targetType: 'self',
  unlockLevel: 1,
  defensive: true,
  effects: [
    { type: EffectType.DEF_UP, target: 'self', duration: 2, value: 50 }
  ]
}
```

**Step 3: Update Kensin Squire's Shield Ally skill**

Add `defensive: true` (~line 225-234):
```js
{
  name: 'Shield Ally',
  description: 'Increase ally DEF by 35% for 2 turns',
  mpCost: 10,
  targetType: 'ally',
  unlockLevel: 1,
  noDamage: true,
  defensive: true,
  effects: [
    { type: EffectType.DEF_UP, target: 'ally', duration: 2, value: 35 }
  ]
}
```

**Step 4: Update Sorju Gate Guard's Shield Block skill**

Add `defensive: true` (~line 325-333):
```js
skill: {
  name: 'Shield Block',
  description: 'Increase own DEF by 30% for 1 turn',
  mpCost: 10,
  targetType: 'self',
  defensive: true,
  effects: [
    { type: EffectType.DEF_UP, target: 'self', duration: 1, value: 30 }
  ]
}
```

**Step 5: Commit**

```bash
git add src/data/heroTemplates.js
git commit -m "feat(heroes): mark Knight defensive skills with defensive: true"
```

---

## Task 12: Add Valor-scaling example skill to Sir Gallan

**Files:**
- Modify: `src/data/heroTemplates.js`

**Step 1: Add a third skill to Sir Gallan with Valor scaling**

Add after the Challenge skill in Sir Gallan's skills array:
```js
{
  name: 'Valorous Strike',
  description: 'Deal damage that scales with Valor',
  mpCost: 0,  // Knights don't use MP
  valorRequired: 50,
  targetType: 'enemy',
  damage: { base: 80, at50: 100, at75: 130, at100: 180 }
}
```

**Step 2: Commit**

```bash
git add src/data/heroTemplates.js
git commit -m "feat(heroes): add Valorous Strike skill to Sir Gallan with Valor scaling"
```

---

## Task 13: Implement Valor damage scaling in battle

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Add helper to get scaled skill damage**

Add after resolveValorScaling:
```js
// Get skill damage value, applying Valor scaling for Knights
function getSkillDamage(skill, hero) {
  if (skill.damage && typeof skill.damage === 'object' && skill.damage.base !== undefined) {
    // This is a Valor-scaling damage value
    const tier = getValorTier(hero)
    return resolveValorScaling(skill.damage, tier)
  }
  return null // Use standard multiplier parsing
}
```

**Step 2: Update damage calculation in executePlayerAction enemy target case**

In the enemy target case (~line 760-767), before calculating damage, check for Valor scaling:
```js
// Deal damage unless skill is effect-only
if (!skill.noDamage) {
  const effectiveDef = getEffectiveStat(target, 'def')
  let damage

  // Check for Valor-scaled damage
  const scaledDamage = getSkillDamage(skill, hero)
  if (scaledDamage !== null) {
    const multiplier = scaledDamage / 100
    damage = calculateDamage(effectiveAtk, multiplier, effectiveDef)
  } else {
    const multiplier = parseSkillMultiplier(skill.description)
    damage = calculateDamage(effectiveAtk, multiplier, effectiveDef)
  }

  applyDamage(target, damage)
  // ... rest of logging
}
```

**Step 3: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat(battle): implement Valor damage scaling for Knight skills"
```

---

## Task 14: Manual testing

**Step 1: Test Valor initialization**

1. Start a battle with a Knight in the party
2. Verify Knight starts with 0 Valor
3. Verify ValorBar shows 0/100 with no lit pips

**Step 2: Test round-end Valor gains**

1. Complete a round with the Knight
2. Verify log shows Valor gain
3. Verify bar updates correctly
4. Test with different ally counts
5. Test low HP bonus (damage Knight below 50%)

**Step 3: Test defensive skill Valor gain**

1. Use a defensive skill (Challenge, Defensive Stance, Shield Ally, Shield Block)
2. Verify +5 Valor gain is logged
3. Verify bar updates immediately

**Step 4: Test Valor requirement**

1. Build Valor to near 50
2. Verify Valorous Strike shows disabled and "Requires 50 Valor"
3. Gain more Valor to reach 50
4. Verify skill becomes available
5. Use the skill and verify it works

**Step 5: Test hero inspect dialog**

1. Double-click a Knight in battle
2. Verify ValorBar shows in the dialog
3. Verify current Valor value is correct

**Step 6: Commit test confirmation**

```bash
git commit --allow-empty -m "test: manual testing of Knight Valor system complete"
```

---

## Files Modified Summary

1. `src/data/classes.js` - Add resourceType to Knight
2. `src/stores/battle.js` - Valor tracking, helpers, gains, scaling
3. `src/components/ValorBar.vue` - New component for Valor display
4. `src/components/HeroCard.vue` - Show ValorBar for Knights
5. `src/screens/BattleScreen.vue` - Skill availability, inspect dialog
6. `src/data/heroTemplates.js` - Defensive tags, example Valor skill
