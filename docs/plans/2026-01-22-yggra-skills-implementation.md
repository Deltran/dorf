# Yggra Skills Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand Yggra from a single-skill healer to a full 5-star druid with healing, poison, thorns, lifesteal damage, and death prevention.

**Architecture:** Add two new mechanics to battle.js (healAlliesPercent for lifesteal damage, DEATH_PREVENTION for cheat-death), add the new effect type to statusEffects.js, then update Yggra's template from `skill` to `skills` array with 5 abilities.

**Tech Stack:** Vue 3, Pinia stores, Vitest

---

## Task 1: Add DEATH_PREVENTION Effect Type

**Files:**
- Modify: `src/data/statusEffects.js`
- Test: `src/data/__tests__/statusEffects.test.js`

**Step 1: Write the failing test**

Create `src/data/__tests__/statusEffects.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { EffectType, effectDefinitions } from '../statusEffects'

describe('statusEffects', () => {
  describe('DEATH_PREVENTION', () => {
    it('exists in EffectType', () => {
      expect(EffectType.DEATH_PREVENTION).toBe('death_prevention')
    })

    it('has correct effect definition', () => {
      const def = effectDefinitions[EffectType.DEATH_PREVENTION]
      expect(def).toBeDefined()
      expect(def.name).toBe('Protected')
      expect(def.isBuff).toBe(true)
      expect(def.isDeathPrevention).toBe(true)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `/usr/local/bin/npx vitest run src/data/__tests__/statusEffects.test.js`
Expected: FAIL - EffectType.DEATH_PREVENTION is undefined

**Step 3: Add DEATH_PREVENTION to EffectType enum**

In `src/data/statusEffects.js`, add to the EffectType object after MARKED:

```js
  // Protection from death
  DEATH_PREVENTION: 'death_prevention'
```

**Step 4: Add DEATH_PREVENTION to effectDefinitions**

In `src/data/statusEffects.js`, add to effectDefinitions after MARKED:

```js
  [EffectType.DEATH_PREVENTION]: {
    name: 'Protected',
    icon: '🌳',
    color: '#22c55e',
    isBuff: true,
    isDeathPrevention: true,
    stackable: false
  }
```

**Step 5: Run test to verify it passes**

Run: `/usr/local/bin/npx vitest run src/data/__tests__/statusEffects.test.js`
Expected: PASS

**Step 6: Commit**

```bash
git add src/data/statusEffects.js src/data/__tests__/statusEffects.test.js
git commit -m "feat: add DEATH_PREVENTION status effect type"
```

---

## Task 2: Implement Death Prevention Mechanic

**Files:**
- Modify: `src/stores/battle.js`
- Test: `src/stores/__tests__/battle-death-prevention.test.js`

**Step 1: Write the failing test**

Create `src/stores/__tests__/battle-death-prevention.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('battle store - death prevention', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('checkDeathPrevention', () => {
    it('returns false when unit has no DEATH_PREVENTION effect', () => {
      const unit = { currentHp: 10, statusEffects: [] }
      expect(store.checkDeathPrevention(unit, 50)).toBe(false)
    })

    it('returns false when damage would not kill unit', () => {
      const unit = {
        currentHp: 100,
        statusEffects: [{ type: EffectType.DEATH_PREVENTION, duration: 2, healOnTrigger: 50 }]
      }
      expect(store.checkDeathPrevention(unit, 50)).toBe(false)
    })

    it('returns true and prevents death when damage would kill unit with DEATH_PREVENTION', () => {
      const unit = {
        currentHp: 30,
        maxHp: 100,
        statusEffects: [{ type: EffectType.DEATH_PREVENTION, duration: 2, healOnTrigger: 50, casterAtk: 40 }]
      }
      const result = store.checkDeathPrevention(unit, 50)
      expect(result).toBe(true)
      expect(unit.currentHp).toBe(21) // 1 HP + 50% of 40 ATK = 1 + 20 = 21
    })

    it('removes DEATH_PREVENTION effect after triggering', () => {
      const unit = {
        currentHp: 30,
        maxHp: 100,
        statusEffects: [{ type: EffectType.DEATH_PREVENTION, duration: 2, healOnTrigger: 50, casterAtk: 40 }]
      }
      store.checkDeathPrevention(unit, 50)
      expect(unit.statusEffects.find(e => e.type === EffectType.DEATH_PREVENTION)).toBeUndefined()
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `/usr/local/bin/npx vitest run src/stores/__tests__/battle-death-prevention.test.js`
Expected: FAIL - checkDeathPrevention is not a function

**Step 3: Implement checkDeathPrevention function**

In `src/stores/battle.js`, add this function (near other helper functions like `hasEffect`):

```js
  function checkDeathPrevention(unit, incomingDamage) {
    if (!unit.statusEffects) return false

    const deathPreventionEffect = unit.statusEffects.find(
      e => e.type === EffectType.DEATH_PREVENTION
    )

    if (!deathPreventionEffect) return false

    // Only trigger if damage would kill
    if (unit.currentHp - incomingDamage > 0) return false

    // Prevent death: set HP to 1
    unit.currentHp = 1

    // Heal based on caster's ATK
    if (deathPreventionEffect.healOnTrigger && deathPreventionEffect.casterAtk) {
      const healAmount = Math.floor(deathPreventionEffect.casterAtk * deathPreventionEffect.healOnTrigger / 100)
      unit.currentHp = Math.min(unit.maxHp, unit.currentHp + healAmount)
    }

    // Remove the effect (one-time use)
    unit.statusEffects = unit.statusEffects.filter(
      e => e.type !== EffectType.DEATH_PREVENTION
    )

    return true
  }
```

**Step 4: Export checkDeathPrevention in the store return**

Add `checkDeathPrevention` to the return object of useBattleStore.

**Step 5: Run test to verify it passes**

Run: `/usr/local/bin/npx vitest run src/stores/__tests__/battle-death-prevention.test.js`
Expected: PASS

**Step 6: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-death-prevention.test.js
git commit -m "feat: add checkDeathPrevention mechanic"
```

---

## Task 3: Integrate Death Prevention into applyDamage

**Files:**
- Modify: `src/stores/battle.js`
- Test: `src/stores/__tests__/battle-death-prevention.test.js`

**Step 1: Write the integration test**

Add to `src/stores/__tests__/battle-death-prevention.test.js`:

```js
  describe('applyDamage integration', () => {
    it('calls checkDeathPrevention before applying lethal damage', () => {
      const unit = {
        currentHp: 30,
        maxHp: 100,
        statusEffects: [{ type: EffectType.DEATH_PREVENTION, duration: 2, healOnTrigger: 50, casterAtk: 40 }]
      }

      // applyDamage should check death prevention
      store.applyDamage(unit, 50, 'attack')

      // Unit should survive with healed HP
      expect(unit.currentHp).toBe(21)
    })
  })
```

**Step 2: Run test to verify it fails**

Run: `/usr/local/bin/npx vitest run src/stores/__tests__/battle-death-prevention.test.js`
Expected: FAIL - unit dies instead of being protected

**Step 3: Modify applyDamage to check death prevention**

In `src/stores/battle.js`, find the `applyDamage` function. At the start, before reducing HP, add:

```js
  function applyDamage(unit, damage, source, attacker = null) {
    // Check death prevention before applying lethal damage
    if (unit.currentHp - damage <= 0) {
      if (checkDeathPrevention(unit, damage)) {
        const unitName = unit.template?.name || 'Unit'
        addLog(`${unitName} is protected from death by World Root's Embrace!`)
        emitCombatEffect(unit.instanceId || unit.id, unit.instanceId ? 'hero' : 'enemy', 'heal', 0)
        return // Damage was prevented
      }
    }

    // ... rest of existing applyDamage logic
```

**Step 4: Run test to verify it passes**

Run: `/usr/local/bin/npx vitest run src/stores/__tests__/battle-death-prevention.test.js`
Expected: PASS

**Step 5: Run all tests to verify no regressions**

Run: `/usr/local/bin/npx vitest run`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-death-prevention.test.js
git commit -m "feat: integrate death prevention into applyDamage"
```

---

## Task 4: Implement healAlliesPercent Mechanic

**Files:**
- Modify: `src/stores/battle.js`
- Test: `src/stores/__tests__/battle-lifesteal.test.js`

**Step 1: Write the failing test**

Create `src/stores/__tests__/battle-lifesteal.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('battle store - healAlliesPercent', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('healAlliesFromDamage', () => {
    it('heals all allies for percentage of damage dealt', () => {
      const allies = [
        { instanceId: 1, currentHp: 50, maxHp: 100 },
        { instanceId: 2, currentHp: 60, maxHp: 100 }
      ]

      // 200 damage dealt, 35% heal = 70 HP to each ally
      store.healAlliesFromDamage(allies, 200, 35)

      expect(allies[0].currentHp).toBe(100) // capped at max
      expect(allies[1].currentHp).toBe(100) // 60 + 70 = 130, capped at 100
    })

    it('does not overheal past maxHp', () => {
      const allies = [
        { instanceId: 1, currentHp: 95, maxHp: 100 }
      ]

      store.healAlliesFromDamage(allies, 200, 35)

      expect(allies[0].currentHp).toBe(100)
    })

    it('handles zero damage', () => {
      const allies = [
        { instanceId: 1, currentHp: 50, maxHp: 100 }
      ]

      store.healAlliesFromDamage(allies, 0, 35)

      expect(allies[0].currentHp).toBe(50)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `/usr/local/bin/npx vitest run src/stores/__tests__/battle-lifesteal.test.js`
Expected: FAIL - healAlliesFromDamage is not a function

**Step 3: Implement healAlliesFromDamage function**

In `src/stores/battle.js`, add:

```js
  function healAlliesFromDamage(allies, damageDealt, healPercent) {
    if (damageDealt <= 0 || healPercent <= 0) return

    const healAmount = Math.floor(damageDealt * healPercent / 100)
    if (healAmount <= 0) return

    for (const ally of allies) {
      const oldHp = ally.currentHp
      ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmount)
      const actualHeal = ally.currentHp - oldHp
      if (actualHeal > 0) {
        emitCombatEffect(ally.instanceId, 'hero', 'heal', actualHeal)
      }
    }
  }
```

**Step 4: Export healAlliesFromDamage in the store return**

Add `healAlliesFromDamage` to the return object of useBattleStore.

**Step 5: Run test to verify it passes**

Run: `/usr/local/bin/npx vitest run src/stores/__tests__/battle-lifesteal.test.js`
Expected: PASS

**Step 6: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-lifesteal.test.js
git commit -m "feat: add healAlliesFromDamage mechanic"
```

---

## Task 5: Integrate healAlliesPercent into Skill Execution

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Find the enemy targetType case in processHeroSkillExecution**

Look for `case 'enemy':` in the skill execution switch statement.

**Step 2: Add healAlliesPercent check after damage is dealt**

After the damage is applied and before the `break`, add:

```js
          // Heal all allies for percentage of damage dealt (Nature's Reclamation)
          if (skill.healAlliesPercent && damage > 0) {
            healAlliesFromDamage(aliveHeroes.value, damage, skill.healAlliesPercent)
            addLog(`All allies are healed from the life force reclaimed!`)
          }
```

**Step 3: Run all tests**

Run: `/usr/local/bin/npx vitest run`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat: integrate healAlliesPercent into skill execution"
```

---

## Task 6: Update Yggra's Hero Template

**Files:**
- Modify: `src/data/heroTemplates.js`
- Test: `src/data/__tests__/heroTemplates-yggra.test.js`

**Step 1: Write the test**

Create `src/data/__tests__/heroTemplates-yggra.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { heroTemplates } from '../heroTemplates'
import { EffectType } from '../statusEffects'

describe('Yggra hero template', () => {
  const yggra = heroTemplates.yggra_world_root

  it('has 5 skills', () => {
    expect(yggra.skills).toHaveLength(5)
  })

  describe('Blessing of the World Root', () => {
    const skill = yggra.skills.find(s => s.name === 'Blessing of the World Root')

    it('exists and targets all allies', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('all_allies')
    })

    it('heals for 75% ATK', () => {
      expect(skill.description).toContain('75%')
    })

    it('costs 19 MP and unlocks at level 1', () => {
      expect(skill.mpCost).toBe(19)
      expect(skill.skillUnlockLevel).toBe(1)
    })
  })

  describe('Grasping Roots', () => {
    const skill = yggra.skills.find(s => s.name === 'Grasping Roots')

    it('exists and applies poison', () => {
      expect(skill).toBeDefined()
      expect(skill.effects[0].type).toBe(EffectType.POISON)
    })

    it('poisons for 50% ATK for 2 turns', () => {
      expect(skill.effects[0].atkPercent).toBe(50)
      expect(skill.effects[0].duration).toBe(2)
    })

    it('costs 15 MP and unlocks at level 1', () => {
      expect(skill.mpCost).toBe(15)
      expect(skill.skillUnlockLevel).toBe(1)
    })
  })

  describe('Bark Shield', () => {
    const skill = yggra.skills.find(s => s.name === 'Bark Shield')

    it('exists and targets ally', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('ally')
    })

    it('heals for 50% ATK', () => {
      expect(skill.description).toContain('50% ATK')
    })

    it('grants 50% thorns for 3 turns', () => {
      const thornsEffect = skill.effects.find(e => e.type === EffectType.THORNS)
      expect(thornsEffect).toBeDefined()
      expect(thornsEffect.value).toBe(50)
      expect(thornsEffect.duration).toBe(3)
    })

    it('costs 18 MP and unlocks at level 3', () => {
      expect(skill.mpCost).toBe(18)
      expect(skill.skillUnlockLevel).toBe(3)
    })
  })

  describe("Nature's Reclamation", () => {
    const skill = yggra.skills.find(s => s.name === "Nature's Reclamation")

    it('exists and targets enemy', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('enemy')
    })

    it('deals 200% ATK damage', () => {
      expect(skill.description).toContain('200%')
    })

    it('heals allies for 35% of damage dealt', () => {
      expect(skill.healAlliesPercent).toBe(35)
    })

    it('costs 28 MP and unlocks at level 6', () => {
      expect(skill.mpCost).toBe(28)
      expect(skill.skillUnlockLevel).toBe(6)
    })
  })

  describe("World Root's Embrace", () => {
    const skill = yggra.skills.find(s => s.name === "World Root's Embrace")

    it('exists and targets all allies', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('all_allies')
    })

    it('applies DEATH_PREVENTION effect', () => {
      const effect = skill.effects.find(e => e.type === EffectType.DEATH_PREVENTION)
      expect(effect).toBeDefined()
      expect(effect.duration).toBe(2)
      expect(effect.healOnTrigger).toBe(50)
    })

    it('costs 35 MP and unlocks at level 12', () => {
      expect(skill.mpCost).toBe(35)
      expect(skill.skillUnlockLevel).toBe(12)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `/usr/local/bin/npx vitest run src/data/__tests__/heroTemplates-yggra.test.js`
Expected: FAIL - yggra.skills is undefined (currently has single `skill`)

**Step 3: Update Yggra's template**

In `src/data/heroTemplates.js`, replace Yggra's definition:

```js
  yggra_world_root: {
    id: 'yggra_world_root',
    name: 'Yggra, the World Root',
    rarity: 5,
    classId: 'druid',
    baseStats: { hp: 120, atk: 40, def: 35, spd: 10, mp: 75 },
    skills: [
      {
        name: 'Blessing of the World Root',
        description: 'Channel the life force of the world tree to restore all allies for 75% ATK',
        mpCost: 19,
        skillUnlockLevel: 1,
        targetType: 'all_allies'
      },
      {
        name: 'Grasping Roots',
        description: 'Poison one enemy (50% ATK per turn for 2 turns)',
        mpCost: 15,
        skillUnlockLevel: 1,
        targetType: 'enemy',
        noDamage: true,
        effects: [
          { type: EffectType.POISON, target: 'enemy', duration: 2, atkPercent: 50 }
        ]
      },
      {
        name: 'Bark Shield',
        description: 'Heal one ally for 50% ATK and grant 50% thorns for 3 turns',
        mpCost: 18,
        skillUnlockLevel: 3,
        targetType: 'ally',
        effects: [
          { type: EffectType.THORNS, target: 'ally', duration: 3, value: 50 }
        ]
      },
      {
        name: "Nature's Reclamation",
        description: 'Deal 200% ATK damage to one enemy; heal all allies for 35% of damage dealt',
        mpCost: 28,
        skillUnlockLevel: 6,
        targetType: 'enemy',
        healAlliesPercent: 35
      },
      {
        name: "World Root's Embrace",
        description: 'Grant all allies death prevention for 2 turns; when triggered, heal saved ally for 50% ATK',
        mpCost: 35,
        skillUnlockLevel: 12,
        targetType: 'all_allies',
        noDamage: true,
        effects: [
          { type: EffectType.DEATH_PREVENTION, target: 'all_allies', duration: 2, healOnTrigger: 50 }
        ]
      }
    ],
    leaderSkill: {
      name: 'Ancient Awakening',
      description: "On round 1, all allies are healed for 10% of Yggra's ATK",
      effects: [
        {
          type: 'timed',
          triggerRound: 1,
          target: 'all_allies',
          apply: {
            effectType: 'heal',
            value: 10
          }
        }
      ]
    }
  },
```

**Step 4: Run test to verify it passes**

Run: `/usr/local/bin/npx vitest run src/data/__tests__/heroTemplates-yggra.test.js`
Expected: PASS

**Step 5: Run all tests**

Run: `/usr/local/bin/npx vitest run`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/data/heroTemplates.js src/data/__tests__/heroTemplates-yggra.test.js
git commit -m "feat: expand Yggra to full 5-skill druid kit"
```

---

## Task 7: Handle World Root's Embrace Effect Application

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Find effect application for all_allies skills**

In the `all_allies` case of skill execution, effects need to store the caster's ATK for `healOnTrigger` to work.

**Step 2: Modify effect application to pass casterAtk**

When applying DEATH_PREVENTION effects, include the caster's ATK:

```js
          // Apply effects to all allies
          if (skill.effects) {
            for (const effect of skill.effects) {
              if (effect.target === 'all_allies') {
                for (const target of aliveHeroes.value) {
                  const effectOptions = {
                    duration: effect.duration,
                    value: effect.value,
                    sourceId: hero.instanceId
                  }
                  // Pass caster ATK for death prevention heal
                  if (effect.type === EffectType.DEATH_PREVENTION) {
                    effectOptions.healOnTrigger = effect.healOnTrigger
                    effectOptions.casterAtk = effectiveAtk
                  }
                  applyEffect(target, effect.type, effectOptions)
                  emitCombatEffect(target.instanceId, 'hero', 'buff', 0)
                }
              }
            }
          }
```

**Step 3: Run all tests**

Run: `/usr/local/bin/npx vitest run`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/stores/battle.js
git commit -m "feat: pass casterAtk when applying DEATH_PREVENTION effect"
```

---

## Task 8: Final Integration Test

**Files:**
- Test: `src/stores/__tests__/battle-yggra-integration.test.js`

**Step 1: Write integration tests**

Create `src/stores/__tests__/battle-yggra-integration.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { heroTemplates } from '../../data/heroTemplates'

describe('Yggra skills integration', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  it('Yggra template has all required skills', () => {
    const yggra = heroTemplates.yggra_world_root
    expect(yggra.skills).toHaveLength(5)

    const skillNames = yggra.skills.map(s => s.name)
    expect(skillNames).toContain('Blessing of the World Root')
    expect(skillNames).toContain('Grasping Roots')
    expect(skillNames).toContain('Bark Shield')
    expect(skillNames).toContain("Nature's Reclamation")
    expect(skillNames).toContain("World Root's Embrace")
  })

  it("Nature's Reclamation has healAlliesPercent property", () => {
    const yggra = heroTemplates.yggra_world_root
    const skill = yggra.skills.find(s => s.name === "Nature's Reclamation")
    expect(skill.healAlliesPercent).toBe(35)
  })
})
```

**Step 2: Run integration test**

Run: `/usr/local/bin/npx vitest run src/stores/__tests__/battle-yggra-integration.test.js`
Expected: PASS

**Step 3: Run full test suite**

Run: `/usr/local/bin/npx vitest run`
Expected: All tests pass

**Step 4: Final commit**

```bash
git add src/stores/__tests__/battle-yggra-integration.test.js
git commit -m "test: add Yggra skills integration tests"
```

---

## Files Changed Summary

- `src/data/statusEffects.js` - Add DEATH_PREVENTION effect type
- `src/data/heroTemplates.js` - Update Yggra from single skill to 5-skill array
- `src/stores/battle.js` - Add checkDeathPrevention, healAlliesFromDamage, integrate into damage/skill execution
- `src/data/__tests__/statusEffects.test.js` - New test file
- `src/stores/__tests__/battle-death-prevention.test.js` - New test file
- `src/stores/__tests__/battle-lifesteal.test.js` - New test file
- `src/data/__tests__/heroTemplates-yggra.test.js` - New test file
- `src/stores/__tests__/battle-yggra-integration.test.js` - New test file
