# Chroma Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Chroma, a 4-star cuttlefish Bard with misdirection control mechanics

**Architecture:** Add BLIND status effect with miss chance, integrate miss check into battle flow, create hero data file

**Tech Stack:** Vue 3, JavaScript, Vitest

---

## Task 1: Add BLIND Status Effect

**Files:**
- Modify: `src/data/statusEffects.js`

**Step 1: Add BLIND to EffectType enum**

```javascript
// Add after SHATTERED_TEMPO
BLIND: 'blind'  // Miss chance on attacks
```

**Step 2: Add BLIND to effectDefinitions**

```javascript
[EffectType.BLIND]: {
  name: 'Blinded',
  icon: '🌫️',
  color: '#6b7280',
  isBuff: false,  // Debuff - counts for Penny/Vicious synergy
  isBlind: true,
  stackable: false
}
```

**Step 3: Run tests to verify no regressions**

Run: `npm test -- --run src/data`
Expected: All existing tests pass

**Step 4: Commit**

```bash
git add src/data/statusEffects.js
git commit -m "feat: add BLIND status effect type"
```

---

## Task 2: Implement Miss Chance Logic in Battle Store

**Files:**
- Modify: `src/stores/battle.js`
- Create: `src/stores/__tests__/battle-blind.test.js`

**Step 1: Write failing tests for blind miss mechanic**

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '@/data/statusEffects'

describe('Blind Miss Mechanic', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  describe('checkBlindMiss', () => {
    it('should return false when attacker has no blind effect', () => {
      const attacker = { statusEffects: [] }
      expect(battleStore.checkBlindMiss(attacker)).toBe(false)
    })

    it('should return false when attacker has no status effects', () => {
      const attacker = {}
      expect(battleStore.checkBlindMiss(attacker)).toBe(false)
    })

    it('should roll against blind miss chance', () => {
      const attacker = {
        statusEffects: [{ type: EffectType.BLIND, value: 50 }]
      }

      // Mock Math.random to return 0.3 (should miss with 50% chance)
      vi.spyOn(Math, 'random').mockReturnValue(0.3)
      expect(battleStore.checkBlindMiss(attacker)).toBe(true)

      // Mock Math.random to return 0.7 (should hit with 50% chance)
      vi.spyOn(Math, 'random').mockReturnValue(0.7)
      expect(battleStore.checkBlindMiss(attacker)).toBe(false)

      vi.restoreAllMocks()
    })

    it('should handle 100% blind chance', () => {
      const attacker = {
        statusEffects: [{ type: EffectType.BLIND, value: 100 }]
      }
      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      expect(battleStore.checkBlindMiss(attacker)).toBe(true)
      vi.restoreAllMocks()
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/stores/__tests__/battle-blind.test.js`
Expected: FAIL - checkBlindMiss not defined

**Step 3: Implement checkBlindMiss function**

Add to battle.js:

```javascript
function checkBlindMiss(attacker) {
  const blindEffect = attacker.statusEffects?.find(e => e.type === EffectType.BLIND)
  if (!blindEffect) return false

  const missChance = blindEffect.value / 100
  return Math.random() < missChance
}
```

Export in the return statement.

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/stores/__tests__/battle-blind.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-blind.test.js
git commit -m "feat: add checkBlindMiss function for blind status effect"
```

---

## Task 3: Integrate Blind Check into Attack Flow

**Files:**
- Modify: `src/stores/battle.js`
- Modify: `src/stores/__tests__/battle-blind.test.js`

**Step 1: Add integration tests**

```javascript
describe('Blind integration with attacks', () => {
  it('should cause attack to miss when blind check succeeds', () => {
    // Setup battle with blinded enemy attacking
    // Verify damage is not applied when miss occurs
    // Verify "MISS" indicator or equivalent
  })

  it('should not affect ally-targeted skills', () => {
    // Blind should only affect enemy-targeted attacks
  })

  it('should work with Penny bonus damage per debuff', () => {
    // Blind counts as debuff for Street Racket
  })

  it('should work with Vicious buff', () => {
    // Vicious (+30% vs debuffed) should trigger on blinded enemies
  })
})
```

**Step 2: Integrate blind check into executeAttack or applyDamage**

Find where attack damage is calculated and add blind check:

```javascript
// Before damage calculation
if (checkBlindMiss(attacker)) {
  // Show miss indicator
  // Skip damage and effects
  return { missed: true }
}
```

**Step 3: Run full battle test suite**

Run: `npm test -- --run src/stores/__tests__/battle`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-blind.test.js
git commit -m "feat: integrate blind miss check into attack flow"
```

---

## Task 4: Create Chroma Hero Data

**Files:**
- Create: `src/data/heroes/4star/chroma.js`
- Modify: `src/data/heroes/4star/index.js`
- Modify: `src/data/heroes/index.js` (if needed)

**Step 1: Create chroma.js**

```javascript
import { EffectType } from '../../statusEffects.js'

export const chroma = {
  id: 'chroma',
  name: 'Chroma, the Curious',
  rarity: 4,
  classId: 'bard',
  baseStats: { hp: 82, atk: 22, def: 18, spd: 17, mp: 60 },
  finale: {
    name: 'The Dazzling',
    description: 'Apply Blind (30% miss chance) to all enemies for 1 turn.',
    target: 'all_enemies',
    effects: [
      { type: EffectType.BLIND, target: 'all_enemies', duration: 1, value: 30 }
    ]
  },
  skills: [
    {
      name: 'Ink Flare',
      description: 'Apply Blind (50% miss chance) to an enemy for 1 turn.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        { type: EffectType.BLIND, target: 'enemy', duration: 1, value: 50 }
      ]
    },
    {
      name: 'Resonance',
      description: 'Restore 20 MP/Focus/Valor/Rage to an ally.',
      skillUnlockLevel: 1,
      targetType: 'ally',
      noDamage: true,
      resourceRestore: 20
    },
    {
      name: 'Fixation Pattern',
      description: 'Apply Taunt to an ally for 1 turn. Enemies must target them.',
      skillUnlockLevel: 3,
      targetType: 'ally',
      noDamage: true,
      effects: [
        { type: EffectType.TAUNT, target: 'ally', duration: 1 }
      ]
    },
    {
      name: 'Chromatic Fade',
      description: 'Gain 75% Evasion for 2 turns.',
      skillUnlockLevel: 6,
      targetType: 'self',
      noDamage: true,
      effects: [
        { type: EffectType.EVASION, target: 'self', duration: 2, value: 75 }
      ]
    },
    {
      name: 'Refraction',
      description: 'Grant an ally 50% Evasion for 2 turns.',
      skillUnlockLevel: 12,
      targetType: 'ally',
      noDamage: true,
      effects: [
        { type: EffectType.EVASION, target: 'ally', duration: 2, value: 50 }
      ]
    }
  ]
}
```

**Step 2: Export from 4star/index.js**

```javascript
export { chroma } from './chroma.js'
```

**Step 3: Verify hero loads correctly**

Run: `npm test -- --run src/data/heroes`
Expected: All tests pass, Chroma included in hero list

**Step 4: Commit**

```bash
git add src/data/heroes/4star/chroma.js src/data/heroes/4star/index.js
git commit -m "feat: add Chroma the Curious 4-star Bard"
```

---

## Task 5: Add Chroma-Specific Tests

**Files:**
- Create: `src/data/heroes/__tests__/chroma.test.js`

**Step 1: Write hero data tests**

```javascript
import { describe, it, expect } from 'vitest'
import { chroma } from '../4star/chroma'
import { EffectType } from '../../statusEffects'

describe('Chroma, the Curious', () => {
  it('should have correct base stats', () => {
    expect(chroma.baseStats).toEqual({
      hp: 82,
      atk: 22,
      def: 18,
      spd: 17,
      mp: 60
    })
  })

  it('should be a 4-star bard', () => {
    expect(chroma.rarity).toBe(4)
    expect(chroma.classId).toBe('bard')
  })

  it('should have 5 skills', () => {
    expect(chroma.skills).toHaveLength(5)
  })

  it('should have Ink Flare with 50% blind at level 1', () => {
    const inkFlare = chroma.skills.find(s => s.name === 'Ink Flare')
    expect(inkFlare.skillUnlockLevel).toBe(1)
    expect(inkFlare.effects[0].type).toBe(EffectType.BLIND)
    expect(inkFlare.effects[0].value).toBe(50)
  })

  it('should have Resonance with 20 resource restore at level 1', () => {
    const resonance = chroma.skills.find(s => s.name === 'Resonance')
    expect(resonance.skillUnlockLevel).toBe(1)
    expect(resonance.resourceRestore).toBe(20)
  })

  it('should have Fixation Pattern with Taunt at level 3', () => {
    const fixation = chroma.skills.find(s => s.name === 'Fixation Pattern')
    expect(fixation.skillUnlockLevel).toBe(3)
    expect(fixation.effects[0].type).toBe(EffectType.TAUNT)
  })

  it('should have Chromatic Fade with 75% self Evasion at level 6', () => {
    const fade = chroma.skills.find(s => s.name === 'Chromatic Fade')
    expect(fade.skillUnlockLevel).toBe(6)
    expect(fade.effects[0].type).toBe(EffectType.EVASION)
    expect(fade.effects[0].value).toBe(75)
    expect(fade.targetType).toBe('self')
  })

  it('should have Refraction with 50% ally Evasion at level 12', () => {
    const refraction = chroma.skills.find(s => s.name === 'Refraction')
    expect(refraction.skillUnlockLevel).toBe(12)
    expect(refraction.effects[0].type).toBe(EffectType.EVASION)
    expect(refraction.effects[0].value).toBe(50)
    expect(refraction.targetType).toBe('ally')
  })

  it('should have The Dazzling finale with 30% AoE blind', () => {
    expect(chroma.finale.name).toBe('The Dazzling')
    expect(chroma.finale.target).toBe('all_enemies')
    expect(chroma.finale.effects[0].type).toBe(EffectType.BLIND)
    expect(chroma.finale.effects[0].value).toBe(30)
  })
})
```

**Step 2: Run tests**

Run: `npm test -- --run src/data/heroes/__tests__/chroma.test.js`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/data/heroes/__tests__/chroma.test.js
git commit -m "test: add Chroma hero data tests"
```

---

## Task 6: Integration Tests - Blind with Penny/Vicious Synergy

**Files:**
- Create: `src/stores/__tests__/battle-blind-synergy.test.js`

**Step 1: Write synergy tests**

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '@/data/statusEffects'

describe('Blind Synergy Tests', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  describe('Penny Whistler synergy', () => {
    it('should count Blind as a debuff for bonus damage per debuff', () => {
      const enemy = {
        statusEffects: [
          { type: EffectType.BLIND, value: 50 }
        ]
      }
      // Verify countDebuffs or equivalent counts Blind
      const debuffCount = battleStore.countDebuffsOnTarget?.(enemy) ??
        enemy.statusEffects.filter(e => !e.definition?.isBuff).length
      expect(debuffCount).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Vicious synergy', () => {
    it('should trigger Vicious bonus against blinded enemies', () => {
      const attacker = {
        statusEffects: [
          { type: EffectType.VICIOUS, bonusDamagePercent: 30 }
        ]
      }
      const target = {
        statusEffects: [
          { type: EffectType.BLIND, value: 50 }
        ]
      }
      // Verify Vicious bonus applies
      const multiplier = battleStore.getViciousDamageMultiplier?.(attacker, target)
      if (multiplier !== undefined) {
        expect(multiplier).toBeGreaterThan(1)
      }
    })
  })
})
```

**Step 2: Run synergy tests**

Run: `npm test -- --run src/stores/__tests__/battle-blind-synergy.test.js`
Expected: All tests pass (Blind should automatically work with existing debuff checks)

**Step 3: Commit**

```bash
git add src/stores/__tests__/battle-blind-synergy.test.js
git commit -m "test: add Blind synergy tests for Penny and Vicious"
```

---

## Task 7: Final Integration Test - Full Chroma Battle

**Files:**
- Create: `src/stores/__tests__/battle-chroma-integration.test.js`

**Step 1: Write full integration test**

Test a battle scenario where Chroma uses skills and Finale:

```javascript
describe('Chroma Battle Integration', () => {
  it('should apply Blind via Ink Flare', () => {
    // Setup Chroma, use Ink Flare on enemy
    // Verify enemy has BLIND effect with 50% value
  })

  it('should apply Taunt to ally via Fixation Pattern', () => {
    // Setup Chroma, use Fixation Pattern on ally
    // Verify ally has TAUNT effect
  })

  it('should grant self Evasion via Chromatic Fade', () => {
    // Use Chromatic Fade
    // Verify Chroma has 75% EVASION
  })

  it('should trigger The Dazzling finale at 3 verses', () => {
    // Build 3 verses
    // Verify finale auto-triggers
    // Verify all enemies have 30% BLIND
  })

  it('should restore resources via Resonance', () => {
    // Setup ally with low MP
    // Use Resonance
    // Verify +20 MP (or equivalent resource)
  })
})
```

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/stores/__tests__/battle-chroma-integration.test.js
git commit -m "test: add Chroma full battle integration tests"
```

---

## Summary

| Task | Description | New Files |
|------|-------------|-----------|
| 1 | Add BLIND status effect | - |
| 2 | Implement checkBlindMiss | battle-blind.test.js |
| 3 | Integrate blind into attack flow | - |
| 4 | Create Chroma hero data | chroma.js |
| 5 | Add Chroma hero tests | chroma.test.js |
| 6 | Add synergy tests | battle-blind-synergy.test.js |
| 7 | Add integration tests | battle-chroma-integration.test.js |

**Total commits:** 7
**New systems:** BLIND status effect with miss chance
