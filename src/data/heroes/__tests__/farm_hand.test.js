import { describe, it, expect } from 'vitest'
import { farm_hand } from '../1star/farm_hand'
import { EffectType } from '../../statusEffects'

describe('Farm Hand (Darl)', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(farm_hand.id).toBe('farm_hand')
      expect(farm_hand.name).toBe('Darl')
    })

    it('should be a 1-star berserker', () => {
      expect(farm_hand.rarity).toBe(1)
      expect(farm_hand.classId).toBe('berserker')
    })

    it('should have correct base stats (no MP for berserkers)', () => {
      expect(farm_hand.baseStats).toEqual({ hp: 70, atk: 30, def: 12, spd: 8 })
      expect(farm_hand.baseStats.mp).toBeUndefined()
    })
  })

  describe('skills', () => {
    it('should have 4 skills total', () => {
      expect(farm_hand.skills).toHaveLength(4)
    })

    describe('Pitchfork Jabs (L1)', () => {
      it('should cost 25 rage and unlock at level 1', () => {
        const skill = farm_hand.skills.find(s => s.name === 'Pitchfork Jabs')
        expect(skill).toBeDefined()
        expect(skill.rageCost).toBe(25)
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target random enemies with 3 hits', () => {
        const skill = farm_hand.skills.find(s => s.name === 'Pitchfork Jabs')
        expect(skill.targetType).toBe('random_enemies')
        expect(skill.hits).toBe(3)
      })
    })

    describe('Twine and Prayer (L3)', () => {
      it('should cost 10 rage and unlock at level 3', () => {
        const skill = farm_hand.skills.find(s => s.name === 'Twine and Prayer')
        expect(skill).toBeDefined()
        expect(skill.rageCost).toBe(10)
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should target self with no damage', () => {
        const skill = farm_hand.skills.find(s => s.name === 'Twine and Prayer')
        expect(skill.targetType).toBe('self')
        expect(skill.noDamage).toBe(true)
      })

      it('should heal 10% HP', () => {
        const skill = farm_hand.skills.find(s => s.name === 'Twine and Prayer')
        expect(skill.selfHealPercent).toBe(10)
      })

      it('should apply +10% ATK buff for 2 turns', () => {
        const skill = farm_hand.skills.find(s => s.name === 'Twine and Prayer')
        expect(skill.effects).toHaveLength(1)
        const atkEffect = skill.effects[0]
        expect(atkEffect.type).toBe(EffectType.ATK_UP)
        expect(atkEffect.target).toBe('self')
        expect(atkEffect.duration).toBe(2)
        expect(atkEffect.value).toBe(10)
      })
    })

    describe('Toad Strangler (L6)', () => {
      it('should cost 35 rage and unlock at level 6', () => {
        const skill = farm_hand.skills.find(s => s.name === 'Toad Strangler')
        expect(skill).toBeDefined()
        expect(skill.rageCost).toBe(35)
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should target single enemy with 4 multi-hits', () => {
        const skill = farm_hand.skills.find(s => s.name === 'Toad Strangler')
        expect(skill.targetType).toBe('enemy')
        expect(skill.multiHit).toBe(4)
      })
    })

    describe('Burndown (L12)', () => {
      it('should cost 65 rage and unlock at level 12', () => {
        const skill = farm_hand.skills.find(s => s.name === 'Burndown')
        expect(skill).toBeDefined()
        expect(skill.rageCost).toBe(65)
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should target all enemies', () => {
        const skill = farm_hand.skills.find(s => s.name === 'Burndown')
        expect(skill.targetType).toBe('all_enemies')
      })

      it('should apply poison for 10% ATK damage for 1 turn', () => {
        const skill = farm_hand.skills.find(s => s.name === 'Burndown')
        expect(skill.effects).toHaveLength(1)
        const poisonEffect = skill.effects[0]
        expect(poisonEffect.type).toBe(EffectType.POISON)
        expect(poisonEffect.target).toBe('enemy')
        expect(poisonEffect.duration).toBe(1)
        expect(poisonEffect.atkPercent).toBe(10)
      })
    })
  })
})
