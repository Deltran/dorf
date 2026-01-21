# Calisus Skills Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 4 lightning-themed skills for Calisus (2-star Mage) with chain damage and stun mechanics.

**Architecture:** Update heroTemplates.js with new skill definitions. Add chain bounce logic to battle.js for the Chain Lightning skill. STUN effect already exists in the system.

**Tech Stack:** Vue 3, Pinia stores, Vitest for testing

---

## Task 1: Update Spark Damage

**Files:**
- Modify: `src/data/heroTemplates.js:463-475`

**Step 1: Update Spark skill**

Change Calisus from single `skill` to `skills` array and update damage to 120%:

```js
apprentice_mage: {
  id: 'apprentice_mage',
  name: 'Calisus',
  rarity: 2,
  classId: 'mage',
  baseStats: { hp: 55, atk: 28, def: 10, spd: 11, mp: 50 },
  skills: [
    {
      name: 'Spark',
      description: 'Deal 120% ATK damage to one enemy',
      mpCost: 10,
      skillUnlockLevel: 1,
      targetType: 'enemy'
    }
  ]
}
```

**Step 2: Commit**

```bash
git add src/data/heroTemplates.js
git commit -m "feat(calisus): convert to skills array, update Spark to 120%"
```

---

## Task 2: Add Jolt Skill (Stun)

**Files:**
- Modify: `src/data/heroTemplates.js` (Calisus skills array)
- Test: `src/stores/__tests__/battle-stun.test.js` (create)

**Step 1: Write the failing test**

Create `src/stores/__tests__/battle-stun.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('battle store - stun effect', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('hasEffect', () => {
    it('detects stun effect on unit', () => {
      const unit = {
        statusEffects: [
          { type: EffectType.STUN, duration: 1 }
        ]
      }
      expect(store.hasEffect(unit, EffectType.STUN)).toBe(true)
    })

    it('returns false when unit has no stun', () => {
      const unit = { statusEffects: [] }
      expect(store.hasEffect(unit, EffectType.STUN)).toBe(false)
    })
  })
})
```

**Step 2: Run test to verify it passes**

Run: `npx vitest run src/stores/__tests__/battle-stun.test.js`

Expected: PASS (hasEffect already exists)

**Step 3: Add Jolt skill to Calisus**

Add to the skills array in heroTemplates.js:

```js
{
  name: 'Jolt',
  description: 'Deal 70% ATK damage and stun the target for 1 turn',
  mpCost: 18,
  skillUnlockLevel: 6,
  targetType: 'enemy',
  effects: [
    { type: EffectType.STUN, target: 'enemy', duration: 1 }
  ]
}
```

**Step 4: Commit**

```bash
git add src/data/heroTemplates.js src/stores/__tests__/battle-stun.test.js
git commit -m "feat(calisus): add Jolt skill with stun effect"
```

---

## Task 3: Add Tempest Skill (AoE)

**Files:**
- Modify: `src/data/heroTemplates.js` (Calisus skills array)

**Step 1: Add Tempest skill**

Add to the skills array:

```js
{
  name: 'Tempest',
  description: 'Deal 130% ATK damage to all enemies',
  mpCost: 26,
  skillUnlockLevel: 12,
  targetType: 'all_enemies'
}
```

**Step 2: Commit**

```bash
git add src/data/heroTemplates.js
git commit -m "feat(calisus): add Tempest AoE skill"
```

---

## Task 4: Add Chain Lightning Skill

**Files:**
- Modify: `src/data/heroTemplates.js` (Calisus skills array)
- Modify: `src/stores/battle.js` (add chain bounce logic)
- Test: `src/stores/__tests__/battle-chain.test.js` (create)

**Step 1: Write the failing test**

Create `src/stores/__tests__/battle-chain.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('battle store - chain bounce', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('getChainTargets', () => {
    it('returns up to maxBounces additional targets excluding primary', () => {
      const primary = { id: 'e1' }
      const enemies = [
        { id: 'e1', currentHp: 50 },
        { id: 'e2', currentHp: 50 },
        { id: 'e3', currentHp: 50 },
        { id: 'e4', currentHp: 50 }
      ]
      const targets = store.getChainTargets(primary, enemies, 2)
      expect(targets.length).toBe(2)
      expect(targets.every(t => t.id !== 'e1')).toBe(true)
    })

    it('returns fewer targets if not enough enemies', () => {
      const primary = { id: 'e1' }
      const enemies = [
        { id: 'e1', currentHp: 50 },
        { id: 'e2', currentHp: 50 }
      ]
      const targets = store.getChainTargets(primary, enemies, 2)
      expect(targets.length).toBe(1)
      expect(targets[0].id).toBe('e2')
    })

    it('excludes dead enemies', () => {
      const primary = { id: 'e1' }
      const enemies = [
        { id: 'e1', currentHp: 50 },
        { id: 'e2', currentHp: 0 },
        { id: 'e3', currentHp: 50 }
      ]
      const targets = store.getChainTargets(primary, enemies, 2)
      expect(targets.length).toBe(1)
      expect(targets[0].id).toBe('e3')
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/stores/__tests__/battle-chain.test.js`

Expected: FAIL with "getChainTargets is not a function"

**Step 3: Implement getChainTargets in battle.js**

Add helper function near other utility functions (around line 150):

```js
// Get chain bounce targets (excludes primary target and dead enemies)
function getChainTargets(primaryTarget, allEnemies, maxBounces) {
  const eligible = allEnemies.filter(e =>
    e.id !== primaryTarget.id && e.currentHp > 0
  )
  // Shuffle and take up to maxBounces
  const shuffled = [...eligible].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, maxBounces)
}
```

Export it in the store's return object.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/stores/__tests__/battle-chain.test.js`

Expected: PASS

**Step 5: Add chain bounce processing to skill execution**

In the `case 'enemy':` block (around line 1166), after the regular damage block, add:

```js
// Handle chain bounce damage (e.g., Chain Lightning)
if (skill.chainBounce && !skill.noDamage) {
  const { maxBounces, bounceMultiplier } = skill.chainBounce
  const bounceTargets = getChainTargets(target, enemies.value, maxBounces)

  if (bounceTargets.length > 0) {
    const bouncePercent = bounceMultiplier / 100
    for (const bounceTarget of bounceTargets) {
      if (bounceTarget.currentHp <= 0) continue
      const bounceDef = getEffectiveStat(bounceTarget, 'def')
      const bounceDamage = calculateDamage(effectiveAtk, bouncePercent, bounceDef)
      applyDamage(bounceTarget, bounceDamage, 'attack', hero)
      emitCombatEffect(bounceTarget.id, 'enemy', 'damage', bounceDamage)
      addLog(`Lightning chains to ${bounceTarget.template.name} for ${bounceDamage} damage!`)

      if (bounceTarget.currentHp <= 0) {
        addLog(`${bounceTarget.template.name} defeated!`)
      }
    }
  }
}
```

**Step 6: Add Chain Lightning skill to Calisus**

Add to the skills array in heroTemplates.js (after Spark, before Jolt):

```js
{
  name: 'Chain Lightning',
  description: 'Deal 70% ATK damage to target, then bounce to up to 2 additional enemies for 50% ATK each',
  mpCost: 16,
  skillUnlockLevel: 3,
  targetType: 'enemy',
  chainBounce: {
    maxBounces: 2,
    bounceMultiplier: 50
  }
}
```

**Step 7: Run all tests**

Run: `npx vitest run`

Expected: All tests PASS

**Step 8: Commit**

```bash
git add src/data/heroTemplates.js src/stores/battle.js src/stores/__tests__/battle-chain.test.js
git commit -m "feat(calisus): add Chain Lightning with bounce mechanic"
```

---

## Task 5: Final Verification

**Step 1: Run full test suite**

Run: `npx vitest run`

Expected: All tests PASS

**Step 2: Run build**

Run: `npm run build`

Expected: Build succeeds with no errors

**Step 3: Final commit (if any changes needed)**

```bash
git add -A
git commit -m "chore: cleanup after Calisus skills implementation"
```

---

## Final Calisus Skills Array

For reference, the complete skills array should be:

```js
skills: [
  {
    name: 'Spark',
    description: 'Deal 120% ATK damage to one enemy',
    mpCost: 10,
    skillUnlockLevel: 1,
    targetType: 'enemy'
  },
  {
    name: 'Chain Lightning',
    description: 'Deal 70% ATK damage to target, then bounce to up to 2 additional enemies for 50% ATK each',
    mpCost: 16,
    skillUnlockLevel: 3,
    targetType: 'enemy',
    chainBounce: {
      maxBounces: 2,
      bounceMultiplier: 50
    }
  },
  {
    name: 'Jolt',
    description: 'Deal 70% ATK damage and stun the target for 1 turn',
    mpCost: 18,
    skillUnlockLevel: 6,
    targetType: 'enemy',
    effects: [
      { type: EffectType.STUN, target: 'enemy', duration: 1 }
    ]
  },
  {
    name: 'Tempest',
    description: 'Deal 130% ATK damage to all enemies',
    mpCost: 26,
    skillUnlockLevel: 12,
    targetType: 'all_enemies'
  }
]
```
