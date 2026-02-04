import { describe, it, expect } from 'vitest'
import { swift_arrow } from '../4star/swift_arrow'
import { EffectType } from '../../statusEffects'

describe('Swift Arrow', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(swift_arrow.id).toBe('swift_arrow')
      expect(swift_arrow.name).toBe('Swift Arrow')
    })

    it('should be a 4-star ranger', () => {
      expect(swift_arrow.rarity).toBe(4)
      expect(swift_arrow.classId).toBe('ranger')
    })

    it('should have correct base stats', () => {
      expect(swift_arrow.baseStats).toEqual({
        hp: 90,
        atk: 42,
        def: 22,
        spd: 20,
        mp: 55
      })
    })

    it('should NOT have a leader skill (4-star)', () => {
      expect(swift_arrow.leaderSkill).toBeUndefined()
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(swift_arrow.skills).toHaveLength(5)
    })

    describe('L1: Quick Shot', () => {
      const quickShot = () => swift_arrow.skills.find(s => s.name === 'Quick Shot')

      it('should exist and be unlocked at level 1', () => {
        expect(quickShot()).toBeDefined()
        expect(quickShot().skillUnlockLevel).toBe(1)
      })

      it('should not have MP or Focus cost (free skill)', () => {
        expect(quickShot().mpCost).toBeFalsy()
        expect(quickShot().focusCost).toBeFalsy()
      })

      it('should target a single enemy', () => {
        expect(quickShot().targetType).toBe('enemy')
      })

      it('should deal 90% ATK damage', () => {
        expect(quickShot().damagePercent).toBe(90)
      })

      it('should apply SPD_DOWN for 2 turns', () => {
        const spdDown = quickShot().effects.find(e => e.type === EffectType.SPD_DOWN)
        expect(spdDown).toBeDefined()
        expect(spdDown.target).toBe('enemy')
        expect(spdDown.duration).toBe(2)
        expect(spdDown.value).toBe(15)
      })
    })

    describe('L1: Pinning Volley', () => {
      const pinningVolley = () => swift_arrow.skills.find(s => s.name === 'Pinning Volley')

      it('should exist and be unlocked at level 1', () => {
        expect(pinningVolley()).toBeDefined()
        expect(pinningVolley().skillUnlockLevel).toBe(1)
      })

      it('should not have MP or Focus cost (free skill)', () => {
        expect(pinningVolley().mpCost).toBeFalsy()
        expect(pinningVolley().focusCost).toBeFalsy()
      })

      it('should target all enemies', () => {
        expect(pinningVolley().targetType).toBe('all_enemies')
      })

      it('should deal 60% ATK damage', () => {
        expect(pinningVolley().damagePercent).toBe(60)
      })

      it('should conditionally apply DEF_DOWN to debuffed enemies', () => {
        expect(pinningVolley().conditionalEffects).toBeDefined()
        const condEffect = pinningVolley().conditionalEffects[0]
        expect(condEffect.condition).toBe('target_has_debuff')
        expect(condEffect.type).toBe(EffectType.DEF_DOWN)
        expect(condEffect.duration).toBe(2)
        expect(condEffect.value).toBe(15)
      })
    })

    describe('L3: Nimble Reposition', () => {
      const nimbleReposition = () => swift_arrow.skills.find(s => s.name === 'Nimble Reposition')

      it('should exist and be unlocked at level 3', () => {
        expect(nimbleReposition()).toBeDefined()
        expect(nimbleReposition().skillUnlockLevel).toBe(3)
      })

      it('should not have MP or Focus cost (free skill)', () => {
        expect(nimbleReposition().mpCost).toBeFalsy()
        expect(nimbleReposition().focusCost).toBeFalsy()
      })

      it('should target self with no damage', () => {
        expect(nimbleReposition().targetType).toBe('self')
        expect(nimbleReposition().noDamage).toBe(true)
      })

      it('should grant DEBUFF_IMMUNE for 1 turn', () => {
        const debuffImmune = nimbleReposition().effects.find(e => e.type === EffectType.DEBUFF_IMMUNE)
        expect(debuffImmune).toBeDefined()
        expect(debuffImmune.duration).toBe(1)
      })

      it('should grant SPD_UP for 2 turns', () => {
        const spdUp = nimbleReposition().effects.find(e => e.type === EffectType.SPD_UP)
        expect(spdUp).toBeDefined()
        expect(spdUp.value).toBe(20)
        expect(spdUp.duration).toBe(2)
      })
    })

    describe('L6: Precision Strike', () => {
      const precisionStrike = () => swift_arrow.skills.find(s => s.name === 'Precision Strike')

      it('should exist and be unlocked at level 6', () => {
        expect(precisionStrike()).toBeDefined()
        expect(precisionStrike().skillUnlockLevel).toBe(6)
      })

      it('should not have MP or Focus cost (free skill)', () => {
        expect(precisionStrike().mpCost).toBeFalsy()
        expect(precisionStrike().focusCost).toBeFalsy()
      })

      it('should target a single enemy', () => {
        expect(precisionStrike().targetType).toBe('enemy')
      })

      it('should deal 140% base ATK damage', () => {
        expect(precisionStrike().damagePercent).toBe(140)
      })

      it('should have bonus effects based on target debuffs', () => {
        expect(precisionStrike().bonusIfTargetHas).toBeDefined()
        expect(precisionStrike().bonusIfTargetHas).toHaveLength(2)
      })
    })

    describe('L12: Flurry of Arrows', () => {
      const flurryOfArrows = () => swift_arrow.skills.find(s => s.name === 'Flurry of Arrows')

      it('should exist and be unlocked at level 12', () => {
        expect(flurryOfArrows()).toBeDefined()
        expect(flurryOfArrows().skillUnlockLevel).toBe(12)
      })

      it('should not have MP or Focus cost (free skill)', () => {
        expect(flurryOfArrows().mpCost).toBeFalsy()
        expect(flurryOfArrows().focusCost).toBeFalsy()
      })

      it('should target a single enemy', () => {
        expect(flurryOfArrows().targetType).toBe('enemy')
      })

      it('should hit 3 times', () => {
        expect(flurryOfArrows().multiHit).toBe(3)
      })

      it('should grant SWIFT_MOMENTUM on hit vs debuffed target', () => {
        expect(flurryOfArrows().onHitDebuffedTarget).toBeDefined()
        expect(flurryOfArrows().onHitDebuffedTarget.applyToSelf.type).toBe(EffectType.SWIFT_MOMENTUM)
      })
    })
  })
})
