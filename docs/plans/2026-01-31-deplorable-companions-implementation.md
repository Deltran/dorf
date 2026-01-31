# Deplorable Companions Banner Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement three new heroes (Grandmother Rot 5-star, Penny Dreadful 4-star, The Grateful Dead 3-star) and a May monthly banner for the "Deplorable Companions" theme.

**Architecture:** Each hero is a separate JS file in `src/data/heroes/{rarity}/`. Heroes are exported through index files. New status effect types (DECOMPOSITION) are added to statusEffects.js. Banner is added to banners.js with monthly schedule for May.

**Tech Stack:** Vue 3, Vitest for testing, ES modules

---

## Task 1: Add DECOMPOSITION Status Effect

**Files:**
- Modify: `src/data/statusEffects.js`
- Test: `src/data/__tests__/statusEffects-decomposition.test.js`

**Step 1: Write the failing test**

Create `src/data/__tests__/statusEffects-decomposition.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import { EffectType, effectDefinitions, getEffectDefinition } from '../statusEffects'

describe('DECOMPOSITION status effect', () => {
  it('should exist in EffectType enum', () => {
    expect(EffectType.DECOMPOSITION).toBe('decomposition')
  })

  it('should have effect definition', () => {
    const def = getEffectDefinition(EffectType.DECOMPOSITION)
    expect(def).toBeDefined()
    expect(def.name).toBe('Decomposition')
    expect(def.isBuff).toBe(true)
    expect(def.isDecomposition).toBe(true)
  })

  it('should have appropriate icon and color', () => {
    const def = effectDefinitions[EffectType.DECOMPOSITION]
    expect(def.icon).toBe('🍂')
    expect(def.color).toBe('#84cc16')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/__tests__/statusEffects-decomposition.test.js`
Expected: FAIL with "Cannot read properties of undefined"

**Step 3: Write minimal implementation**

Add to `src/data/statusEffects.js` in EffectType enum (after FORTUNE_SWAPPED):

```javascript
  // Deplorable Companions effects
  DECOMPOSITION: 'decomposition' // Shield then heal each turn
```

Add to effectDefinitions (after FORTUNE_SWAPPED definition):

```javascript
  [EffectType.DECOMPOSITION]: {
    name: 'Decomposition',
    icon: '🍂',
    color: '#84cc16',
    isBuff: true,
    isDecomposition: true,
    stackable: false
  }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/data/__tests__/statusEffects-decomposition.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/statusEffects.js src/data/__tests__/statusEffects-decomposition.test.js
git commit -m "feat(effects): add DECOMPOSITION status effect for Grandmother Rot"
```

---

## Task 2: Create Grandmother Rot Hero Template

**Files:**
- Create: `src/data/heroes/5star/grandmother_rot.js`
- Modify: `src/data/heroes/5star/index.js`
- Test: `src/data/__tests__/grandmother-rot-template.test.js`

**Step 1: Write the failing test**

Create `src/data/__tests__/grandmother-rot-template.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import { grandmother_rot } from '../heroes/5star/grandmother_rot'
import { EffectType } from '../statusEffects'

describe('Grandmother Rot hero template', () => {
  it('exists with correct identity', () => {
    expect(grandmother_rot).toBeDefined()
    expect(grandmother_rot.id).toBe('grandmother_rot')
    expect(grandmother_rot.name).toBe('Grandmother Rot')
    expect(grandmother_rot.rarity).toBe(5)
    expect(grandmother_rot.classId).toBe('druid')
  })

  it('has correct base stats', () => {
    expect(grandmother_rot.baseStats).toEqual({
      hp: 115,
      atk: 30,
      def: 32,
      spd: 11,
      mp: 80
    })
  })

  it('has 5 skills', () => {
    expect(grandmother_rot.skills).toHaveLength(5)
  })

  it('has leader skill', () => {
    expect(grandmother_rot.leaderSkill).toBeDefined()
    expect(grandmother_rot.leaderSkill.name).toBe('The Circle Continues')
  })

  describe('Mulching Strike skill', () => {
    const skill = grandmother_rot.skills.find(s => s.name === 'Mulching Strike')

    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.mpCost).toBe(15)
      expect(skill.targetType).toBe('enemy')
      expect(skill.damagePercent).toBe(90)
      expect(skill.healSelfPercent).toBe(20)
    })
  })

  describe('Decomposition skill', () => {
    const skill = grandmother_rot.skills.find(s => s.name === 'Decomposition')

    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.mpCost).toBe(20)
      expect(skill.targetType).toBe('ally')
      expect(skill.noDamage).toBe(true)
    })

    it('applies DECOMPOSITION effect', () => {
      const effect = skill.effects.find(e => e.type === EffectType.DECOMPOSITION)
      expect(effect).toBeDefined()
      expect(effect.duration).toBe(3)
      expect(effect.shieldAtkPercent).toBe(10)
      expect(effect.healAtkPercent).toBe(25)
    })
  })

  describe('Blight Bloom skill', () => {
    const skill = grandmother_rot.skills.find(s => s.name === 'Blight Bloom')

    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.mpCost).toBe(25)
      expect(skill.targetType).toBe('all_enemies')
      expect(skill.damagePercent).toBe(60)
      expect(skill.ifPoisoned).toEqual({ damagePercent: 90 })
    })
  })

  describe('Fungal Network skill', () => {
    const skill = grandmother_rot.skills.find(s => s.name === 'Fungal Network')

    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.mpCost).toBe(32)
      expect(skill.targetType).toBe('all_allies')
      expect(skill.healPercent).toBe(15)
      expect(skill.ifPoisoned).toEqual({ healPercent: 35, removePoisonFromAllies: true })
    })
  })

  describe('The Great Composting skill', () => {
    const skill = grandmother_rot.skills.find(s => s.name === 'The Great Composting')

    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.mpCost).toBe(45)
      expect(skill.skillUnlockLevel).toBe(12)
      expect(skill.consumesPoisonFromEnemies).toBe(true)
    })

    it('has baseline regen effect', () => {
      expect(skill.baselineRegen).toBeDefined()
      expect(skill.baselineRegen.type).toBe(EffectType.REGEN)
    })
  })

  describe('leader skill: The Circle Continues', () => {
    it('has passive_round_start effect', () => {
      const effect = grandmother_rot.leaderSkill.effects[0]
      expect(effect.type).toBe('passive_round_start')
      expect(effect.condition.hasEffect).toBe('poison')
      expect(effect.heal.atkPercent).toBe(5)
      expect(effect.extendEffect.type).toBe('poison')
      expect(effect.extendEffect.duration).toBe(1)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/__tests__/grandmother-rot-template.test.js`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

Create `src/data/heroes/5star/grandmother_rot.js`:

```javascript
import { EffectType } from '../../statusEffects.js'

export const grandmother_rot = {
  id: 'grandmother_rot',
  name: 'Grandmother Rot',
  rarity: 5,
  classId: 'druid',
  baseStats: { hp: 115, atk: 30, def: 32, spd: 11, mp: 80 },
  skills: [
    {
      name: 'Mulching Strike',
      description: 'Deal 90% ATK damage. Heal self for 20% of damage dealt.',
      mpCost: 15,
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 90,
      healSelfPercent: 20
    },
    {
      name: 'Decomposition',
      description: 'Apply Decomposition to ally for 3 turns: gain Shield equal to 10% caster ATK at turn start, then heal for 25% caster ATK.',
      mpCost: 20,
      skillUnlockLevel: 1,
      targetType: 'ally',
      noDamage: true,
      effects: [
        { type: EffectType.DECOMPOSITION, target: 'ally', duration: 3, shieldAtkPercent: 10, healAtkPercent: 25 }
      ]
    },
    {
      name: 'Blight Bloom',
      description: 'Deal 60% ATK damage to all enemies. Poisoned enemies take 90% ATK instead.',
      mpCost: 25,
      skillUnlockLevel: 3,
      targetType: 'all_enemies',
      damagePercent: 60,
      ifPoisoned: { damagePercent: 90 }
    },
    {
      name: 'Fungal Network',
      description: 'Heal all allies for 15% caster ATK. Allies with Poison heal for 35% ATK instead and have Poison removed.',
      mpCost: 32,
      skillUnlockLevel: 6,
      targetType: 'all_allies',
      healPercent: 15,
      ifPoisoned: { healPercent: 35, removePoisonFromAllies: true }
    },
    {
      name: 'The Great Composting',
      description: 'Remove all Poison from enemies. Each stack grants all allies Regen (20% ATK) for 2 turns (max 6 turns). Grants 2 turns Regen baseline if no Poison consumed.',
      mpCost: 45,
      skillUnlockLevel: 12,
      targetType: 'special',
      consumesPoisonFromEnemies: true,
      baselineRegen: { type: EffectType.REGEN, duration: 2, atkPercent: 20 },
      perPoisonConsumed: { type: EffectType.REGEN, durationPerStack: 2, maxDuration: 6, atkPercent: 20 }
    }
  ],
  leaderSkill: {
    name: 'The Circle Continues',
    description: 'At the start of each round, if any ally has Poison, heal them for 5% of caster ATK and extend Poison duration by 1 turn.',
    effects: [
      {
        type: 'passive_round_start',
        condition: { hasEffect: 'poison' },
        heal: { atkPercent: 5 },
        extendEffect: { type: 'poison', duration: 1 }
      }
    ]
  }
}
```

**Step 4: Update index file**

Modify `src/data/heroes/5star/index.js` to add import and export:

Add import at top:
```javascript
import { grandmother_rot } from './grandmother_rot.js'
```

Add to heroes object:
```javascript
  grandmother_rot,
```

**Step 5: Run test to verify it passes**

Run: `npm test -- src/data/__tests__/grandmother-rot-template.test.js`
Expected: PASS

**Step 6: Commit**

```bash
git add src/data/heroes/5star/grandmother_rot.js src/data/heroes/5star/index.js src/data/__tests__/grandmother-rot-template.test.js
git commit -m "feat(heroes): add Grandmother Rot 5-star druid template"
```

---

## Task 3: Create Penny Dreadful Hero Template

**Files:**
- Create: `src/data/heroes/4star/penny_dreadful.js`
- Modify: `src/data/heroes/4star/index.js`
- Test: `src/data/__tests__/penny-dreadful-template.test.js`

**Step 1: Write the failing test**

Create `src/data/__tests__/penny-dreadful-template.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import { penny_dreadful } from '../heroes/4star/penny_dreadful'
import { EffectType } from '../statusEffects'

describe('Penny Dreadful hero template', () => {
  it('exists with correct identity', () => {
    expect(penny_dreadful).toBeDefined()
    expect(penny_dreadful.id).toBe('penny_dreadful')
    expect(penny_dreadful.name).toBe('Penny Dreadful')
    expect(penny_dreadful.rarity).toBe(4)
    expect(penny_dreadful.classId).toBe('alchemist')
  })

  it('has correct base stats', () => {
    expect(penny_dreadful.baseStats).toEqual({
      hp: 78,
      atk: 36,
      def: 16,
      spd: 15,
      mp: 65
    })
  })

  it('has 5 skills', () => {
    expect(penny_dreadful.skills).toHaveLength(5)
  })

  describe('A Spot of Tea skill', () => {
    const skill = penny_dreadful.skills.find(s => s.name === 'A Spot of Tea')

    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.essenceCost).toBe(12)
      expect(skill.targetType).toBe('enemy')
      expect(skill.damagePercent).toBe(80)
      expect(skill.usesVolatility).toBe(true)
    })

    it('applies Poison effect', () => {
      const effect = skill.effects.find(e => e.type === EffectType.POISON)
      expect(effect).toBeDefined()
      expect(effect.duration).toBe(2)
      expect(effect.atkPercent).toBe(25)
    })
  })

  describe('The Good Silver skill', () => {
    const skill = penny_dreadful.skills.find(s => s.name === 'The Good Silver')

    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.essenceCost).toBe(15)
      expect(skill.damagePercent).toBe(70)
    })

    it('applies SPD_DOWN and ATK_DOWN effects', () => {
      const spdDown = skill.effects.find(e => e.type === EffectType.SPD_DOWN)
      const atkDown = skill.effects.find(e => e.type === EffectType.ATK_DOWN)
      expect(spdDown).toBeDefined()
      expect(spdDown.value).toBe(20)
      expect(atkDown).toBeDefined()
      expect(atkDown.value).toBe(15)
    })
  })

  describe('Poison Cocktail skill', () => {
    const skill = penny_dreadful.skills.find(s => s.name === 'Poison Cocktail')

    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.essenceCost).toBe(20)
      expect(skill.damagePercent).toBe(100)
      expect(skill.skillUnlockLevel).toBe(3)
    })

    it('has debuff thresholds for Marked scaling', () => {
      expect(skill.debuffThresholds).toBeDefined()
      expect(skill.debuffThresholds.at2.type).toBe(EffectType.MARKED)
      expect(skill.debuffThresholds.at2.value).toBe(25)
      expect(skill.debuffThresholds.at3.value).toBe(35)
      expect(skill.debuffThresholds.at4.refreshAllDebuffs).toBe(1)
    })
  })

  describe('Spring Cleaning skill', () => {
    const skill = penny_dreadful.skills.find(s => s.name === 'Spring Cleaning')

    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.essenceCost).toBe(18)
      expect(skill.targetType).toBe('all_allies')
      expect(skill.cleanseDebuffs).toBe(1)
    })

    it('grants DEF_UP if cleansed', () => {
      expect(skill.ifCleansed.type).toBe(EffectType.DEF_UP)
      expect(skill.ifCleansed.value).toBe(15)
    })
  })

  describe('Tidy Up skill', () => {
    const skill = penny_dreadful.skills.find(s => s.name === 'Tidy Up')

    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.essenceCost).toBe(28)
      expect(skill.targetType).toBe('all_enemies')
      expect(skill.damagePercent).toBe(70)
      expect(skill.skillUnlockLevel).toBe(12)
    })

    it('has debuff scaling with cap', () => {
      expect(skill.bonusDamagePerDebuff).toBe(20)
      expect(skill.maxBonusDamage).toBe(100)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/__tests__/penny-dreadful-template.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/data/heroes/4star/penny_dreadful.js`:

```javascript
import { EffectType } from '../../statusEffects.js'

export const penny_dreadful = {
  id: 'penny_dreadful',
  name: 'Penny Dreadful',
  rarity: 4,
  classId: 'alchemist',
  baseStats: { hp: 78, atk: 36, def: 16, spd: 15, mp: 65 },
  skills: [
    {
      name: 'A Spot of Tea',
      description: 'Deal 80% ATK damage. Apply Poison (25% ATK) for 2 turns.',
      essenceCost: 12,
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 80,
      usesVolatility: true,
      effects: [
        { type: EffectType.POISON, target: 'enemy', duration: 2, atkPercent: 25 }
      ]
    },
    {
      name: 'The Good Silver',
      description: 'Deal 70% ATK damage. Apply SPD Down (-20%) and ATK Down (-15%) for 2 turns.',
      essenceCost: 15,
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 70,
      usesVolatility: true,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'enemy', duration: 2, value: 20 },
        { type: EffectType.ATK_DOWN, target: 'enemy', duration: 2, value: 15 }
      ]
    },
    {
      name: 'Poison Cocktail',
      description: 'Deal 100% ATK damage. 2+ debuffs: apply Marked (+25%). 3+ debuffs: Marked (+35%). 4+ debuffs: refresh all debuff durations by 1.',
      essenceCost: 20,
      skillUnlockLevel: 3,
      targetType: 'enemy',
      damagePercent: 100,
      usesVolatility: true,
      debuffThresholds: {
        at2: { type: EffectType.MARKED, duration: 3, value: 25 },
        at3: { type: EffectType.MARKED, duration: 3, value: 35 },
        at4: { refreshAllDebuffs: 1 }
      }
    },
    {
      name: 'Spring Cleaning',
      description: 'Cleanse one debuff from each ally. Grant DEF Up (+15%) for 2 turns to allies who had a debuff cleansed.',
      essenceCost: 18,
      skillUnlockLevel: 6,
      targetType: 'all_allies',
      noDamage: true,
      cleanseDebuffs: 1,
      ifCleansed: { type: EffectType.DEF_UP, duration: 2, value: 15 }
    },
    {
      name: 'Tidy Up',
      description: 'Deal 70% ATK damage to all enemies. +20% damage per debuff across all enemies (max +100%).',
      essenceCost: 28,
      skillUnlockLevel: 12,
      targetType: 'all_enemies',
      damagePercent: 70,
      usesVolatility: true,
      bonusDamagePerDebuff: 20,
      maxBonusDamage: 100
    }
  ]
}
```

**Step 4: Update index file**

Modify `src/data/heroes/4star/index.js`:

Add import:
```javascript
import { penny_dreadful } from './penny_dreadful.js'
```

Add to heroes object:
```javascript
  penny_dreadful,
```

**Step 5: Run test to verify it passes**

Run: `npm test -- src/data/__tests__/penny-dreadful-template.test.js`
Expected: PASS

**Step 6: Commit**

```bash
git add src/data/heroes/4star/penny_dreadful.js src/data/heroes/4star/index.js src/data/__tests__/penny-dreadful-template.test.js
git commit -m "feat(heroes): add Penny Dreadful 4-star alchemist template"
```

---

## Task 4: Create The Grateful Dead Hero Template

**Files:**
- Create: `src/data/heroes/3star/the_grateful_dead.js`
- Modify: `src/data/heroes/3star/index.js`
- Test: `src/data/__tests__/the-grateful-dead-template.test.js`

**Step 1: Write the failing test**

Create `src/data/__tests__/the-grateful-dead-template.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import { the_grateful_dead } from '../heroes/3star/the_grateful_dead'
import { EffectType } from '../statusEffects'

describe('The Grateful Dead hero template', () => {
  it('exists with correct identity', () => {
    expect(the_grateful_dead).toBeDefined()
    expect(the_grateful_dead.id).toBe('the_grateful_dead')
    expect(the_grateful_dead.name).toBe('The Grateful Dead')
    expect(the_grateful_dead.rarity).toBe(3)
    expect(the_grateful_dead.classId).toBe('knight')
  })

  it('has correct base stats (no mp for knight)', () => {
    expect(the_grateful_dead.baseStats).toEqual({
      hp: 105,
      atk: 24,
      def: 26,
      spd: 9
    })
  })

  it('has 5 skills', () => {
    expect(the_grateful_dead.skills).toHaveLength(5)
  })

  describe('Grave Tap skill', () => {
    const skill = the_grateful_dead.skills.find(s => s.name === 'Grave Tap')

    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.valorRequired).toBe(0)
      expect(skill.targetType).toBe('enemy')
      expect(skill.damagePercent).toBe(85)
      expect(skill.valorGain).toBe(10)
    })
  })

  describe('A Minor Inconvenience skill', () => {
    const skill = the_grateful_dead.skills.find(s => s.name === 'A Minor Inconvenience')

    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.valorRequired).toBe(15)
      expect(skill.targetType).toBe('self')
      expect(skill.noDamage).toBe(true)
    })

    it('cleanses stun, sleep, and heal_block', () => {
      expect(skill.cleanseSelf).toContain('stun')
      expect(skill.cleanseSelf).toContain('sleep')
      expect(skill.cleanseSelf).toContain('heal_block')
    })

    it('applies Riposte effect', () => {
      const effect = skill.effects.find(e => e.type === EffectType.RIPOSTE)
      expect(effect).toBeDefined()
      expect(effect.duration).toBe(2)
    })
  })

  describe('Cold Comfort skill', () => {
    const skill = the_grateful_dead.skills.find(s => s.name === 'Cold Comfort')

    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.valorRequired).toBe(25)
      expect(skill.targetType).toBe('ally')
      expect(skill.skillUnlockLevel).toBe(3)
    })

    it('applies Shield effect based on max HP', () => {
      const effect = skill.effects.find(e => e.type === EffectType.SHIELD)
      expect(effect).toBeDefined()
      expect(effect.shieldPercentMaxHp).toBe(30)
    })
  })

  describe('Bygone Valor skill', () => {
    const skill = the_grateful_dead.skills.find(s => s.name === 'Bygone Valor')

    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.valorRequired).toBe(1)
      expect(skill.consumesAllValor).toBe(true)
      expect(skill.targetType).toBe('all_enemies')
      expect(skill.skillUnlockLevel).toBe(6)
    })

    it('has correct damage scaling', () => {
      expect(skill.damagePercent).toBe(60)
      expect(skill.bonusDamagePerValor).toBe(1.0)
      expect(skill.maxBonusDamage).toBe(100)
      expect(skill.healSelfPercent).toBe(50)
    })

    it('applies DEF_DOWN at 100 Valor', () => {
      expect(skill.at100Valor).toBeDefined()
      const effect = skill.at100Valor.effects[0]
      expect(effect.type).toBe(EffectType.DEF_DOWN)
      expect(effect.value).toBe(20)
    })
  })

  describe('Already Dead passive', () => {
    const skill = the_grateful_dead.skills.find(s => s.name === 'Already Dead')

    it('is marked as passive with valorThreshold type', () => {
      expect(skill).toBeDefined()
      expect(skill.isPassive).toBe(true)
      expect(skill.passiveType).toBe('valorThreshold')
      expect(skill.skillUnlockLevel).toBe(12)
    })

    it('has correct thresholds', () => {
      const thresholds = skill.thresholds
      expect(thresholds).toHaveLength(4)
      expect(thresholds[0]).toEqual({ valor: 25, stat: 'def', value: 10 })
      expect(thresholds[1]).toEqual({ valor: 50, stat: 'atk', value: 15 })
      expect(thresholds[2]).toEqual({ valor: 75, riposteLifesteal: 10 })
      expect(thresholds[3]).toEqual({ valor: 100, deathPrevention: true, oncePerBattle: true })
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/__tests__/the-grateful-dead-template.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/data/heroes/3star/the_grateful_dead.js`:

```javascript
import { EffectType } from '../../statusEffects.js'

export const the_grateful_dead = {
  id: 'the_grateful_dead',
  name: 'The Grateful Dead',
  rarity: 3,
  classId: 'knight',
  baseStats: { hp: 105, atk: 24, def: 26, spd: 9 },
  skills: [
    {
      name: 'Grave Tap',
      description: 'Deal 85% ATK damage. Gain 10 Valor.',
      skillUnlockLevel: 1,
      valorRequired: 0,
      targetType: 'enemy',
      damagePercent: 85,
      valorGain: 10
    },
    {
      name: 'A Minor Inconvenience',
      description: 'Cleanse Stun, Sleep, and Heal Block from self. Gain Riposte for 2 turns.',
      skillUnlockLevel: 1,
      valorRequired: 15,
      targetType: 'self',
      noDamage: true,
      cleanseSelf: ['stun', 'sleep', 'heal_block'],
      effects: [
        { type: EffectType.RIPOSTE, target: 'self', duration: 2 }
      ]
    },
    {
      name: 'Cold Comfort',
      description: "Grant ally Shield equal to 30% of Grateful Dead's max HP for 3 turns.",
      skillUnlockLevel: 3,
      valorRequired: 25,
      targetType: 'ally',
      noDamage: true,
      effects: [
        { type: EffectType.SHIELD, target: 'ally', duration: 3, shieldPercentMaxHp: 30 }
      ]
    },
    {
      name: 'Bygone Valor',
      description: 'Deal 60% ATK damage to all enemies. +1% per Valor consumed (max +100%). 50% lifesteal. At 100 Valor: apply DEF Down (-20%) for 2 turns.',
      skillUnlockLevel: 6,
      valorRequired: 1,
      consumesAllValor: true,
      targetType: 'all_enemies',
      damagePercent: 60,
      bonusDamagePerValor: 1.0,
      maxBonusDamage: 100,
      healSelfPercent: 50,
      at100Valor: {
        effects: [
          { type: EffectType.DEF_DOWN, target: 'all_enemies', duration: 2, value: 20 }
        ]
      }
    },
    {
      name: 'Already Dead',
      description: 'Passive: At 25 Valor: +10% DEF. At 50: +15% ATK. At 75: +10% Lifesteal on Riposte. At 100: Death Prevention (once per battle).',
      skillUnlockLevel: 12,
      isPassive: true,
      passiveType: 'valorThreshold',
      thresholds: [
        { valor: 25, stat: 'def', value: 10 },
        { valor: 50, stat: 'atk', value: 15 },
        { valor: 75, riposteLifesteal: 10 },
        { valor: 100, deathPrevention: true, oncePerBattle: true }
      ]
    }
  ]
}
```

**Step 4: Update index file**

Modify `src/data/heroes/3star/index.js`:

Add import:
```javascript
import { the_grateful_dead } from './the_grateful_dead.js'
```

Add to heroes object:
```javascript
  the_grateful_dead,
```

**Step 5: Run test to verify it passes**

Run: `npm test -- src/data/__tests__/the-grateful-dead-template.test.js`
Expected: PASS

**Step 6: Commit**

```bash
git add src/data/heroes/3star/the_grateful_dead.js src/data/heroes/3star/index.js src/data/__tests__/the-grateful-dead-template.test.js
git commit -m "feat(heroes): add The Grateful Dead 3-star knight template"
```

---

## Task 5: Create Deplorable Companions Banner

**Files:**
- Modify: `src/data/banners.js`
- Test: `src/data/__tests__/banners-deplorable-companions.test.js`

**Step 1: Write the failing test**

Create `src/data/__tests__/banners-deplorable-companions.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import { banners, getBannerById, getMonthlyBanner } from '../banners'

describe('Deplorable Companions Banner', () => {
  const banner = banners.find(b => b.id === 'deplorable_companions')

  it('should exist', () => {
    expect(banner).toBeDefined()
  })

  it('should have correct name and description', () => {
    expect(banner.name).toBe('Deplorable Companions')
    expect(banner.description).toContain('anti-heroes')
  })

  it('should be a monthly banner for May (repeats yearly)', () => {
    expect(banner.permanent).toBe(false)
    expect(banner.monthlySchedule).toEqual({ month: 5 })
  })

  it('should have all three deplorable heroes', () => {
    expect(banner.heroPool[5]).toContain('grandmother_rot')
    expect(banner.heroPool[4]).toContain('penny_dreadful')
    expect(banner.heroPool[3]).toContain('the_grateful_dead')
  })

  it('should be findable by id', () => {
    expect(getBannerById('deplorable_companions')).toBe(banner)
  })

  it('should be findable as May monthly banner', () => {
    expect(getMonthlyBanner(2026, 5)).toBe(banner)
  })

  it('should have a balanced hero pool across rarities', () => {
    expect(banner.heroPool[5]).toHaveLength(1)
    expect(banner.heroPool[4].length).toBeGreaterThanOrEqual(2)
    expect(banner.heroPool[3].length).toBeGreaterThanOrEqual(2)
    expect(banner.heroPool[2].length).toBeGreaterThanOrEqual(2)
    expect(banner.heroPool[1].length).toBeGreaterThanOrEqual(2)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/__tests__/banners-deplorable-companions.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**

Add to `src/data/banners.js` in the banners array (after golden_showers):

```javascript
  {
    id: 'deplorable_companions',
    name: 'Deplorable Companions',
    description: 'Unlikely allies emerge from the shadows. Featuring anti-heroes, reluctant saviors, and those who found their own equilibrium with darkness.',
    permanent: false,
    monthlySchedule: { month: 5 },
    heroPool: {
      5: ['grandmother_rot'],
      4: ['penny_dreadful', 'zina_the_desperate'],
      3: ['the_grateful_dead', 'vashek_the_unrelenting', 'village_healer'],
      2: ['militia_soldier', 'herb_gatherer', 'fennick'],
      1: ['beggar_monk', 'street_urchin', 'farm_hand']
    }
  }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/data/__tests__/banners-deplorable-companions.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/banners.js src/data/__tests__/banners-deplorable-companions.test.js
git commit -m "feat(banners): add Deplorable Companions May monthly banner"
```

---

## Task 6: Run Full Test Suite

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass (no regressions)

**Step 2: Commit any fixes if needed**

If tests fail, fix and commit.

---

## Task 7: Final Review and Merge Preparation

**Step 1: Review all changes**

```bash
git log --oneline feature/deplorable-companions
git diff main..feature/deplorable-companions --stat
```

**Step 2: Ensure clean commit history**

All commits should follow conventional commit format.

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add DECOMPOSITION effect | statusEffects.js |
| 2 | Grandmother Rot template | 5star/grandmother_rot.js |
| 3 | Penny Dreadful template | 4star/penny_dreadful.js |
| 4 | The Grateful Dead template | 3star/the_grateful_dead.js |
| 5 | Deplorable Companions banner | banners.js |
| 6 | Full test suite | - |
| 7 | Final review | - |

Each task follows TDD: write failing test, implement, verify pass, commit.
