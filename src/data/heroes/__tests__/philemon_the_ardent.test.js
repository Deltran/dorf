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
