import { describe, it, expect } from 'vitest'
import { onibaba } from '../5star/onibaba'
import { EffectType } from '../../statusEffects'

describe('Onibaba, the Mountain Crone', () => {
  it('should have correct base stats', () => {
    expect(onibaba.baseStats).toEqual({
      hp: 115,
      atk: 30,
      def: 28,
      spd: 11,
      mp: 70
    })
  })

  it('should be a 5-star druid', () => {
    expect(onibaba.rarity).toBe(5)
    expect(onibaba.classId).toBe('druid')
  })

  it('should have correct identity', () => {
    expect(onibaba.id).toBe('onibaba')
    expect(onibaba.name).toBe('Onibaba, the Mountain Crone')
  })

  it('should have Hungry Ghost passive with 15% lifesteal', () => {
    expect(onibaba.passive).toBeDefined()
    expect(onibaba.passive.name).toBe('Hungry Ghost')
    expect(onibaba.passive.lifestealOnDamage).toBe(15)
  })

  it('should have 5 skills', () => {
    expect(onibaba.skills).toHaveLength(5)
  })

  describe('Soul Siphon', () => {
    const skill = onibaba?.skills?.find(s => s.name === 'Soul Siphon')

    it('exists and costs 0 MP', () => {
      expect(skill).toBeDefined()
      expect(skill.mpCost).toBe(0)
    })

    it('unlocks at level 1', () => {
      expect(skill.skillUnlockLevel).toBe(1)
    })

    it('deals 60% ATK damage', () => {
      expect(skill.damagePercent).toBe(60)
    })

    it('targets enemy', () => {
      expect(skill.targetType).toBe('enemy')
    })

    it('heals lowest HP ally for 100% of damage dealt', () => {
      expect(skill.healLowestAllyPercent).toBe(100)
    })
  })

  describe('Grudge Hex', () => {
    const skill = onibaba?.skills?.find(s => s.name === 'Grudge Hex')

    it('exists and costs 15 MP', () => {
      expect(skill).toBeDefined()
      expect(skill.mpCost).toBe(15)
    })

    it('unlocks at level 1', () => {
      expect(skill.skillUnlockLevel).toBe(1)
    })

    it('targets enemy with no direct damage', () => {
      expect(skill.targetType).toBe('enemy')
      expect(skill.noDamage).toBe(true)
    })

    it('applies poison for 40% ATK for 3 turns', () => {
      const poisonEffect = skill.effects.find(e => e.type === EffectType.POISON)
      expect(poisonEffect).toBeDefined()
      expect(poisonEffect.atkPercent).toBe(40)
      expect(poisonEffect.duration).toBe(3)
    })

    it('doubles poison if enemy attacks Onibaba', () => {
      const poisonEffect = skill.effects.find(e => e.type === EffectType.POISON)
      expect(poisonEffect.doubleIfAttacksCaster).toBe(true)
    })
  })

  describe('Spirit Ward', () => {
    const skill = onibaba?.skills?.find(s => s.name === 'Spirit Ward')

    it('exists and costs 25 MP', () => {
      expect(skill).toBeDefined()
      expect(skill.mpCost).toBe(25)
    })

    it('unlocks at level 3', () => {
      expect(skill.skillUnlockLevel).toBe(3)
    })

    it('targets ally with no direct damage', () => {
      expect(skill.targetType).toBe('ally')
      expect(skill.noDamage).toBe(true)
    })

    it('grants shield equal to 20% of caster max HP', () => {
      const shieldEffect = skill.effects.find(e => e.type === EffectType.SHIELD)
      expect(shieldEffect).toBeDefined()
      expect(shieldEffect.casterMaxHpPercent).toBe(20)
    })

    it('grants debuff immunity', () => {
      const debuffImmune = skill.effects.find(e => e.type === EffectType.DEBUFF_IMMUNE)
      expect(debuffImmune).toBeDefined()
    })
  })

  describe('Wailing Mask', () => {
    const skill = onibaba?.skills?.find(s => s.name === 'Wailing Mask')

    it('exists and costs 32 MP', () => {
      expect(skill).toBeDefined()
      expect(skill.mpCost).toBe(32)
    })

    it('unlocks at level 6', () => {
      expect(skill.skillUnlockLevel).toBe(6)
    })

    it('targets all enemies', () => {
      expect(skill.targetType).toBe('all_enemies')
    })

    it('costs 20% of current HP to use', () => {
      expect(skill.selfHpCostPercent).toBe(20)
    })

    it('deals HP cost as damage ignoring DEF', () => {
      expect(skill.dealHpCostAsDamage).toBe(true)
      expect(skill.ignoresDef).toBe(true)
    })

    it('heals all allies for 50% of damage dealt', () => {
      expect(skill.healAlliesPercent).toBe(50)
    })
  })

  describe("The Crone's Gift", () => {
    const skill = onibaba?.skills?.find(s => s.name === "The Crone's Gift")

    it('exists and costs 40 MP', () => {
      expect(skill).toBeDefined()
      expect(skill.mpCost).toBe(40)
    })

    it('unlocks at level 12', () => {
      expect(skill.skillUnlockLevel).toBe(12)
    })

    it('targets ally with no direct damage', () => {
      expect(skill.targetType).toBe('ally')
      expect(skill.noDamage).toBe(true)
    })

    it('costs 30% of current HP to use', () => {
      expect(skill.selfHpCostPercent).toBe(30)
    })

    it('grants ally +25% ATK for 3 turns', () => {
      const atkUp = skill.effects.find(e => e.type === EffectType.ATK_UP)
      expect(atkUp).toBeDefined()
      expect(atkUp.value).toBe(25)
      expect(atkUp.duration).toBe(3)
    })

    it('grants ally 20% lifesteal for 3 turns', () => {
      expect(skill.grantLifesteal).toBeDefined()
      expect(skill.grantLifesteal.value).toBe(20)
      expect(skill.grantLifesteal.duration).toBe(3)
    })
  })

  describe("Leader Skill: Grandmother's Vigil", () => {
    it('exists with correct name and description', () => {
      expect(onibaba.leaderSkill).toBeDefined()
      expect(onibaba.leaderSkill.name).toBe("Grandmother's Vigil")
    })

    it('triggers auto Soul Siphon when ally drops below 30% HP', () => {
      const effect = onibaba.leaderSkill.effects[0]
      expect(effect.type).toBe('ally_low_hp_auto_attack')
      expect(effect.hpThreshold).toBe(30)
      expect(effect.autoSkill).toBe('Soul Siphon')
      expect(effect.oncePerAlly).toBe(true)
    })
  })
})
