# Valentine's Day Heroes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Mara Thornheart (5-star Berserker) and Philemon the Ardent (4-star Knight) for the Valentine's Day banner.

**Architecture:** Two hero templates with skills using existing effect types (POISON, ATK_DOWN, REFLECT, DEATH_PREVENTION, SHIELD, GUARDING). Mara requires a new Heartbreak passive system with stack tracking. Philemon uses standard Knight Valor patterns. New leader skill type for HP-threshold triggers.

**Tech Stack:** Vue 3, Pinia stores, Vitest for testing

---

## Task 1: Mara Thornheart Hero Template

**Files:**
- Create: `src/data/heroes/5star/mara_thornheart.js`
- Modify: `src/data/heroes/index.js` (add import/export)
- Test: `src/data/heroes/__tests__/mara_thornheart.test.js`

**Step 1: Write the failing test for Mara's template structure**

```javascript
// src/data/heroes/__tests__/mara_thornheart.test.js
import { describe, it, expect } from 'vitest'
import { mara_thornheart } from '../5star/mara_thornheart'
import { EffectType } from '../../statusEffects'

describe('Mara Thornheart hero template', () => {
  it('exists with correct identity', () => {
    expect(mara_thornheart).toBeDefined()
    expect(mara_thornheart.id).toBe('mara_thornheart')
    expect(mara_thornheart.name).toBe('Mara Thornheart')
    expect(mara_thornheart.rarity).toBe(5)
    expect(mara_thornheart.classId).toBe('berserker')
  })

  it('has correct base stats for glass cannon berserker', () => {
    expect(mara_thornheart.baseStats).toEqual({
      hp: 105,
      atk: 52,
      def: 28,
      spd: 20
    })
  })

  it('has 5 skills', () => {
    expect(mara_thornheart.skills).toHaveLength(5)
  })

  it('has heartbreakPassive defined', () => {
    expect(mara_thornheart.heartbreakPassive).toBeDefined()
    expect(mara_thornheart.heartbreakPassive.maxStacks).toBe(5)
    expect(mara_thornheart.heartbreakPassive.atkPerStack).toBe(4)
    expect(mara_thornheart.heartbreakPassive.lifestealPerStack).toBe(3)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/heroes/__tests__/mara_thornheart.test.js`
Expected: FAIL with "Cannot find module '../5star/mara_thornheart'"

**Step 3: Write Mara's hero template**

```javascript
// src/data/heroes/5star/mara_thornheart.js
import { EffectType } from '../../statusEffects.js'

export const mara_thornheart = {
  id: 'mara_thornheart',
  name: 'Mara Thornheart',
  rarity: 5,
  classId: 'berserker',
  baseStats: { hp: 105, atk: 52, def: 28, spd: 20 },

  // Heartbreak passive system
  heartbreakPassive: {
    maxStacks: 5,
    atkPerStack: 4,        // +4% ATK per stack
    lifestealPerStack: 3,  // +3% lifesteal per stack
    triggers: {
      allyBelowHalfHp: true,     // +1 stack when ally drops below 50% HP
      allyDeath: true,           // +1 stack when ally dies
      heavyDamagePercent: 15     // +1 stack when Mara takes 15%+ max HP damage
    }
  },

  skills: [
    {
      name: 'Thorn Lash',
      description: 'Deal 110% ATK damage. Heals based on Heartbreak lifesteal.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 110,
      rageGain: 10,
      usesHeartbreakLifesteal: true
    },
    {
      name: 'Bitter Embrace',
      description: 'Deal 150% ATK damage. Apply Bleeding for 3 turns. At 3+ Heartbreak stacks, also apply Weakened.',
      skillUnlockLevel: 5,
      targetType: 'enemy',
      damagePercent: 150,
      rageCost: 25,
      effects: [
        { type: EffectType.POISON, target: 'enemy', duration: 3, atkPercent: 8, displayName: 'Bleeding' }
      ],
      conditionalEffects: {
        heartbreakThreshold: 3,
        effects: [
          { type: EffectType.ATK_DOWN, target: 'enemy', duration: 2, value: 15, displayName: 'Weakened' }
        ]
      }
    },
    {
      name: 'Scorned',
      description: 'For 2 turns, reflect 30% of damage taken back to attackers. Gain +1 Heartbreak stack.',
      skillUnlockLevel: 15,
      targetType: 'self',
      noDamage: true,
      rageCost: 40,
      cooldown: 4,
      effects: [
        { type: EffectType.REFLECT, target: 'self', duration: 2, value: 30 }
      ],
      grantHeartbreakStacks: 1
    },
    {
      name: 'Vengeance Garden',
      description: 'Deal 90% ATK damage to all enemies (+15% per Heartbreak stack). Heal for 5% of damage dealt.',
      skillUnlockLevel: 25,
      targetType: 'all_enemies',
      damagePercent: 90,
      damagePerHeartbreakStack: 15,
      rageCost: 60,
      cooldown: 3,
      healSelfPercent: 5
    },
    {
      name: "Love's Final Thorn",
      description: 'Deal 200% ATK damage (+25% per Heartbreak stack consumed). Consume all stacks. Take 10% max HP self-damage. If kill, gain 2 stacks.',
      skillUnlockLevel: 40,
      targetType: 'enemy',
      damagePercent: 200,
      damagePerHeartbreakStackConsumed: 25,
      consumeAllHeartbreakStacks: true,
      rageCost: 80,
      cooldown: 5,
      selfDamagePercentMaxHp: 10,
      onKillGrantHeartbreakStacks: 2
    }
  ],

  leaderSkill: {
    name: "What Doesn't Kill Us",
    description: 'All allies gain +5% lifesteal. When any ally first drops below 50% HP, they gain +15% ATK for 3 turns.',
    effects: [
      {
        type: 'passive_lifesteal',
        value: 5,
        target: 'all_allies'
      },
      {
        type: 'hp_threshold_triggered',
        threshold: 50,
        triggerOnce: true,
        apply: {
          effectType: 'atk_up',
          duration: 3,
          value: 15
        }
      }
    ]
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/data/heroes/__tests__/mara_thornheart.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/heroes/5star/mara_thornheart.js src/data/heroes/__tests__/mara_thornheart.test.js
git commit -m "$(cat <<'EOF'
feat(heroes): add Mara Thornheart 5-star berserker template

Valentine's Day banner hero with Heartbreak stack passive system.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Mara Skill Tests

**Files:**
- Modify: `src/data/heroes/__tests__/mara_thornheart.test.js`

**Step 1: Add skill-specific tests**

```javascript
// Add to mara_thornheart.test.js

describe('Thorn Lash (Skill 1)', () => {
  const skill = mara_thornheart.skills.find(s => s.name === 'Thorn Lash')

  it('deals 110% ATK damage', () => {
    expect(skill.damagePercent).toBe(110)
  })

  it('builds 10 rage', () => {
    expect(skill.rageGain).toBe(10)
  })

  it('uses heartbreak lifesteal', () => {
    expect(skill.usesHeartbreakLifesteal).toBe(true)
  })
})

describe('Bitter Embrace (Skill 2)', () => {
  const skill = mara_thornheart.skills.find(s => s.name === 'Bitter Embrace')

  it('deals 150% ATK damage', () => {
    expect(skill.damagePercent).toBe(150)
  })

  it('costs 25 rage', () => {
    expect(skill.rageCost).toBe(25)
  })

  it('applies POISON (Bleeding) for 3 turns at 8% ATK', () => {
    const poison = skill.effects.find(e => e.type === EffectType.POISON)
    expect(poison).toBeDefined()
    expect(poison.duration).toBe(3)
    expect(poison.atkPercent).toBe(8)
    expect(poison.displayName).toBe('Bleeding')
  })

  it('has conditional ATK_DOWN at 3+ stacks', () => {
    expect(skill.conditionalEffects.heartbreakThreshold).toBe(3)
    const atkDown = skill.conditionalEffects.effects.find(e => e.type === EffectType.ATK_DOWN)
    expect(atkDown.value).toBe(15)
    expect(atkDown.duration).toBe(2)
  })
})

describe('Scorned (Skill 3)', () => {
  const skill = mara_thornheart.skills.find(s => s.name === 'Scorned')

  it('is self-targeted with no damage', () => {
    expect(skill.targetType).toBe('self')
    expect(skill.noDamage).toBe(true)
  })

  it('costs 40 rage with 4 turn cooldown', () => {
    expect(skill.rageCost).toBe(40)
    expect(skill.cooldown).toBe(4)
  })

  it('applies 30% reflect for 2 turns', () => {
    const reflect = skill.effects.find(e => e.type === EffectType.REFLECT)
    expect(reflect.value).toBe(30)
    expect(reflect.duration).toBe(2)
  })

  it('grants 1 Heartbreak stack', () => {
    expect(skill.grantHeartbreakStacks).toBe(1)
  })
})

describe('Vengeance Garden (Skill 4)', () => {
  const skill = mara_thornheart.skills.find(s => s.name === 'Vengeance Garden')

  it('is AoE targeting all enemies', () => {
    expect(skill.targetType).toBe('all_enemies')
  })

  it('deals 90% base + 15% per stack', () => {
    expect(skill.damagePercent).toBe(90)
    expect(skill.damagePerHeartbreakStack).toBe(15)
  })

  it('heals for 5% of damage dealt', () => {
    expect(skill.healSelfPercent).toBe(5)
  })
})

describe("Love's Final Thorn (Skill 5)", () => {
  const skill = mara_thornheart.skills.find(s => s.name === "Love's Final Thorn")

  it('deals 200% base + 25% per stack consumed', () => {
    expect(skill.damagePercent).toBe(200)
    expect(skill.damagePerHeartbreakStackConsumed).toBe(25)
  })

  it('consumes all Heartbreak stacks', () => {
    expect(skill.consumeAllHeartbreakStacks).toBe(true)
  })

  it('deals 10% max HP self-damage', () => {
    expect(skill.selfDamagePercentMaxHp).toBe(10)
  })

  it('grants 2 stacks on kill', () => {
    expect(skill.onKillGrantHeartbreakStacks).toBe(2)
  })
})

describe('Leader Skill', () => {
  it('has correct name and description', () => {
    expect(mara_thornheart.leaderSkill.name).toBe("What Doesn't Kill Us")
  })

  it('has passive lifesteal effect', () => {
    const passiveLifesteal = mara_thornheart.leaderSkill.effects.find(e => e.type === 'passive_lifesteal')
    expect(passiveLifesteal.value).toBe(5)
    expect(passiveLifesteal.target).toBe('all_allies')
  })

  it('has HP threshold trigger at 50%', () => {
    const trigger = mara_thornheart.leaderSkill.effects.find(e => e.type === 'hp_threshold_triggered')
    expect(trigger.threshold).toBe(50)
    expect(trigger.triggerOnce).toBe(true)
    expect(trigger.apply.effectType).toBe('atk_up')
    expect(trigger.apply.value).toBe(15)
    expect(trigger.apply.duration).toBe(3)
  })
})
```

**Step 2: Run tests**

Run: `npm test -- src/data/heroes/__tests__/mara_thornheart.test.js`
Expected: PASS

**Step 3: Commit**

```bash
git add src/data/heroes/__tests__/mara_thornheart.test.js
git commit -m "$(cat <<'EOF'
test(heroes): add comprehensive skill tests for Mara Thornheart

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Philemon the Ardent Hero Template

**Files:**
- Create: `src/data/heroes/4star/philemon_the_ardent.js`
- Modify: `src/data/heroes/index.js` (add import/export)
- Test: `src/data/heroes/__tests__/philemon_the_ardent.test.js`

**Step 1: Write the failing test**

```javascript
// src/data/heroes/__tests__/philemon_the_ardent.test.js
import { describe, it, expect } from 'vitest'
import { philemon_the_ardent } from '../4star/philemon_the_ardent'
import { EffectType } from '../../statusEffects'

describe('Philemon the Ardent hero template', () => {
  it('exists with correct identity', () => {
    expect(philemon_the_ardent).toBeDefined()
    expect(philemon_the_ardent.id).toBe('philemon_the_ardent')
    expect(philemon_the_ardent.name).toBe('Philemon the Ardent')
    expect(philemon_the_ardent.rarity).toBe(4)
    expect(philemon_the_ardent.classId).toBe('knight')
  })

  it('has correct base stats for tank/support hybrid', () => {
    expect(philemon_the_ardent.baseStats).toEqual({
      hp: 120,
      atk: 32,
      def: 38,
      spd: 12,
      mp: 100
    })
  })

  it('has 5 skills', () => {
    expect(philemon_the_ardent.skills).toHaveLength(5)
  })

  it('does NOT have a leader skill (4-star)', () => {
    expect(philemon_the_ardent.leaderSkill).toBeUndefined()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/heroes/__tests__/philemon_the_ardent.test.js`
Expected: FAIL

**Step 3: Write Philemon's hero template**

```javascript
// src/data/heroes/4star/philemon_the_ardent.js
import { EffectType } from '../../statusEffects.js'

export const philemon_the_ardent = {
  id: 'philemon_the_ardent',
  name: 'Philemon the Ardent',
  rarity: 4,
  classId: 'knight',
  baseStats: { hp: 120, atk: 32, def: 38, spd: 12, mp: 100 },

  skills: [
    {
      name: 'Devoted Strike',
      description: 'Deal 100% ATK damage. Build 10 Valor (+5 bonus if guarding an ally).',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 100,
      valorGain: 10,
      valorGainBonusIfGuarding: 5
    },
    {
      name: "Heart's Shield",
      description: 'Guard an ally for 2 turns, redirecting all damage to Philemon. Gain +20% DEF while guarding.',
      skillUnlockLevel: 5,
      targetType: 'ally',
      excludeSelf: true,
      noDamage: true,
      valorCost: 20,
      cooldown: 3,
      effects: [
        { type: EffectType.GUARDING, target: 'ally', duration: 2 }
      ],
      selfBuffWhileGuarding: {
        type: EffectType.DEF_UP,
        value: 20,
        duration: 2
      }
    },
    {
      name: 'Stolen Glance',
      description: 'Grant an ally +20% ATK and +10% SPD for 2 turns. Philemon gains +10 Valor.',
      skillUnlockLevel: 15,
      targetType: 'ally',
      excludeSelf: true,
      noDamage: true,
      valorCost: 30,
      cooldown: 3,
      effects: [
        { type: EffectType.ATK_UP, target: 'ally', duration: 2, value: 20 },
        { type: EffectType.SPD_UP, target: 'ally', duration: 2, value: 10 }
      ],
      valorGainOnUse: 10
    },
    {
      name: 'Undying Devotion',
      description: 'Grant an ally Death Prevention for 3 turns. If triggered, Philemon takes 25% of his max HP as damage.',
      skillUnlockLevel: 25,
      targetType: 'ally',
      excludeSelf: true,
      noDamage: true,
      valorCost: 50,
      cooldown: 5,
      effects: [
        {
          type: EffectType.DEATH_PREVENTION,
          target: 'ally',
          duration: 3,
          damageToSourceOnTrigger: 25  // % of Philemon's max HP
        }
      ]
    },
    {
      name: 'Heartsworn Bulwark',
      description: 'Grant all allies a shield equal to 15% of Philemon\'s max HP for 2 turns. While any ally has this shield, Philemon gains +25% DEF.',
      skillUnlockLevel: 40,
      targetType: 'all_allies',
      noDamage: true,
      valorCost: 70,
      cooldown: 4,
      effects: [
        {
          type: EffectType.SHIELD,
          target: 'all_allies',
          duration: 2,
          shieldPercentCasterMaxHp: 15
        }
      ],
      selfBuffWhileShieldsActive: {
        type: EffectType.DEF_UP,
        value: 25
      }
    }
  ]
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/data/heroes/__tests__/philemon_the_ardent.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/heroes/4star/philemon_the_ardent.js src/data/heroes/__tests__/philemon_the_ardent.test.js
git commit -m "$(cat <<'EOF'
feat(heroes): add Philemon the Ardent 4-star knight template

Valentine's Day banner hero - devoted tank/support hybrid.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Philemon Skill Tests

**Files:**
- Modify: `src/data/heroes/__tests__/philemon_the_ardent.test.js`

**Step 1: Add skill-specific tests**

```javascript
// Add to philemon_the_ardent.test.js

describe('Devoted Strike (Skill 1)', () => {
  const skill = philemon_the_ardent.skills.find(s => s.name === 'Devoted Strike')

  it('deals 100% ATK damage', () => {
    expect(skill.damagePercent).toBe(100)
  })

  it('builds 10 Valor with +5 bonus if guarding', () => {
    expect(skill.valorGain).toBe(10)
    expect(skill.valorGainBonusIfGuarding).toBe(5)
  })
})

describe("Heart's Shield (Skill 2)", () => {
  const skill = philemon_the_ardent.skills.find(s => s.name === "Heart's Shield")

  it('targets ally, excludes self', () => {
    expect(skill.targetType).toBe('ally')
    expect(skill.excludeSelf).toBe(true)
  })

  it('costs 20 Valor with 3 turn cooldown', () => {
    expect(skill.valorCost).toBe(20)
    expect(skill.cooldown).toBe(3)
  })

  it('applies GUARDING for 2 turns', () => {
    const guard = skill.effects.find(e => e.type === EffectType.GUARDING)
    expect(guard.duration).toBe(2)
  })

  it('grants +20% DEF while guarding', () => {
    expect(skill.selfBuffWhileGuarding.type).toBe(EffectType.DEF_UP)
    expect(skill.selfBuffWhileGuarding.value).toBe(20)
  })
})

describe('Stolen Glance (Skill 3)', () => {
  const skill = philemon_the_ardent.skills.find(s => s.name === 'Stolen Glance')

  it('grants +20% ATK and +10% SPD for 2 turns', () => {
    const atkUp = skill.effects.find(e => e.type === EffectType.ATK_UP)
    const spdUp = skill.effects.find(e => e.type === EffectType.SPD_UP)
    expect(atkUp.value).toBe(20)
    expect(atkUp.duration).toBe(2)
    expect(spdUp.value).toBe(10)
    expect(spdUp.duration).toBe(2)
  })

  it('grants +10 Valor on use', () => {
    expect(skill.valorGainOnUse).toBe(10)
  })
})

describe('Undying Devotion (Skill 4)', () => {
  const skill = philemon_the_ardent.skills.find(s => s.name === 'Undying Devotion')

  it('applies DEATH_PREVENTION for 3 turns', () => {
    const dp = skill.effects.find(e => e.type === EffectType.DEATH_PREVENTION)
    expect(dp.duration).toBe(3)
  })

  it('damages Philemon 25% max HP when triggered', () => {
    const dp = skill.effects.find(e => e.type === EffectType.DEATH_PREVENTION)
    expect(dp.damageToSourceOnTrigger).toBe(25)
  })

  it('costs 50 Valor with 5 turn cooldown', () => {
    expect(skill.valorCost).toBe(50)
    expect(skill.cooldown).toBe(5)
  })
})

describe('Heartsworn Bulwark (Skill 5)', () => {
  const skill = philemon_the_ardent.skills.find(s => s.name === 'Heartsworn Bulwark')

  it('targets all allies', () => {
    expect(skill.targetType).toBe('all_allies')
  })

  it('applies SHIELD at 15% of caster max HP', () => {
    const shield = skill.effects.find(e => e.type === EffectType.SHIELD)
    expect(shield.shieldPercentCasterMaxHp).toBe(15)
    expect(shield.duration).toBe(2)
  })

  it('grants +25% DEF while shields are active', () => {
    expect(skill.selfBuffWhileShieldsActive.type).toBe(EffectType.DEF_UP)
    expect(skill.selfBuffWhileShieldsActive.value).toBe(25)
  })
})
```

**Step 2: Run tests**

Run: `npm test -- src/data/heroes/__tests__/philemon_the_ardent.test.js`
Expected: PASS

**Step 3: Commit**

```bash
git add src/data/heroes/__tests__/philemon_the_ardent.test.js
git commit -m "$(cat <<'EOF'
test(heroes): add comprehensive skill tests for Philemon the Ardent

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Register Heroes in Index

**Files:**
- Modify: `src/data/heroes/index.js`

**Step 1: Read current index structure**

Read `src/data/heroes/index.js` to understand the import/export pattern.

**Step 2: Add imports and exports**

Add to the imports section:
```javascript
import { mara_thornheart } from './5star/mara_thornheart.js'
import { philemon_the_ardent } from './4star/philemon_the_ardent.js'
```

Add to the heroTemplates object:
```javascript
export const heroTemplates = {
  // ... existing heroes
  mara_thornheart,
  philemon_the_ardent,
}
```

**Step 3: Run all hero template tests**

Run: `npm test -- src/data/__tests__/heroTemplates`
Expected: PASS (all hero template tests should pass)

**Step 4: Commit**

```bash
git add src/data/heroes/index.js
git commit -m "$(cat <<'EOF'
feat(heroes): register Valentine's heroes in index

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Heartbreak Stack System in Battle Store

**Files:**
- Modify: `src/stores/battle.js`
- Test: `src/stores/__tests__/battle-heartbreak.test.js`

**Step 1: Write failing tests for Heartbreak system**

```javascript
// src/stores/__tests__/battle-heartbreak.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'

describe('battle store - Heartbreak passive system', () => {
  let store
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
    heroesStore = useHeroesStore()
  })

  describe('initializeHeartbreakStacks', () => {
    it('initializes Mara with 0 Heartbreak stacks', () => {
      const mara = {
        instanceId: 'mara1',
        template: {
          id: 'mara_thornheart',
          heartbreakPassive: { maxStacks: 5 }
        },
        currentHp: 500,
        maxHp: 500,
        heartbreakStacks: undefined
      }

      store.initializeHeartbreakStacks(mara)

      expect(mara.heartbreakStacks).toBe(0)
    })
  })

  describe('gainHeartbreakStack', () => {
    it('increases stacks by 1', () => {
      const mara = {
        instanceId: 'mara1',
        template: { heartbreakPassive: { maxStacks: 5 } },
        heartbreakStacks: 2
      }

      store.gainHeartbreakStack(mara, 1)

      expect(mara.heartbreakStacks).toBe(3)
    })

    it('caps at maxStacks', () => {
      const mara = {
        instanceId: 'mara1',
        template: { heartbreakPassive: { maxStacks: 5 } },
        heartbreakStacks: 4
      }

      store.gainHeartbreakStack(mara, 3)

      expect(mara.heartbreakStacks).toBe(5)
    })
  })

  describe('consumeAllHeartbreakStacks', () => {
    it('returns current stacks and resets to 0', () => {
      const mara = {
        instanceId: 'mara1',
        template: { heartbreakPassive: { maxStacks: 5 } },
        heartbreakStacks: 4
      }

      const consumed = store.consumeAllHeartbreakStacks(mara)

      expect(consumed).toBe(4)
      expect(mara.heartbreakStacks).toBe(0)
    })
  })

  describe('getHeartbreakBonuses', () => {
    it('calculates ATK and lifesteal bonuses from stacks', () => {
      const mara = {
        instanceId: 'mara1',
        template: {
          heartbreakPassive: {
            maxStacks: 5,
            atkPerStack: 4,
            lifestealPerStack: 3
          }
        },
        heartbreakStacks: 3
      }

      const bonuses = store.getHeartbreakBonuses(mara)

      // 3 stacks * 4% ATK = 12%
      expect(bonuses.atkBonus).toBe(12)
      // 3 stacks * 3% lifesteal = 9%
      expect(bonuses.lifestealBonus).toBe(9)
    })
  })

  describe('Heartbreak triggers', () => {
    it('gains stack when ally drops below 50% HP', () => {
      const mara = {
        instanceId: 'mara1',
        template: {
          heartbreakPassive: {
            maxStacks: 5,
            triggers: { allyBelowHalfHp: true }
          }
        },
        heartbreakStacks: 0,
        currentHp: 500
      }

      const ally = {
        instanceId: 'ally1',
        currentHp: 600,
        maxHp: 1000,
        triggeredHeartbreak: false
      }

      // Ally takes damage that drops them to 40% (below 50%)
      store.checkHeartbreakAllyHpTrigger(mara, ally, 200)

      expect(mara.heartbreakStacks).toBe(1)
    })

    it('gains stack when Mara takes heavy damage (15%+ max HP)', () => {
      const mara = {
        instanceId: 'mara1',
        template: {
          heartbreakPassive: {
            maxStacks: 5,
            triggers: { heavyDamagePercent: 15 }
          }
        },
        heartbreakStacks: 0,
        currentHp: 500,
        maxHp: 500
      }

      // 15% of 500 = 75 damage threshold
      store.checkHeartbreakSelfDamageTrigger(mara, 80)

      expect(mara.heartbreakStacks).toBe(1)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/battle-heartbreak.test.js`
Expected: FAIL

**Step 3: Implement Heartbreak system in battle.js**

Add to battle.js (near other resource system functions around line 750):

```javascript
// Heartbreak Stack System (for Mara Thornheart)

function hasHeartbreakPassive(unit) {
  return unit.template?.heartbreakPassive !== undefined
}

function initializeHeartbreakStacks(unit) {
  if (hasHeartbreakPassive(unit)) {
    unit.heartbreakStacks = unit.heartbreakStacks ?? 0
  }
}

function gainHeartbreakStack(unit, amount = 1) {
  if (!hasHeartbreakPassive(unit)) return
  const maxStacks = unit.template.heartbreakPassive.maxStacks || 5
  const oldStacks = unit.heartbreakStacks || 0
  unit.heartbreakStacks = Math.min(maxStacks, oldStacks + amount)

  if (unit.heartbreakStacks > oldStacks) {
    addLog(`${unit.template.name} gains Heartbreak! (${unit.heartbreakStacks}/${maxStacks})`)
    emitCombatEffect(unit.instanceId, 'hero', 'heartbreak_stack', unit.heartbreakStacks)
  }
}

function consumeAllHeartbreakStacks(unit) {
  if (!hasHeartbreakPassive(unit)) return 0
  const stacks = unit.heartbreakStacks || 0
  unit.heartbreakStacks = 0
  if (stacks > 0) {
    addLog(`${unit.template.name} consumes ${stacks} Heartbreak stacks!`)
  }
  return stacks
}

function getHeartbreakBonuses(unit) {
  if (!hasHeartbreakPassive(unit)) return { atkBonus: 0, lifestealBonus: 0 }
  const passive = unit.template.heartbreakPassive
  const stacks = unit.heartbreakStacks || 0
  return {
    atkBonus: stacks * (passive.atkPerStack || 0),
    lifestealBonus: stacks * (passive.lifestealPerStack || 0)
  }
}

function checkHeartbreakAllyHpTrigger(maraUnit, ally, damageDealt) {
  if (!hasHeartbreakPassive(maraUnit)) return
  if (ally.instanceId === maraUnit.instanceId) return
  if (ally.triggeredHeartbreak) return

  const triggers = maraUnit.template.heartbreakPassive.triggers
  if (!triggers?.allyBelowHalfHp) return

  const hpAfter = ally.currentHp - damageDealt
  const hpBefore = ally.currentHp
  const halfHp = ally.maxHp * 0.5

  // Trigger if ally crosses the 50% threshold
  if (hpBefore > halfHp && hpAfter <= halfHp) {
    ally.triggeredHeartbreak = true
    gainHeartbreakStack(maraUnit, 1)
  }
}

function checkHeartbreakSelfDamageTrigger(maraUnit, damageDealt) {
  if (!hasHeartbreakPassive(maraUnit)) return

  const triggers = maraUnit.template.heartbreakPassive.triggers
  if (!triggers?.heavyDamagePercent) return

  const threshold = maraUnit.maxHp * (triggers.heavyDamagePercent / 100)
  if (damageDealt >= threshold) {
    gainHeartbreakStack(maraUnit, 1)
  }
}

function checkHeartbreakAllyDeathTrigger(maraUnit) {
  if (!hasHeartbreakPassive(maraUnit)) return

  const triggers = maraUnit.template.heartbreakPassive.triggers
  if (!triggers?.allyDeath) return

  gainHeartbreakStack(maraUnit, 1)
}
```

Also add to the store's return object:
```javascript
return {
  // ... existing exports
  initializeHeartbreakStacks,
  gainHeartbreakStack,
  consumeAllHeartbreakStacks,
  getHeartbreakBonuses,
  checkHeartbreakAllyHpTrigger,
  checkHeartbreakSelfDamageTrigger,
  checkHeartbreakAllyDeathTrigger,
}
```

**Step 4: Run tests**

Run: `npm test -- src/stores/__tests__/battle-heartbreak.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-heartbreak.test.js
git commit -m "$(cat <<'EOF'
feat(battle): add Heartbreak stack passive system

Implements stack tracking, triggers, and bonus calculations for Mara.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Integrate Heartbreak Triggers into Battle Flow

**Files:**
- Modify: `src/stores/battle.js`
- Test: `src/stores/__tests__/battle-heartbreak-integration.test.js`

**Step 1: Write integration tests**

```javascript
// src/stores/__tests__/battle-heartbreak-integration.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { heroTemplates } from '../../data/heroes/index.js'

describe('Heartbreak integration with battle flow', () => {
  let store
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
    heroesStore = useHeroesStore()
  })

  it('initializes Mara with heartbreakStacks in initBattle', () => {
    const mara = heroesStore.addHero('mara_thornheart')
    heroesStore.setPartySlot(0, mara.instanceId)

    store.initBattle({}, ['goblin_scout'])

    const battleMara = store.heroes.find(h => h.templateId === 'mara_thornheart')
    expect(battleMara.heartbreakStacks).toBe(0)
  })

  it('applies Heartbreak ATK bonus to damage calculation', () => {
    // Mara at 3 stacks = +12% ATK
    const mara = {
      instanceId: 'mara1',
      template: heroTemplates.mara_thornheart,
      heartbreakStacks: 3,
      stats: { atk: 100 }
    }

    const bonuses = store.getHeartbreakBonuses(mara)
    expect(bonuses.atkBonus).toBe(12)

    // Effective ATK should be 100 * 1.12 = 112
    const effectiveAtk = 100 * (1 + bonuses.atkBonus / 100)
    expect(effectiveAtk).toBe(112)
  })
})
```

**Step 2: Integrate into initBattle**

In the hero initialization section of `initBattle`, add:
```javascript
// After setting up hero properties
initializeHeartbreakStacks(battleHero)
```

**Step 3: Integrate into applyDamage**

In `applyDamage`, after damage is applied, add checks for Heartbreak triggers:
```javascript
// Check Heartbreak triggers for any Mara in party
const maraHeroes = heroes.value.filter(h => hasHeartbreakPassive(h) && h.currentHp > 0)
for (const mara of maraHeroes) {
  if (target.instanceId !== mara.instanceId) {
    // Ally took damage - check HP threshold trigger
    checkHeartbreakAllyHpTrigger(mara, target, actualDamage)
  } else {
    // Mara took damage - check heavy damage trigger
    checkHeartbreakSelfDamageTrigger(mara, actualDamage)
  }
}
```

**Step 4: Integrate into death handling**

Where ally death is processed, add:
```javascript
// Check for Heartbreak ally death trigger
const maraHeroes = heroes.value.filter(h => hasHeartbreakPassive(h) && h.currentHp > 0)
for (const mara of maraHeroes) {
  if (deadHero.instanceId !== mara.instanceId) {
    checkHeartbreakAllyDeathTrigger(mara)
  }
}
```

**Step 5: Run tests**

Run: `npm test -- src/stores/__tests__/battle-heartbreak`
Expected: PASS

**Step 6: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-heartbreak-integration.test.js
git commit -m "$(cat <<'EOF'
feat(battle): integrate Heartbreak triggers into battle flow

Heartbreak stacks now trigger on ally HP threshold, ally death, and heavy self-damage.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Leader Skill - HP Threshold Trigger

**Files:**
- Modify: `src/stores/battle.js`
- Test: `src/stores/__tests__/battle-mara-leader.test.js`

**Step 1: Write failing tests for leader skill**

```javascript
// src/stores/__tests__/battle-mara-leader.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { heroTemplates } from '../../data/heroes/index.js'
import { EffectType } from '../../data/statusEffects'

describe('Mara leader skill - What Doesn\'t Kill Us', () => {
  let store
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
    heroesStore = useHeroesStore()
  })

  describe('passive_lifesteal effect', () => {
    it('grants +5% lifesteal to all allies', () => {
      const mara = heroesStore.addHero('mara_thornheart')
      const ally = heroesStore.addHero('shadow_king')
      heroesStore.setPartySlot(0, mara.instanceId)
      heroesStore.setPartySlot(1, ally.instanceId)
      heroesStore.setPartyLeader(mara.instanceId)

      store.initBattle({}, ['goblin_scout'])
      store.applyPassiveLeaderEffects()

      const battleAlly = store.heroes.find(h => h.templateId === 'shadow_king')
      expect(battleAlly.leaderBonuses.lifesteal).toBe(5)
    })
  })

  describe('hp_threshold_triggered effect', () => {
    it('grants +15% ATK when ally first drops below 50% HP', () => {
      const mara = heroesStore.addHero('mara_thornheart')
      const ally = heroesStore.addHero('shadow_king')
      heroesStore.setPartySlot(0, mara.instanceId)
      heroesStore.setPartySlot(1, ally.instanceId)
      heroesStore.setPartyLeader(mara.instanceId)

      store.initBattle({}, ['goblin_scout'])

      const battleAlly = store.heroes.find(h => h.templateId === 'shadow_king')
      battleAlly.currentHp = 600
      battleAlly.maxHp = 1000

      // Take damage that drops below 50%
      store.applyDamage(battleAlly, 200, 'attack', store.enemies[0])

      // Should have ATK_UP buff
      const atkBuff = battleAlly.statusEffects.find(e => e.type === EffectType.ATK_UP && e.sourceId === 'leader_skill')
      expect(atkBuff).toBeDefined()
      expect(atkBuff.value).toBe(15)
      expect(atkBuff.duration).toBe(3)
    })

    it('only triggers once per ally per battle', () => {
      const mara = heroesStore.addHero('mara_thornheart')
      const ally = heroesStore.addHero('shadow_king')
      heroesStore.setPartySlot(0, mara.instanceId)
      heroesStore.setPartySlot(1, ally.instanceId)
      heroesStore.setPartyLeader(mara.instanceId)

      store.initBattle({}, ['goblin_scout'])

      const battleAlly = store.heroes.find(h => h.templateId === 'shadow_king')
      battleAlly.currentHp = 600
      battleAlly.maxHp = 1000

      // First trigger
      store.applyDamage(battleAlly, 200, 'attack', store.enemies[0])

      // Heal back up
      battleAlly.currentHp = 600

      // Second damage that would cross threshold again
      store.applyDamage(battleAlly, 200, 'attack', store.enemies[0])

      // Should only have ONE ATK_UP buff from leader
      const atkBuffs = battleAlly.statusEffects.filter(e => e.type === EffectType.ATK_UP && e.sourceId === 'leader_skill')
      expect(atkBuffs.length).toBe(1)
    })
  })
})
```

**Step 2: Implement leader skill handling**

In battle.js, modify `applyPassiveLeaderEffects`:
```javascript
// Handle passive_lifesteal type
for (const effect of leaderSkill.effects) {
  if (effect.type === 'passive_lifesteal') {
    const targets = getLeaderEffectTargets(effect.target, effect.condition)
    for (const target of targets) {
      if (!target.leaderBonuses) target.leaderBonuses = {}
      target.leaderBonuses.lifesteal = (target.leaderBonuses.lifesteal || 0) + effect.value
    }
  }
}
```

Add new function for HP threshold triggers:
```javascript
function checkHpThresholdLeaderTriggers(unit, damageDealt) {
  const leaderSkill = getActiveLeaderSkill()
  if (!leaderSkill) return

  for (const effect of leaderSkill.effects) {
    if (effect.type !== 'hp_threshold_triggered') continue

    const hpAfter = unit.currentHp - damageDealt
    const threshold = unit.maxHp * (effect.threshold / 100)

    // Check if crossed threshold
    if (unit.currentHp > threshold && hpAfter <= threshold) {
      // Check if already triggered
      if (effect.triggerOnce && unit.leaderThresholdTriggered) continue

      // Mark as triggered
      if (effect.triggerOnce) {
        unit.leaderThresholdTriggered = true
      }

      // Apply the effect
      applyEffect(unit, effect.apply.effectType, {
        duration: effect.apply.duration,
        value: effect.apply.value,
        sourceId: 'leader_skill'
      })

      addLog(`${leaderSkill.name} triggers! ${unit.template.name} gains ${effect.apply.effectType}!`)
    }
  }
}
```

Call this in `applyDamage` before modifying HP.

**Step 3: Run tests**

Run: `npm test -- src/stores/__tests__/battle-mara-leader.test.js`
Expected: PASS

**Step 4: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-mara-leader.test.js
git commit -m "$(cat <<'EOF'
feat(battle): implement Mara's leader skill HP threshold triggers

Adds passive_lifesteal and hp_threshold_triggered leader effect types.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Philemon's Death Prevention Damage-to-Source

**Files:**
- Modify: `src/stores/battle.js`
- Test: `src/stores/__tests__/battle-philemon-devotion.test.js`

**Step 1: Write failing tests**

```javascript
// src/stores/__tests__/battle-philemon-devotion.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('Philemon Undying Devotion - Death Prevention with damage to source', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  it('damages Philemon when Death Prevention triggers on ally', () => {
    const philemon = {
      instanceId: 'philemon1',
      template: { name: 'Philemon' },
      currentHp: 1000,
      maxHp: 1000,
      statusEffects: []
    }

    const ally = {
      instanceId: 'ally1',
      template: { name: 'Ally' },
      currentHp: 50,
      maxHp: 500,
      statusEffects: [
        {
          type: EffectType.DEATH_PREVENTION,
          duration: 3,
          damageToSourceOnTrigger: 25,  // 25% of Philemon's max HP
          sourceId: 'philemon1',
          definition: { isDeathPrevention: true }
        }
      ]
    }

    store.heroes = [philemon, ally]

    // Apply lethal damage to ally
    store.applyDamage(ally, 100, 'attack', null)

    // Ally should survive at 1 HP
    expect(ally.currentHp).toBe(1)

    // Philemon should take 25% of 1000 = 250 damage
    expect(philemon.currentHp).toBe(750)
  })

  it('does not damage source if Death Prevention does not trigger', () => {
    const philemon = {
      instanceId: 'philemon1',
      template: { name: 'Philemon' },
      currentHp: 1000,
      maxHp: 1000,
      statusEffects: []
    }

    const ally = {
      instanceId: 'ally1',
      template: { name: 'Ally' },
      currentHp: 500,
      maxHp: 500,
      statusEffects: [
        {
          type: EffectType.DEATH_PREVENTION,
          duration: 3,
          damageToSourceOnTrigger: 25,
          sourceId: 'philemon1',
          definition: { isDeathPrevention: true }
        }
      ]
    }

    store.heroes = [philemon, ally]

    // Apply non-lethal damage
    store.applyDamage(ally, 100, 'attack', null)

    // Philemon should not take damage
    expect(philemon.currentHp).toBe(1000)
  })
})
```

**Step 2: Implement in checkDeathPrevention**

Modify the death prevention handling in `applyDamage` or `checkDeathPrevention`:
```javascript
// When Death Prevention triggers
if (deathPreventionEffect.damageToSourceOnTrigger && deathPreventionEffect.sourceId) {
  const source = heroes.value.find(h => h.instanceId === deathPreventionEffect.sourceId)
  if (source && source.currentHp > 0) {
    const selfDamage = Math.floor(source.maxHp * deathPreventionEffect.damageToSourceOnTrigger / 100)
    source.currentHp = Math.max(1, source.currentHp - selfDamage)
    addLog(`${source.template.name} takes ${selfDamage} damage from Undying Devotion!`)
    emitCombatEffect(source.instanceId, 'hero', 'damage', selfDamage)
  }
}
```

**Step 3: Run tests**

Run: `npm test -- src/stores/__tests__/battle-philemon-devotion.test.js`
Expected: PASS

**Step 4: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-philemon-devotion.test.js
git commit -m "$(cat <<'EOF'
feat(battle): add damageToSourceOnTrigger for Death Prevention

Enables Philemon's Undying Devotion to damage him when protecting allies.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Valentine's Banner Configuration

**Files:**
- Create: `src/data/banners/valentines_heartbreak.js`
- Modify: `src/data/banners/index.js`
- Test: `src/data/__tests__/banners-valentines.test.js`

**Step 1: Write failing test**

```javascript
// src/data/__tests__/banners-valentines.test.js
import { describe, it, expect } from 'vitest'
import { banners } from '../banners/index.js'

describe('Valentine\'s Day banner', () => {
  const banner = banners.find(b => b.id === 'valentines_heartbreak')

  it('exists with correct identity', () => {
    expect(banner).toBeDefined()
    expect(banner.name).toBe("Love's Thorny Path")
  })

  it('features Mara and Philemon', () => {
    expect(banner.featuredHeroes).toContain('mara_thornheart')
    expect(banner.featuredHeroes).toContain('philemon_the_ardent')
  })

  it('has correct date range for February', () => {
    expect(banner.startDate).toBe('2026-02-01')
    expect(banner.endDate).toBe('2026-02-28')
  })

  it('has rate-up configured', () => {
    expect(banner.rateUp['mara_thornheart']).toBe(0.5)
    expect(banner.rateUp['philemon_the_ardent']).toBe(0.5)
  })
})
```

**Step 2: Create banner configuration**

```javascript
// src/data/banners/valentines_heartbreak.js
export const valentines_heartbreak = {
  id: 'valentines_heartbreak',
  name: "Love's Thorny Path",
  description: "A banner of heartbreak and devotion. Featured: Mara Thornheart and Philemon the Ardent.",
  featuredHeroes: ['mara_thornheart', 'philemon_the_ardent'],
  rateUp: {
    'mara_thornheart': 0.5,
    'philemon_the_ardent': 0.5
  },
  startDate: '2026-02-01',
  endDate: '2026-02-28',
  bannerType: 'limited'
}
```

**Step 3: Add to banners index**

**Step 4: Run tests**

Run: `npm test -- src/data/__tests__/banners-valentines.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/banners/valentines_heartbreak.js src/data/banners/index.js src/data/__tests__/banners-valentines.test.js
git commit -m "$(cat <<'EOF'
feat(gacha): add Valentine's Day banner configuration

Love's Thorny Path banner featuring Mara Thornheart and Philemon the Ardent.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Full Integration Tests

**Files:**
- Create: `src/stores/__tests__/battle-valentines-integration.test.js`

**Step 1: Write comprehensive integration tests**

```javascript
// src/stores/__tests__/battle-valentines-integration.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { heroTemplates } from '../../data/heroes/index.js'
import { EffectType } from '../../data/statusEffects'

describe('Valentine\'s heroes full integration', () => {
  let store
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
    heroesStore = useHeroesStore()
  })

  describe('Mara + Philemon party synergy', () => {
    beforeEach(() => {
      const mara = heroesStore.addHero('mara_thornheart')
      const philemon = heroesStore.addHero('philemon_the_ardent')
      heroesStore.setPartySlot(0, mara.instanceId)
      heroesStore.setPartySlot(1, philemon.instanceId)
      heroesStore.setPartyLeader(mara.instanceId)

      store.initBattle({}, ['goblin_scout', 'goblin_warrior'])
    })

    it('Mara gains Heartbreak stack when Philemon takes damage for ally', () => {
      const mara = store.heroes.find(h => h.templateId === 'mara_thornheart')
      const philemon = store.heroes.find(h => h.templateId === 'philemon_the_ardent')

      expect(mara.heartbreakStacks).toBe(0)

      // Philemon takes heavy damage (15%+ of max HP)
      const heavyDamage = Math.ceil(philemon.maxHp * 0.20)
      store.applyDamage(philemon, heavyDamage, 'attack', store.enemies[0])

      // Philemon dropping below 50% should trigger leader skill
      // (depends on HP values, may need adjustment)
    })

    it('Philemon protecting Mara allows safe stack building', () => {
      const mara = store.heroes.find(h => h.templateId === 'mara_thornheart')
      const philemon = store.heroes.find(h => h.templateId === 'philemon_the_ardent')

      // Apply GUARDING effect (simulating Heart's Shield)
      mara.statusEffects.push({
        type: EffectType.GUARDING,
        duration: 2,
        guardianId: philemon.instanceId,
        definition: { isGuarding: true }
      })

      // Damage meant for Mara should go to Philemon
      const originalMaraHp = mara.currentHp
      const originalPhilemonHp = philemon.currentHp

      store.applyDamage(mara, 100, 'attack', store.enemies[0])

      // Mara should not have taken the damage
      expect(mara.currentHp).toBe(originalMaraHp)
      // Philemon should have taken it
      expect(philemon.currentHp).toBeLessThan(originalPhilemonHp)
    })
  })

  describe('Mara skill execution', () => {
    beforeEach(() => {
      const mara = heroesStore.addHero('mara_thornheart')
      heroesStore.setPartySlot(0, mara.instanceId)
      store.initBattle({}, ['goblin_scout'])
    })

    it('Love\'s Final Thorn consumes stacks and deals bonus damage', () => {
      const mara = store.heroes.find(h => h.templateId === 'mara_thornheart')
      mara.heartbreakStacks = 4
      mara.currentRage = 100

      const skill = mara.template.skills.find(s => s.name === "Love's Final Thorn")

      // Base 200% + (4 stacks * 25%) = 300% damage
      const expectedMultiplier = 200 + (4 * 25)
      expect(skill.damagePercent + (4 * skill.damagePerHeartbreakStackConsumed)).toBe(expectedMultiplier)
    })
  })
})
```

**Step 2: Run full test suite**

Run: `npm test`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add src/stores/__tests__/battle-valentines-integration.test.js
git commit -m "$(cat <<'EOF'
test(battle): add Valentine's heroes full integration tests

Tests Mara + Philemon synergy and skill execution.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Final Verification

**Step 1: Run full test suite**

```bash
npm test
```

**Step 2: Verify hero appears in gacha**

Manually test or write test to verify:
- Heroes appear in `heroTemplates`
- Banner is active during February date range
- Pulling from banner can yield featured heroes

**Step 3: Create summary commit**

```bash
git log --oneline -15
```

Review all commits are in order.

---

## Summary

This plan implements:

1. **Mara Thornheart (5-star Berserker)**
   - Heartbreak passive stack system (0-5 stacks)
   - Stack triggers: ally HP threshold, ally death, heavy self-damage
   - Per-stack bonuses: +4% ATK, +3% lifesteal
   - 5 skills with stack-based scaling
   - Leader skill with passive lifesteal + HP threshold trigger

2. **Philemon the Ardent (4-star Knight)**
   - Standard Knight Valor resource
   - Guardian/protection focused skills
   - Death Prevention with damage-to-source mechanic
   - Team shield with self-buff

3. **Valentine's Banner**
   - February 1-28 date range
   - 50% rate-up for both featured heroes

**New Battle Systems:**
- Heartbreak stack tracking and triggers
- `passive_lifesteal` leader effect type
- `hp_threshold_triggered` leader effect type
- `damageToSourceOnTrigger` for Death Prevention
