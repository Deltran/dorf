# Splash Damage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add reusable splash damage mechanic where skills can hit random secondary targets after the primary target.

**Architecture:** Add `splashCount` and `splashDamagePercent` skill properties. After dealing primary damage in the 'enemy' case of `executePlayerAction`, check for these properties and deal splash damage to random other enemies.

**Tech Stack:** Vue 3, Pinia, Vitest

---

## Task 1: Write Tests for Splash Damage

**Files:**
- Create: `src/stores/__tests__/battle-splash.test.js`

**Step 1: Create test file with test structure**

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('Splash damage mechanics', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('pickRandom helper', () => {
    it('returns up to count items from array', () => {
      const items = [1, 2, 3, 4, 5]
      const picked = store.pickRandom(items, 2)
      expect(picked.length).toBe(2)
      expect(items).toContain(picked[0])
      expect(items).toContain(picked[1])
    })

    it('returns all items if count exceeds array length', () => {
      const items = [1, 2]
      const picked = store.pickRandom(items, 5)
      expect(picked.length).toBe(2)
    })

    it('returns empty array for empty input', () => {
      const picked = store.pickRandom([], 3)
      expect(picked.length).toBe(0)
    })
  })

  describe('splash damage in combat', () => {
    it('deals splash damage to 2 random other enemies when 3+ enemies exist', () => {
      // Setup battle with 3 enemies
      store.heroes.value = [{
        instanceId: 'hero1',
        template: { id: 'ember_witch', name: 'Shasha' },
        stats: { hp: 100, atk: 50, def: 20, spd: 14 },
        currentHp: 100,
        maxHp: 100,
        currentMp: 70,
        maxMp: 70,
        statusEffects: []
      }]

      store.enemies.value = [
        { id: 'enemy1', template: { name: 'Goblin A' }, stats: { hp: 100, def: 10 }, currentHp: 100, statusEffects: [] },
        { id: 'enemy2', template: { name: 'Goblin B' }, stats: { hp: 100, def: 10 }, currentHp: 100, statusEffects: [] },
        { id: 'enemy3', template: { name: 'Goblin C' }, stats: { hp: 100, def: 10 }, currentHp: 100, statusEffects: [] }
      ]

      const skill = {
        name: 'Fireball',
        targetType: 'enemy',
        mpCost: 20,
        damagePercent: 130,
        splashCount: 2,
        splashDamagePercent: 50
      }

      // Set up battle state
      store.state.value = 'player_turn'
      store.selectedAction.value = { type: 'skill', skill }
      store.selectedTarget.value = { id: 'enemy1', type: 'enemy' }
      store.turnOrder.value = [{ id: 'hero1', type: 'hero' }]
      store.currentTurnIndex.value = 0

      // Execute the action
      store.executePlayerAction()

      // Primary target should take damage
      expect(store.enemies.value[0].currentHp).toBeLessThan(100)

      // Both other enemies should also take splash damage
      const enemy2Damaged = store.enemies.value[1].currentHp < 100
      const enemy3Damaged = store.enemies.value[2].currentHp < 100
      expect(enemy2Damaged).toBe(true)
      expect(enemy3Damaged).toBe(true)
    })

    it('deals splash damage to only 1 enemy when only 2 enemies exist', () => {
      store.heroes.value = [{
        instanceId: 'hero1',
        template: { id: 'ember_witch', name: 'Shasha' },
        stats: { hp: 100, atk: 50, def: 20, spd: 14 },
        currentHp: 100,
        maxHp: 100,
        currentMp: 70,
        maxMp: 70,
        statusEffects: []
      }]

      store.enemies.value = [
        { id: 'enemy1', template: { name: 'Goblin A' }, stats: { hp: 100, def: 10 }, currentHp: 100, statusEffects: [] },
        { id: 'enemy2', template: { name: 'Goblin B' }, stats: { hp: 100, def: 10 }, currentHp: 100, statusEffects: [] }
      ]

      const skill = {
        name: 'Fireball',
        targetType: 'enemy',
        mpCost: 20,
        damagePercent: 130,
        splashCount: 2,
        splashDamagePercent: 50
      }

      store.state.value = 'player_turn'
      store.selectedAction.value = { type: 'skill', skill }
      store.selectedTarget.value = { id: 'enemy1', type: 'enemy' }
      store.turnOrder.value = [{ id: 'hero1', type: 'hero' }]
      store.currentTurnIndex.value = 0

      store.executePlayerAction()

      // Primary target should take damage
      expect(store.enemies.value[0].currentHp).toBeLessThan(100)
      // The only other enemy should take splash damage
      expect(store.enemies.value[1].currentHp).toBeLessThan(100)
    })

    it('does not splash when only 1 enemy exists', () => {
      store.heroes.value = [{
        instanceId: 'hero1',
        template: { id: 'ember_witch', name: 'Shasha' },
        stats: { hp: 100, atk: 50, def: 20, spd: 14 },
        currentHp: 100,
        maxHp: 100,
        currentMp: 70,
        maxMp: 70,
        statusEffects: []
      }]

      store.enemies.value = [
        { id: 'enemy1', template: { name: 'Goblin A' }, stats: { hp: 100, def: 10 }, currentHp: 100, statusEffects: [] }
      ]

      const skill = {
        name: 'Fireball',
        targetType: 'enemy',
        mpCost: 20,
        damagePercent: 130,
        splashCount: 2,
        splashDamagePercent: 50
      }

      store.state.value = 'player_turn'
      store.selectedAction.value = { type: 'skill', skill }
      store.selectedTarget.value = { id: 'enemy1', type: 'enemy' }
      store.turnOrder.value = [{ id: 'hero1', type: 'hero' }]
      store.currentTurnIndex.value = 0

      store.executePlayerAction()

      // Primary target should take damage (no errors thrown)
      expect(store.enemies.value[0].currentHp).toBeLessThan(100)
    })

    it('splash damage respects target defense', () => {
      store.heroes.value = [{
        instanceId: 'hero1',
        template: { id: 'ember_witch', name: 'Shasha' },
        stats: { hp: 100, atk: 50, def: 20, spd: 14 },
        currentHp: 100,
        maxHp: 100,
        currentMp: 70,
        maxMp: 70,
        statusEffects: []
      }]

      // One enemy with low DEF, one with high DEF
      store.enemies.value = [
        { id: 'enemy1', template: { name: 'Goblin' }, stats: { hp: 200, def: 10 }, currentHp: 200, statusEffects: [] },
        { id: 'enemy2', template: { name: 'Armored Orc' }, stats: { hp: 200, def: 50 }, currentHp: 200, statusEffects: [] }
      ]

      const skill = {
        name: 'Fireball',
        targetType: 'enemy',
        mpCost: 20,
        damagePercent: 130,
        splashCount: 2,
        splashDamagePercent: 50
      }

      store.state.value = 'player_turn'
      store.selectedAction.value = { type: 'skill', skill }
      store.selectedTarget.value = { id: 'enemy1', type: 'enemy' }
      store.turnOrder.value = [{ id: 'hero1', type: 'hero' }]
      store.currentTurnIndex.value = 0

      store.executePlayerAction()

      // High DEF enemy should take less splash damage than they would with low DEF
      const highDefDamage = 200 - store.enemies.value[1].currentHp
      // With 50 DEF vs 50% of 50 ATK = 25 damage before defense
      // Damage should be reduced by defense
      expect(highDefDamage).toBeGreaterThan(0)
      expect(highDefDamage).toBeLessThan(25) // Should be reduced by high DEF
    })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/stores/__tests__/battle-splash.test.js`
Expected: FAIL - pickRandom is not exposed

---

## Task 2: Add pickRandom Helper Function

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Add helper function near other utility functions (around line 2575)**

Find the `parseSkillMultiplier` function and add `pickRandom` just before it:

```js
  function pickRandom(array, count) {
    const shuffled = [...array].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }
```

**Step 2: Export pickRandom in the store return statement**

Find the return statement and add `pickRandom` to the exports:

```js
    pickRandom,
```

**Step 3: Run helper tests to verify they pass**

Run: `npx vitest run src/stores/__tests__/battle-splash.test.js -t "pickRandom"`
Expected: PASS (3 tests)

**Step 4: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-splash.test.js
git commit -m "feat: add pickRandom helper for splash damage"
```

---

## Task 3: Implement Splash Damage Logic

**Files:**
- Modify: `src/stores/battle.js:1590-1595` (after primary damage, before effects)

**Step 1: Add splash damage logic**

After the primary damage block (around line 1590, after `consumeDebuffs` handling but before the `} else {` that handles noDamage skills), add:

```js
          // Handle splash damage to random other enemies
          if (skill.splashCount && skill.splashDamagePercent) {
            const otherEnemies = aliveEnemies.value.filter(e => e.id !== target.id)
            if (otherEnemies.length > 0) {
              const splashTargets = pickRandom(otherEnemies, skill.splashCount)
              const splashMultiplier = skill.splashDamagePercent / 100

              for (const splashTarget of splashTargets) {
                const splashDef = getEffectiveStat(splashTarget, 'def')
                const splashDamage = calculateDamage(effectiveAtk, splashMultiplier, splashDef)
                applyDamage(splashTarget, splashDamage, 'attack', hero)
                emitCombatEffect(splashTarget.id, 'enemy', 'damage', splashDamage)
                addLog(`Fireball splashes to ${splashTarget.template.name} for ${splashDamage} damage!`)

                if (splashTarget.currentHp <= 0) {
                  addLog(`${splashTarget.template.name} defeated!`)
                }
              }
            }
          }
```

**Step 2: Run splash combat tests**

Run: `npx vitest run src/stores/__tests__/battle-splash.test.js -t "splash damage in combat"`
Expected: PASS (4 tests)

**Step 3: Run all tests to verify no regressions**

Run: `npx vitest run`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat: implement splash damage mechanic in battle"
```

---

## Task 4: Update Fireball Skill Definition

**Files:**
- Modify: `src/data/heroTemplates.js:321-327`

**Step 1: Update Fireball skill**

Replace the current Fireball skill:

```js
      {
        name: 'Fireball',
        description: 'Deal 130% ATK damage to one enemy and 50% ATK damage to adjacent enemies.',
        mpCost: 20,
        skillUnlockLevel: 1,
        targetType: 'enemy'
      },
```

With:

```js
      {
        name: 'Fireball',
        description: 'Deal 130% ATK damage to one enemy and 50% ATK damage to up to 2 other random enemies.',
        mpCost: 20,
        skillUnlockLevel: 1,
        targetType: 'enemy',
        damagePercent: 130,
        splashCount: 2,
        splashDamagePercent: 50
      },
```

**Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/data/heroTemplates.js
git commit -m "feat: update Fireball skill with splash damage properties"
```

---

## Task 5: Add Evasion Test for Splash Targets

**Files:**
- Modify: `src/stores/__tests__/battle-splash.test.js`

**Step 1: Add evasion test**

Add this test to the "splash damage in combat" describe block:

```js
    it('allows splash targets to evade', () => {
      store.heroes.value = [{
        instanceId: 'hero1',
        template: { id: 'ember_witch', name: 'Shasha' },
        stats: { hp: 100, atk: 50, def: 20, spd: 14 },
        currentHp: 100,
        maxHp: 100,
        currentMp: 70,
        maxMp: 70,
        statusEffects: []
      }]

      // Enemy2 has 100% evasion
      store.enemies.value = [
        { id: 'enemy1', template: { name: 'Goblin A' }, stats: { hp: 100, def: 10 }, currentHp: 100, statusEffects: [] },
        {
          id: 'enemy2',
          template: { name: 'Dodgy Goblin' },
          stats: { hp: 100, def: 10 },
          currentHp: 100,
          statusEffects: [{ type: 'evasion', value: 100, duration: 5, definition: { name: 'Evasion' } }]
        }
      ]

      const skill = {
        name: 'Fireball',
        targetType: 'enemy',
        mpCost: 20,
        damagePercent: 130,
        splashCount: 2,
        splashDamagePercent: 50
      }

      store.state.value = 'player_turn'
      store.selectedAction.value = { type: 'skill', skill }
      store.selectedTarget.value = { id: 'enemy1', type: 'enemy' }
      store.turnOrder.value = [{ id: 'hero1', type: 'hero' }]
      store.currentTurnIndex.value = 0

      store.executePlayerAction()

      // Primary target takes damage
      expect(store.enemies.value[0].currentHp).toBeLessThan(100)
      // Evasion enemy should evade (100% evasion means always dodge)
      expect(store.enemies.value[1].currentHp).toBe(100)
    })
```

**Step 2: Run the test**

Run: `npx vitest run src/stores/__tests__/battle-splash.test.js -t "allows splash targets to evade"`
Expected: PASS (since applyDamage already checks evasion)

**Step 3: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/stores/__tests__/battle-splash.test.js
git commit -m "test: add evasion test for splash damage targets"
```

---

## Task 6: Final Verification and Cleanup

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (should be 139+ tests)

**Step 2: Verify Fireball skill definition looks correct**

Run: `grep -A 10 "name: 'Fireball'" src/data/heroTemplates.js`
Expected: Shows updated skill with splashCount and splashDamagePercent

**Step 3: Commit any remaining changes**

If any uncommitted changes:
```bash
git add -A
git commit -m "chore: final cleanup for splash damage feature"
```

---

## Summary

After completing all tasks:
- New `pickRandom` helper function in battle.js
- Splash damage logic in 'enemy' case of executePlayerAction
- Updated Fireball skill with `splashCount: 2` and `splashDamagePercent: 50`
- 5 new tests covering splash damage scenarios
- Description changed from "adjacent enemies" to "up to 2 other random enemies"
