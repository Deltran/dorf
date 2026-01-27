# Kensin Retaliation Knight Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign Kensin from a redundant Sir Gallan clone into a Retaliation Knight with a unique draw-fire / punish-damage / Valor-dump gameplay loop. Also rename from "Kensin, Squire" to "Kensin".

**Architecture:** Template data change (5 new skills), two battle.js mechanics changes (riposte DEF-check bypass, Valor consumption for finishers). All three changes are independently testable.

**Tech Stack:** Vue 3, Vitest, Pinia

**Design Reference:** `docs/plans/2026-01-27-kensin-retaliation-knight-design.md`

---

### Task 1: Write Kensin template test

**Files:**
- Create: `src/data/__tests__/heroTemplates-kensin.test.js`

**Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { heroTemplates } from '../heroTemplates'
import { EffectType } from '../statusEffects'

describe('Kensin hero template', () => {
  const kensin = heroTemplates.town_guard

  it('exists with correct identity', () => {
    expect(kensin).toBeDefined()
    expect(kensin.id).toBe('town_guard')
    expect(kensin.name).toBe('Kensin')
    expect(kensin.rarity).toBe(3)
    expect(kensin.classId).toBe('knight')
  })

  it('has unchanged base stats', () => {
    expect(kensin.baseStats).toEqual({ hp: 110, atk: 22, def: 35, spd: 8 })
  })

  it('has 5 skills', () => {
    expect(kensin.skills).toHaveLength(5)
  })

  describe('Stand and Fight', () => {
    const skill = kensin.skills.find(s => s.name === 'Stand and Fight')

    it('exists as a self-target taunt at Valor 25', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('self')
      expect(skill.valorRequired).toBe(25)
      expect(skill.skillUnlockLevel).toBe(1)
      expect(skill.noDamage).toBe(true)
    })

    it('applies TAUNT with Valor-scaled duration', () => {
      const taunt = skill.effects.find(e => e.type === EffectType.TAUNT)
      expect(taunt).toBeDefined()
      expect(taunt.duration).toEqual({ base: 2, at50: 3 })
    })

    it('applies DAMAGE_REDUCTION at 75 Valor', () => {
      const dr = skill.effects.find(e => e.type === EffectType.DAMAGE_REDUCTION)
      expect(dr).toBeDefined()
      expect(dr.value).toBe(15)
      expect(dr.valorThreshold).toBe(75)
    })
  })

  describe('Retribution', () => {
    const skill = kensin.skills.find(s => s.name === 'Retribution')

    it('exists as an enemy-target damage skill with no Valor requirement', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('enemy')
      expect(skill.valorRequired).toBe(0)
      expect(skill.skillUnlockLevel).toBe(1)
    })

    it('has Valor-scaled damage from 100% to 180%', () => {
      expect(skill.damage).toEqual({ base: 100, at25: 120, at50: 140, at75: 160, at100: 180 })
    })
  })

  describe('Reinforce', () => {
    const skill = kensin.skills.find(s => s.name === 'Reinforce')

    it('exists as an ally-target utility at Valor 50', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('ally')
      expect(skill.valorRequired).toBe(50)
      expect(skill.skillUnlockLevel).toBe(3)
      expect(skill.noDamage).toBe(true)
    })

    it('cleanses ATK/DEF debuffs with SPD at Valor 100', () => {
      expect(skill.cleanse.types).toEqual(['atk', 'def'])
      expect(skill.cleanse.at100Types).toEqual(['atk', 'def', 'spd'])
    })

    it('heals from DEF stat with Valor scaling', () => {
      expect(skill.healFromStat.stat).toBe('def')
      expect(skill.healFromStat.percent).toEqual({ base: 10, at75: 15 })
    })
  })

  describe('Riposte', () => {
    const skill = kensin.skills.find(s => s.name === 'Riposte')

    it('exists as a self-target buff at no Valor requirement', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('self')
      expect(skill.valorRequired).toBe(0)
      expect(skill.skillUnlockLevel).toBe(6)
      expect(skill.noDamage).toBe(true)
    })

    it('applies RIPOSTE with noDefCheck and Valor-scaled value/duration', () => {
      const riposte = skill.effects.find(e => e.type === EffectType.RIPOSTE)
      expect(riposte).toBeDefined()
      expect(riposte.noDefCheck).toBe(true)
      expect(riposte.value).toEqual({ base: 80, at50: 100 })
      expect(riposte.duration).toEqual({ base: 2, at75: 3 })
    })
  })

  describe('Judgment of Steel', () => {
    const skill = kensin.skills.find(s => s.name === 'Judgment of Steel')

    it('exists as an enemy-target finisher at Valor 50', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('enemy')
      expect(skill.valorRequired).toBe(50)
      expect(skill.skillUnlockLevel).toBe(12)
    })

    it('consumes all Valor with damage-per-Valor scaling', () => {
      expect(skill.valorCost).toBe('all')
      expect(skill.baseDamage).toBe(50)
      expect(skill.damagePerValor).toBe(2)
    })

    it('applies DEF debuff to target', () => {
      const debuff = skill.effects.find(e => e.type === EffectType.DEF_DOWN)
      expect(debuff).toBeDefined()
      expect(debuff.value).toBe(20)
      expect(debuff.duration).toBe(2)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/heroTemplates-kensin.test.js`
Expected: Most tests FAIL — name is wrong ("Kensin, Squire" vs "Kensin"), skills don't match.

---

### Task 2: Update Kensin template data

**Files:**
- Modify: `src/data/heroTemplates.js` (lines 498-568)

**Step 1: Replace Kensin's template**

Replace the entire `town_guard` object's `name` and `skills` array. Keep `id`, `rarity`, `classId`, and `baseStats` unchanged.

Change name from `'Kensin, Squire'` to `'Kensin'`.

Replace skills with:

```js
    skills: [
      {
        name: 'Stand and Fight',
        description: 'Taunt all enemies for 2 turns. At 50 Valor: 3 turns. At 75 Valor: also gain 15% damage reduction.',
        valorRequired: 25,
        targetType: 'self',
        skillUnlockLevel: 1,
        noDamage: true,
        defensive: true,
        effects: [
          { type: EffectType.TAUNT, target: 'self', duration: { base: 2, at50: 3 } },
          { type: EffectType.DAMAGE_REDUCTION, target: 'self', duration: { base: 2, at50: 3 }, value: 15, valorThreshold: 75 }
        ]
      },
      {
        name: 'Retribution',
        description: 'Deal damage to one enemy. Damage scales with Valor: 100% ATK base, up to 180% at max Valor.',
        valorRequired: 0,
        targetType: 'enemy',
        skillUnlockLevel: 1,
        damage: { base: 100, at25: 120, at50: 140, at75: 160, at100: 180 }
      },
      {
        name: 'Reinforce',
        description: 'Remove ATK/DEF debuffs from ally and heal 10% of your DEF as HP. At 75 Valor: 15% heal. At 100 Valor: also removes SPD debuffs.',
        valorRequired: 50,
        targetType: 'ally',
        skillUnlockLevel: 3,
        noDamage: true,
        defensive: true,
        cleanse: { types: ['atk', 'def'], at100Types: ['atk', 'def', 'spd'] },
        healFromStat: { stat: 'def', percent: { base: 10, at75: 15 } }
      },
      {
        name: 'Riposte',
        description: 'Gain Riposte for 2 turns: counter-attack for 80% ATK when hit. No DEF requirement. At 50 Valor: 100% ATK. At 75 Valor: 3 turns.',
        valorRequired: 0,
        targetType: 'self',
        skillUnlockLevel: 6,
        noDamage: true,
        defensive: true,
        effects: [
          { type: EffectType.RIPOSTE, target: 'self', duration: { base: 2, at75: 3 }, value: { base: 80, at50: 100 }, noDefCheck: true }
        ]
      },
      {
        name: 'Judgment of Steel',
        description: 'Consume ALL Valor. Deal 50% ATK + 2% per Valor consumed to one enemy. Apply 20% DEF debuff for 2 turns.',
        valorCost: 'all',
        valorRequired: 50,
        targetType: 'enemy',
        skillUnlockLevel: 12,
        baseDamage: 50,
        damagePerValor: 2,
        effects: [
          { type: EffectType.DEF_DOWN, target: 'enemy', duration: 2, value: 20 }
        ]
      }
    ]
```

**Step 2: Run Kensin template test**

Run: `npx vitest run src/data/__tests__/heroTemplates-kensin.test.js`
Expected: All tests PASS.

---

### Task 3: Write Riposte noDefCheck test

**Files:**
- Create: `src/stores/__tests__/battle-riposte.test.js`

**Step 1: Write the failing test**

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('battle store - Riposte', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('noDefCheck flag', () => {
    it('triggers riposte even when enemy DEF is higher than hero DEF', () => {
      // Kensin-style riposte: no DEF comparison
      const hero = {
        instanceId: 'kensin1',
        template: { name: 'Kensin' },
        currentHp: 100,
        maxHp: 110,
        stats: { hp: 110, atk: 22, def: 35, spd: 8 },
        statusEffects: [
          {
            type: EffectType.RIPOSTE,
            duration: 2,
            value: 80,
            noDefCheck: true,
            definition: { isRiposte: true }
          }
        ],
        leaderBonuses: {}
      }

      const enemy = {
        id: 'e1',
        template: { name: 'Iron Golem' },
        currentHp: 200,
        maxHp: 200,
        stats: { hp: 200, atk: 50, def: 80, spd: 10 },
        statusEffects: [],
        baseStats: { def: 80 }
      }

      // Enemy DEF (80) > Hero DEF (35) — old riposte would NOT trigger
      // With noDefCheck: true, riposte SHOULD trigger
      // Riposte damage = floor(22 * 80 / 100) = floor(17.6) = 17
      store.heroes = [hero]
      store.enemies = [enemy]

      // Call the riposte check function
      // We need to verify the riposte triggers by checking enemy HP after
      const result = store.checkRiposte(hero, enemy)
      expect(result).toBeDefined()
      expect(result.triggered).toBe(true)
      expect(result.damage).toBe(17)
    })

    it('still uses DEF comparison when noDefCheck is not set', () => {
      const hero = {
        instanceId: 'hero1',
        template: { name: 'Old Knight' },
        currentHp: 100,
        maxHp: 110,
        stats: { hp: 110, atk: 22, def: 35, spd: 8 },
        statusEffects: [
          {
            type: EffectType.RIPOSTE,
            duration: 2,
            value: 100,
            definition: { isRiposte: true }
          }
        ],
        leaderBonuses: {}
      }

      const enemy = {
        id: 'e1',
        template: { name: 'Iron Golem' },
        currentHp: 200,
        maxHp: 200,
        stats: { hp: 200, atk: 50, def: 80, spd: 10 },
        statusEffects: [],
        baseStats: { def: 80 }
      }

      // Enemy DEF (80) > Hero DEF (35) — no noDefCheck, should NOT trigger
      store.heroes = [hero]
      store.enemies = [enemy]

      const result = store.checkRiposte(hero, enemy)
      expect(result.triggered).toBe(false)
    })

    it('triggers old-style riposte when enemy DEF is lower', () => {
      const hero = {
        instanceId: 'hero1',
        template: { name: 'Old Knight' },
        currentHp: 100,
        maxHp: 110,
        stats: { hp: 110, atk: 22, def: 35, spd: 8 },
        statusEffects: [
          {
            type: EffectType.RIPOSTE,
            duration: 2,
            value: 100,
            definition: { isRiposte: true }
          }
        ],
        leaderBonuses: {}
      }

      const enemy = {
        id: 'e1',
        template: { name: 'Weak Goblin' },
        currentHp: 50,
        maxHp: 50,
        stats: { hp: 50, atk: 15, def: 10, spd: 12 },
        statusEffects: [],
        baseStats: { def: 10 }
      }

      // Enemy DEF (10) < Hero DEF (35) — old riposte triggers
      store.heroes = [hero]
      store.enemies = [enemy]

      const result = store.checkRiposte(hero, enemy)
      expect(result.triggered).toBe(true)
      expect(result.damage).toBe(22) // floor(22 * 100 / 100)
    })
  })
})
```

**Important note for implementer:** The riposte logic is currently inline in `battle.js` at lines 2826-2844, embedded inside the enemy attack flow. It is NOT exported as a standalone function. The implementer will need to either:
- (a) Extract the riposte check into a testable `checkRiposte(hero, enemy)` function that returns `{ triggered, damage }`, export it, and call it from the existing location, OR
- (b) Adjust the test approach to test via the full attack flow.

Option (a) is preferred — extracting a function makes the riposte logic testable and keeps the inline code clean.

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/stores/__tests__/battle-riposte.test.js`
Expected: FAIL — `store.checkRiposte is not a function`

---

### Task 4: Implement Riposte noDefCheck bypass

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Extract riposte check into a function**

Find the riposte logic at lines 2826-2844. Extract into a new function:

```js
  function checkRiposte(target, enemy) {
    const riposteEffect = target.statusEffects?.find(e => e.definition?.isRiposte)
    if (!riposteEffect || enemy.currentHp <= 0 || target.currentHp <= 0) {
      return { triggered: false, damage: 0 }
    }

    const targetDef = getEffectiveStat(target, 'def')
    const enemyDef = getEffectiveStat(enemy, 'def')

    if (riposteEffect.noDefCheck || enemyDef < targetDef) {
      const targetAtk = getEffectiveStat(target, 'atk')
      const riposteDamage = Math.floor(targetAtk * (riposteEffect.value || 100) / 100)
      return { triggered: true, damage: riposteDamage }
    }

    return { triggered: false, damage: 0 }
  }
```

Replace the inline riposte code (lines 2826-2844) with a call to `checkRiposte()` that applies the damage if triggered.

Export `checkRiposte` from the store's return object.

**Step 2: Run riposte tests**

Run: `npx vitest run src/stores/__tests__/battle-riposte.test.js`
Expected: All 3 tests PASS.

**Step 3: Run full test suite to check for regressions**

Run: `npx vitest run`
Expected: All tests PASS. The extracted function preserves existing behavior — old riposte skills without `noDefCheck` still check DEF.

---

### Task 5: Write Valor consumption test

**Files:**
- Create: `src/stores/__tests__/battle-valor-consume.test.js`

**Step 1: Write the failing test**

The implementer should:
1. First read `battle.js` to find how `rageCost: 'all'` is handled for Shadow King (search for `rageCost` in the skill execution flow).
2. Understand the pattern, then write tests for the equivalent `valorCost: 'all'` pattern.

The tests should cover:
- Skill with `valorCost: 'all'` consumes all Valor when used (Valor drops to 0).
- Damage is calculated as `baseDamage + (valorConsumed * damagePerValor)` — at 100 Valor: 50 + 200 = 250% ATK. At 50 Valor: 50 + 100 = 150% ATK.
- Skill is blocked if Valor is below `valorRequired` (50).

**Note:** The exact test structure depends on how the existing rage consumption is structured. The implementer must mirror that pattern for Valor. If rage consumption is inline in the attack flow (not an exported function), the implementer should extract a testable function like `resolveValorCost(hero, skill)` that returns `{ valorConsumed, damagePercent }`.

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/stores/__tests__/battle-valor-consume.test.js`
Expected: FAIL — function not found or Valor not consumed.

---

### Task 6: Implement Valor consumption

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Find the rageCost pattern**

Search `battle.js` for `rageCost` to find how Shadow King's `rageCost: 'all'` is handled. The pattern involves:
1. Before skill execution: check if skill has `rageCost: 'all'`
2. Record the current rage amount
3. Set rage to 0
4. Use the consumed amount in damage calculation with `damagePerRage`

**Step 2: Mirror for Valor**

In the same skill execution flow (likely near the `valorRequired` check at lines 1667-1672), add:

```js
// Handle Valor consumption (valorCost: 'all')
let valorConsumed = 0
if (isKnight(hero) && skill.valorCost === 'all') {
  valorConsumed = hero.currentValor || 0
  hero.currentValor = 0
  addLog(`${hero.template.name} consumes ${valorConsumed} Valor!`)
}
```

In the damage calculation flow, add handling for `baseDamage` + `damagePerValor`:

```js
// For Valor-consuming damage skills
if (skill.damagePerValor && valorConsumed > 0) {
  damagePercent = skill.baseDamage + (valorConsumed * skill.damagePerValor)
}
```

**Step 3: Export any new functions and run tests**

Run: `npx vitest run src/stores/__tests__/battle-valor-consume.test.js`
Expected: All tests PASS.

---

### Task 7: Run full suite and commit

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS.

**Step 2: Commit**

```bash
git add src/data/heroTemplates.js src/data/__tests__/heroTemplates-kensin.test.js src/stores/battle.js src/stores/__tests__/battle-riposte.test.js src/stores/__tests__/battle-valor-consume.test.js
git commit -m "$(cat <<'EOF'
feat: redesign Kensin as the Retaliation Knight

Rework Kensin from a redundant Sir Gallan clone into a unique knight
who punishes enemies for attacking. Rename "Kensin, Squire" to "Kensin".

New kit: Stand and Fight (taunt), Retribution (Valor-scaled damage),
Reinforce (cleanse+heal, unchanged), Riposte (no DEF check),
Judgment of Steel (consume Valor for burst + DEF debuff).

New mechanics:
- Riposte noDefCheck flag: bypasses DEF comparison for retaliation kit
- valorCost: 'all': consumes Valor for damage scaling (mirrors rageCost)

Knight archetype split:
- Sir Gallan (4★): prevents damage (shields, DR, immunity)
- Kensin (3★): punishes damage (taunt, retaliate, Valor dump)
- Sorju (2★): preempts damage (speed, initiative)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```
