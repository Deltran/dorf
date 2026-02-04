# Stack System & Swift Arrow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add counter-based stacking to the status effect system, then redesign Swift Arrow using the new SWIFT_MOMENTUM stack effect.

**Architecture:** New `maxStacks` property on effect definitions triggers counter-based stacking in `applyEffect`. A single effect object tracks `stacks` count. `getEffectiveStat` multiplies `value * stacks`. UI components show numeric badge on stacked effects. Swift Arrow's kit is replaced with the Tempo Archer design.

**Tech Stack:** Vue 3, Pinia, Vitest

---

## Task 1: Stack System — Effect Definition & createEffect

**Files:**
- Modify: `src/data/statusEffects.js`
- Test: `src/data/__tests__/statusEffects-stacking.test.js`

### Step 1: Write the failing tests

```js
import { describe, it, expect } from 'vitest'
import { EffectType, effectDefinitions, createEffect } from '../statusEffects'

describe('counter-based stacking', () => {
  describe('effect definitions', () => {
    it('existing effects have no maxStacks', () => {
      expect(effectDefinitions[EffectType.ATK_UP].maxStacks).toBeUndefined()
      expect(effectDefinitions[EffectType.POISON].maxStacks).toBeUndefined()
      expect(effectDefinitions[EffectType.SPD_UP].maxStacks).toBeUndefined()
    })

    it('SWIFT_MOMENTUM is defined with maxStacks', () => {
      expect(EffectType.SWIFT_MOMENTUM).toBe('swift_momentum')
      const def = effectDefinitions[EffectType.SWIFT_MOMENTUM]
      expect(def).toBeDefined()
      expect(def.name).toBe('Momentum')
      expect(def.icon).toBe('🏹')
      expect(def.isBuff).toBe(true)
      expect(def.stat).toBe('spd')
      expect(def.maxStacks).toBe(6)
    })
  })

  describe('createEffect with stacks', () => {
    it('creates a SWIFT_MOMENTUM effect with stacks property', () => {
      const effect = createEffect(EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      expect(effect).not.toBeNull()
      expect(effect.type).toBe('swift_momentum')
      expect(effect.value).toBe(5)
      expect(effect.duration).toBe(999)
      expect(effect.definition.maxStacks).toBe(6)
    })

    it('existing effects do not get stacks property from createEffect', () => {
      const effect = createEffect(EffectType.ATK_UP, { duration: 2, value: 20 })
      expect(effect.stacks).toBeUndefined()
    })
  })
})
```

### Step 2: Run tests to verify they fail

Run: `npx vitest run src/data/__tests__/statusEffects-stacking.test.js`
Expected: FAIL — `EffectType.SWIFT_MOMENTUM` is undefined

### Step 3: Write minimal implementation

In `src/data/statusEffects.js`:

Add to `EffectType` object:
```js
// Stacking effects
SWIFT_MOMENTUM: 'swift_momentum'
```

Add to `effectDefinitions`:
```js
[EffectType.SWIFT_MOMENTUM]: {
  name: 'Momentum',
  icon: '🏹',
  color: '#f59e0b',
  isBuff: true,
  stat: 'spd',
  maxStacks: 6
}
```

### Step 4: Run tests to verify they pass

Run: `npx vitest run src/data/__tests__/statusEffects-stacking.test.js`
Expected: PASS

### Step 5: Commit

```bash
git add src/data/statusEffects.js src/data/__tests__/statusEffects-stacking.test.js
git commit -m "feat: add SWIFT_MOMENTUM effect type with maxStacks property"
```

---

## Task 2: Stack System — applyEffect counter logic

**Files:**
- Modify: `src/stores/battle.js` (applyEffect function, ~line 422)
- Test: `src/stores/__tests__/battle-stacking.test.js`

### Step 1: Write the failing tests

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { EffectType, effectDefinitions } from '../../data/statusEffects'

describe('counter-based stacking in applyEffect', () => {
  let battleStore
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
  })

  function makeUnit() {
    return {
      instanceId: 'test_hero_1',
      templateId: 'swift_arrow',
      template: { name: 'Swift Arrow', classId: 'ranger' },
      currentHp: 100,
      maxHp: 100,
      stats: { hp: 100, atk: 42, def: 22, spd: 20 },
      statusEffects: []
    }
  }

  describe('first application', () => {
    it('creates effect with stacks: 1', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })

      expect(unit.statusEffects).toHaveLength(1)
      expect(unit.statusEffects[0].type).toBe('swift_momentum')
      expect(unit.statusEffects[0].stacks).toBe(1)
      expect(unit.statusEffects[0].value).toBe(5)
      expect(unit.statusEffects[0].duration).toBe(999)
    })
  })

  describe('subsequent applications', () => {
    it('increments stacks on second application', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })

      expect(unit.statusEffects).toHaveLength(1)
      expect(unit.statusEffects[0].stacks).toBe(2)
    })

    it('increments stacks up to maxStacks (6)', () => {
      const unit = makeUnit()
      for (let i = 0; i < 6; i++) {
        battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      }

      expect(unit.statusEffects).toHaveLength(1)
      expect(unit.statusEffects[0].stacks).toBe(6)
    })

    it('does not exceed maxStacks', () => {
      const unit = makeUnit()
      for (let i = 0; i < 10; i++) {
        battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      }

      expect(unit.statusEffects).toHaveLength(1)
      expect(unit.statusEffects[0].stacks).toBe(6)
    })
  })

  describe('duration refresh', () => {
    it('refreshes duration when adding a stack', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 3, value: 5 })

      // Simulate duration ticking down
      unit.statusEffects[0].duration = 1

      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 3, value: 5 })

      expect(unit.statusEffects[0].stacks).toBe(2)
      expect(unit.statusEffects[0].duration).toBe(3)
    })

    it('refreshes duration even at maxStacks', () => {
      const unit = makeUnit()
      for (let i = 0; i < 6; i++) {
        battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      }

      // Simulate duration ticking down
      unit.statusEffects[0].duration = 1

      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })

      expect(unit.statusEffects[0].stacks).toBe(6)
      expect(unit.statusEffects[0].duration).toBe(999)
    })
  })

  describe('value consistency', () => {
    it('preserves value per stack (does not take max)', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })

      // value stays at 5 (per-stack value), not 10
      expect(unit.statusEffects[0].value).toBe(5)
      expect(unit.statusEffects[0].stacks).toBe(2)
    })
  })

  describe('does not interfere with existing effect modes', () => {
    it('non-stackable effects still refresh duration and take higher value', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.ATK_UP, { duration: 2, value: 10 })
      battleStore.applyEffect(unit, EffectType.ATK_UP, { duration: 3, value: 20 })

      expect(unit.statusEffects).toHaveLength(1)
      expect(unit.statusEffects[0].value).toBe(20)
      expect(unit.statusEffects[0].duration).toBe(3)
      expect(unit.statusEffects[0].stacks).toBeUndefined()
    })

    it('old-style stackable effects (poison) still add separate instances', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.POISON, { duration: 3, value: 10 })
      battleStore.applyEffect(unit, EffectType.POISON, { duration: 3, value: 10 })

      expect(unit.statusEffects).toHaveLength(2)
      expect(unit.statusEffects[0].stacks).toBeUndefined()
      expect(unit.statusEffects[1].stacks).toBeUndefined()
    })
  })

  describe('cleanse removes all stacks', () => {
    it('removing the effect removes all stacks at once', () => {
      const unit = makeUnit()
      for (let i = 0; i < 4; i++) {
        battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      }

      expect(unit.statusEffects[0].stacks).toBe(4)

      // Remove the effect (simulating a cleanse)
      unit.statusEffects = unit.statusEffects.filter(e => e.type !== EffectType.SWIFT_MOMENTUM)

      expect(unit.statusEffects).toHaveLength(0)
    })
  })

  describe('debuff immunity does not block buff stacks', () => {
    it('SWIFT_MOMENTUM (a buff) is not blocked by DEBUFF_IMMUNE', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.DEBUFF_IMMUNE, { duration: 3 })
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })

      const momentum = unit.statusEffects.find(e => e.type === EffectType.SWIFT_MOMENTUM)
      expect(momentum).toBeDefined()
      expect(momentum.stacks).toBe(1)
    })
  })
})
```

### Step 2: Run tests to verify they fail

Run: `npx vitest run src/stores/__tests__/battle-stacking.test.js`
Expected: FAIL — applyEffect doesn't set `stacks` property

### Step 3: Write minimal implementation

In `src/stores/battle.js`, modify the `applyEffect` function. Insert the `maxStacks` branch **after** the debuff immunity check and effect creation (after line 445 `newEffect.fromAllySkill = fromAllySkill`), **before** the existing stacking logic (line 447):

```js
    // Counter-based stacking (maxStacks)
    if (definition.maxStacks) {
      const existingIndex = unit.statusEffects.findIndex(e => e.type === effectType)

      if (existingIndex !== -1) {
        unit.statusEffects = unit.statusEffects.map((effect, index) => {
          if (index === existingIndex) {
            return {
              ...effect,
              stacks: Math.min(effect.stacks + 1, definition.maxStacks),
              duration: Math.max(effect.duration, duration)
            }
          }
          return effect
        })
      } else {
        newEffect.stacks = 1
        unit.statusEffects = [...unit.statusEffects, newEffect]
      }

      const unitName = unit.template?.name || 'Unknown'
      addLog(`${unitName} gains ${definition.name}!`)
      return
    }
```

The `return` at the end prevents falling through to the existing stacking/refresh logic.

### Step 4: Run tests to verify they pass

Run: `npx vitest run src/stores/__tests__/battle-stacking.test.js`
Expected: PASS

### Step 5: Run all existing tests to verify no regressions

Run: `npx vitest run`
Expected: All existing tests PASS

### Step 6: Commit

```bash
git add src/stores/battle.js src/stores/__tests__/battle-stacking.test.js
git commit -m "feat: implement counter-based stacking in applyEffect"
```

---

## Task 3: Stack System — getEffectiveStat reads stacks

**Files:**
- Modify: `src/stores/battle.js` (getEffectiveStat function, ~line 369)
- Test: `src/stores/__tests__/battle-stacking.test.js` (append to existing file)

### Step 1: Write the failing tests

Append to `src/stores/__tests__/battle-stacking.test.js`:

```js
  describe('getEffectiveStat with stacks', () => {
    it('multiplies value by stacks for stat calculation', () => {
      const unit = makeUnit()
      // Apply 3 stacks of +5% SPD
      for (let i = 0; i < 3; i++) {
        battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      }

      // Effective SPD = 20 * (1 + 15/100) = 23
      const effectiveSpd = battleStore.getEffectiveStat(unit, 'spd')
      expect(effectiveSpd).toBe(23)
    })

    it('1 stack applies value once', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })

      // Effective SPD = 20 * (1 + 5/100) = 21
      const effectiveSpd = battleStore.getEffectiveStat(unit, 'spd')
      expect(effectiveSpd).toBe(21)
    })

    it('maxStacks (6) applies full value', () => {
      const unit = makeUnit()
      for (let i = 0; i < 6; i++) {
        battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      }

      // Effective SPD = 20 * (1 + 30/100) = 26
      const effectiveSpd = battleStore.getEffectiveStat(unit, 'spd')
      expect(effectiveSpd).toBe(26)
    })

    it('non-stacked effects still work normally (no stacks property)', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.SPD_UP, { duration: 2, value: 20 })

      // Effective SPD = 20 * (1 + 20/100) = 24
      const effectiveSpd = battleStore.getEffectiveStat(unit, 'spd')
      expect(effectiveSpd).toBe(24)
    })

    it('stacked effect coexists with regular stat buffs', () => {
      const unit = makeUnit()
      // Regular SPD_UP +20%
      battleStore.applyEffect(unit, EffectType.SPD_UP, { duration: 2, value: 20 })
      // 3 stacks of momentum +5% each = +15%
      for (let i = 0; i < 3; i++) {
        battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      }

      // Effective SPD = 20 * (1 + (20 + 15) / 100) = 20 * 1.35 = 27
      const effectiveSpd = battleStore.getEffectiveStat(unit, 'spd')
      expect(effectiveSpd).toBe(27)
    })
  })
```

### Step 2: Run tests to verify they fail

Run: `npx vitest run src/stores/__tests__/battle-stacking.test.js`
Expected: FAIL — `getEffectiveStat` adds `value` once, not `value * stacks`

### Step 3: Write minimal implementation

In `src/stores/battle.js`, modify `getEffectiveStat` (~line 377-381):

Change:
```js
      if (effect.type.includes('_up')) {
        modifier += effect.value
      } else if (effect.type.includes('_down')) {
        modifier -= effect.value
      }
```

To:
```js
      if (effect.type.includes('_up')) {
        modifier += effect.value * (effect.stacks || 1)
      } else if (effect.type.includes('_down')) {
        modifier -= effect.value * (effect.stacks || 1)
      }
```

### Step 4: Run tests to verify they pass

Run: `npx vitest run src/stores/__tests__/battle-stacking.test.js`
Expected: PASS

### Step 5: Run all existing tests

Run: `npx vitest run`
Expected: All PASS (fallback `|| 1` ensures no regression)

### Step 6: Commit

```bash
git add src/stores/battle.js src/stores/__tests__/battle-stacking.test.js
git commit -m "feat: getEffectiveStat multiplies value by stacks"
```

---

## Task 4: Stack System — getStacks helper

**Files:**
- Modify: `src/stores/battle.js` (add function + export)
- Test: `src/stores/__tests__/battle-stacking.test.js` (append)

### Step 1: Write the failing tests

Append to `src/stores/__tests__/battle-stacking.test.js`:

```js
  describe('getStacks helper', () => {
    it('returns 0 when unit has no effects', () => {
      const unit = makeUnit()
      expect(battleStore.getStacks(unit, EffectType.SWIFT_MOMENTUM)).toBe(0)
    })

    it('returns 0 for a non-stacked effect type', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.ATK_UP, { duration: 2, value: 20 })
      expect(battleStore.getStacks(unit, EffectType.ATK_UP)).toBe(0)
    })

    it('returns current stack count', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      expect(battleStore.getStacks(unit, EffectType.SWIFT_MOMENTUM)).toBe(1)

      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      expect(battleStore.getStacks(unit, EffectType.SWIFT_MOMENTUM)).toBe(2)
    })

    it('returns 0 after effect is removed', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      unit.statusEffects = unit.statusEffects.filter(e => e.type !== EffectType.SWIFT_MOMENTUM)
      expect(battleStore.getStacks(unit, EffectType.SWIFT_MOMENTUM)).toBe(0)
    })
  })
```

### Step 2: Run tests to verify they fail

Run: `npx vitest run src/stores/__tests__/battle-stacking.test.js`
Expected: FAIL — `battleStore.getStacks is not a function`

### Step 3: Write minimal implementation

In `src/stores/battle.js`, add near the other helpers (near `hasEffect`):

```js
  function getStacks(unit, effectType) {
    const effect = (unit.statusEffects || []).find(e => e.type === effectType)
    return effect?.stacks || 0
  }
```

Add `getStacks` to the store's return object (in the return block where `hasEffect` is exported).

### Step 4: Run tests to verify they pass

Run: `npx vitest run src/stores/__tests__/battle-stacking.test.js`
Expected: PASS

### Step 5: Commit

```bash
git add src/stores/battle.js src/stores/__tests__/battle-stacking.test.js
git commit -m "feat: add getStacks helper to battle store"
```

---

## Task 5: Stack System — UI stack count badge

**Files:**
- Modify: `src/components/HeroCard.vue` (~lines 208-220, 380-413)
- Modify: `src/components/EnemyCard.vue` (~lines 72-84, 176-209)
- Modify: `src/components/HeroDetailSheet.vue` (~lines 107-139)
- Modify: `src/components/EnemyDetailSheet.vue` (~lines 65-92)
- Modify: `src/screens/BattleScreen.vue` (~lines 1912-1930)

No test file for this task — it's pure template/CSS changes.

### Step 1: HeroCard.vue — Add stack badge

In the effect badge template (~line 217-218), add stack count display:

Change:
```vue
        <span class="effect-icon">{{ effect.definition?.icon }}</span>
        <span v-if="effect.duration <= 99" class="effect-duration">{{ effect.duration }}</span>
```

To:
```vue
        <span class="effect-icon">{{ effect.definition?.icon }}</span>
        <span v-if="effect.stacks" class="effect-stacks">{{ effect.stacks }}</span>
        <span v-else-if="effect.duration <= 99" class="effect-duration">{{ effect.duration }}</span>
```

Add CSS for `.effect-stacks`:
```css
.effect-stacks {
  color: #fbbf24;
  font-size: 0.65rem;
  font-weight: 700;
}
```

### Step 2: EnemyCard.vue — Same change

Apply identical template and CSS changes as HeroCard.vue.

### Step 3: HeroDetailSheet.vue — Show stacks in description

In `getEffectDescription` function (~line 111), after `let desc = def.name`, add:

```js
  // Add stack count for counter-stacked effects
  if (effect.stacks) {
    desc += ` x${effect.stacks}`
  }
```

### Step 4: EnemyDetailSheet.vue — Same change

Apply identical `getEffectDescription` change.

### Step 5: BattleScreen.vue — Show stacks in inspection panel

In the inspection panel effect display (~line 1921-1923), add stack count:

Change:
```vue
              <span class="effect-icon">{{ effect.definition?.icon }}</span>
              <span class="effect-name">{{ effect.definition?.name }}</span>
              <span class="effect-duration">{{ effect.duration }} turns</span>
```

To:
```vue
              <span class="effect-icon">{{ effect.definition?.icon }}</span>
              <span class="effect-name">{{ effect.definition?.name }}<span v-if="effect.stacks"> x{{ effect.stacks }}</span></span>
              <span class="effect-duration">{{ effect.duration > 99 ? '' : `${effect.duration} turns` }}</span>
```

### Step 6: Run all tests to check for regressions

Run: `npx vitest run`
Expected: All PASS

### Step 7: Commit

```bash
git add src/components/HeroCard.vue src/components/EnemyCard.vue src/components/HeroDetailSheet.vue src/components/EnemyDetailSheet.vue src/screens/BattleScreen.vue
git commit -m "feat: display stack count badge on stacked effects"
```

---

## Task 6: Swift Arrow — Hero data redesign

**Files:**
- Modify: `src/data/heroes/4star/swift_arrow.js`
- Test: `src/data/heroes/__tests__/swift_arrow_redesign.test.js`

### Step 1: Write the failing tests

```js
import { describe, it, expect } from 'vitest'
import { swift_arrow } from '../4star/swift_arrow'
import { EffectType } from '../../statusEffects'

describe('Swift Arrow redesign — Tempo Archer', () => {
  it('has correct base identity', () => {
    expect(swift_arrow.id).toBe('swift_arrow')
    expect(swift_arrow.name).toBe('Swift Arrow')
    expect(swift_arrow.rarity).toBe(4)
    expect(swift_arrow.classId).toBe('ranger')
    expect(swift_arrow.epithet).toBe('The Skirmisher')
  })

  it('has unchanged base stats', () => {
    expect(swift_arrow.baseStats).toEqual({ hp: 90, atk: 42, def: 22, spd: 20, mp: 55 })
  })

  it('has exactly 5 skills', () => {
    expect(swift_arrow.skills).toHaveLength(5)
  })

  describe('Skill 1: Quick Shot', () => {
    it('has correct properties', () => {
      const skill = swift_arrow.skills[0]
      expect(skill.name).toBe('Quick Shot')
      expect(skill.skillUnlockLevel).toBe(1)
      expect(skill.targetType).toBe('enemy')
      expect(skill.damagePercent).toBe(90)
    })

    it('applies SPD_DOWN to target', () => {
      const skill = swift_arrow.skills[0]
      expect(skill.effects).toHaveLength(1)
      expect(skill.effects[0].type).toBe(EffectType.SPD_DOWN)
      expect(skill.effects[0].target).toBe('enemy')
      expect(skill.effects[0].duration).toBe(2)
      expect(skill.effects[0].value).toBe(15)
    })
  })

  describe('Skill 2: Pinning Volley', () => {
    it('has correct properties', () => {
      const skill = swift_arrow.skills[1]
      expect(skill.name).toBe('Pinning Volley')
      expect(skill.skillUnlockLevel).toBe(1)
      expect(skill.targetType).toBe('all_enemies')
      expect(skill.damagePercent).toBe(60)
    })

    it('conditionally applies DEF_DOWN to debuffed enemies', () => {
      const skill = swift_arrow.skills[1]
      expect(skill.conditionalEffects).toBeDefined()
      expect(skill.conditionalEffects[0].condition).toBe('target_has_debuff')
      expect(skill.conditionalEffects[0].type).toBe(EffectType.DEF_DOWN)
      expect(skill.conditionalEffects[0].target).toBe('enemy')
      expect(skill.conditionalEffects[0].duration).toBe(2)
      expect(skill.conditionalEffects[0].value).toBe(15)
    })
  })

  describe('Skill 3: Nimble Reposition', () => {
    it('has correct properties', () => {
      const skill = swift_arrow.skills[2]
      expect(skill.name).toBe('Nimble Reposition')
      expect(skill.skillUnlockLevel).toBe(3)
      expect(skill.targetType).toBe('self')
      expect(skill.noDamage).toBe(true)
    })

    it('grants DEBUFF_IMMUNE and SPD_UP', () => {
      const skill = swift_arrow.skills[2]
      expect(skill.effects).toHaveLength(2)

      const debuffImmune = skill.effects.find(e => e.type === EffectType.DEBUFF_IMMUNE)
      expect(debuffImmune).toBeDefined()
      expect(debuffImmune.duration).toBe(1)

      const spdUp = skill.effects.find(e => e.type === EffectType.SPD_UP)
      expect(spdUp).toBeDefined()
      expect(spdUp.value).toBe(20)
      expect(spdUp.duration).toBe(2)
    })
  })

  describe('Skill 4: Precision Strike', () => {
    it('has correct properties', () => {
      const skill = swift_arrow.skills[3]
      expect(skill.name).toBe('Precision Strike')
      expect(skill.skillUnlockLevel).toBe(6)
      expect(skill.targetType).toBe('enemy')
      expect(skill.damagePercent).toBe(140)
    })

    it('has DEF_DOWN bonus (ignore DEF)', () => {
      const skill = swift_arrow.skills[3]
      expect(skill.bonusIfTargetHas).toBeDefined()
      const defDownBonus = skill.bonusIfTargetHas.find(b => b.effectType === EffectType.DEF_DOWN)
      expect(defDownBonus).toBeDefined()
      expect(defDownBonus.ignoreDef).toBe(20)
    })

    it('has SPD_DOWN bonus (increased damage)', () => {
      const skill = swift_arrow.skills[3]
      const spdDownBonus = skill.bonusIfTargetHas.find(b => b.effectType === EffectType.SPD_DOWN)
      expect(spdDownBonus).toBeDefined()
      expect(spdDownBonus.damagePercent).toBe(180)
    })
  })

  describe('Skill 5: Flurry of Arrows', () => {
    it('has correct properties', () => {
      const skill = swift_arrow.skills[4]
      expect(skill.name).toBe('Flurry of Arrows')
      expect(skill.skillUnlockLevel).toBe(12)
      expect(skill.targetType).toBe('enemy')
      expect(skill.damagePercent).toBe(55)
      expect(skill.multiHit).toBe(3)
    })

    it('grants SWIFT_MOMENTUM stack on hit vs debuffed target', () => {
      const skill = swift_arrow.skills[4]
      expect(skill.onHitDebuffedTarget).toBeDefined()
      expect(skill.onHitDebuffedTarget.applyToSelf).toBeDefined()
      expect(skill.onHitDebuffedTarget.applyToSelf.type).toBe(EffectType.SWIFT_MOMENTUM)
      expect(skill.onHitDebuffedTarget.applyToSelf.value).toBe(5)
      expect(skill.onHitDebuffedTarget.applyToSelf.duration).toBe(999)
    })
  })

  it('does not use MARKED anywhere', () => {
    const allEffects = swift_arrow.skills.flatMap(s => [
      ...(s.effects || []),
      ...(s.conditionalEffects || [])
    ])
    const markedEffects = allEffects.filter(e => e.type === EffectType.MARKED)
    expect(markedEffects).toHaveLength(0)
  })

  it('does not use STEALTH or EVASION anywhere', () => {
    const allEffects = swift_arrow.skills.flatMap(s => [
      ...(s.effects || []),
      ...(s.conditionalEffects || [])
    ])
    const stealthEvasion = allEffects.filter(e =>
      e.type === EffectType.STEALTH || e.type === EffectType.EVASION
    )
    expect(stealthEvasion).toHaveLength(0)
  })
})
```

### Step 2: Run tests to verify they fail

Run: `npx vitest run src/data/heroes/__tests__/swift_arrow_redesign.test.js`
Expected: FAIL — current Swift Arrow has Volley, Hunter's Mark, etc.

### Step 3: Write minimal implementation

Replace `src/data/heroes/4star/swift_arrow.js`:

```js
import { EffectType } from '../../statusEffects.js'

export const swift_arrow = {
  id: 'swift_arrow',
  name: 'Swift Arrow',
  rarity: 4,
  classId: 'ranger',
  baseStats: { hp: 90, atk: 42, def: 22, spd: 20, mp: 55 },
  skills: [
    {
      name: 'Quick Shot',
      description: 'Deal 90% ATK damage to one enemy. Applies SPD Down for 2 turns.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 90,
      effects: [
        {
          type: EffectType.SPD_DOWN,
          target: 'enemy',
          duration: 2,
          value: 15
        }
      ]
    },
    {
      name: 'Pinning Volley',
      description: 'Deal 60% ATK damage to all enemies. Enemies already suffering a debuff also receive DEF Down for 2 turns.',
      skillUnlockLevel: 1,
      targetType: 'all_enemies',
      damagePercent: 60,
      conditionalEffects: [
        {
          condition: 'target_has_debuff',
          type: EffectType.DEF_DOWN,
          target: 'enemy',
          duration: 2,
          value: 15
        }
      ]
    },
    {
      name: 'Nimble Reposition',
      description: 'Become immune to debuffs for 1 turn and gain 20% SPD for 2 turns.',
      skillUnlockLevel: 3,
      targetType: 'self',
      noDamage: true,
      effects: [
        {
          type: EffectType.DEBUFF_IMMUNE,
          target: 'self',
          duration: 1
        },
        {
          type: EffectType.SPD_UP,
          target: 'self',
          duration: 2,
          value: 20
        }
      ]
    },
    {
      name: 'Precision Strike',
      description: 'Deal 140% ATK damage to one enemy. If target has DEF Down, ignore an additional 20% DEF. If target has SPD Down, deal 180% ATK instead.',
      skillUnlockLevel: 6,
      targetType: 'enemy',
      damagePercent: 140,
      bonusIfTargetHas: [
        {
          effectType: EffectType.DEF_DOWN,
          ignoreDef: 20
        },
        {
          effectType: EffectType.SPD_DOWN,
          damagePercent: 180
        }
      ]
    },
    {
      name: 'Flurry of Arrows',
      description: 'Deal 55% ATK damage three times to one enemy. Each hit against a debuffed target grants a stack of Momentum (+5% SPD, max 6 stacks).',
      skillUnlockLevel: 12,
      targetType: 'enemy',
      damagePercent: 55,
      multiHit: 3,
      onHitDebuffedTarget: {
        applyToSelf: {
          type: EffectType.SWIFT_MOMENTUM,
          value: 5,
          duration: 999
        }
      }
    }
  ],
  epithet: 'The Skirmisher',
  introQuote: 'Can\'t talk here. I need to focus.',
  lore: 'Exiled from the Verdant Court for a transgression she refuses to name, Swift Arrow wanders the lowlands picking off threats that most people never see coming. She speaks little, eats less, and has never once missed a shot she intended to land.'
}
```

### Step 4: Run tests to verify they pass

Run: `npx vitest run src/data/heroes/__tests__/swift_arrow_redesign.test.js`
Expected: PASS

### Step 5: Run all tests to check for regressions

Run: `npx vitest run`
Expected: Check if any existing Swift Arrow tests break — fix or update as needed.

### Step 6: Commit

```bash
git add src/data/heroes/4star/swift_arrow.js src/data/heroes/__tests__/swift_arrow_redesign.test.js
git commit -m "feat: redesign Swift Arrow as Tempo Archer with Momentum stacking"
```

---

## Task 7: Verify everything

### Step 1: Run full test suite

Run: `npx vitest run`
Expected: All tests PASS with zero warnings

### Step 2: Commit any final fixes

If any tests needed updating, commit them now.
