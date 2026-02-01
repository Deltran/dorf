import { describe, it, expect } from 'vitest'
import { fennick } from '../2star/fennick'
import { EffectType } from '../../statusEffects'

describe('Fennick (fennick)', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(fennick.id).toBe('fennick')
      expect(fennick.name).toBe('Fennick')
    })

    it('should be a 2-star ranger', () => {
      expect(fennick.rarity).toBe(2)
      expect(fennick.classId).toBe('ranger')
    })

    it('should have tank role (unusual for ranger)', () => {
      expect(fennick.role).toBe('tank')
    })

    it('should have correct base stats with MP', () => {
      expect(fennick.baseStats).toEqual({ hp: 80, atk: 16, def: 8, spd: 16, mp: 30 })
    })
  })

  describe('skills', () => {
    it('should have 4 skills total', () => {
      expect(fennick.skills).toHaveLength(4)
    })

    describe('Come and Get Me (L1)', () => {
      const skill = fennick.skills.find(s => s.name === 'Come and Get Me')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target self', () => {
        expect(skill.targetType).toBe('self')
      })

      it('should not deal damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should apply TAUNT for 2 turns', () => {
        const tauntEffect = skill.effects.find(e => e.type === EffectType.TAUNT)
        expect(tauntEffect).toBeDefined()
        expect(tauntEffect.target).toBe('self')
        expect(tauntEffect.duration).toBe(2)
      })

      it('should apply 30% EVASION for 2 turns', () => {
        const evasionEffect = skill.effects.find(e => e.type === EffectType.EVASION)
        expect(evasionEffect).toBeDefined()
        expect(evasionEffect.target).toBe('self')
        expect(evasionEffect.duration).toBe(2)
        expect(evasionEffect.value).toBe(30)
      })
    })

    describe('Counter-shot (L3)', () => {
      const skill = fennick.skills.find(s => s.name === 'Counter-shot')

      it('should exist and unlock at level 3', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should target enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should deal 90% ATK damage', () => {
        expect(skill.damagePercent).toBe(90)
      })

      it('should apply 30% THORNS for 2 turns', () => {
        expect(skill.effects).toHaveLength(1)
        const thornsEffect = skill.effects[0]
        expect(thornsEffect.type).toBe(EffectType.THORNS)
        expect(thornsEffect.target).toBe('self')
        expect(thornsEffect.duration).toBe(2)
        expect(thornsEffect.value).toBe(30)
      })
    })

    describe("Fox's Cunning (L6)", () => {
      const skill = fennick.skills.find(s => s.name === "Fox's Cunning")

      it('should exist and unlock at level 6', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should target self', () => {
        expect(skill.targetType).toBe('self')
      })

      it('should not deal damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should apply 20% EVASION for 3 turns', () => {
        const evasionEffect = skill.effects.find(e => e.type === EffectType.EVASION)
        expect(evasionEffect).toBeDefined()
        expect(evasionEffect.target).toBe('self')
        expect(evasionEffect.duration).toBe(3)
        expect(evasionEffect.value).toBe(20)
      })

      it('should apply +3 SPD_UP for 3 turns', () => {
        const spdEffect = skill.effects.find(e => e.type === EffectType.SPD_UP)
        expect(spdEffect).toBeDefined()
        expect(spdEffect.target).toBe('self')
        expect(spdEffect.duration).toBe(3)
        expect(spdEffect.value).toBe(3)
      })
    })

    describe('Pin Down (L12)', () => {
      const skill = fennick.skills.find(s => s.name === 'Pin Down')

      it('should exist and unlock at level 12', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should target enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should deal 100% ATK damage', () => {
        expect(skill.damagePercent).toBe(100)
      })

      it('should apply STUN for 1 turn', () => {
        expect(skill.effects).toHaveLength(1)
        const stunEffect = skill.effects[0]
        expect(stunEffect.type).toBe(EffectType.STUN)
        expect(stunEffect.target).toBe('enemy')
        expect(stunEffect.duration).toBe(1)
      })
    })
  })
})
