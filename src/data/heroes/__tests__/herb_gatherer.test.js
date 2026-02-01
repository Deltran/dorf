import { describe, it, expect } from 'vitest'
import { herb_gatherer } from '../2star/herb_gatherer'
import { EffectType } from '../../statusEffects'

describe('Bertan the Gatherer (herb_gatherer)', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(herb_gatherer.id).toBe('herb_gatherer')
      expect(herb_gatherer.name).toBe('Bertan the Gatherer')
    })

    it('should be a 2-star druid', () => {
      expect(herb_gatherer.rarity).toBe(2)
      expect(herb_gatherer.classId).toBe('druid')
    })

    it('should have correct base stats with MP', () => {
      expect(herb_gatherer.baseStats).toEqual({ hp: 65, atk: 15, def: 18, spd: 10, mp: 55 })
    })
  })

  describe('skills', () => {
    it('should have 4 skills total', () => {
      expect(herb_gatherer.skills).toHaveLength(4)
    })

    describe('Herbal Remedy (L1)', () => {
      const skill = herb_gatherer.skills.find(s => s.name === 'Herbal Remedy')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should cost 12 MP', () => {
        expect(skill.mpCost).toBe(12)
      })

      it('should target an ally', () => {
        expect(skill.targetType).toBe('ally')
      })

      it('should heal for 120% ATK per description', () => {
        expect(skill.description).toContain('120% ATK')
      })

      it('should not have any status effects', () => {
        expect(skill.effects).toBeUndefined()
      })
    })

    describe('Antidote (L3)', () => {
      const skill = herb_gatherer.skills.find(s => s.name === 'Antidote')

      it('should exist and unlock at level 3', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should cost 10 MP', () => {
        expect(skill.mpCost).toBe(10)
      })

      it('should target an ally', () => {
        expect(skill.targetType).toBe('ally')
      })

      it('should not deal damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should cleanse DoT effects (poison, burn, bleed)', () => {
        expect(skill.cleanse).toBe('dots')
      })
    })

    describe('Herbal Tonic (L6)', () => {
      const skill = herb_gatherer.skills.find(s => s.name === 'Herbal Tonic')

      it('should exist and unlock at level 6', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should cost 14 MP', () => {
        expect(skill.mpCost).toBe(14)
      })

      it('should target an ally', () => {
        expect(skill.targetType).toBe('ally')
      })

      it('should not deal damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should apply REGEN effect for 3 turns at 45% ATK per turn', () => {
        expect(skill.effects).toHaveLength(1)
        const regenEffect = skill.effects[0]
        expect(regenEffect.type).toBe(EffectType.REGEN)
        expect(regenEffect.target).toBe('ally')
        expect(regenEffect.duration).toBe(3)
        expect(regenEffect.atkPercent).toBe(45)
      })
    })

    describe("Nature's Bounty (L12)", () => {
      const skill = herb_gatherer.skills.find(s => s.name === "Nature's Bounty")

      it('should exist and unlock at level 12', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should cost 18 MP', () => {
        expect(skill.mpCost).toBe(18)
      })

      it('should target an ally', () => {
        expect(skill.targetType).toBe('ally')
      })

      it('should heal for 150% ATK per description', () => {
        expect(skill.description).toContain('150% ATK')
      })

      it('should restore 15 MP to target', () => {
        expect(skill.mpRestore).toBe(15)
      })

      it('should grant Focus to Rangers', () => {
        expect(skill.grantsFocus).toBe(true)
      })
    })
  })
})
