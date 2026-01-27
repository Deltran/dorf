# Fennick Kit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete Fennick's 4-skill evasion tank kit and make evasion effects stack additively.

**Architecture:** Three data/logic changes: (1) make EVASION stackable in statusEffects.js, (2) update applyDamage in battle.js to sum multiple evasion effects, (3) add three new skills to Fennick's template in heroTemplates.js. All changes are TDD with tests written first.

**Tech Stack:** Vue 3, Pinia, Vitest

---

### Task 1: Make EVASION effect stackable

**Files:**
- Modify: `src/data/statusEffects.js:199` (change `stackable: false` to `stackable: true`)
- Test: `src/stores/__tests__/battle-evasion.test.js`

**Step 1: Write the failing test**

Add a test to `src/stores/__tests__/battle-evasion.test.js` inside the `EffectType.EVASION` describe block:

```js
it('should be stackable', () => {
  expect(effectDefinitions[EffectType.EVASION].stackable).toBe(true)
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/stores/__tests__/battle-evasion.test.js --reporter=verbose`
Expected: FAIL — `expected true to be false` (currently `stackable: false`)

**Step 3: Write minimal implementation**

In `src/data/statusEffects.js`, change line 199 from `stackable: false` to `stackable: true`:

```js
[EffectType.EVASION]: {
  name: 'Evasion',
  icon: '💨',
  color: '#a78bfa',
  isBuff: true,
  isEvasion: true,
  stackable: true
},
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/stores/__tests__/battle-evasion.test.js --reporter=verbose`
Expected: PASS — all tests green

**Step 5: Commit**

```bash
git add src/data/statusEffects.js src/stores/__tests__/battle-evasion.test.js
git commit -m "feat(evasion): make EVASION effect stackable"
```

---

### Task 2: Update applyDamage to sum multiple evasion effects

**Files:**
- Modify: `src/stores/battle.js:865-884` (evasion check in `applyDamage`)
- Test: `src/stores/__tests__/battle-evasion.test.js`

**Step 1: Write the failing tests**

Add a new `describe('evasion stacking', ...)` block to `src/stores/__tests__/battle-evasion.test.js`:

```js
describe('evasion stacking', () => {
  it('sums multiple evasion effects additively', () => {
    // 30 + 20 = 50% evasion; Math.random returns 0.49 (just under 50%)
    const originalRandom = Math.random
    Math.random = () => 0.49

    const unit = {
      currentHp: 100,
      maxHp: 100,
      statusEffects: [
        { type: EffectType.EVASION, duration: 2, value: 30 },
        { type: EffectType.EVASION, duration: 3, value: 20 }
      ],
      template: { name: 'Test Hero' }
    }

    const result = store.applyDamage(unit, 50, 'attack')

    expect(result).toBe(0) // Evaded (0.49 < 0.50)
    expect(unit.currentHp).toBe(100)

    Math.random = originalRandom
  })

  it('fails evasion when roll exceeds summed chance', () => {
    // 30 + 20 = 50% evasion; Math.random returns 0.51 (just over 50%)
    const originalRandom = Math.random
    Math.random = () => 0.51

    const unit = {
      currentHp: 100,
      maxHp: 100,
      statusEffects: [
        { type: EffectType.EVASION, duration: 2, value: 30 },
        { type: EffectType.EVASION, duration: 3, value: 20 }
      ],
      template: { name: 'Test Hero' }
    }

    const result = store.applyDamage(unit, 50, 'attack')

    expect(result).toBe(50) // Hit (0.51 >= 0.50)
    expect(unit.currentHp).toBe(50)

    Math.random = originalRandom
  })

  it('caps total evasion at 100%', () => {
    // 60 + 60 = 120%, capped to 100%; Math.random returns 0.99
    const originalRandom = Math.random
    Math.random = () => 0.99

    const unit = {
      currentHp: 100,
      maxHp: 100,
      statusEffects: [
        { type: EffectType.EVASION, duration: 2, value: 60 },
        { type: EffectType.EVASION, duration: 3, value: 60 }
      ],
      template: { name: 'Test Hero' }
    }

    const result = store.applyDamage(unit, 50, 'attack')

    expect(result).toBe(0) // 100% evasion always dodges
    expect(unit.currentHp).toBe(100)

    Math.random = originalRandom
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/stores/__tests__/battle-evasion.test.js --reporter=verbose`
Expected: FAIL — the stacking test with 0.49 will fail because current code uses `.find()` which only gets the first effect (30%), and 0.49 >= 0.30. The 100% cap test will also fail.

**Step 3: Write minimal implementation**

In `src/stores/battle.js`, replace lines 865-885 (the evasion block in `applyDamage`). Change from:

```js
// Check for EVASION effect
const evasionEffect = (unit.statusEffects || []).find(e => e.type === EffectType.EVASION)
if (evasionEffect && source === 'attack') {
  const evasionChance = evasionEffect.value / 100
  if (Math.random() < evasionChance) {
    const unitName = unit.template?.name || 'Unknown'
    addLog(`${unitName} evades the attack!`)
    emitCombatEffect(unit.instanceId || unit.id, unit.instanceId ? 'hero' : 'enemy', 'miss', 0)

    // Handle onEvade effects (e.g., MP restore to caster)
    if (evasionEffect.onEvade?.restoreMp && evasionEffect.sourceId) {
      const caster = heroes.value.find(h => h.instanceId === evasionEffect.sourceId)
      if (caster && caster.currentHp > 0) {
        const mpToRestore = evasionEffect.onEvade.restoreMp
        caster.currentMp = Math.min(caster.maxMp, caster.currentMp + mpToRestore)
        addLog(`${caster.template.name} recovers ${mpToRestore} MP!`)
      }
    }

    return 0 // No damage dealt
  }
}
```

To:

```js
// Check for EVASION effects (sum all additively, cap at 100%)
const evasionEffects = (unit.statusEffects || []).filter(e => e.type === EffectType.EVASION)
if (evasionEffects.length > 0 && source === 'attack') {
  const totalEvasion = evasionEffects.reduce((sum, e) => sum + (e.value || 0), 0)
  const evasionChance = Math.min(totalEvasion, 100) / 100
  if (Math.random() < evasionChance) {
    const unitName = unit.template?.name || 'Unknown'
    addLog(`${unitName} evades the attack!`)
    emitCombatEffect(unit.instanceId || unit.id, unit.instanceId ? 'hero' : 'enemy', 'miss', 0)

    // Handle onEvade effects (e.g., MP restore to caster)
    for (const evasionEffect of evasionEffects) {
      if (evasionEffect.onEvade?.restoreMp && evasionEffect.sourceId) {
        const caster = heroes.value.find(h => h.instanceId === evasionEffect.sourceId)
        if (caster && caster.currentHp > 0) {
          const mpToRestore = evasionEffect.onEvade.restoreMp
          caster.currentMp = Math.min(caster.maxMp, caster.currentMp + mpToRestore)
          addLog(`${caster.template.name} recovers ${mpToRestore} MP!`)
        }
      }
    }

    return 0 // No damage dealt
  }
}
```

Key changes:
- `.find()` → `.filter()` to get all evasion effects
- `.reduce()` to sum all evasion values
- `Math.min(totalEvasion, 100)` to cap at 100%
- `for...of` loop over all effects for `onEvade` handlers

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/stores/__tests__/battle-evasion.test.js --reporter=verbose`
Expected: PASS — all tests green (existing + new stacking tests)

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-evasion.test.js
git commit -m "feat(evasion): sum multiple evasion effects additively, cap at 100%"
```

---

### Task 3: Add Fennick's three new skills

**Files:**
- Modify: `src/data/heroTemplates.js:1103-1115` (Fennick's skills array)
- Test: `src/stores/__tests__/battle-evasion.test.js` (add Fennick template tests)

**Step 1: Write the failing tests**

Add a new `describe('Fennick skill kit', ...)` block to `src/stores/__tests__/battle-evasion.test.js`. Import `heroTemplates` at the top:

```js
import { heroTemplates } from '../../data/heroTemplates'
```

Then add the tests:

```js
describe('Fennick skill kit', () => {
  const fennick = heroTemplates.fennick

  it('has 4 skills', () => {
    expect(fennick.skills).toHaveLength(4)
  })

  it('has Come and Get Me at level 1', () => {
    const skill = fennick.skills[0]
    expect(skill.name).toBe('Come and Get Me')
    expect(skill.skillUnlockLevel).toBe(1)
    expect(skill.targetType).toBe('self')
    expect(skill.noDamage).toBe(true)
    expect(skill.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: EffectType.TAUNT, duration: 2 }),
        expect.objectContaining({ type: EffectType.EVASION, duration: 2, value: 30 })
      ])
    )
  })

  it('has Counter-shot at level 3', () => {
    const skill = fennick.skills[1]
    expect(skill.name).toBe('Counter-shot')
    expect(skill.skillUnlockLevel).toBe(3)
    expect(skill.damagePercent).toBe(90)
    expect(skill.targetType).toBe('enemy')
    expect(skill.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: EffectType.THORNS, target: 'self', duration: 2, value: 30 })
      ])
    )
  })

  it("has Fox's Cunning at level 6", () => {
    const skill = fennick.skills[2]
    expect(skill.name).toBe("Fox's Cunning")
    expect(skill.skillUnlockLevel).toBe(6)
    expect(skill.targetType).toBe('self')
    expect(skill.noDamage).toBe(true)
    expect(skill.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: EffectType.EVASION, duration: 3, value: 20 }),
        expect.objectContaining({ type: EffectType.SPD_UP, duration: 3, value: 3 })
      ])
    )
  })

  it('has Pin Down at level 12', () => {
    const skill = fennick.skills[3]
    expect(skill.name).toBe('Pin Down')
    expect(skill.skillUnlockLevel).toBe(12)
    expect(skill.damagePercent).toBe(100)
    expect(skill.targetType).toBe('enemy')
    expect(skill.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: EffectType.STUN, target: 'enemy', duration: 1 })
      ])
    )
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/stores/__tests__/battle-evasion.test.js --reporter=verbose`
Expected: FAIL — `expected 1 to be 4` (Fennick currently has 1 skill)

**Step 3: Write minimal implementation**

In `src/data/heroTemplates.js`, replace Fennick's `skills` array (lines 1103-1114) with the complete 4-skill kit:

```js
skills: [
  {
    name: 'Come and Get Me',
    description: 'Taunt all enemies for 2 turns and gain 30% evasion for 2 turns.',
    skillUnlockLevel: 1,
    targetType: 'self',
    noDamage: true,
    effects: [
      { type: EffectType.TAUNT, target: 'self', duration: 2 },
      { type: EffectType.EVASION, target: 'self', duration: 2, value: 30 }
    ]
  },
  {
    name: 'Counter-shot',
    description: 'Deal 90% ATK damage to an enemy. Gain thorns for 2 turns, reflecting 30% damage to attackers.',
    skillUnlockLevel: 3,
    damagePercent: 90,
    targetType: 'enemy',
    effects: [
      { type: EffectType.THORNS, target: 'self', duration: 2, value: 30 }
    ]
  },
  {
    name: "Fox's Cunning",
    description: 'Gain 20% evasion and +3 SPD for 3 turns. Evasion stacks with other sources.',
    skillUnlockLevel: 6,
    targetType: 'self',
    noDamage: true,
    effects: [
      { type: EffectType.EVASION, target: 'self', duration: 3, value: 20 },
      { type: EffectType.SPD_UP, target: 'self', duration: 3, value: 3 }
    ]
  },
  {
    name: 'Pin Down',
    description: 'Deal 100% ATK damage to an enemy and stun them for 1 turn.',
    skillUnlockLevel: 12,
    damagePercent: 100,
    targetType: 'enemy',
    effects: [
      { type: EffectType.STUN, target: 'enemy', duration: 1 }
    ]
  }
]
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/stores/__tests__/battle-evasion.test.js --reporter=verbose`
Expected: PASS — all tests green

**Step 5: Run full test suite**

Run: `npx vitest run --reporter=verbose`
Expected: All tests pass (no regressions)

**Step 6: Commit**

```bash
git add src/data/heroTemplates.js src/stores/__tests__/battle-evasion.test.js
git commit -m "feat(fennick): add Counter-shot, Fox's Cunning, and Pin Down skills"
```
