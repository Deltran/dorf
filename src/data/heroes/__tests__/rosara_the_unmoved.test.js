import { describe, it, expect } from 'vitest'
import { rosara_the_unmoved } from '../5star/rosara_the_unmoved'
import { EffectType } from '../../statusEffects'

describe('Rosara the Unmoved', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(rosara_the_unmoved.id).toBe('rosara_the_unmoved')
      expect(rosara_the_unmoved.name).toBe('Rosara')
    })

    it('should be a 5-star knight', () => {
      expect(rosara_the_unmoved.rarity).toBe(5)
      expect(rosara_the_unmoved.classId).toBe('knight')
    })

    it('should have correct base stats', () => {
      expect(rosara_the_unmoved.baseStats).toEqual({
        hp: 130,
        atk: 25,
        def: 38,
        spd: 8
      })
    })
  })

  describe('basicAttackModifier', () => {
    it('should have Quiet Defiance passive', () => {
      expect(rosara_the_unmoved.basicAttackModifier).toBeDefined()
      expect(rosara_the_unmoved.basicAttackModifier.name).toBe('Quiet Defiance')
    })

    it('should unlock at level 1', () => {
      expect(rosara_the_unmoved.basicAttackModifier.skillUnlockLevel).toBe(1)
    })

    it('should deal 80% damage normally', () => {
      expect(rosara_the_unmoved.basicAttackModifier.baseDamagePercent).toBe(80)
    })

    it('should deal 120% damage if attacked last round', () => {
      expect(rosara_the_unmoved.basicAttackModifier.ifAttackedDamagePercent).toBe(120)
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(rosara_the_unmoved.skills).toHaveLength(5)
    })

    describe('Quiet Defiance (skill form)', () => {
      const skill = rosara_the_unmoved.skills.find(s => s.name === 'Quiet Defiance')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should be a passive skill', () => {
        expect(skill.isPassive).toBe(true)
        expect(skill.passiveType).toBe('basicAttackModifier')
      })
    })

    describe('Seat of Power', () => {
      const skill = rosara_the_unmoved.skills.find(s => s.name === 'Seat of Power')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should require 0 valor', () => {
        expect(skill.valorRequired).toBe(0)
      })

      it('should target self with no damage', () => {
        expect(skill.targetType).toBe('self')
        expect(skill.noDamage).toBe(true)
      })

      it('should be a defensive skill', () => {
        expect(skill.defensive).toBe(true)
      })

      it('should apply SEATED effect with scaling duration', () => {
        const seated = skill.effects.find(e => e.type === EffectType.SEATED)
        expect(seated).toBeDefined()
        expect(seated.duration.base).toBe(2)
        expect(seated.duration.at50).toBe(3)
      })

      it('should apply TAUNT effect with scaling duration', () => {
        const taunt = skill.effects.find(e => e.type === EffectType.TAUNT)
        expect(taunt).toBeDefined()
        expect(taunt.duration.base).toBe(2)
        expect(taunt.duration.at50).toBe(3)
      })

      it('should apply DEF_UP effect with scaling value and duration', () => {
        const defUp = skill.effects.find(e => e.type === EffectType.DEF_UP)
        expect(defUp).toBeDefined()
        expect(defUp.duration.base).toBe(2)
        expect(defUp.duration.at50).toBe(3)
        expect(defUp.value.base).toBe(20)
        expect(defUp.value.at25).toBe(30)
        expect(defUp.value.at75).toBe(40)
        expect(defUp.value.at100).toBe(50)
      })
    })

    describe('Weight of History', () => {
      const skill = rosara_the_unmoved.skills.find(s => s.name === 'Weight of History')

      it('should exist and unlock at level 3', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should require 25 valor', () => {
        expect(skill.valorRequired).toBe(25)
      })

      it('should target enemy with no damage', () => {
        expect(skill.targetType).toBe('enemy')
        expect(skill.noDamage).toBe(true)
      })

      it('should apply MARKED effect with scaling value and duration', () => {
        const marked = skill.effects.find(e => e.type === EffectType.MARKED)
        expect(marked).toBeDefined()
        expect(marked.duration.base).toBe(2)
        expect(marked.duration.at100).toBe(3)
        expect(marked.value.base).toBe(30)
        expect(marked.value.at50).toBe(40)
        expect(marked.value.at75).toBe(50)
      })
    })

    describe('Unwavering', () => {
      const skill = rosara_the_unmoved.skills.find(s => s.name === 'Unwavering')

      it('should exist and unlock at level 6', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should be a passive skill', () => {
        expect(skill.isPassive).toBe(true)
        expect(skill.passiveType).toBe('controlImmunity')
      })

      it('should be immune to stun and sleep', () => {
        expect(skill.immuneTo).toContain(EffectType.STUN)
        expect(skill.immuneTo).toContain(EffectType.SLEEP)
      })

      it('should grant 10 valor when immunity triggers', () => {
        expect(skill.onImmunityTrigger.valorGain).toBe(10)
      })
    })

    describe('Monument to Defiance', () => {
      const skill = rosara_the_unmoved.skills.find(s => s.name === 'Monument to Defiance')

      it('should exist and unlock at level 12', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should require 50 valor and consume all valor', () => {
        expect(skill.valorRequired).toBe(50)
        expect(skill.valorCost).toBe('all')
      })

      it('should target self with no damage', () => {
        expect(skill.targetType).toBe('self')
        expect(skill.noDamage).toBe(true)
      })

      it('should be a defensive skill', () => {
        expect(skill.defensive).toBe(true)
      })

      it('should apply REFLECT effect with scaling value, duration, and cap', () => {
        const reflect = skill.effects.find(e => e.type === EffectType.REFLECT)
        expect(reflect).toBeDefined()
        expect(reflect.duration.base).toBe(1)
        expect(reflect.duration.at75).toBe(2)
        expect(reflect.duration.at100).toBe(3)
        expect(reflect.value.base).toBe(50)
        expect(reflect.value.at75).toBe(75)
        expect(reflect.value.at100).toBe(100)
        expect(reflect.cap.base).toBe(100)
        expect(reflect.cap.at75).toBe(125)
        expect(reflect.cap.at100).toBe(150)
      })

      it('should grant ATK and DEF buffs to allies if Rosara dies during effect', () => {
        expect(skill.onDeathDuringEffect).toBeDefined()
        expect(skill.onDeathDuringEffect.target).toBe('all_allies')
        expect(skill.onDeathDuringEffect.effects).toHaveLength(2)

        const atkUp = skill.onDeathDuringEffect.effects.find(e => e.type === EffectType.ATK_UP)
        expect(atkUp).toBeDefined()
        expect(atkUp.duration).toBe(3)
        expect(atkUp.value.base).toBe(20)
        expect(atkUp.value.at75).toBe(25)
        expect(atkUp.value.at100).toBe(30)

        const defUp = skill.onDeathDuringEffect.effects.find(e => e.type === EffectType.DEF_UP)
        expect(defUp).toBeDefined()
        expect(defUp.duration).toBe(3)
        expect(defUp.value.base).toBe(20)
        expect(defUp.value.at75).toBe(25)
        expect(defUp.value.at100).toBe(30)
      })
    })
  })

  describe('leader skill', () => {
    it('should have The First to Stand leader skill', () => {
      expect(rosara_the_unmoved.leaderSkill).toBeDefined()
      expect(rosara_the_unmoved.leaderSkill.name).toBe('The First to Stand')
    })

    it('should have correct description', () => {
      expect(rosara_the_unmoved.leaderSkill.description).toBe('At battle start, the lowest HP% ally gains Taunt and +25% DEF for turn 1. Rosara takes 30% of damage dealt to that ally during round 1.')
    })

    it('should be a battle_start_protect_lowest effect', () => {
      const effect = rosara_the_unmoved.leaderSkill.effects[0]
      expect(effect.type).toBe('battle_start_protect_lowest')
    })

    it('should protect the lowest HP ally', () => {
      const effect = rosara_the_unmoved.leaderSkill.effects[0]
      expect(effect.protectLowestHp).toBe(true)
    })

    it('should grant taunt and DEF up', () => {
      const effect = rosara_the_unmoved.leaderSkill.effects[0]
      expect(effect.grantTaunt).toBe(true)
      expect(effect.grantDefUp).toBe(25)
      expect(effect.duration).toBe(1)
    })

    it('should share 30% of damage for 1 round', () => {
      const effect = rosara_the_unmoved.leaderSkill.effects[0]
      expect(effect.damageSharePercent).toBe(30)
      expect(effect.damageShareDuration).toBe(1)
    })
  })
})
