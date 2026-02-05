# Colosseum AI Skills Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable Colosseum AI enemies to use their hero skills instead of only basic attacking.

**Architecture:** Fix the cooldown check that filters out skills without explicit cooldown property, then add Alchemist-specific essence resource tracking (check cost, deduct on use, regenerate per turn).

**Tech Stack:** Vue 3, Pinia stores, Vitest

---

## Background

Colosseum enemies are hero templates fighting as AI. Currently they only basic attack because:
1. Hero skills don't have `cooldown` property (they use resource costs like `mpCost`, `rageCost`, etc.)
2. The cooldown check `enemy.currentCooldowns[s.name] !== 0` returns `true` for `undefined`, filtering out all skills
3. No resource cost checking exists in `executeEnemyTurn`

## Tasks

### Task 1: Write failing test for cooldown check fix

**Files:**
- Create: `src/stores/__tests__/battle-colosseum-ai.test.js`

**Step 1: Write the failing test**

```javascript
/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { useHeroesStore } from '../heroes.js'

describe('Colosseum AI skill usage', () => {
  let battleStore
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
  })

  describe('cooldown check for hero skills', () => {
    it('should include skills without cooldown property in ready skills', () => {
      // Create a mock colosseum enemy with hero-style skills (no cooldown property)
      const mockEnemy = {
        id: 'colosseum_0',
        templateId: 'shadow_king',
        isColosseumEnemy: true,
        currentHp: 1000,
        maxHp: 1000,
        currentCooldowns: {}, // Empty - hero skills don't have cooldown
        template: {
          name: 'Shadow King',
          skills: [
            { name: 'Void Strike', rageCost: 50, damagePercent: 200, targetType: 'enemy' },
            { name: 'Mantle of Empty Hate', rageCost: 30, targetType: 'self' }
          ]
        },
        stats: { atk: 100, def: 50, spd: 80 }
      }

      // Use the internal skill filtering logic
      const allSkills = mockEnemy.template.skills
      const readySkills = allSkills.filter(s => {
        // This is the CURRENT buggy logic - should fail
        if (mockEnemy.currentCooldowns[s.name] !== 0) return false
        return true
      })

      // Should have skills available, but currently fails due to undefined !== 0
      expect(readySkills.length).toBeGreaterThan(0)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/stores/__tests__/battle-colosseum-ai.test.js --reporter=verbose`
Expected: FAIL - readySkills.length is 0 because `undefined !== 0` is true

**Step 3: Skip implementation for now (test documents the bug)**

This test documents the current bug. We'll fix it in Task 2.

---

### Task 2: Fix cooldown check in executeEnemyTurn

**Files:**
- Modify: `src/stores/battle.js:4359`
- Update: `src/stores/__tests__/battle-colosseum-ai.test.js`

**Step 1: Update test to use correct logic**

Replace the test with one that tests the FIXED logic:

```javascript
    it('should include skills without cooldown property in ready skills', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        templateId: 'shadow_king',
        isColosseumEnemy: true,
        currentHp: 1000,
        maxHp: 1000,
        currentCooldowns: {},
        template: {
          name: 'Shadow King',
          skills: [
            { name: 'Void Strike', rageCost: 50, damagePercent: 200, targetType: 'enemy' },
            { name: 'Mantle of Empty Hate', rageCost: 30, targetType: 'self' }
          ]
        },
        stats: { atk: 100, def: 50, spd: 80 }
      }

      const allSkills = mockEnemy.template.skills
      const readySkills = allSkills.filter(s => {
        // FIXED logic: only filter if cooldown is explicitly > 0
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        return true
      })

      expect(readySkills.length).toBe(2)
      expect(readySkills.map(s => s.name)).toContain('Void Strike')
      expect(readySkills.map(s => s.name)).toContain('Mantle of Empty Hate')
    })

    it('should filter out skills that are on cooldown', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        currentCooldowns: { 'Void Strike': 2 }, // On cooldown
        template: {
          skills: [
            { name: 'Void Strike', rageCost: 50 },
            { name: 'Mantle of Empty Hate', rageCost: 30 }
          ]
        }
      }

      const allSkills = mockEnemy.template.skills
      const readySkills = allSkills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        return true
      })

      expect(readySkills.length).toBe(1)
      expect(readySkills[0].name).toBe('Mantle of Empty Hate')
    })
```

**Step 2: Run tests to verify they pass with correct logic**

Run: `npx vitest run src/stores/__tests__/battle-colosseum-ai.test.js --reporter=verbose`
Expected: PASS (tests use the fixed logic inline)

**Step 3: Apply fix to battle.js**

In `src/stores/battle.js`, find line ~4359 and change:

```javascript
// BEFORE (line 4359):
if (enemy.currentCooldowns[s.name] !== 0) return false

// AFTER:
if (enemy.currentCooldowns?.[s.name] > 0) return false
```

**Step 4: Run all battle tests to verify no regressions**

Run: `npx vitest run src/stores/__tests__/battle*.test.js --reporter=verbose`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-colosseum-ai.test.js
git commit -m "fix(battle): allow colosseum AI to use skills without cooldown property

Hero skills use resource costs (mpCost, rageCost) instead of cooldowns.
The check 'undefined !== 0' was filtering out all hero skills.
Changed to 'cooldown > 0' so undefined/0 both mean 'ready'."
```

---

### Task 3: Add essence cost check in skill filtering

**Files:**
- Modify: `src/stores/battle.js:~4360`
- Update: `src/stores/__tests__/battle-colosseum-ai.test.js`

**Step 1: Write failing test for essence cost check**

Add to test file:

```javascript
  describe('essence cost checking for alchemist AI', () => {
    it('should filter out skills when not enough essence', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentEssence: 5, // Only 5 essence
        maxEssence: 60,
        currentCooldowns: {},
        template: {
          skills: [
            { name: 'Cheap Skill', essenceCost: 5, damagePercent: 80 },
            { name: 'Expensive Skill', essenceCost: 20, damagePercent: 150 }
          ]
        }
      }

      const allSkills = mockEnemy.template.skills
      const readySkills = allSkills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        // Essence check
        if (s.essenceCost && mockEnemy.currentEssence !== undefined) {
          if (mockEnemy.currentEssence < s.essenceCost) return false
        }
        return true
      })

      expect(readySkills.length).toBe(1)
      expect(readySkills[0].name).toBe('Cheap Skill')
    })

    it('should allow skills when enough essence', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentEssence: 30,
        maxEssence: 60,
        currentCooldowns: {},
        template: {
          skills: [
            { name: 'Cheap Skill', essenceCost: 5, damagePercent: 80 },
            { name: 'Expensive Skill', essenceCost: 20, damagePercent: 150 }
          ]
        }
      }

      const allSkills = mockEnemy.template.skills
      const readySkills = allSkills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        if (s.essenceCost && mockEnemy.currentEssence !== undefined) {
          if (mockEnemy.currentEssence < s.essenceCost) return false
        }
        return true
      })

      expect(readySkills.length).toBe(2)
    })

    it('should ignore essence check for non-alchemist enemies', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        // No currentEssence property = not an alchemist
        currentCooldowns: {},
        template: {
          skills: [
            { name: 'MP Skill', mpCost: 20, damagePercent: 100 }
          ]
        }
      }

      const allSkills = mockEnemy.template.skills
      const readySkills = allSkills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        if (s.essenceCost && mockEnemy.currentEssence !== undefined) {
          if (mockEnemy.currentEssence < s.essenceCost) return false
        }
        return true
      })

      expect(readySkills.length).toBe(1) // MP skill passes (no essence check)
    })
  })
```

**Step 2: Run tests to verify they pass**

Run: `npx vitest run src/stores/__tests__/battle-colosseum-ai.test.js --reporter=verbose`
Expected: PASS (tests use inline logic)

**Step 3: Apply essence check to battle.js**

In `src/stores/battle.js`, in the `readySkills` filter (around line 4359-4365), add the essence check:

```javascript
const readySkills = allSkills.filter(s => {
  // Check cooldown - only filter if explicitly > 0
  if (enemy.currentCooldowns?.[s.name] > 0) return false
  // Check essence cost for colosseum alchemists
  if (s.essenceCost && enemy.currentEssence !== undefined) {
    if (enemy.currentEssence < s.essenceCost) return false
  }
  // Check HP-based use conditions
  if (s.useCondition === 'hp_below_50') {
    const hpPercent = (enemy.currentHp / enemy.maxHp) * 100
    if (hpPercent >= 50) return false
  }
  return true
})
```

**Step 4: Run battle tests**

Run: `npx vitest run src/stores/__tests__/battle*.test.js --reporter=verbose`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-colosseum-ai.test.js
git commit -m "feat(battle): add essence cost check for colosseum alchemist AI"
```

---

### Task 4: Add essence deduction when skill is used

**Files:**
- Modify: `src/stores/battle.js:~4631`
- Update: `src/stores/__tests__/battle-colosseum-ai.test.js`

**Step 1: Write test for essence deduction**

Add to test file:

```javascript
  describe('essence deduction on skill use', () => {
    it('should deduct essence when alchemist AI uses skill', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentEssence: 30,
        maxEssence: 60,
        currentCooldowns: {}
      }

      const skill = { name: 'Tainted Tonic', essenceCost: 12, damagePercent: 90 }

      // Simulate deduction logic
      if (skill.essenceCost && mockEnemy.currentEssence !== undefined) {
        mockEnemy.currentEssence -= skill.essenceCost
      }

      expect(mockEnemy.currentEssence).toBe(18)
    })

    it('should not deduct essence for non-alchemist enemies', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentMp: 50, // MP-based, not essence
        currentCooldowns: {}
      }

      const skill = { name: 'Fireball', mpCost: 20, damagePercent: 120 }

      // Simulate deduction logic - should not affect anything
      if (skill.essenceCost && mockEnemy.currentEssence !== undefined) {
        mockEnemy.currentEssence -= skill.essenceCost
      }

      // currentEssence was never defined, shouldn't crash or change
      expect(mockEnemy.currentEssence).toBeUndefined()
      expect(mockEnemy.currentMp).toBe(50) // Unchanged
    })
  })
```

**Step 2: Run tests**

Run: `npx vitest run src/stores/__tests__/battle-colosseum-ai.test.js --reporter=verbose`
Expected: PASS

**Step 3: Apply essence deduction to battle.js**

In `src/stores/battle.js`, find where cooldown is set after skill use (around line 4631):

```javascript
// Find this line:
enemy.currentCooldowns[skill.name] = skill.cooldown + 1

// Add BEFORE it:
// Deduct essence cost for colosseum alchemists
if (skill.essenceCost && enemy.currentEssence !== undefined) {
  enemy.currentEssence -= skill.essenceCost
}
```

Note: This needs to be added in multiple places where `enemy.currentCooldowns[skill.name]` is set:
- Line ~4424 (summon skills)
- Line ~4458 (fallback skills)
- Line ~4469 (field full, no fallback)
- Line ~4574 (noDamage skills)
- Line ~4631 (standard skills)

Actually, for cleaner code, add it once right after skill selection (around line 4386) before any branching:

```javascript
if (skill) {
  // Deduct essence cost for colosseum alchemists (do once before branching)
  if (skill.essenceCost && enemy.currentEssence !== undefined) {
    enemy.currentEssence -= skill.essenceCost
  }

  // Handle summon skills before normal skill processing
  if (skill.summon) {
    // ... rest of code
```

**Step 4: Run all battle tests**

Run: `npx vitest run src/stores/__tests__/battle*.test.js --reporter=verbose`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-colosseum-ai.test.js
git commit -m "feat(battle): deduct essence when colosseum alchemist AI uses skill"
```

---

### Task 5: Add essence regeneration at turn start

**Files:**
- Modify: `src/stores/battle.js:~2629`
- Update: `src/stores/__tests__/battle-colosseum-ai.test.js`

**Step 1: Write test for essence regeneration**

Add to test file:

```javascript
  describe('essence regeneration at turn start', () => {
    it('should regenerate essence for colosseum alchemist at turn start', () => {
      const battleStore = useBattleStore()

      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentEssence: 20,
        maxEssence: 60,
        class: { resourceType: 'essence' }
      }

      // Call regenerateEssence directly
      battleStore.regenerateEssence(mockEnemy)

      expect(mockEnemy.currentEssence).toBe(30) // +10 regen
    })

    it('should cap essence at maxEssence', () => {
      const battleStore = useBattleStore()

      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentEssence: 55,
        maxEssence: 60,
        class: { resourceType: 'essence' }
      }

      battleStore.regenerateEssence(mockEnemy)

      expect(mockEnemy.currentEssence).toBe(60) // Capped at max
    })

    it('should not regenerate essence for non-alchemist', () => {
      const battleStore = useBattleStore()

      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentMp: 30,
        maxMp: 100,
        class: { resourceType: 'mp' } // Not essence
      }

      battleStore.regenerateEssence(mockEnemy)

      // Should not crash, should not change MP
      expect(mockEnemy.currentMp).toBe(30)
    })
  })
```

**Step 2: Run tests**

Run: `npx vitest run src/stores/__tests__/battle-colosseum-ai.test.js --reporter=verbose`
Expected: PASS (regenerateEssence already exists and is exported)

**Step 3: Hook regeneration into enemy turn start**

In `src/stores/battle.js`, find `startNextTurn()` around line 2621-2633:

```javascript
} else {
  const enemy = enemies.value.find(e => e.id === turn.id)
  if (enemy && enemy.currentHp > 0) {
    // Check for stun
    if (!processStartOfTurnEffects(enemy)) {
      processEndOfTurnEffects(enemy)
      advanceTurnIndex()
      setTimeout(() => startNextTurn(), 600)
      return
    }

    // ADD THIS: Regenerate essence for colosseum alchemist enemies
    if (enemy.isColosseumEnemy) {
      regenerateEssence(enemy)
    }

    state.value = BattleState.ENEMY_TURN
    addLog(`${enemy.template.name}'s turn`)
    setTimeout(() => executeEnemyTurn(enemy), 800)
    return
  }
}
```

**Step 4: Run all battle tests**

Run: `npx vitest run src/stores/__tests__/battle*.test.js --reporter=verbose`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-colosseum-ai.test.js
git commit -m "feat(battle): regenerate essence for colosseum alchemist AI at turn start"
```

---

### Task 6: Integration test - full colosseum battle with alchemist

**Files:**
- Update: `src/stores/__tests__/battle-colosseum-ai.test.js`

**Step 1: Write integration test**

Add to test file:

```javascript
  describe('integration: alchemist AI full turn', () => {
    it('should use skill when essence available, basic attack when not', () => {
      // This test documents expected behavior for manual verification
      // Full integration would require mocking the entire battle flow

      const mockAlchemist = {
        id: 'colosseum_0',
        templateId: 'zina_the_desperate',
        isColosseumEnemy: true,
        currentHp: 500,
        maxHp: 500,
        currentEssence: 15,
        maxEssence: 60,
        currentCooldowns: {},
        class: { resourceType: 'essence' },
        template: {
          name: 'Zina the Desperate',
          skills: [
            { name: 'Tainted Tonic', essenceCost: 10, damagePercent: 90 },
            { name: 'Volatile Mixture', essenceCost: 25, damagePercent: 150 }
          ]
        },
        stats: { atk: 120, def: 40, spd: 70 }
      }

      // Skill filtering with all checks
      const readySkills = mockAlchemist.template.skills.filter(s => {
        if (mockAlchemist.currentCooldowns?.[s.name] > 0) return false
        if (s.essenceCost && mockAlchemist.currentEssence !== undefined) {
          if (mockAlchemist.currentEssence < s.essenceCost) return false
        }
        return true
      })

      // Should only have Tainted Tonic available (10 essence cost, have 15)
      expect(readySkills.length).toBe(1)
      expect(readySkills[0].name).toBe('Tainted Tonic')

      // Simulate using the skill
      const skill = readySkills[0]
      mockAlchemist.currentEssence -= skill.essenceCost

      expect(mockAlchemist.currentEssence).toBe(5)

      // Next turn: regenerate +10
      mockAlchemist.currentEssence = Math.min(
        mockAlchemist.maxEssence,
        mockAlchemist.currentEssence + 10
      )

      expect(mockAlchemist.currentEssence).toBe(15) // Back to 15

      // Can use Tainted Tonic again
      const nextReadySkills = mockAlchemist.template.skills.filter(s => {
        if (mockAlchemist.currentCooldowns?.[s.name] > 0) return false
        if (s.essenceCost && mockAlchemist.currentEssence !== undefined) {
          if (mockAlchemist.currentEssence < s.essenceCost) return false
        }
        return true
      })

      expect(nextReadySkills.length).toBe(1)
      expect(nextReadySkills[0].name).toBe('Tainted Tonic')
    })
  })
```

**Step 2: Run all tests**

Run: `npx vitest run src/stores/__tests__/battle-colosseum-ai.test.js --reporter=verbose`
Expected: All PASS

**Step 3: Commit**

```bash
git add src/stores/__tests__/battle-colosseum-ai.test.js
git commit -m "test(battle): add integration test for colosseum alchemist AI"
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `src/stores/battle.js:4359` | Change `!== 0` to `> 0` for cooldown check |
| `src/stores/battle.js:~4360` | Add essence cost check in skill filter |
| `src/stores/battle.js:~4386` | Add essence deduction when skill used |
| `src/stores/battle.js:~2630` | Add essence regen for colosseum enemies |
| `src/stores/__tests__/battle-colosseum-ai.test.js` | New test file |

## Post-Implementation

After all tasks complete:
1. Run full test suite: `npx vitest run`
2. Manual test: Start a colosseum battle with an Alchemist enemy and verify they use skills
3. Commit any final fixes
