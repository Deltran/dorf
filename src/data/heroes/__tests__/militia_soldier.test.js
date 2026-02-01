import { describe, it, expect } from 'vitest'
import { militia_soldier } from '../2star/militia_soldier'
import { EffectType } from '../../statusEffects'

describe('Sorju, Gate Guard (militia_soldier)', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(militia_soldier.id).toBe('militia_soldier')
      expect(militia_soldier.name).toBe('Sorju, Gate Guard')
    })

    it('should be a 2-star knight', () => {
      expect(militia_soldier.rarity).toBe(2)
      expect(militia_soldier.classId).toBe('knight')
    })

    it('should have correct base stats (no MP for knights using Valor)', () => {
      expect(militia_soldier.baseStats).toEqual({ hp: 90, atk: 18, def: 28, spd: 13 })
      expect(militia_soldier.baseStats.mp).toBeUndefined()
    })
  })

  describe('skills', () => {
    it('should have 3 skills total', () => {
      expect(militia_soldier.skills).toHaveLength(3)
    })

    describe('High Initiative (L1)', () => {
      const skill = militia_soldier.skills.find(s => s.name === 'High Initiative')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should require 0 Valor', () => {
        expect(skill.valorRequired).toBe(0)
      })

      it('should target enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should have scaling damage based on Valor tiers', () => {
        expect(skill.damage).toEqual({ base: 70, at50: 85, at100: 100 })
      })

      it('should apply SPD_UP to self with Valor scaling', () => {
        expect(skill.effects).toHaveLength(1)
        const spdEffect = skill.effects[0]
        expect(spdEffect.type).toBe(EffectType.SPD_UP)
        expect(spdEffect.target).toBe('self')
        expect(spdEffect.duration).toBe(2)
        expect(spdEffect.value).toEqual({ base: 2, at25: 3, at75: 4, at100: 5 })
      })
    })

    describe('Blitz Strike (L3)', () => {
      const skill = militia_soldier.skills.find(s => s.name === 'Blitz Strike')

      it('should exist and unlock at level 3', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should require 25 Valor', () => {
        expect(skill.valorRequired).toBe(25)
      })

      it('should target all enemies', () => {
        expect(skill.targetType).toBe('all_enemies')
      })

      it('should filter to enemies that have not acted yet', () => {
        expect(skill.targetFilter).toBe('not_acted')
      })

      it('should have scaling damage based on Valor tiers', () => {
        expect(skill.damage).toEqual({ base: 100, at50: 105, at75: 110, at100: 115 })
      })

      it('should not have any additional effects', () => {
        expect(skill.effects).toBeUndefined()
      })
    })

    describe('Pinning Advance (L6)', () => {
      const skill = militia_soldier.skills.find(s => s.name === 'Pinning Advance')

      it('should exist and unlock at level 6', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should require 50 Valor', () => {
        expect(skill.valorRequired).toBe(50)
      })

      it('should target enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should have scaling damage based on Valor tiers', () => {
        expect(skill.damage).toEqual({ base: 100, at75: 115 })
      })

      it('should apply SPD_DOWN to enemy with scaling duration and value', () => {
        expect(skill.effects).toHaveLength(1)
        const spdDownEffect = skill.effects[0]
        expect(spdDownEffect.type).toBe(EffectType.SPD_DOWN)
        expect(spdDownEffect.target).toBe('enemy')
        expect(spdDownEffect.duration).toEqual({ base: 2, at100: 3 })
        expect(spdDownEffect.value).toEqual({ base: 5, at100: 6 })
      })
    })
  })
})
