# Aurora Stat Rebalance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebalance Aurora the Dawn from an over-budgeted generalist (247 combat stats) to a soak tank (210 combat stats) by reducing HP, ATK, and DEF.

**Architecture:** Single data change in `heroTemplates.js` (line 23), validated by a new test file following the existing `heroTemplates-yggra.test.js` pattern. Existing tests in `battle-guardian.test.js` use inline mock objects (not Aurora's real stats), so they are unaffected.

**Tech Stack:** Vue 3, Vitest, Pinia

**Design Reference:** `~/dorf-evaluation-session-1.md`, Solution 2 (lines 334-368)

---

### Task 1: Write Aurora stat validation test

**Files:**
- Create: `src/data/__tests__/heroTemplates-aurora.test.js`

**Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { heroTemplates } from '../heroTemplates'
import { EffectType } from '../statusEffects'

describe('Aurora the Dawn hero template', () => {
  const aurora = heroTemplates.aurora_the_dawn

  it('exists with correct identity', () => {
    expect(aurora).toBeDefined()
    expect(aurora.name).toBe('Aurora the Dawn')
    expect(aurora.rarity).toBe(5)
    expect(aurora.classId).toBe('paladin')
  })

  describe('base stats (soak tank budget: 210 combat stats)', () => {
    it('has HP 140 (high pool for damage soaking)', () => {
      expect(aurora.baseStats.hp).toBe(140)
    })

    it('has ATK 28 (tank, not DPS — weakens lifesteal self-heal)', () => {
      expect(aurora.baseStats.atk).toBe(28)
    })

    it('has DEF 30 (below Sir Gallan 45 — soak tank, not mitigation tank)', () => {
      expect(aurora.baseStats.def).toBe(30)
    })

    it('has SPD 12 (unchanged)', () => {
      expect(aurora.baseStats.spd).toBe(12)
    })

    it('has MP 60 (unchanged)', () => {
      expect(aurora.baseStats.mp).toBe(60)
    })

    it('has combat stat total of 210', () => {
      const { hp, atk, def, spd } = aurora.baseStats
      expect(hp + atk + def + spd).toBe(210)
    })
  })

  it('has 5 skills', () => {
    expect(aurora.skills).toHaveLength(5)
  })

  describe('Holy Strike', () => {
    const skill = aurora.skills.find(s => s.name === 'Holy Strike')

    it('exists and targets enemy', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('enemy')
    })

    it('deals 120% ATK with 50% lifesteal', () => {
      expect(skill.damagePercent).toBe(120)
      expect(skill.healSelfPercent).toBe(50)
    })
  })

  describe('Guardian Link', () => {
    const skill = aurora.skills.find(s => s.name === 'Guardian Link')

    it('exists and targets ally', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('ally')
    })

    it('redirects 40% damage for 3 turns', () => {
      const effect = skill.effects.find(e => e.type === EffectType.GUARDIAN_LINK)
      expect(effect).toBeDefined()
      expect(effect.redirectPercent).toBe(40)
      expect(effect.duration).toBe(3)
    })
  })

  describe('Consecrated Ground', () => {
    const skill = aurora.skills.find(s => s.name === 'Consecrated Ground')

    it('exists and targets ally', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('ally')
    })

    it('grants 25% damage reduction for 3 turns', () => {
      const effect = skill.effects.find(e => e.type === EffectType.DAMAGE_REDUCTION)
      expect(effect).toBeDefined()
      expect(effect.value).toBe(25)
      expect(effect.duration).toBe(3)
    })
  })

  describe("Judgment's Echo", () => {
    const skill = aurora.skills.find(s => s.name === "Judgment's Echo")

    it('exists and targets self', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('self')
    })

    it('stores damage for 2 turns', () => {
      const effect = skill.effects.find(e => e.type === EffectType.DAMAGE_STORE)
      expect(effect).toBeDefined()
      expect(effect.duration).toBe(2)
    })
  })

  describe('Divine Sacrifice', () => {
    const skill = aurora.skills.find(s => s.name === 'Divine Sacrifice')

    it('exists and targets self', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('self')
    })

    it('intercepts ally damage with 50% DR and 15% heal per turn', () => {
      const effect = skill.effects.find(e => e.type === EffectType.DIVINE_SACRIFICE)
      expect(effect).toBeDefined()
      expect(effect.damageReduction).toBe(50)
      expect(effect.healPerTurn).toBe(15)
      expect(effect.duration).toBe(2)
    })
  })

  describe('leader skill', () => {
    it('is Dawn\'s Protection — passive +15% DEF to non-knights', () => {
      expect(aurora.leaderSkill.name).toBe("Dawn's Protection")
      expect(aurora.leaderSkill.effects[0].type).toBe('passive')
      expect(aurora.leaderSkill.effects[0].stat).toBe('def')
      expect(aurora.leaderSkill.effects[0].value).toBe(15)
      expect(aurora.leaderSkill.effects[0].condition).toEqual({ classId: { not: 'knight' } })
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/heroTemplates-aurora.test.js`
Expected: FAIL — stat assertions will fail because current stats are `{ hp: 150, atk: 35, def: 50 }` but tests expect `{ hp: 140, atk: 28, def: 30 }`. The combat total test will show `247 !== 210`.

---

### Task 2: Update Aurora's base stats

**Files:**
- Modify: `src/data/heroTemplates.js:23`

**Step 1: Apply the stat change**

Change line 23 from:
```js
    baseStats: { hp: 150, atk: 35, def: 50, spd: 12, mp: 60 },
```
to:
```js
    baseStats: { hp: 140, atk: 28, def: 30, spd: 12, mp: 60 },
```

**Step 2: Run Aurora test to verify it passes**

Run: `npx vitest run src/data/__tests__/heroTemplates-aurora.test.js`
Expected: All tests PASS.

**Step 3: Run all existing tests to check for regressions**

Run: `npx vitest run`
Expected: All tests PASS. The `battle-guardian.test.js` tests use inline mock objects with hardcoded HP values (e.g., `currentHp: 150`), not Aurora's actual template stats, so they are unaffected by this change.

**Step 4: Commit**

```bash
git add src/data/__tests__/heroTemplates-aurora.test.js src/data/heroTemplates.js
git commit -m "feat: rebalance Aurora the Dawn stats — soak tank (210 combat total)

Reduce Aurora's combat stat budget from 247 to 210 to align with other
5-star heroes (Shadow King 208, Yggra 205). Repositions her as a soak
tank (high HP, low DEF) rather than a mitigation tank.

Changes: HP 150→140, ATK 35→28, DEF 50→30, SPD/MP unchanged.
ATK nerf also weakens lifesteal self-heal, partially addressing the
healer ATK paradox identified in the roster evaluation.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```
