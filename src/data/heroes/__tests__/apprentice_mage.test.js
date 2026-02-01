import { describe, it, expect } from 'vitest'
import { apprentice_mage } from '../2star/apprentice_mage'
import { EffectType } from '../../statusEffects'

describe('Calisus (apprentice_mage)', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(apprentice_mage.id).toBe('apprentice_mage')
      expect(apprentice_mage.name).toBe('Calisus')
    })

    it('should be a 2-star mage', () => {
      expect(apprentice_mage.rarity).toBe(2)
      expect(apprentice_mage.classId).toBe('mage')
    })

    it('should have correct base stats with MP', () => {
      expect(apprentice_mage.baseStats).toEqual({ hp: 55, atk: 28, def: 10, spd: 11, mp: 50 })
    })
  })

  describe('skills', () => {
    it('should have 4 skills total', () => {
      expect(apprentice_mage.skills).toHaveLength(4)
    })

    describe('Spark (L1)', () => {
      const skill = apprentice_mage.skills.find(s => s.name === 'Spark')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should cost 10 MP', () => {
        expect(skill.mpCost).toBe(10)
      })

      it('should target a single enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should have 120% ATK damage described in description', () => {
        expect(skill.description).toContain('120% ATK')
      })

      it('should not have any status effects', () => {
        expect(skill.effects).toBeUndefined()
      })
    })

    describe('Chain Lightning (L3)', () => {
      const skill = apprentice_mage.skills.find(s => s.name === 'Chain Lightning')

      it('should exist and unlock at level 3', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should cost 16 MP', () => {
        expect(skill.mpCost).toBe(16)
      })

      it('should target a single enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should have chain bounce mechanics', () => {
        expect(skill.chainBounce).toBeDefined()
        expect(skill.chainBounce.maxBounces).toBe(2)
        expect(skill.chainBounce.bounceMultiplier).toBe(50)
      })

      it('should deal 70% primary and 50% bounce damage per description', () => {
        expect(skill.description).toContain('70% ATK')
        expect(skill.description).toContain('50% ATK each')
      })
    })

    describe('Jolt (L6)', () => {
      const skill = apprentice_mage.skills.find(s => s.name === 'Jolt')

      it('should exist and unlock at level 6', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should cost 18 MP', () => {
        expect(skill.mpCost).toBe(18)
      })

      it('should target a single enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should apply STUN effect for 1 turn', () => {
        expect(skill.effects).toHaveLength(1)
        const stunEffect = skill.effects[0]
        expect(stunEffect.type).toBe(EffectType.STUN)
        expect(stunEffect.target).toBe('enemy')
        expect(stunEffect.duration).toBe(1)
      })

      it('should deal 70% ATK damage per description', () => {
        expect(skill.description).toContain('70% ATK')
      })
    })

    describe('Tempest (L12)', () => {
      const skill = apprentice_mage.skills.find(s => s.name === 'Tempest')

      it('should exist and unlock at level 12', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should cost 26 MP', () => {
        expect(skill.mpCost).toBe(26)
      })

      it('should target all enemies', () => {
        expect(skill.targetType).toBe('all_enemies')
      })

      it('should deal 130% ATK damage per description', () => {
        expect(skill.description).toContain('130% ATK')
      })

      it('should not have any status effects', () => {
        expect(skill.effects).toBeUndefined()
      })
    })
  })
})
