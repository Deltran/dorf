# Drums of the Old Blood Banner Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement three new heroes (Korrath, Vraxx, Torga) and a June-repeating "Drums of the Old Blood" banner with new battle mechanics.

**Architecture:**
- Create hero template files following existing patterns in `src/data/heroes/{rarity}star/`
- Add new battle mechanics to `battle.js` for execute bonuses, rage manipulation, and on-kill effects
- Add banner with `monthlySchedule: { month: 6 }` for June rotation

**Tech Stack:** Vue 3, Pinia, Vitest

---

## Task 1: Create Torga Bloodbeat (3-star Berserker) Template Tests

**Files:**
- Create: `src/data/__tests__/torga-bloodbeat-template.test.js`

**Step 1: Write the failing test**

```js
// src/data/__tests__/torga-bloodbeat-template.test.js
import { describe, it, expect } from 'vitest'
import { heroTemplates } from '../heroes/index.js'
import { EffectType } from '../statusEffects.js'

describe('Torga Bloodbeat hero template', () => {
  const torga = heroTemplates.torga_bloodbeat

  it('exists with correct identity', () => {
    expect(torga).toBeDefined()
    expect(torga.id).toBe('torga_bloodbeat')
    expect(torga.name).toBe('Torga Bloodbeat')
    expect(torga.rarity).toBe(3)
    expect(torga.classId).toBe('berserker')
  })

  describe('base stats', () => {
    it('has HP 85', () => {
      expect(torga.baseStats.hp).toBe(85)
    })

    it('has ATK 35', () => {
      expect(torga.baseStats.atk).toBe(35)
    })

    it('has DEF 15', () => {
      expect(torga.baseStats.def).toBe(15)
    })

    it('has SPD 12', () => {
      expect(torga.baseStats.spd).toBe(12)
    })

    it('has combat stat total of 147', () => {
      const { hp, atk, def, spd } = torga.baseStats
      expect(hp + atk + def + spd).toBe(147)
    })
  })

  it('has 5 skills', () => {
    expect(torga.skills).toHaveLength(5)
  })

  describe('Rhythm Strike (Level 1)', () => {
    const skill = () => torga.skills.find(s => s.name === 'Rhythm Strike')

    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(1)
      expect(skill().targetType).toBe('enemy')
    })

    it('has zero rage cost and grants rage', () => {
      expect(skill().rageCost).toBe(0)
      expect(skill().rageGain).toBe(10)
    })

    it('deals 100% ATK damage', () => {
      expect(skill().damagePercent).toBe(100)
    })
  })

  describe('Blood Tempo (Level 1)', () => {
    const skill = () => torga.skills.find(s => s.name === 'Blood Tempo')

    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(1)
      expect(skill().targetType).toBe('self')
      expect(skill().noDamage).toBe(true)
    })

    it('costs HP for rage', () => {
      expect(skill().rageCost).toBe(0)
      expect(skill().selfDamagePercentMaxHp).toBe(15)
      expect(skill().rageGain).toBe(30)
    })

    it('grants ATK buff', () => {
      const atkUp = skill().effects.find(e => e.type === EffectType.ATK_UP)
      expect(atkUp).toBeDefined()
      expect(atkUp.value).toBe(20)
      expect(atkUp.duration).toBe(2)
    })
  })

  describe('Rage Surge (Level 3)', () => {
    const skill = () => torga.skills.find(s => s.name === 'Rage Surge')

    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(3)
      expect(skill().rageCost).toBe(25)
      expect(skill().targetType).toBe('enemy')
    })

    it('has rage-scaling damage', () => {
      expect(skill().damagePercent).toBe(80)
      expect(skill().bonusDamagePerRage).toBe(0.5)
    })
  })

  describe('Death Knell (Level 6)', () => {
    const skill = () => torga.skills.find(s => s.name === 'Death Knell')

    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(6)
      expect(skill().rageCost).toBe(40)
      expect(skill().targetType).toBe('enemy')
    })

    it('has execute bonus with healing', () => {
      expect(skill().damagePercent).toBe(150)
      expect(skill().executeBonus).toBeDefined()
      expect(skill().executeBonus.threshold).toBe(30)
      expect(skill().executeBonus.damagePercent).toBe(250)
      expect(skill().executeBonus.healSelfPercent).toBe(20)
    })
  })

  describe('Finale of Fury (Level 12)', () => {
    const skill = () => torga.skills.find(s => s.name === 'Finale of Fury')

    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(12)
      expect(skill().targetType).toBe('enemy')
    })

    it('consumes all rage', () => {
      expect(skill().rageCost).toBe('all')
    })

    it('has rage-scaling damage', () => {
      expect(skill().baseDamagePercent).toBe(50)
      expect(skill().damagePerRage).toBe(2)
    })

    it('grants rage on kill', () => {
      expect(skill().onKill).toBeDefined()
      expect(skill().onKill.rageGain).toBe(50)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/__tests__/torga-bloodbeat-template.test.js`
Expected: FAIL with "heroTemplates.torga_bloodbeat is undefined"

**Step 3: Commit test**

```bash
git add src/data/__tests__/torga-bloodbeat-template.test.js
git commit -m "test(heroes): add Torga Bloodbeat template tests"
```

---

## Task 2: Implement Torga Bloodbeat Hero Template

**Files:**
- Create: `src/data/heroes/3star/torga_bloodbeat.js`
- Modify: `src/data/heroes/3star/index.js`

**Step 1: Create hero template file**

```js
// src/data/heroes/3star/torga_bloodbeat.js
import { EffectType } from '../../statusEffects.js'

export const torga_bloodbeat = {
  id: 'torga_bloodbeat',
  name: 'Torga Bloodbeat',
  rarity: 3,
  classId: 'berserker',
  baseStats: { hp: 85, atk: 35, def: 15, spd: 12 },
  skills: [
    {
      name: 'Rhythm Strike',
      description: 'Deal 100% ATK damage to one enemy. Gain 10 Rage.',
      skillUnlockLevel: 1,
      rageCost: 0,
      targetType: 'enemy',
      damagePercent: 100,
      rageGain: 10
    },
    {
      name: 'Blood Tempo',
      description: 'Sacrifice 15% max HP to gain 30 Rage and +20% ATK for 2 turns.',
      skillUnlockLevel: 1,
      rageCost: 0,
      targetType: 'self',
      noDamage: true,
      selfDamagePercentMaxHp: 15,
      rageGain: 30,
      effects: [
        { type: EffectType.ATK_UP, target: 'self', duration: 2, value: 20 }
      ]
    },
    {
      name: 'Rage Surge',
      description: 'Deal 80% ATK damage to one enemy. Deal bonus damage equal to 0.5% per current Rage.',
      skillUnlockLevel: 3,
      rageCost: 25,
      targetType: 'enemy',
      damagePercent: 80,
      bonusDamagePerRage: 0.5
    },
    {
      name: 'Death Knell',
      description: 'Deal 150% ATK damage to one enemy. If target is below 30% HP, deal 250% instead and heal for 20% of damage dealt.',
      skillUnlockLevel: 6,
      rageCost: 40,
      targetType: 'enemy',
      damagePercent: 150,
      executeBonus: { threshold: 30, damagePercent: 250, healSelfPercent: 20 }
    },
    {
      name: 'Finale of Fury',
      description: 'Consume ALL Rage. Deal 50% ATK damage + 2% per Rage consumed to one enemy. If this kills the target, gain 50 Rage.',
      skillUnlockLevel: 12,
      rageCost: 'all',
      targetType: 'enemy',
      baseDamagePercent: 50,
      damagePerRage: 2,
      onKill: { rageGain: 50 }
    }
  ]
}
```

**Step 2: Update 3star index**

Add to `src/data/heroes/3star/index.js`:
```js
import { torga_bloodbeat } from './torga_bloodbeat.js'

export const heroes = {
  // ... existing heroes
  torga_bloodbeat
}
```

**Step 3: Run test to verify it passes**

Run: `npm test -- src/data/__tests__/torga-bloodbeat-template.test.js`
Expected: PASS

**Step 4: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit implementation**

```bash
git add src/data/heroes/3star/torga_bloodbeat.js src/data/heroes/3star/index.js
git commit -m "feat(heroes): add Torga Bloodbeat 3-star Berserker"
```

---

## Task 3: Create Vraxx the Thunderskin (4-star Bard) Template Tests

**Files:**
- Create: `src/data/__tests__/vraxx-thunderskin-template.test.js`

**Step 1: Write the failing test**

```js
// src/data/__tests__/vraxx-thunderskin-template.test.js
import { describe, it, expect } from 'vitest'
import { heroTemplates } from '../heroes/index.js'
import { EffectType } from '../statusEffects.js'

describe('Vraxx the Thunderskin hero template', () => {
  const vraxx = heroTemplates.vraxx_thunderskin

  it('exists with correct identity', () => {
    expect(vraxx).toBeDefined()
    expect(vraxx.id).toBe('vraxx_thunderskin')
    expect(vraxx.name).toBe('Vraxx the Thunderskin')
    expect(vraxx.rarity).toBe(4)
    expect(vraxx.classId).toBe('bard')
  })

  describe('base stats', () => {
    it('has HP 85', () => {
      expect(vraxx.baseStats.hp).toBe(85)
    })

    it('has ATK 28', () => {
      expect(vraxx.baseStats.atk).toBe(28)
    })

    it('has DEF 24', () => {
      expect(vraxx.baseStats.def).toBe(24)
    })

    it('has SPD 18', () => {
      expect(vraxx.baseStats.spd).toBe(18)
    })

    it('has combat stat total of 155', () => {
      const { hp, atk, def, spd } = vraxx.baseStats
      expect(hp + atk + def + spd).toBe(155)
    })
  })

  it('has 5 skills', () => {
    expect(vraxx.skills).toHaveLength(5)
  })

  describe('Finale: Thunderclap Crescendo', () => {
    it('has finale defined', () => {
      expect(vraxx.finale).toBeDefined()
      expect(vraxx.finale.name).toBe('Thunderclap Crescendo')
    })

    it('has consume excess rage mechanic', () => {
      const effect = vraxx.finale.effects.find(e => e.type === 'consume_excess_rage')
      expect(effect).toBeDefined()
      expect(effect.rageThreshold).toBe(50)
      expect(effect.damagePerRagePercent).toBe(3)
    })

    it('has fallback buff when no rage consumed', () => {
      const effect = vraxx.finale.effects.find(e => e.type === 'consume_excess_rage')
      expect(effect.fallbackBuff).toBeDefined()
      expect(effect.fallbackBuff.type).toBe('atk_up')
      expect(effect.fallbackBuff.value).toBe(25)
      expect(effect.fallbackBuff.duration).toBe(2)
    })
  })

  describe('Battle Cadence (Level 1)', () => {
    const skill = () => vraxx.skills.find(s => s.name === 'Battle Cadence')

    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(1)
      expect(skill().targetType).toBe('all_allies')
      expect(skill().noDamage).toBe(true)
    })

    it('grants ATK buff to all allies', () => {
      const atkUp = skill().effects.find(e => e.type === EffectType.ATK_UP)
      expect(atkUp).toBeDefined()
      expect(atkUp.value).toBe(15)
      expect(atkUp.duration).toBe(2)
    })
  })

  describe('Fury Beat (Level 1)', () => {
    const skill = () => vraxx.skills.find(s => s.name === 'Fury Beat')

    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(1)
      expect(skill().targetType).toBe('all_allies')
      expect(skill().noDamage).toBe(true)
    })

    it('has conditional rage grant or buff', () => {
      const effect = skill().effects.find(e => e.type === 'conditional_resource_or_buff')
      expect(effect).toBeDefined()
      expect(effect.rageGrant.classCondition).toBe('berserker')
      expect(effect.rageGrant.amount).toBe(15)
      expect(effect.fallbackBuff.type).toBe(EffectType.ATK_UP)
      expect(effect.fallbackBuff.value).toBe(15)
    })
  })

  describe('Warsong Strike (Level 3)', () => {
    const skill = () => vraxx.skills.find(s => s.name === 'Warsong Strike')

    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(3)
      expect(skill().targetType).toBe('enemy')
      expect(skill().damagePercent).toBe(80)
    })
  })

  describe('Unbreaking Tempo (Level 6)', () => {
    const skill = () => vraxx.skills.find(s => s.name === 'Unbreaking Tempo')

    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(6)
      expect(skill().targetType).toBe('all_allies')
      expect(skill().noDamage).toBe(true)
    })

    it('grants DEF buff', () => {
      const defUp = skill().effects.find(e => e.type === EffectType.DEF_UP)
      expect(defUp).toBeDefined()
      expect(defUp.value).toBe(20)
      expect(defUp.duration).toBe(2)
    })

    it('grants conditional regen to wounded allies', () => {
      const regen = skill().effects.find(e => e.type === EffectType.REGEN)
      expect(regen).toBeDefined()
      expect(regen.atkPercent).toBe(15)
      expect(regen.condition).toBeDefined()
      expect(regen.condition.hpBelow).toBe(50)
    })
  })

  describe('Drums of the Old Blood (Level 12)', () => {
    const skill = () => vraxx.skills.find(s => s.name === 'Drums of the Old Blood')

    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(12)
      expect(skill().targetType).toBe('all_allies')
      expect(skill().noDamage).toBe(true)
    })

    it('grants ATK and DEF buff', () => {
      const atkUp = skill().effects.find(e => e.type === EffectType.ATK_UP)
      const defUp = skill().effects.find(e => e.type === EffectType.DEF_UP)
      expect(atkUp).toBeDefined()
      expect(atkUp.value).toBe(25)
      expect(defUp).toBeDefined()
      expect(defUp.value).toBe(25)
    })

    it('grants debuff immunity', () => {
      const immune = skill().effects.find(e => e.type === EffectType.DEBUFF_IMMUNE)
      expect(immune).toBeDefined()
      expect(immune.duration).toBe(3)
    })

    it('grants rage to berserkers', () => {
      const rageGrant = skill().effects.find(e => e.type === 'rage_grant')
      expect(rageGrant).toBeDefined()
      expect(rageGrant.classCondition).toBe('berserker')
      expect(rageGrant.amount).toBe(25)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/__tests__/vraxx-thunderskin-template.test.js`
Expected: FAIL

**Step 3: Commit test**

```bash
git add src/data/__tests__/vraxx-thunderskin-template.test.js
git commit -m "test(heroes): add Vraxx the Thunderskin template tests"
```

---

## Task 4: Implement Vraxx the Thunderskin Hero Template

**Files:**
- Create: `src/data/heroes/4star/vraxx_thunderskin.js`
- Modify: `src/data/heroes/4star/index.js`

**Step 1: Create hero template file**

```js
// src/data/heroes/4star/vraxx_thunderskin.js
import { EffectType } from '../../statusEffects.js'

export const vraxx_thunderskin = {
  id: 'vraxx_thunderskin',
  name: 'Vraxx the Thunderskin',
  rarity: 4,
  classId: 'bard',
  baseStats: { hp: 85, atk: 28, def: 24, spd: 18 },
  finale: {
    name: 'Thunderclap Crescendo',
    description: 'Consume excess Rage (above 50) from all Berserker allies. Deal 3% ATK damage per Rage consumed to all enemies. If no Rage consumed, grant all allies +25% ATK for 2 turns.',
    target: 'dynamic',
    effects: [
      {
        type: 'consume_excess_rage',
        rageThreshold: 50,
        damagePerRagePercent: 3,
        fallbackBuff: { type: 'atk_up', value: 25, duration: 2 }
      }
    ]
  },
  skills: [
    {
      name: 'Battle Cadence',
      description: 'Grant all allies +15% ATK for 2 turns.',
      skillUnlockLevel: 1,
      targetType: 'all_allies',
      noDamage: true,
      effects: [
        { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 15 }
      ]
    },
    {
      name: 'Fury Beat',
      description: 'Grant 15 Rage to all Berserker allies. Non-Berserker allies gain +15% ATK for 2 turns instead.',
      skillUnlockLevel: 1,
      targetType: 'all_allies',
      noDamage: true,
      effects: [
        {
          type: 'conditional_resource_or_buff',
          rageGrant: { classCondition: 'berserker', amount: 15 },
          fallbackBuff: { type: EffectType.ATK_UP, duration: 2, value: 15 }
        }
      ]
    },
    {
      name: 'Warsong Strike',
      description: 'Deal 80% ATK damage to one enemy.',
      skillUnlockLevel: 3,
      targetType: 'enemy',
      damagePercent: 80
    },
    {
      name: 'Unbreaking Tempo',
      description: 'Grant all allies +20% DEF for 2 turns. Allies below 50% HP also gain Regen for 15% ATK per turn for 2 turns.',
      skillUnlockLevel: 6,
      targetType: 'all_allies',
      noDamage: true,
      effects: [
        { type: EffectType.DEF_UP, target: 'all_allies', duration: 2, value: 20 },
        {
          type: EffectType.REGEN,
          target: 'all_allies',
          duration: 2,
          atkPercent: 15,
          condition: { hpBelow: 50 }
        }
      ]
    },
    {
      name: 'Drums of the Old Blood',
      description: 'All allies gain +25% ATK, +25% DEF, and immunity to debuffs for 3 turns. Berserker allies also gain 25 Rage.',
      skillUnlockLevel: 12,
      targetType: 'all_allies',
      noDamage: true,
      effects: [
        { type: EffectType.ATK_UP, target: 'all_allies', duration: 3, value: 25 },
        { type: EffectType.DEF_UP, target: 'all_allies', duration: 3, value: 25 },
        { type: EffectType.DEBUFF_IMMUNE, target: 'all_allies', duration: 3 },
        { type: 'rage_grant', classCondition: 'berserker', amount: 25 }
      ]
    }
  ]
}
```

**Step 2: Update 4star index**

Add to `src/data/heroes/4star/index.js`:
```js
import { vraxx_thunderskin } from './vraxx_thunderskin.js'

export const heroes = {
  // ... existing heroes
  vraxx_thunderskin
}
```

**Step 3: Run test to verify it passes**

Run: `npm test -- src/data/__tests__/vraxx-thunderskin-template.test.js`
Expected: PASS

**Step 4: Commit implementation**

```bash
git add src/data/heroes/4star/vraxx_thunderskin.js src/data/heroes/4star/index.js
git commit -m "feat(heroes): add Vraxx the Thunderskin 4-star Bard war drummer"
```

---

## Task 5: Create Korrath of the Hollow Ear (5-star Ranger) Template Tests

**Files:**
- Create: `src/data/__tests__/korrath-hollow-ear-template.test.js`

**Step 1: Write the failing test**

```js
// src/data/__tests__/korrath-hollow-ear-template.test.js
import { describe, it, expect } from 'vitest'
import { heroTemplates } from '../heroes/index.js'
import { EffectType } from '../statusEffects.js'

describe('Korrath of the Hollow Ear hero template', () => {
  const korrath = heroTemplates.korrath_hollow_ear

  it('exists with correct identity', () => {
    expect(korrath).toBeDefined()
    expect(korrath.id).toBe('korrath_hollow_ear')
    expect(korrath.name).toBe('Korrath of the Hollow Ear')
    expect(korrath.rarity).toBe(5)
    expect(korrath.classId).toBe('ranger')
  })

  describe('base stats', () => {
    it('has HP 95', () => {
      expect(korrath.baseStats.hp).toBe(95)
    })

    it('has ATK 48', () => {
      expect(korrath.baseStats.atk).toBe(48)
    })

    it('has DEF 20', () => {
      expect(korrath.baseStats.def).toBe(20)
    })

    it('has SPD 22', () => {
      expect(korrath.baseStats.spd).toBe(22)
    })

    it('has combat stat total of 185', () => {
      const { hp, atk, def, spd } = korrath.baseStats
      expect(hp + atk + def + spd).toBe(185)
    })
  })

  it('has 5 skills', () => {
    expect(korrath.skills).toHaveLength(5)
  })

  describe('Leader Skill: Blood Remembers', () => {
    it('has leader skill defined', () => {
      expect(korrath.leaderSkill).toBeDefined()
      expect(korrath.leaderSkill.name).toBe('Blood Remembers')
    })

    it('triggers on round 2', () => {
      const effect = korrath.leaderSkill.effects[0]
      expect(effect.type).toBe('timed')
      expect(effect.triggerRound).toBe(2)
      expect(effect.target).toBe('all_allies')
    })

    it('grants ATK and SPD buff', () => {
      const effect = korrath.leaderSkill.effects[0]
      expect(effect.apply).toContainEqual({ effectType: 'atk_up', duration: 3, value: 20 })
      expect(effect.apply).toContainEqual({ effectType: 'spd_up', duration: 3, value: 15 })
    })
  })

  describe('Whisper Shot (Level 1)', () => {
    const skill = () => korrath.skills.find(s => s.name === 'Whisper Shot')

    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(1)
      expect(skill().targetType).toBe('enemy')
    })

    it('has execute bonus', () => {
      expect(skill().damagePercent).toBe(110)
      expect(skill().executeBonus).toBeDefined()
      expect(skill().executeBonus.threshold).toBe(30)
      expect(skill().executeBonus.damagePercent).toBe(150)
    })
  })

  describe('Spirit Mark (Level 1)', () => {
    const skill = () => korrath.skills.find(s => s.name === 'Spirit Mark')

    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(1)
      expect(skill().targetType).toBe('enemy')
      expect(skill().noDamage).toBe(true)
    })

    it('applies MARKED effect', () => {
      const marked = skill().effects.find(e => e.type === EffectType.MARKED)
      expect(marked).toBeDefined()
      expect(marked.duration).toBe(3)
      expect(marked.value).toBe(25)
    })
  })

  describe('Deathecho Volley (Level 3)', () => {
    const skill = () => korrath.skills.find(s => s.name === 'Deathecho Volley')

    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(3)
      expect(skill().targetType).toBe('all_enemies')
    })

    it('has death-scaling bonus damage', () => {
      expect(skill().damagePercent).toBe(60)
      expect(skill().bonusDamagePerDeath).toBeDefined()
      expect(skill().bonusDamagePerDeath.perDeath).toBe(15)
      expect(skill().bonusDamagePerDeath.maxBonus).toBe(60)
    })
  })

  describe('Spirit Volley (Level 6)', () => {
    const skill = () => korrath.skills.find(s => s.name === 'Spirit Volley')

    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(6)
      expect(skill().targetType).toBe('random_enemies')
    })

    it('has multi-hit with marked priority', () => {
      expect(skill().multiHit).toBe(5)
      expect(skill().damagePercent).toBe(50)
      expect(skill().prioritizeMarked).toBe(true)
    })
  })

  describe('The Last Drumbeat (Level 12)', () => {
    const skill = () => korrath.skills.find(s => s.name === 'The Last Drumbeat')

    it('exists with correct properties', () => {
      expect(skill()).toBeDefined()
      expect(skill().skillUnlockLevel).toBe(12)
      expect(skill().targetType).toBe('enemy')
    })

    it('has high damage with DEF ignore', () => {
      expect(skill().damagePercent).toBe(200)
      expect(skill().ignoreDef).toBe(75)
    })

    it('resets turn order on kill', () => {
      expect(skill().onKill).toBeDefined()
      expect(skill().onKill.resetTurnOrder).toBe(true)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/__tests__/korrath-hollow-ear-template.test.js`
Expected: FAIL

**Step 3: Commit test**

```bash
git add src/data/__tests__/korrath-hollow-ear-template.test.js
git commit -m "test(heroes): add Korrath of the Hollow Ear template tests"
```

---

## Task 6: Implement Korrath of the Hollow Ear Hero Template

**Files:**
- Create: `src/data/heroes/5star/korrath_hollow_ear.js`
- Modify: `src/data/heroes/5star/index.js`

**Step 1: Create hero template file**

```js
// src/data/heroes/5star/korrath_hollow_ear.js
import { EffectType } from '../../statusEffects.js'

export const korrath_hollow_ear = {
  id: 'korrath_hollow_ear',
  name: 'Korrath of the Hollow Ear',
  rarity: 5,
  classId: 'ranger',
  baseStats: { hp: 95, atk: 48, def: 20, spd: 22 },
  leaderSkill: {
    name: 'Blood Remembers',
    description: 'On round 2, all allies gain +20% ATK and +15% SPD for 3 turns',
    effects: [{
      type: 'timed',
      triggerRound: 2,
      target: 'all_allies',
      apply: [
        { effectType: 'atk_up', duration: 3, value: 20 },
        { effectType: 'spd_up', duration: 3, value: 15 }
      ]
    }]
  },
  skills: [
    {
      name: 'Whisper Shot',
      description: 'Deal 110% ATK damage to one enemy. If target is below 30% HP, deal 150% instead.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 110,
      executeBonus: { threshold: 30, damagePercent: 150 }
    },
    {
      name: 'Spirit Mark',
      description: 'Mark an enemy for 3 turns. Marked enemies take 25% increased damage from all sources.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        { type: EffectType.MARKED, target: 'enemy', duration: 3, value: 25 }
      ]
    },
    {
      name: 'Deathecho Volley',
      description: 'Deal 60% ATK damage to all enemies. Deal bonus damage equal to 15% per enemy that has died this battle (max 60%).',
      skillUnlockLevel: 3,
      targetType: 'all_enemies',
      damagePercent: 60,
      bonusDamagePerDeath: { perDeath: 15, maxBonus: 60 }
    },
    {
      name: 'Spirit Volley',
      description: 'Deal 50% ATK damage five times to random enemies. Marked enemies are targeted first.',
      skillUnlockLevel: 6,
      targetType: 'random_enemies',
      multiHit: 5,
      damagePercent: 50,
      prioritizeMarked: true
    },
    {
      name: 'The Last Drumbeat',
      description: 'Deal 200% ATK damage to one enemy, ignoring 75% DEF. If this kills the target, reset Korrath to the top of the turn order.',
      skillUnlockLevel: 12,
      targetType: 'enemy',
      damagePercent: 200,
      ignoreDef: 75,
      onKill: { resetTurnOrder: true }
    }
  ]
}
```

**Step 2: Update 5star index**

Add to `src/data/heroes/5star/index.js`:
```js
import { korrath_hollow_ear } from './korrath_hollow_ear.js'

export const heroes = {
  // ... existing heroes
  korrath_hollow_ear
}
```

**Step 3: Run test to verify it passes**

Run: `npm test -- src/data/__tests__/korrath-hollow-ear-template.test.js`
Expected: PASS

**Step 4: Commit implementation**

```bash
git add src/data/heroes/5star/korrath_hollow_ear.js src/data/heroes/5star/index.js
git commit -m "feat(heroes): add Korrath of the Hollow Ear 5-star Ranger"
```

---

## Task 7: Create Drums of the Old Blood Banner Tests

**Files:**
- Create: `src/data/__tests__/banners-drums-of-old-blood.test.js`

**Step 1: Write the failing test**

```js
// src/data/__tests__/banners-drums-of-old-blood.test.js
import { describe, it, expect } from 'vitest'
import { banners, getMonthlyBanner } from '../banners.js'

describe('Drums of the Old Blood banner', () => {
  const banner = banners.find(b => b.id === 'drums_of_old_blood')

  it('exists with correct properties', () => {
    expect(banner).toBeDefined()
    expect(banner.name).toBe('Drums of the Old Blood')
    expect(banner.permanent).toBe(false)
  })

  it('is scheduled for June (month 6)', () => {
    expect(banner.monthlySchedule).toBeDefined()
    expect(banner.monthlySchedule.month).toBe(6)
  })

  it('has all 5 rarities populated', () => {
    for (let r = 1; r <= 5; r++) {
      expect(banner.heroPool[r]).toBeDefined()
      expect(banner.heroPool[r].length).toBeGreaterThan(0)
    }
  })

  it('features Korrath as 5-star', () => {
    expect(banner.heroPool[5]).toContain('korrath_hollow_ear')
  })

  it('features Vraxx as 4-star', () => {
    expect(banner.heroPool[4]).toContain('vraxx_thunderskin')
  })

  it('features Torga as 3-star', () => {
    expect(banner.heroPool[3]).toContain('torga_bloodbeat')
  })

  it('is returned by getMonthlyBanner for June', () => {
    const juneBanner = getMonthlyBanner(2026, 6)
    expect(juneBanner).toBeDefined()
    expect(juneBanner.id).toBe('drums_of_old_blood')
  })

  it('has thematic description', () => {
    expect(banner.description).toContain('Drumcaller')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/__tests__/banners-drums-of-old-blood.test.js`
Expected: FAIL

**Step 3: Commit test**

```bash
git add src/data/__tests__/banners-drums-of-old-blood.test.js
git commit -m "test(banners): add Drums of the Old Blood banner tests"
```

---

## Task 8: Implement Drums of the Old Blood Banner

**Files:**
- Modify: `src/data/banners.js`

**Step 1: Add banner to banners array**

Add to `src/data/banners.js` in the `banners` array:

```js
{
  id: 'drums_of_old_blood',
  name: 'Drums of the Old Blood',
  description: 'The Drumcaller warband emerges from Stormwind Peaks! Featuring Korrath, Vraxx, and Torga.',
  permanent: false,
  monthlySchedule: { month: 6 },
  heroPool: {
    5: ['korrath_hollow_ear'],
    4: ['vraxx_thunderskin', 'swift_arrow'],
    3: ['torga_bloodbeat', 'town_guard', 'wandering_bard'],
    2: ['militia_soldier', 'apprentice_mage', 'fennick'],
    1: ['farm_hand', 'street_urchin', 'beggar_monk']
  }
}
```

**Step 2: Run test to verify it passes**

Run: `npm test -- src/data/__tests__/banners-drums-of-old-blood.test.js`
Expected: PASS

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit implementation**

```bash
git add src/data/banners.js
git commit -m "feat(banners): add Drums of the Old Blood June banner"
```

---

## Task 9: Create Banner Integration Tests

**Files:**
- Create: `src/stores/__tests__/battle-drums-integration.test.js`

**Step 1: Write integration test**

```js
// src/stores/__tests__/battle-drums-integration.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { heroTemplates } from '../../data/heroes/index.js'
import { EffectType } from '../../data/statusEffects.js'

describe('Drums of the Old Blood banner heroes integration', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('Hero template existence', () => {
    it('Korrath exists in heroTemplates', () => {
      expect(heroTemplates.korrath_hollow_ear).toBeDefined()
      expect(heroTemplates.korrath_hollow_ear.name).toBe('Korrath of the Hollow Ear')
      expect(heroTemplates.korrath_hollow_ear.rarity).toBe(5)
      expect(heroTemplates.korrath_hollow_ear.classId).toBe('ranger')
    })

    it('Vraxx exists in heroTemplates', () => {
      expect(heroTemplates.vraxx_thunderskin).toBeDefined()
      expect(heroTemplates.vraxx_thunderskin.name).toBe('Vraxx the Thunderskin')
      expect(heroTemplates.vraxx_thunderskin.rarity).toBe(4)
      expect(heroTemplates.vraxx_thunderskin.classId).toBe('bard')
    })

    it('Torga exists in heroTemplates', () => {
      expect(heroTemplates.torga_bloodbeat).toBeDefined()
      expect(heroTemplates.torga_bloodbeat.name).toBe('Torga Bloodbeat')
      expect(heroTemplates.torga_bloodbeat.rarity).toBe(3)
      expect(heroTemplates.torga_bloodbeat.classId).toBe('berserker')
    })
  })

  describe('Korrath battle functionality', () => {
    it('has leader skill Blood Remembers', () => {
      const korrath = heroTemplates.korrath_hollow_ear
      expect(korrath.leaderSkill).toBeDefined()
      expect(korrath.leaderSkill.name).toBe('Blood Remembers')
      expect(korrath.leaderSkill.effects[0].triggerRound).toBe(2)
    })

    it('has Spirit Mark with MARKED effect', () => {
      const korrath = heroTemplates.korrath_hollow_ear
      const spiritMark = korrath.skills.find(s => s.name === 'Spirit Mark')
      expect(spiritMark).toBeDefined()
      const markedEffect = spiritMark.effects.find(e => e.type === EffectType.MARKED)
      expect(markedEffect).toBeDefined()
      expect(markedEffect.value).toBe(25)
    })

    it('has execute bonus on Whisper Shot', () => {
      const korrath = heroTemplates.korrath_hollow_ear
      const whisperShot = korrath.skills.find(s => s.name === 'Whisper Shot')
      expect(whisperShot.executeBonus).toBeDefined()
      expect(whisperShot.executeBonus.threshold).toBe(30)
    })
  })

  describe('Vraxx battle functionality', () => {
    it('has Bard finale', () => {
      const vraxx = heroTemplates.vraxx_thunderskin
      expect(vraxx.finale).toBeDefined()
      expect(vraxx.finale.name).toBe('Thunderclap Crescendo')
    })

    it('has Fury Beat with conditional rage grant', () => {
      const vraxx = heroTemplates.vraxx_thunderskin
      const furyBeat = vraxx.skills.find(s => s.name === 'Fury Beat')
      expect(furyBeat).toBeDefined()
      const effect = furyBeat.effects.find(e => e.type === 'conditional_resource_or_buff')
      expect(effect).toBeDefined()
      expect(effect.rageGrant.classCondition).toBe('berserker')
    })

    it('has conditional regen on Unbreaking Tempo', () => {
      const vraxx = heroTemplates.vraxx_thunderskin
      const tempo = vraxx.skills.find(s => s.name === 'Unbreaking Tempo')
      const regen = tempo.effects.find(e => e.type === EffectType.REGEN)
      expect(regen.condition).toBeDefined()
      expect(regen.condition.hpBelow).toBe(50)
    })
  })

  describe('Torga battle functionality', () => {
    it('has Berserker skills with rage costs', () => {
      const torga = heroTemplates.torga_bloodbeat
      const rageSurge = torga.skills.find(s => s.name === 'Rage Surge')
      expect(rageSurge.rageCost).toBe(25)
    })

    it('has rageGain on Rhythm Strike', () => {
      const torga = heroTemplates.torga_bloodbeat
      const rhythmStrike = torga.skills.find(s => s.name === 'Rhythm Strike')
      expect(rhythmStrike.rageCost).toBe(0)
      expect(rhythmStrike.rageGain).toBe(10)
    })

    it('has selfDamagePercentMaxHp on Blood Tempo', () => {
      const torga = heroTemplates.torga_bloodbeat
      const bloodTempo = torga.skills.find(s => s.name === 'Blood Tempo')
      expect(bloodTempo.selfDamagePercentMaxHp).toBe(15)
      expect(bloodTempo.rageGain).toBe(30)
    })

    it('has execute bonus with healing on Death Knell', () => {
      const torga = heroTemplates.torga_bloodbeat
      const deathKnell = torga.skills.find(s => s.name === 'Death Knell')
      expect(deathKnell.executeBonus).toBeDefined()
      expect(deathKnell.executeBonus.healSelfPercent).toBe(20)
    })

    it('has consume all rage on Finale of Fury', () => {
      const torga = heroTemplates.torga_bloodbeat
      const finale = torga.skills.find(s => s.name === 'Finale of Fury')
      expect(finale.rageCost).toBe('all')
      expect(finale.onKill.rageGain).toBe(50)
    })
  })

  describe('Banner thematic consistency', () => {
    it('all heroes have thematic skill names', () => {
      // Korrath - spirit, whisper, echo, drumbeat
      const korrath = heroTemplates.korrath_hollow_ear
      expect(korrath.skills.some(s => s.name.includes('Spirit'))).toBe(true)
      expect(korrath.skills.some(s => s.name.includes('Drumbeat'))).toBe(true)

      // Vraxx - battle, fury, tempo, drums
      const vraxx = heroTemplates.vraxx_thunderskin
      expect(vraxx.skills.some(s => s.name.includes('Battle'))).toBe(true)
      expect(vraxx.skills.some(s => s.name.includes('Drums'))).toBe(true)

      // Torga - rhythm, blood, rage, fury
      const torga = heroTemplates.torga_bloodbeat
      expect(torga.skills.some(s => s.name.includes('Rhythm'))).toBe(true)
      expect(torga.skills.some(s => s.name.includes('Fury'))).toBe(true)
    })

    it('all heroes have correct rarity tiers', () => {
      expect(heroTemplates.korrath_hollow_ear.rarity).toBe(5) // Legendary
      expect(heroTemplates.vraxx_thunderskin.rarity).toBe(4) // Epic
      expect(heroTemplates.torga_bloodbeat.rarity).toBe(3) // Rare
    })
  })
})
```

**Step 2: Run test**

Run: `npm test -- src/stores/__tests__/battle-drums-integration.test.js`
Expected: PASS

**Step 3: Commit**

```bash
git add src/stores/__tests__/battle-drums-integration.test.js
git commit -m "test(battle): add Drums of the Old Blood integration tests"
```

---

## Task 10: Run Full Test Suite and Final Verification

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 2: Verify hero counts**

Run: `npm test -- --grep "hero template"`
Expected: All hero template tests pass

**Step 3: Verify banner function**

Run: `npm test -- --grep "banner"`
Expected: All banner tests pass

**Step 4: Final commit (if any changes)**

```bash
git status
# If clean, proceed to summary
```

---

## Summary

**Heroes Created:**
1. **Torga Bloodbeat** (3-star Berserker) - Rage-building DPS with execute mechanics
2. **Vraxx the Thunderskin** (4-star Bard) - War drummer with Rage manipulation
3. **Korrath of the Hollow Ear** (5-star Ranger) - Spirit hunter with death-scaling

**Banner Created:**
- **Drums of the Old Blood** - Monthly banner for June (month 6)

**New Mechanics Defined (templates only, battle.js integration TBD):**
- `executeBonus` - Threshold-based damage increase
- `bonusDamagePerDeath` - Scaling with killed enemies
- `bonusDamagePerRage` - Linear scaling with current Rage
- `onKill.resetTurnOrder` - Turn order manipulation
- `onKill.rageGain` - Rage on kill
- `conditional_resource_or_buff` - Class-conditional effects
- `consume_excess_rage` - Finale Rage consumption
- `rageCost: 'all'` - Consume all Rage

**Files Created/Modified:**
- `src/data/heroes/3star/torga_bloodbeat.js` (new)
- `src/data/heroes/4star/vraxx_thunderskin.js` (new)
- `src/data/heroes/5star/korrath_hollow_ear.js` (new)
- `src/data/heroes/3star/index.js` (modified)
- `src/data/heroes/4star/index.js` (modified)
- `src/data/heroes/5star/index.js` (modified)
- `src/data/banners.js` (modified)
- `src/data/__tests__/torga-bloodbeat-template.test.js` (new)
- `src/data/__tests__/vraxx-thunderskin-template.test.js` (new)
- `src/data/__tests__/korrath-hollow-ear-template.test.js` (new)
- `src/data/__tests__/banners-drums-of-old-blood.test.js` (new)
- `src/stores/__tests__/battle-drums-integration.test.js` (new)
