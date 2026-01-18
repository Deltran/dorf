# Berserker Rage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Rage resource system for Berserkers - a 0-100 resource that builds from dealing/taking damage and is spent on skills.

**Architecture:** Rage follows the existing Focus pattern for Rangers. Berserkers track `currentRage` (0-100), gain +5 rage per damage instance dealt or taken, and spend rage via `rageCost` on skills. Rage persists across battles within a quest but resets on death.

**Tech Stack:** Vue 3, Pinia stores, existing battle system patterns

---

## Task 1: Add resourceType to Berserker Class

**Files:**
- Modify: `src/data/classes.js:8-13`
- Test: `src/data/__tests__/classes.test.js` (create)

**Step 1: Write the failing test**

Create `src/data/__tests__/classes.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { classes } from '../classes'

describe('classes', () => {
  describe('berserker', () => {
    it('has resourceType rage', () => {
      expect(classes.berserker.resourceType).toBe('rage')
    })

    it('has resourceName Rage', () => {
      expect(classes.berserker.resourceName).toBe('Rage')
    })
  })

  describe('ranger', () => {
    it('has resourceType focus', () => {
      expect(classes.ranger.resourceType).toBe('focus')
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/__tests__/classes.test.js`
Expected: FAIL - "expected undefined to be 'rage'"

**Step 3: Write minimal implementation**

In `src/data/classes.js`, add `resourceType: 'rage'` to berserker:

```js
berserker: {
  id: 'berserker',
  title: 'Berserker',
  role: 'dps',
  resourceName: 'Rage',
  resourceType: 'rage'
},
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/data/__tests__/classes.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/classes.js src/data/__tests__/classes.test.js
git commit -m "feat(rage): add resourceType to Berserker class"
```

---

## Task 2: Add Rage Helper Functions to Battle Store

**Files:**
- Modify: `src/stores/battle.js` (near existing Focus helpers ~line 47)
- Test: `src/stores/__tests__/battle-rage.test.js` (create)

**Step 1: Write the failing test**

Create `src/stores/__tests__/battle-rage.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('battle store - rage helpers', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('isBerserker', () => {
    it('returns true for units with rage resourceType', () => {
      const berserker = { class: { resourceType: 'rage' } }
      expect(store.isBerserker(berserker)).toBe(true)
    })

    it('returns false for non-berserkers', () => {
      const knight = { class: { resourceType: undefined } }
      expect(store.isBerserker(knight)).toBe(false)
    })

    it('returns false for rangers', () => {
      const ranger = { class: { resourceType: 'focus' } }
      expect(store.isBerserker(ranger)).toBe(false)
    })
  })

  describe('gainRage', () => {
    it('increases currentRage by specified amount', () => {
      const unit = { currentRage: 0 }
      store.gainRage(unit, 5)
      expect(unit.currentRage).toBe(5)
    })

    it('caps rage at 100', () => {
      const unit = { currentRage: 98 }
      store.gainRage(unit, 10)
      expect(unit.currentRage).toBe(100)
    })

    it('does nothing if unit has no currentRage property', () => {
      const unit = {}
      store.gainRage(unit, 5)
      expect(unit.currentRage).toBeUndefined()
    })
  })

  describe('spendRage', () => {
    it('decreases currentRage by specified amount', () => {
      const unit = { currentRage: 50 }
      store.spendRage(unit, 25)
      expect(unit.currentRage).toBe(25)
    })

    it('does not go below 0', () => {
      const unit = { currentRage: 10 }
      store.spendRage(unit, 25)
      expect(unit.currentRage).toBe(0)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/battle-rage.test.js`
Expected: FAIL - "store.isBerserker is not a function"

**Step 3: Write minimal implementation**

In `src/stores/battle.js`, add these helper functions inside the store (near the Focus helpers around line 47):

```js
// Rage helpers (Berserkers)
function isBerserker(unit) {
  return unit.class?.resourceType === 'rage'
}

function gainRage(unit, amount) {
  if (unit.currentRage !== undefined) {
    unit.currentRage = Math.min(100, unit.currentRage + amount)
  }
}

function spendRage(unit, amount) {
  if (unit.currentRage !== undefined) {
    unit.currentRage = Math.max(0, unit.currentRage - amount)
  }
}
```

Add these to the store's return statement:

```js
return {
  // ... existing returns
  isBerserker,
  gainRage,
  spendRage,
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/battle-rage.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-rage.test.js
git commit -m "feat(rage): add isBerserker, gainRage, spendRage helpers"
```

---

## Task 3: Initialize currentRage for Berserkers in Battle

**Files:**
- Modify: `src/stores/battle.js` (initBattle function, hero initialization ~line 130)
- Test: `src/stores/__tests__/battle-rage.test.js` (add to existing)

**Step 1: Write the failing test**

Add to `src/stores/__tests__/battle-rage.test.js`:

```js
describe('initBattle - berserker initialization', () => {
  it('initializes berserkers with currentRage 0', () => {
    const mockHeroes = [{
      instanceId: 'hero1',
      templateId: 'shadow_king',
      name: 'Shadow King',
      classId: 'berserker',
      stats: { hp: 100, atk: 50, def: 20, spd: 15, mp: 50 },
      currentHp: 100,
      currentMp: 50
    }]

    // Mock the heroes store
    store.initBattle(mockHeroes, [], null, { leaderHero: null })

    const hero = store.heroes[0]
    expect(hero.currentRage).toBe(0)
  })

  it('does not add currentRage to non-berserkers', () => {
    const mockHeroes = [{
      instanceId: 'hero1',
      templateId: 'sir_gallan',
      name: 'Sir Gallan',
      classId: 'knight',
      stats: { hp: 100, atk: 50, def: 20, spd: 15, mp: 50 },
      currentHp: 100,
      currentMp: 50
    }]

    store.initBattle(mockHeroes, [], null, { leaderHero: null })

    const hero = store.heroes[0]
    expect(hero.currentRage).toBeUndefined()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/battle-rage.test.js`
Expected: FAIL - "expected undefined to be 0"

**Step 3: Write minimal implementation**

In `src/stores/battle.js`, find the hero initialization in `initBattle()` (around line 130-150). After setting up class and other properties, add:

```js
// Initialize rage for berserkers
if (isBerserker(hero)) {
  hero.currentRage = hero.currentRage ?? 0
}
```

Note: Using `??` allows rage to persist from previous battles in the quest (heroes store tracks currentRage).

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/battle-rage.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-rage.test.js
git commit -m "feat(rage): initialize currentRage for berserkers in battle"
```

---

## Task 4: Grant Rage on Damage Dealt

**Files:**
- Modify: `src/stores/battle.js` (applyDamage function)
- Test: `src/stores/__tests__/battle-rage.test.js` (add to existing)

**Step 1: Write the failing test**

Add to `src/stores/__tests__/battle-rage.test.js`:

```js
describe('rage gain on damage dealt', () => {
  beforeEach(() => {
    // Set up a battle with a berserker
    const mockHeroes = [{
      instanceId: 'hero1',
      templateId: 'shadow_king',
      name: 'Shadow King',
      classId: 'berserker',
      stats: { hp: 100, atk: 50, def: 20, spd: 15, mp: 50 },
      currentHp: 100,
      currentMp: 50
    }]
    const mockEnemies = [{
      id: 'enemy1',
      name: 'Goblin',
      stats: { hp: 50, atk: 10, def: 5, spd: 5 },
      currentHp: 50
    }]

    store.initBattle(mockHeroes, mockEnemies, null, { leaderHero: null })
  })

  it('grants +5 rage when berserker deals damage', () => {
    const berserker = store.heroes[0]
    const enemy = store.enemies[0]

    expect(berserker.currentRage).toBe(0)

    store.applyDamage(enemy, 10, berserker)

    expect(berserker.currentRage).toBe(5)
  })

  it('grants rage for each damage instance in multi-hit', () => {
    const berserker = store.heroes[0]
    const enemy = store.enemies[0]

    store.applyDamage(enemy, 10, berserker)
    store.applyDamage(enemy, 10, berserker)
    store.applyDamage(enemy, 10, berserker)

    expect(berserker.currentRage).toBe(15)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/battle-rage.test.js`
Expected: FAIL - "expected 0 to be 5"

**Step 3: Write minimal implementation**

In `src/stores/battle.js`, find the `applyDamage` function. After applying damage but before returning, add:

```js
// Grant rage to berserker attackers
if (source && isBerserker(source)) {
  gainRage(source, 5)
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/battle-rage.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-rage.test.js
git commit -m "feat(rage): grant +5 rage when berserker deals damage"
```

---

## Task 5: Grant Rage on Damage Taken

**Files:**
- Modify: `src/stores/battle.js` (applyDamage function)
- Test: `src/stores/__tests__/battle-rage.test.js` (add to existing)

**Step 1: Write the failing test**

Add to `src/stores/__tests__/battle-rage.test.js`:

```js
describe('rage gain on damage taken', () => {
  beforeEach(() => {
    const mockHeroes = [{
      instanceId: 'hero1',
      templateId: 'shadow_king',
      name: 'Shadow King',
      classId: 'berserker',
      stats: { hp: 100, atk: 50, def: 20, spd: 15, mp: 50 },
      currentHp: 100,
      currentMp: 50
    }]
    const mockEnemies = [{
      id: 'enemy1',
      name: 'Goblin',
      stats: { hp: 50, atk: 10, def: 5, spd: 5 },
      currentHp: 50
    }]

    store.initBattle(mockHeroes, mockEnemies, null, { leaderHero: null })
  })

  it('grants +5 rage when berserker takes damage', () => {
    const berserker = store.heroes[0]

    expect(berserker.currentRage).toBe(0)

    store.applyDamage(berserker, 10, store.enemies[0])

    expect(berserker.currentRage).toBe(5)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/battle-rage.test.js`
Expected: FAIL - "expected 0 to be 5"

**Step 3: Write minimal implementation**

In `src/stores/battle.js`, in the `applyDamage` function, add after the damage dealt rage gain:

```js
// Grant rage to berserker defenders
if (isBerserker(unit)) {
  gainRage(unit, 5)
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/battle-rage.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-rage.test.js
git commit -m "feat(rage): grant +5 rage when berserker takes damage"
```

---

## Task 6: Update Skill Availability for Berserkers

**Files:**
- Modify: `src/stores/battle.js` (skill availability check ~line 720-733)
- Test: `src/stores/__tests__/battle-rage.test.js` (add to existing)

**Step 1: Write the failing test**

Add to `src/stores/__tests__/battle-rage.test.js`:

```js
describe('skill availability for berserkers', () => {
  it('allows skill when currentRage >= rageCost', () => {
    const berserker = {
      currentRage: 30,
      skill: { rageCost: 25 },
      class: { resourceType: 'rage' }
    }

    expect(store.canUseSkill(berserker)).toBe(true)
  })

  it('blocks skill when currentRage < rageCost', () => {
    const berserker = {
      currentRage: 10,
      skill: { rageCost: 25 },
      class: { resourceType: 'rage' }
    }

    expect(store.canUseSkill(berserker)).toBe(false)
  })

  it('allows skill with 0 rageCost regardless of rage', () => {
    const berserker = {
      currentRage: 0,
      skill: { rageCost: 0 },
      class: { resourceType: 'rage' }
    }

    expect(store.canUseSkill(berserker)).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/battle-rage.test.js`
Expected: FAIL - canUseSkill not handling rageCost

**Step 3: Write minimal implementation**

In `src/stores/battle.js`, find the `canUseSkill` function (or create it if it's inline). Update the resource check:

```js
function canUseSkill(unit) {
  if (!unit.skill) return false

  // Rangers always can use skill if they have focus
  if (isRanger(unit)) {
    return unit.hasFocus === true
  }

  // Berserkers check rage cost
  if (isBerserker(unit)) {
    const rageCost = unit.skill.rageCost ?? 0
    return unit.currentRage >= rageCost
  }

  // MP-based classes
  const mpCost = unit.skill.mpCost ?? 0
  return unit.currentMp >= mpCost
}
```

Add `canUseSkill` to the store's return statement if not already exposed.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/battle-rage.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-rage.test.js
git commit -m "feat(rage): check rageCost for berserker skill availability"
```

---

## Task 7: Spend Rage When Using Skills

**Files:**
- Modify: `src/stores/battle.js` (skill execution)
- Test: `src/stores/__tests__/battle-rage.test.js` (add to existing)

**Step 1: Write the failing test**

Add to `src/stores/__tests__/battle-rage.test.js`:

```js
describe('rage spending on skill use', () => {
  it('spends rageCost when berserker uses skill', () => {
    const berserker = {
      currentRage: 50,
      skill: { rageCost: 25 },
      class: { resourceType: 'rage' }
    }

    store.spendSkillResource(berserker)

    expect(berserker.currentRage).toBe(25)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/battle-rage.test.js`
Expected: FAIL - spendSkillResource not handling berserkers

**Step 3: Write minimal implementation**

In `src/stores/battle.js`, find where skill resources are spent (or create `spendSkillResource` helper):

```js
function spendSkillResource(unit) {
  if (isRanger(unit)) {
    removeFocus(unit)
    return
  }

  if (isBerserker(unit)) {
    const rageCost = unit.skill?.rageCost ?? 0
    spendRage(unit, rageCost)
    return
  }

  // MP-based classes
  const mpCost = unit.skill?.mpCost ?? 0
  unit.currentMp = Math.max(0, unit.currentMp - mpCost)
}
```

Add to return statement if new.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/battle-rage.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-rage.test.js
git commit -m "feat(rage): spend rageCost when berserker uses skill"
```

---

## Task 8: Update Berserker Hero Templates with rageCost

**Files:**
- Modify: `src/data/heroTemplates.js` (shadow_king and farm_hand entries)
- Test: `src/data/__tests__/heroTemplates.test.js` (create)

**Step 1: Write the failing test**

Create `src/data/__tests__/heroTemplates.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { heroTemplates } from '../heroTemplates'
import { classes } from '../classes'

describe('heroTemplates - berserkers', () => {
  const berserkerHeroes = Object.values(heroTemplates).filter(
    h => h.classId === 'berserker'
  )

  it('all berserkers use rageCost instead of mpCost', () => {
    berserkerHeroes.forEach(hero => {
      expect(hero.skill.rageCost, `${hero.name} should have rageCost`).toBeDefined()
      expect(hero.skill.mpCost, `${hero.name} should not have mpCost`).toBeUndefined()
    })
  })

  it('shadow_king has rageCost 25', () => {
    expect(heroTemplates.shadow_king.skill.rageCost).toBe(25)
  })

  it('farm_hand has rageCost 8', () => {
    expect(heroTemplates.farm_hand.skill.rageCost).toBe(8)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/__tests__/heroTemplates.test.js`
Expected: FAIL - "shadow_king should have rageCost"

**Step 3: Write minimal implementation**

In `src/data/heroTemplates.js`, update the two berserker heroes:

For `shadow_king`:
```js
skill: {
  name: 'Void Strike',
  description: 'Deal 200% ATK damage to one enemy, ignoring 50% of their DEF',
  rageCost: 25,  // Changed from mpCost
  targetType: 'enemy'
},
```

For `farm_hand`:
```js
skill: {
  name: 'Pitchfork Jab',
  description: 'Deal 90% ATK damage to one enemy',
  rageCost: 8,  // Changed from mpCost
  targetType: 'enemy'
},
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/data/__tests__/heroTemplates.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/heroTemplates.js src/data/__tests__/heroTemplates.test.js
git commit -m "feat(rage): update berserker heroes to use rageCost"
```

---

## Task 9: Persist Rage in Heroes Store

**Files:**
- Modify: `src/stores/heroes.js` (getPartyState or similar)
- Test: `src/stores/__tests__/heroes-rage.test.js` (create)

**Step 1: Write the failing test**

Create `src/stores/__tests__/heroes-rage.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHeroesStore } from '../heroes'

describe('heroes store - rage persistence', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useHeroesStore()
  })

  it('berserker heroes have currentRage property', () => {
    // Add a berserker to collection
    store.addHero({
      templateId: 'shadow_king',
      classId: 'berserker'
    })

    const hero = store.heroes[0]
    expect(hero.currentRage).toBeDefined()
    expect(hero.currentRage).toBe(0)
  })

  it('updateHeroAfterBattle preserves currentRage', () => {
    store.addHero({
      templateId: 'shadow_king',
      classId: 'berserker'
    })

    const hero = store.heroes[0]

    store.updateHeroAfterBattle(hero.instanceId, {
      currentHp: 80,
      currentRage: 45
    })

    expect(store.heroes[0].currentRage).toBe(45)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/heroes-rage.test.js`
Expected: FAIL - currentRage not being tracked

**Step 3: Write minimal implementation**

In `src/stores/heroes.js`:

1. In `addHero`, initialize `currentRage: 0` for berserkers:
```js
// After creating the hero object
if (hero.classId === 'berserker') {
  hero.currentRage = 0
}
```

2. In `updateHeroAfterBattle` (or equivalent), include currentRage:
```js
function updateHeroAfterBattle(instanceId, state) {
  const hero = heroes.value.find(h => h.instanceId === instanceId)
  if (hero) {
    hero.currentHp = state.currentHp
    hero.currentMp = state.currentMp
    if (state.currentRage !== undefined) {
      hero.currentRage = state.currentRage
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/heroes-rage.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/heroes.js src/stores/__tests__/heroes-rage.test.js
git commit -m "feat(rage): persist currentRage in heroes store"
```

---

## Task 10: Reset Rage on Hero Death

**Files:**
- Modify: `src/stores/battle.js` (death handling)
- Test: `src/stores/__tests__/battle-rage.test.js` (add to existing)

**Step 1: Write the failing test**

Add to `src/stores/__tests__/battle-rage.test.js`:

```js
describe('rage reset on death', () => {
  it('resets currentRage to 0 when berserker dies', () => {
    const mockHeroes = [{
      instanceId: 'hero1',
      templateId: 'shadow_king',
      name: 'Shadow King',
      classId: 'berserker',
      stats: { hp: 100, atk: 50, def: 20, spd: 15, mp: 50 },
      currentHp: 100,
      currentMp: 50,
      currentRage: 75
    }]

    store.initBattle(mockHeroes, [], null, { leaderHero: null })

    const berserker = store.heroes[0]
    berserker.currentRage = 75 // Ensure rage is set

    // Kill the berserker
    store.applyDamage(berserker, 200, null)

    expect(berserker.currentRage).toBe(0)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/battle-rage.test.js`
Expected: FAIL - "expected 75 to be 0" (or similar, rage not reset)

**Step 3: Write minimal implementation**

In `src/stores/battle.js`, find where death is handled (likely in `applyDamage` or a death handler). Add:

```js
// When unit dies
if (unit.currentHp <= 0) {
  unit.currentHp = 0
  unit.isDead = true

  // Reset rage on death
  if (isBerserker(unit)) {
    unit.currentRage = 0
  }

  // ... existing death handling
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/battle-rage.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-rage.test.js
git commit -m "feat(rage): reset rage to 0 on berserker death"
```

---

## Task 11: Display Rage Bar in HeroCard

**Files:**
- Modify: `src/components/HeroCard.vue`
- Test: Manual visual verification

**Step 1: Identify the current MP bar implementation**

Read `src/components/HeroCard.vue` to find the MP bar. It should be conditional based on `showBars` prop.

**Step 2: Add rage bar logic**

In the template, add a rage bar for berserkers (alongside or instead of MP bar):

```vue
<!-- Rage bar for berserkers -->
<div v-if="showBars && isBerserker" class="resource-bar rage-bar">
  <div class="bar-fill rage-fill" :style="{ width: ragePercent + '%' }"></div>
  <span class="bar-text">{{ hero.currentRage }}/100</span>
</div>

<!-- MP bar for non-berserkers, non-rangers -->
<div v-else-if="showBars && !isRanger" class="resource-bar mp-bar">
  <!-- existing MP bar -->
</div>
```

**Step 3: Add computed properties**

```js
const isBerserker = computed(() => hero.value?.class?.resourceType === 'rage')

const ragePercent = computed(() => {
  if (!hero.value?.currentRage) return 0
  return (hero.value.currentRage / 100) * 100
})
```

**Step 4: Add rage bar styles**

```css
.rage-fill {
  background: linear-gradient(90deg, #dc2626, #f97316);
}
```

**Step 5: Verify visually**

Run: `npm run dev`
- Start a battle with Shadow King or Farm Hand
- Verify rage bar appears (red/orange gradient)
- Verify it starts at 0
- Deal/take damage and verify it increases

**Step 6: Commit**

```bash
git add src/components/HeroCard.vue
git commit -m "feat(rage): display rage bar in HeroCard for berserkers"
```

---

## Task 12: Display Rage Cost in Battle UI

**Files:**
- Modify: `src/views/BattleScreen.vue`
- Test: Manual visual verification

**Step 1: Find skill cost display**

Read `src/views/BattleScreen.vue` to find where skill costs are displayed (usually near skill buttons).

**Step 2: Update cost display logic**

Update the skill cost display to show rageCost for berserkers:

```vue
<span v-if="selectedUnit?.class?.resourceType === 'rage'" class="skill-cost rage-cost">
  {{ selectedUnit.skill.rageCost }} Rage
</span>
<span v-else-if="selectedUnit?.class?.resourceType === 'focus'" class="skill-cost focus-cost">
  Requires Focus
</span>
<span v-else class="skill-cost mp-cost">
  {{ selectedUnit.skill.mpCost }} MP
</span>
```

**Step 3: Add rage cost styles**

```css
.rage-cost {
  color: #f97316;
}
```

**Step 4: Verify visually**

Run: `npm run dev`
- Start a battle with a berserker
- Select the berserker
- Verify skill shows "25 Rage" (or appropriate cost)
- Verify styling matches design

**Step 5: Commit**

```bash
git add src/views/BattleScreen.vue
git commit -m "feat(rage): display rageCost in battle skill UI"
```

---

## Task 13: Sync Battle State Back to Heroes Store

**Files:**
- Modify: `src/stores/battle.js` (getPartyState or victory handling)
- Test: Integration test

**Step 1: Write the test**

Add to `src/stores/__tests__/battle-rage.test.js`:

```js
describe('getPartyState includes rage', () => {
  it('includes currentRage in party state for berserkers', () => {
    const mockHeroes = [{
      instanceId: 'hero1',
      templateId: 'shadow_king',
      classId: 'berserker',
      stats: { hp: 100, atk: 50, def: 20, spd: 15, mp: 50 },
      currentHp: 100,
      currentMp: 50
    }]

    store.initBattle(mockHeroes, [], null, { leaderHero: null })
    store.heroes[0].currentRage = 45

    const state = store.getPartyState()

    expect(state[0].currentRage).toBe(45)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/battle-rage.test.js`
Expected: FAIL - currentRage not in party state

**Step 3: Implement**

In `src/stores/battle.js`, find `getPartyState()` function. Add currentRage to the returned state:

```js
function getPartyState() {
  return heroes.value.map(hero => ({
    instanceId: hero.instanceId,
    currentHp: hero.currentHp,
    currentMp: hero.currentMp,
    currentRage: hero.currentRage, // Add this
    // ... other properties
  }))
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/battle-rage.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-rage.test.js
git commit -m "feat(rage): include currentRage in getPartyState"
```

---

## Task 14: Run Full Test Suite

**Files:**
- None (verification only)

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Fix any failures**

If any tests fail, fix them before proceeding.

**Step 3: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address test and lint issues"
```

---

## Task 15: Manual Integration Testing

**Files:**
- None (verification only)

**Step 1: Start development server**

Run: `npm run dev`

**Step 2: Test rage mechanics**

1. Add Shadow King (or Farm Hand) to party
2. Start a quest battle
3. Verify:
   - Rage bar shows at 0
   - Attack enemy → rage increases by 5
   - Take damage → rage increases by 5
   - Multi-hit skill → rage increases per hit
   - Use skill when rage >= cost → rage decreases
   - Cannot use skill when rage < cost
   - Rage persists to next battle in quest
   - Rage resets to 0 on death
   - Rage resets when starting new quest

**Step 3: Document any issues**

If issues found, create bug fix tasks and address them.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(rage): complete berserker rage system implementation"
```
