# Berserker Rage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the Berserker Rage system so rage builds through combat and is spent on skills.

**Architecture:** Rage is a 0-100 resource that builds through damage dealt/taken (+5 per instance), persists across battles in a quest, and is spent to use skills. Core mechanics exist in battle.js but skill usage, UI, and hero templates need updates.

**Tech Stack:** Vue 3, Pinia stores, existing battle system

---

## Current State

**Already implemented:**
- `classes.js`: Berserker has `resourceType: 'rage'`
- `battle.js`: `isBerserker()`, `gainRage()`, `spendRage()` helpers exist
- `battle.js`: `initBattle()` initializes `currentRage` for berserkers
- `battle.js`: `applyDamage()` grants +5 rage on damage dealt/taken

**Missing:**
1. `executePlayerAction()` doesn't spend rage for berserker skills
2. `getPartyState()` doesn't save `currentRage` for persistence
3. Rage doesn't reset to 0 on berserker death
4. Hero templates use `mpCost` instead of `rageCost`
5. HeroCard.vue has no Rage bar display
6. BattleScreen.vue skill functions don't handle berserkers

---

## Task 1: Fix Rage Spending in Battle Store

**Files:**
- Modify: `src/stores/battle.js:861-882`

**Step 1: Add berserker handling in executePlayerAction**

Find this code block in `executePlayerAction()`:

```js
} else {
  if (hero.currentMp < skill.mpCost) {
    addLog(`Not enough ${hero.class.resourceName}!`)
    state.value = BattleState.PLAYER_TURN
    return
  }
  hero.currentMp -= skill.mpCost
}
```

Replace with:

```js
} else if (isBerserker(hero)) {
  const rageCost = skill.rageCost ?? 0
  if (hero.currentRage < rageCost) {
    addLog(`Not enough ${hero.class.resourceName}!`)
    state.value = BattleState.PLAYER_TURN
    return
  }
  hero.currentRage -= rageCost
} else {
  if (hero.currentMp < skill.mpCost) {
    addLog(`Not enough ${hero.class.resourceName}!`)
    state.value = BattleState.PLAYER_TURN
    return
  }
  hero.currentMp -= skill.mpCost
}
```

**Step 2: Verify change compiles**

Run: `cd /home/deltran/code/dorf && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
cd /home/deltran/code/dorf && git add src/stores/battle.js && git commit -m "$(cat <<'EOF'
fix: spend rage when berserkers use skills

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Save Rage in Party State

**Files:**
- Modify: `src/stores/battle.js:1424-1433`

**Step 1: Update getPartyState to include currentRage**

Find this function:

```js
function getPartyState() {
  const partyState = {}
  for (const hero of heroes.value) {
    partyState[hero.instanceId] = {
      currentHp: hero.currentHp,
      currentMp: hero.currentMp
    }
  }
  return partyState
}
```

Replace with:

```js
function getPartyState() {
  const partyState = {}
  for (const hero of heroes.value) {
    partyState[hero.instanceId] = {
      currentHp: hero.currentHp,
      currentMp: hero.currentMp,
      currentRage: hero.currentRage
    }
  }
  return partyState
}
```

**Step 2: Verify change compiles**

Run: `cd /home/deltran/code/dorf && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
cd /home/deltran/code/dorf && git add src/stores/battle.js && git commit -m "$(cat <<'EOF'
fix: persist rage across battles in quest

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Reset Rage on Death

**Files:**
- Modify: `src/stores/battle.js:529-556`

**Step 1: Add rage reset in applyDamage when hero dies**

Find this section in `applyDamage()`:

```js
// Clear all status effects on death
if (unit.currentHp <= 0 && unit.statusEffects?.length > 0) {
  unit.statusEffects = []
}
```

Replace with:

```js
// Clear all status effects on death
if (unit.currentHp <= 0) {
  if (unit.statusEffects?.length > 0) {
    unit.statusEffects = []
  }
  // Reset rage on death for berserkers
  if (isBerserker(unit)) {
    unit.currentRage = 0
  }
}
```

**Step 2: Verify change compiles**

Run: `cd /home/deltran/code/dorf && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
cd /home/deltran/code/dorf && git add src/stores/battle.js && git commit -m "$(cat <<'EOF'
fix: reset berserker rage to 0 on death

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Create RageBar Component

**Files:**
- Create: `src/components/RageBar.vue`

**Step 1: Create the RageBar component**

```vue
<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentRage: {
    type: Number,
    default: 0
  },
  size: {
    type: String,
    default: 'md' // 'sm' or 'md'
  }
})

const percentage = computed(() => {
  return Math.min(100, Math.max(0, props.currentRage))
})

const sizeClass = computed(() => `size-${props.size}`)
</script>

<template>
  <div :class="['rage-bar', sizeClass]">
    <div class="rage-label">
      <span class="label-text">Rage</span>
      <span class="label-value">{{ currentRage }}/100</span>
    </div>
    <div class="rage-track">
      <div class="rage-fill" :style="{ width: percentage + '%' }"></div>
    </div>
  </div>
</template>

<style scoped>
.rage-bar {
  width: 100%;
}

.rage-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}

.label-text {
  color: #ef4444;
  font-weight: 600;
}

.label-value {
  color: #9ca3af;
}

.size-sm .rage-label {
  font-size: 0.65rem;
}

.size-md .rage-label {
  font-size: 0.75rem;
}

.rage-track {
  height: 6px;
  background: #374151;
  border-radius: 3px;
  overflow: hidden;
}

.size-sm .rage-track {
  height: 4px;
}

.rage-fill {
  height: 100%;
  background: linear-gradient(90deg, #dc2626, #f97316);
  border-radius: 3px;
  transition: width 0.3s ease;
}
</style>
```

**Step 2: Verify component compiles**

Run: `cd /home/deltran/code/dorf && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
cd /home/deltran/code/dorf && git add src/components/RageBar.vue && git commit -m "$(cat <<'EOF'
feat: add RageBar component for berserker UI

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Add Rage Bar to HeroCard

**Files:**
- Modify: `src/components/HeroCard.vue`

**Step 1: Import RageBar component**

Add after the ValorBar import (line 6):

```js
import RageBar from './RageBar.vue'
```

**Step 2: Add isBerserkerHero computed**

Add after `isKnightHero` computed (around line 69):

```js
const isBerserkerHero = computed(() => {
  return heroClass.value?.resourceType === 'rage'
})
```

**Step 3: Add RageBar to template**

Find this section in the template (around line 167-181):

```vue
<!-- Valor bar for Knights -->
<ValorBar
  v-else-if="isKnightHero"
  :currentValor="hero.currentValor || 0"
  size="sm"
/>
<!-- MP bar for others -->
<StatBar
  v-else
```

Replace with:

```vue
<!-- Valor bar for Knights -->
<ValorBar
  v-else-if="isKnightHero"
  :currentValor="hero.currentValor || 0"
  size="sm"
/>
<!-- Rage bar for Berserkers -->
<RageBar
  v-else-if="isBerserkerHero"
  :currentRage="hero.currentRage || 0"
  size="sm"
/>
<!-- MP bar for others -->
<StatBar
  v-else
```

**Step 4: Verify change compiles**

Run: `cd /home/deltran/code/dorf && npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
cd /home/deltran/code/dorf && git add src/components/HeroCard.vue && git commit -m "$(cat <<'EOF'
feat: display rage bar for berserkers in HeroCard

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Update BattleScreen Skill Functions

**Files:**
- Modify: `src/screens/BattleScreen.vue`

**Step 1: Add isCurrentHeroBerserker computed**

Add after `isCurrentHeroKnight` computed (around line 83):

```js
// Check if current hero is a berserker (uses Rage)
const isCurrentHeroBerserker = computed(() => {
  return currentHero.value?.class?.resourceType === 'rage'
})
```

**Step 2: Update getSkillCost function**

Find this function (around line 106-114):

```js
function getSkillCost(skill) {
  if (isCurrentHeroKnight.value) {
    return skill.valorRequired || null
  }
  if (isCurrentHeroRanger.value) {
    return null
  }
  return skill.mpCost
}
```

Replace with:

```js
function getSkillCost(skill) {
  if (isCurrentHeroKnight.value) {
    return skill.valorRequired || null
  }
  if (isCurrentHeroRanger.value) {
    return null
  }
  if (isCurrentHeroBerserker.value) {
    return skill.rageCost || 0
  }
  return skill.mpCost
}
```

**Step 3: Update getSkillCostLabel function**

Find this function (around line 116-124):

```js
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

Replace with:

```js
function getSkillCostLabel(skill) {
  if (isCurrentHeroKnight.value && skill.valorRequired) {
    return 'Valor'
  }
  if (isCurrentHeroRanger.value) {
    return null
  }
  if (isCurrentHeroBerserker.value) {
    return 'Rage'
  }
  return currentHero.value?.class?.resourceName
}
```

**Step 4: Update canUseSkill function**

Find this function (around line 127-144):

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

Replace with:

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

  // Berserkers check Rage cost
  if (isCurrentHeroBerserker.value) {
    const rageCost = skill.rageCost ?? 0
    return (currentHero.value.currentRage || 0) >= rageCost
  }

  return currentHero.value.currentMp >= skill.mpCost
}
```

**Step 5: Update getSkillDescription for berserkers**

Find this function (around line 96-104):

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
```

Replace with:

```js
function getSkillDescription(skill) {
  if (isCurrentHeroKnight.value && skill.valorRequired && (currentHero.value.currentValor || 0) < skill.valorRequired) {
    return `Requires ${skill.valorRequired} Valor`
  }
  if (isCurrentHeroRanger.value && !currentHero.value.hasFocus) {
    return 'Requires Focus'
  }
  if (isCurrentHeroBerserker.value) {
    const rageCost = skill.rageCost ?? 0
    if ((currentHero.value.currentRage || 0) < rageCost) {
      return `Requires ${rageCost} Rage`
    }
  }
  return skill.description
}
```

**Step 6: Verify change compiles**

Run: `cd /home/deltran/code/dorf && npm run build`
Expected: Build succeeds

**Step 7: Commit**

```bash
cd /home/deltran/code/dorf && git add src/screens/BattleScreen.vue && git commit -m "$(cat <<'EOF'
feat: add berserker rage support to battle UI

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Update Hero Templates

**Files:**
- Modify: `src/data/heroTemplates.js`

**Step 1: Update Darl (1-star Berserker)**

Find this hero (around line 374-387):

```js
farm_hand: {
  id: 'farm_hand',
  name: 'Darl',
  rarity: 1,
  classId: 'berserker',
  baseStats: { hp: 70, atk: 20, def: 12, spd: 8, mp: 30 },
  skill: {
    name: 'Pitchfork Jab',
    description: 'Deal 90% ATK damage to one enemy',
    mpCost: 8,
    targetType: 'enemy'
  }
}
```

Replace with:

```js
farm_hand: {
  id: 'farm_hand',
  name: 'Darl',
  rarity: 1,
  classId: 'berserker',
  baseStats: { hp: 70, atk: 20, def: 12, spd: 8 },
  skill: {
    name: 'Pitchfork Jab',
    description: 'Deal 90% ATK damage to one enemy',
    rageCost: 25,
    targetType: 'enemy'
  }
}
```

**Step 2: Update Shadow King (5-star Berserker)**

Find this hero (around line 43-70):

```js
shadow_king: {
  id: 'shadow_king',
  name: 'The Shadow King',
  rarity: 5,
  classId: 'berserker',
  baseStats: { hp: 110, atk: 55, def: 25, spd: 18, mp: 50 },
  skill: {
    name: 'Void Strike',
    description: 'Deal 200% ATK damage to one enemy, ignoring 50% of their DEF',
    mpCost: 25,
    targetType: 'enemy'
  },
```

Replace with:

```js
shadow_king: {
  id: 'shadow_king',
  name: 'The Shadow King',
  rarity: 5,
  classId: 'berserker',
  baseStats: { hp: 110, atk: 55, def: 25, spd: 18 },
  skill: {
    name: 'Void Strike',
    description: 'Deal 200% ATK damage to one enemy, ignoring 50% of their DEF',
    rageCost: 50,
    targetType: 'enemy'
  },
```

**Step 3: Verify change compiles**

Run: `cd /home/deltran/code/dorf && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
cd /home/deltran/code/dorf && git add src/data/heroTemplates.js && git commit -m "$(cat <<'EOF'
feat: convert berserker skills to use rageCost

- Darl: 25 rage for Pitchfork Jab
- Shadow King: 50 rage for Void Strike
- Remove mp stat from berserkers (unused)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Manual Testing

**Step 1: Start dev server**

Run: `cd /home/deltran/code/dorf && npm run dev`

**Step 2: Test in browser**

1. Open browser to localhost URL shown
2. Add Darl or Shadow King to party (use gacha or existing hero)
3. Start a quest battle
4. Verify:
   - Rage bar shows at 0/100 (red/orange gradient)
   - Basic attack is available
   - Skill button shows "25 Rage" or "50 Rage" cost
   - Skill is disabled when rage is insufficient
   - Dealing damage grants +5 rage
   - Taking damage grants +5 rage
   - Using skill spends rage
   - Rage persists to next battle in quest
   - Rage resets on berserker death

**Step 3: Final commit if any fixes needed**

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Fix rage spending in executePlayerAction | battle.js |
| 2 | Save rage in party state for persistence | battle.js |
| 3 | Reset rage on death | battle.js |
| 4 | Create RageBar component | RageBar.vue (new) |
| 5 | Add rage bar to HeroCard | HeroCard.vue |
| 6 | Update BattleScreen skill functions | BattleScreen.vue |
| 7 | Update hero templates to use rageCost | heroTemplates.js |
| 8 | Manual testing | - |
