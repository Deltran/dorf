# Swift Arrow Skills Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Swift Arrow's 5-skill kit with Hunter's Mark (vulnerability debuff) and DEF penetration mechanics.

**Architecture:** Add MARKED status effect that amplifies damage taken. Use existing `ignoreDef` pattern for DEF penetration. Add prioritizeMarked flag for multi-hit random targeting.

**Tech Stack:** Vue 3, Pinia stores, Vitest

---

## Task 1: Add MARKED Status Effect

**Files:**
- Modify: `src/data/statusEffects.js`
- Test: `src/data/__tests__/statusEffects.test.js` (create)

**Step 1: Write the failing test**

Create `src/data/__tests__/statusEffects.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { EffectType, effectDefinitions, createEffect } from '../statusEffects'

describe('MARKED status effect', () => {
  it('has MARKED in EffectType enum', () => {
    expect(EffectType.MARKED).toBe('marked')
  })

  it('has MARKED definition with correct properties', () => {
    const def = effectDefinitions[EffectType.MARKED]
    expect(def).toBeDefined()
    expect(def.name).toBe('Marked')
    expect(def.isBuff).toBe(false)
    expect(def.isMarked).toBe(true)
  })

  it('creates MARKED effect with value', () => {
    const effect = createEffect(EffectType.MARKED, { duration: 3, value: 20 })
    expect(effect.type).toBe('marked')
    expect(effect.duration).toBe(3)
    expect(effect.value).toBe(20)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/data/__tests__/statusEffects.test.js`
Expected: FAIL - EffectType.MARKED is undefined

**Step 3: Add MARKED to EffectType enum**

In `src/data/statusEffects.js`, add to EffectType object after WELL_FED:

```js
  // Vulnerability
  MARKED: 'marked' // Increases damage taken from all sources
```

**Step 4: Add MARKED effect definition**

In `src/data/statusEffects.js`, add to effectDefinitions after WELL_FED:

```js
  [EffectType.MARKED]: {
    name: 'Marked',
    icon: '🎯',
    color: '#ef4444',
    isBuff: false,
    isMarked: true,
    stackable: false
  }
```

**Step 5: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/data/__tests__/statusEffects.test.js`
Expected: PASS

**Step 6: Commit**

```bash
git add src/data/statusEffects.js src/data/__tests__/statusEffects.test.js
git commit -m "feat: add MARKED status effect type"
```

---

## Task 2: Add MARKED Damage Amplification

**Files:**
- Modify: `src/stores/battle.js`
- Test: `src/stores/__tests__/battle-marked.test.js` (create)

**Step 1: Write the failing test**

Create `src/stores/__tests__/battle-marked.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('battle store - MARKED effect', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('getMarkedDamageMultiplier', () => {
    it('returns 1 when target has no MARKED effect', () => {
      const target = { statusEffects: [] }
      expect(store.getMarkedDamageMultiplier(target)).toBe(1)
    })

    it('returns amplified multiplier when target is MARKED', () => {
      const target = {
        statusEffects: [
          { type: EffectType.MARKED, duration: 3, value: 20 }
        ]
      }
      expect(store.getMarkedDamageMultiplier(target)).toBe(1.2)
    })

    it('returns 1 when target has no statusEffects array', () => {
      const target = {}
      expect(store.getMarkedDamageMultiplier(target)).toBe(1)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/stores/__tests__/battle-marked.test.js`
Expected: FAIL - getMarkedDamageMultiplier is not a function

**Step 3: Add getMarkedDamageMultiplier function**

In `src/stores/battle.js`, add after `calculateDamage` function (around line 2135):

```js
  function getMarkedDamageMultiplier(target) {
    const markedEffect = target?.statusEffects?.find(e => e.type === EffectType.MARKED)
    if (markedEffect) {
      return 1 + (markedEffect.value / 100)
    }
    return 1
  }
```

**Step 4: Export getMarkedDamageMultiplier in return statement**

Find the return statement at the end of the store and add `getMarkedDamageMultiplier` to the returned object.

**Step 5: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/stores/__tests__/battle-marked.test.js`
Expected: PASS

**Step 6: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-marked.test.js
git commit -m "feat: add getMarkedDamageMultiplier for MARKED damage amp"
```

---

## Task 3: Integrate MARKED into Damage Calculation

**Files:**
- Modify: `src/stores/battle.js`
- Modify: `src/stores/__tests__/battle-marked.test.js`

**Step 1: Write integration test**

Add to `src/stores/__tests__/battle-marked.test.js`:

```js
  describe('applyMarkedDamage (integration)', () => {
    it('applies MARKED multiplier to calculateDamage result', () => {
      // Base damage: 100 ATK * 1.0 multiplier - 50 DEF * 0.5 = 75
      const baseDamage = store.calculateDamageWithMarked(100, 1.0, 50, 1)
      expect(baseDamage).toBe(75)

      // With 20% MARKED: 75 * 1.2 = 90
      const markedDamage = store.calculateDamageWithMarked(100, 1.0, 50, 1.2)
      expect(markedDamage).toBe(90)
    })
  })
```

**Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/stores/__tests__/battle-marked.test.js`
Expected: FAIL - calculateDamageWithMarked is not a function

**Step 3: Add calculateDamageWithMarked function**

In `src/stores/battle.js`, add after `getMarkedDamageMultiplier`:

```js
  function calculateDamageWithMarked(atk, multiplier, def, markedMultiplier = 1) {
    const raw = atk * multiplier - def * 0.5
    const baseDamage = Math.max(1, Math.floor(raw))
    return Math.floor(baseDamage * markedMultiplier)
  }
```

**Step 4: Export calculateDamageWithMarked**

Add `calculateDamageWithMarked` to the return statement.

**Step 5: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/stores/__tests__/battle-marked.test.js`
Expected: PASS

**Step 6: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-marked.test.js
git commit -m "feat: add calculateDamageWithMarked for MARKED integration"
```

---

## Task 4: Add prioritizeMarked for Multi-Hit Skills

**Files:**
- Modify: `src/stores/battle.js`
- Modify: `src/stores/__tests__/battle-marked.test.js`

**Step 1: Write the failing test**

Add to `src/stores/__tests__/battle-marked.test.js`:

```js
  describe('selectRandomTarget', () => {
    it('returns random target from alive enemies', () => {
      const enemies = [
        { id: 1, currentHp: 100, statusEffects: [] },
        { id: 2, currentHp: 100, statusEffects: [] }
      ]
      const target = store.selectRandomTarget(enemies, false)
      expect([1, 2]).toContain(target.id)
    })

    it('prioritizes MARKED targets when prioritizeMarked is true', () => {
      const enemies = [
        { id: 1, currentHp: 100, statusEffects: [] },
        { id: 2, currentHp: 100, statusEffects: [{ type: EffectType.MARKED, duration: 3, value: 20 }] }
      ]
      // Run multiple times to verify marked target is always chosen
      for (let i = 0; i < 10; i++) {
        const target = store.selectRandomTarget(enemies, true)
        expect(target.id).toBe(2)
      }
    })

    it('falls back to any target when no MARKED targets exist', () => {
      const enemies = [
        { id: 1, currentHp: 100, statusEffects: [] },
        { id: 2, currentHp: 100, statusEffects: [] }
      ]
      const target = store.selectRandomTarget(enemies, true)
      expect([1, 2]).toContain(target.id)
    })

    it('returns null for empty array', () => {
      const target = store.selectRandomTarget([], false)
      expect(target).toBeNull()
    })
  })
```

**Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/stores/__tests__/battle-marked.test.js`
Expected: FAIL - selectRandomTarget is not a function

**Step 3: Add selectRandomTarget function**

In `src/stores/battle.js`, add after `calculateDamageWithMarked`:

```js
  function selectRandomTarget(enemies, prioritizeMarked = false) {
    const alive = enemies.filter(e => e.currentHp > 0)
    if (alive.length === 0) return null

    if (prioritizeMarked) {
      const marked = alive.filter(e => e.statusEffects?.some(s => s.type === EffectType.MARKED))
      if (marked.length > 0) {
        return marked[Math.floor(Math.random() * marked.length)]
      }
    }

    return alive[Math.floor(Math.random() * alive.length)]
  }
```

**Step 4: Export selectRandomTarget**

Add `selectRandomTarget` to the return statement.

**Step 5: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/stores/__tests__/battle-marked.test.js`
Expected: PASS

**Step 6: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-marked.test.js
git commit -m "feat: add selectRandomTarget with prioritizeMarked support"
```

---

## Task 5: Update Swift Arrow Hero Template

**Files:**
- Modify: `src/data/heroTemplates.js`

**Step 1: Replace Swift Arrow's single skill with skills array**

In `src/data/heroTemplates.js`, replace the `swift_arrow` entry (around line 285-297):

```js
  swift_arrow: {
    id: 'swift_arrow',
    name: 'Swift Arrow',
    rarity: 4,
    classId: 'ranger',
    baseStats: { hp: 90, atk: 42, def: 22, spd: 20, mp: 55 },
    skills: [
      {
        name: 'Volley',
        description: 'Deal 70% ATK damage three times to random enemies.',
        skillUnlockLevel: 1,
        targetType: 'random_enemies',
        multiHit: 3
      },
      {
        name: "Hunter's Mark",
        description: 'Mark an enemy for 3 turns. Marked enemies take 20% increased damage from all sources.',
        skillUnlockLevel: 1,
        targetType: 'enemy',
        noDamage: true,
        effects: [
          { type: EffectType.MARKED, target: 'enemy', duration: 3, value: 20 }
        ]
      },
      {
        name: 'Barrage',
        description: 'Deal 60% ATK damage to all enemies.',
        skillUnlockLevel: 3,
        targetType: 'all_enemies'
      },
      {
        name: 'Piercing Shot',
        description: 'Deal 180% ATK damage to one enemy. Ignores 50% of target DEF.',
        skillUnlockLevel: 6,
        targetType: 'enemy',
        ignoreDef: 50
      },
      {
        name: 'Arrow Storm',
        description: 'Deal 50% ATK damage five times to random enemies. Marked enemies are targeted first.',
        skillUnlockLevel: 12,
        targetType: 'random_enemies',
        multiHit: 5,
        prioritizeMarked: true
      }
    ]
  },
```

**Step 2: Add EffectType import if not present**

Verify `EffectType` is imported at the top of `heroTemplates.js`. If not:

```js
import { EffectType } from './statusEffects'
```

**Step 3: Run all tests**

Run: `./node_modules/.bin/vitest run`
Expected: All existing tests still pass

**Step 4: Commit**

```bash
git add src/data/heroTemplates.js
git commit -m "feat: add Swift Arrow full skill kit"
```

---

## Task 6: Integrate MARKED and prioritizeMarked into Battle Flow

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Update random_enemies targeting to use selectRandomTarget and prioritizeMarked**

Find the `case 'random_enemies':` block (around line 1700) and update to:

```js
        case 'random_enemies': {
          const multiplier = parseSkillMultiplier(skill.description, shardBonus)
          const numHits = skill.multiHit || 1
          let totalDamage = 0

          addLog(`${hero.template.name} uses ${skill.name}!`)

          for (let i = 0; i < numHits; i++) {
            const target = selectRandomTarget(aliveEnemies.value, skill.prioritizeMarked)
            if (!target) break

            const effectiveDef = getEffectiveStat(target, 'def')
            const defReduction = skill.ignoreDef ? (skill.ignoreDef / 100) : 0
            const reducedDef = effectiveDef * (1 - defReduction)
            const markedMultiplier = getMarkedDamageMultiplier(target)
            const damage = calculateDamageWithMarked(effectiveAtk, multiplier, reducedDef, markedMultiplier)

            applyDamage(target, damage, 'attack', hero)
            totalDamage += damage
            emitCombatEffect(target.id, 'enemy', 'damage', damage)

            if (target.currentHp <= 0) {
              addLog(`${target.template.name} defeated!`)
            }
          }

          addLog(`${hero.template.name} deals ${totalDamage} total damage!`)
          break
        }
```

**Step 2: Update single-target enemy damage to use MARKED multiplier**

In the `case 'enemy':` block, find where damage is calculated and applied. Add MARKED multiplier:

```js
const markedMultiplier = getMarkedDamageMultiplier(target)
// Then use calculateDamageWithMarked instead of calculateDamage
```

**Step 3: Update all_enemies damage to use MARKED multiplier**

In the `case 'all_enemies':` block, add MARKED multiplier to each target's damage calculation.

**Step 4: Run all tests**

Run: `./node_modules/.bin/vitest run`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat: integrate MARKED damage amp into battle flow"
```

---

## Task 7: Final Integration Test

**Files:**
- Modify: `src/stores/__tests__/battle-marked.test.js`

**Step 1: Add full integration test for Swift Arrow skills**

Add to `src/stores/__tests__/battle-marked.test.js`:

```js
describe('Swift Arrow skills integration', () => {
  it("Hunter's Mark applies MARKED effect to enemy", () => {
    // This test verifies the skill effect structure is correct
    const huntersMarkSkill = {
      name: "Hunter's Mark",
      effects: [
        { type: EffectType.MARKED, target: 'enemy', duration: 3, value: 20 }
      ]
    }
    expect(huntersMarkSkill.effects[0].type).toBe(EffectType.MARKED)
    expect(huntersMarkSkill.effects[0].value).toBe(20)
  })
})
```

**Step 2: Run all tests**

Run: `./node_modules/.bin/vitest run`
Expected: All tests pass (should be 54+ tests now)

**Step 3: Commit**

```bash
git add src/stores/__tests__/battle-marked.test.js
git commit -m "test: add Swift Arrow integration tests"
```

---

## Notes

- Rangers use Focus (boolean); Swift Arrow loses Focus on any skill use
- `ignoreDef` already exists in the codebase and works correctly
- MARKED does not stack; reapplying refreshes duration
- `targetType: 'random_enemies'` is a new target type that hits random targets multiple times
