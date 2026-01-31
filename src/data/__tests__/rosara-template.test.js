import { describe, it, expect } from 'vitest'
import { rosara_the_unmoved } from '../heroes/5star/rosara_the_unmoved'
import { EffectType } from '../statusEffects'

describe('Rosara the Unmoved hero template', () => {
  it('exists with correct identity', () => {
    expect(rosara_the_unmoved).toBeDefined()
    expect(rosara_the_unmoved.id).toBe('rosara_the_unmoved')
    expect(rosara_the_unmoved.name).toBe('Rosara the Unmoved')
    expect(rosara_the_unmoved.rarity).toBe(5)
    expect(rosara_the_unmoved.classId).toBe('knight')
  })

  it('has correct base stats', () => {
    expect(rosara_the_unmoved.baseStats).toEqual({
      hp: 130,
      atk: 25,
      def: 38,
      spd: 8
    })
  })

  it('has 5 skills (including passive)', () => {
    expect(rosara_the_unmoved.skills).toHaveLength(5)
  })

  it('has basicAttackModifier passive', () => {
    expect(rosara_the_unmoved.basicAttackModifier).toBeDefined()
    expect(rosara_the_unmoved.basicAttackModifier.name).toBe('Quiet Defiance')
    expect(rosara_the_unmoved.basicAttackModifier.baseDamagePercent).toBe(80)
    expect(rosara_the_unmoved.basicAttackModifier.ifAttackedDamagePercent).toBe(120)
  })

  it('has leader skill', () => {
    expect(rosara_the_unmoved.leaderSkill).toBeDefined()
    expect(rosara_the_unmoved.leaderSkill.name).toBe('The First to Stand')
  })

  describe('Quiet Defiance passive skill', () => {
    const skill = rosara_the_unmoved?.skills?.find(s => s.name === 'Quiet Defiance')

    it('is marked as passive with basicAttackModifier type', () => {
      expect(skill).toBeDefined()
      expect(skill.isPassive).toBe(true)
      expect(skill.passiveType).toBe('basicAttackModifier')
    })
  })

  describe('Seat of Power', () => {
    const skill = rosara_the_unmoved?.skills?.find(s => s.name === 'Seat of Power')

    it('exists and targets self', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('self')
    })

    it('is defensive and has no damage', () => {
      expect(skill.noDamage).toBe(true)
      expect(skill.defensive).toBe(true)
    })

    it('grants SEATED, TAUNT, and DEF_UP effects', () => {
      const seatedEffect = skill.effects.find(e => e.type === EffectType.SEATED)
      const tauntEffect = skill.effects.find(e => e.type === EffectType.TAUNT)
      const defUpEffect = skill.effects.find(e => e.type === EffectType.DEF_UP)

      expect(seatedEffect).toBeDefined()
      expect(tauntEffect).toBeDefined()
      expect(defUpEffect).toBeDefined()
    })

    it('has Valor-scaling duration and values', () => {
      const seatedEffect = skill.effects.find(e => e.type === EffectType.SEATED)
      const defUpEffect = skill.effects.find(e => e.type === EffectType.DEF_UP)

      // Duration scales at 50 Valor
      expect(seatedEffect.duration).toEqual({ base: 2, at50: 3 })
      // DEF Up value scales at multiple tiers
      expect(defUpEffect.value).toEqual({ base: 20, at25: 30, at75: 40, at100: 50 })
    })
  })

  describe('Weight of History', () => {
    const skill = rosara_the_unmoved?.skills?.find(s => s.name === 'Weight of History')

    it('exists and targets enemy', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('enemy')
    })

    it('requires 25 Valor', () => {
      expect(skill.valorRequired).toBe(25)
    })

    it('applies MARKED effect with Valor-scaling value', () => {
      const markedEffect = skill.effects.find(e => e.type === EffectType.MARKED)
      expect(markedEffect).toBeDefined()
      expect(markedEffect.value).toEqual({ base: 30, at50: 40, at75: 50 })
    })
  })

  describe('Unwavering passive', () => {
    const skill = rosara_the_unmoved?.skills?.find(s => s.name === 'Unwavering')

    it('is marked as passive with controlImmunity type', () => {
      expect(skill).toBeDefined()
      expect(skill.isPassive).toBe(true)
      expect(skill.passiveType).toBe('controlImmunity')
    })

    it('is immune to STUN and SLEEP', () => {
      expect(skill.immuneTo).toContain(EffectType.STUN)
      expect(skill.immuneTo).toContain(EffectType.SLEEP)
    })

    it('grants 10 Valor when immunity triggers', () => {
      expect(skill.onImmunityTrigger.valorGain).toBe(10)
    })
  })

  describe('Monument to Defiance', () => {
    const skill = rosara_the_unmoved?.skills?.find(s => s.name === 'Monument to Defiance')

    it('exists and targets self', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('self')
    })

    it('requires 50 Valor and consumes all', () => {
      expect(skill.valorRequired).toBe(50)
      expect(skill.valorCost).toBe('all')
    })

    it('applies REFLECT effect with Valor-scaling values', () => {
      const reflectEffect = skill.effects.find(e => e.type === EffectType.REFLECT)
      expect(reflectEffect).toBeDefined()
      expect(reflectEffect.value).toEqual({ base: 50, at75: 75, at100: 100 })
      expect(reflectEffect.cap).toEqual({ base: 100, at75: 125, at100: 150 })
    })

    it('has on-death trigger for ally buffs', () => {
      expect(skill.onDeathDuringEffect).toBeDefined()
      expect(skill.onDeathDuringEffect.target).toBe('all_allies')
      expect(skill.onDeathDuringEffect.effects).toHaveLength(2)
    })
  })

  describe('leader skill: The First to Stand', () => {
    it('protects lowest HP ally at battle start', () => {
      const effect = rosara_the_unmoved.leaderSkill.effects[0]
      expect(effect.type).toBe('battle_start_protect_lowest')
      expect(effect.protectLowestHp).toBe(true)
      expect(effect.grantTaunt).toBe(true)
      expect(effect.grantDefUp).toBe(25)
      expect(effect.damageSharePercent).toBe(30)
    })
  })
})
