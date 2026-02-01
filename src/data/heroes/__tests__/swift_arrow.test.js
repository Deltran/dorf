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

    describe('L1: Volley', () => {
      const volley = () => swift_arrow.skills.find(s => s.name === 'Volley')

      it('should exist and be unlocked at level 1', () => {
        expect(volley()).toBeDefined()
        expect(volley().skillUnlockLevel).toBe(1)
      })

      it('should not have MP or Focus cost (free skill)', () => {
        expect(volley().mpCost).toBeFalsy()
        expect(volley().focusCost).toBeFalsy()
      })

      it('should target random enemies', () => {
        expect(volley().targetType).toBe('random_enemies')
      })

      it('should hit 3 times', () => {
        expect(volley().multiHit).toBe(3)
      })
    })

    describe("L1: Hunter's Mark", () => {
      const huntersMark = () => swift_arrow.skills.find(s => s.name === "Hunter's Mark")

      it('should exist and be unlocked at level 1', () => {
        expect(huntersMark()).toBeDefined()
        expect(huntersMark().skillUnlockLevel).toBe(1)
      })

      it('should not have MP or Focus cost (free skill)', () => {
        expect(huntersMark().mpCost).toBeFalsy()
        expect(huntersMark().focusCost).toBeFalsy()
      })

      it('should target enemy with no direct damage', () => {
        expect(huntersMark().targetType).toBe('enemy')
        expect(huntersMark().noDamage).toBe(true)
      })

      it('should apply MARKED for 3 turns with 20% damage increase', () => {
        const markEffect = huntersMark().effects.find(e => e.type === EffectType.MARKED)
        expect(markEffect).toBeDefined()
        expect(markEffect.target).toBe('enemy')
        expect(markEffect.duration).toBe(3)
        expect(markEffect.value).toBe(20)
      })
    })

    describe('L3: Barrage', () => {
      const barrage = () => swift_arrow.skills.find(s => s.name === 'Barrage')

      it('should exist and be unlocked at level 3', () => {
        expect(barrage()).toBeDefined()
        expect(barrage().skillUnlockLevel).toBe(3)
      })

      it('should not have MP or Focus cost (free skill)', () => {
        expect(barrage().mpCost).toBeFalsy()
        expect(barrage().focusCost).toBeFalsy()
      })

      it('should target all enemies', () => {
        expect(barrage().targetType).toBe('all_enemies')
      })
    })

    describe('L6: Piercing Shot', () => {
      const piercingShot = () => swift_arrow.skills.find(s => s.name === 'Piercing Shot')

      it('should exist and be unlocked at level 6', () => {
        expect(piercingShot()).toBeDefined()
        expect(piercingShot().skillUnlockLevel).toBe(6)
      })

      it('should not have MP or Focus cost (free skill)', () => {
        expect(piercingShot().mpCost).toBeFalsy()
        expect(piercingShot().focusCost).toBeFalsy()
      })

      it('should target a single enemy', () => {
        expect(piercingShot().targetType).toBe('enemy')
      })

      it('should ignore 50% of target DEF', () => {
        expect(piercingShot().ignoreDef).toBe(50)
      })
    })

    describe('L12: Arrow Storm', () => {
      const arrowStorm = () => swift_arrow.skills.find(s => s.name === 'Arrow Storm')

      it('should exist and be unlocked at level 12', () => {
        expect(arrowStorm()).toBeDefined()
        expect(arrowStorm().skillUnlockLevel).toBe(12)
      })

      it('should not have MP or Focus cost (free skill)', () => {
        expect(arrowStorm().mpCost).toBeFalsy()
        expect(arrowStorm().focusCost).toBeFalsy()
      })

      it('should target random enemies', () => {
        expect(arrowStorm().targetType).toBe('random_enemies')
      })

      it('should hit 5 times', () => {
        expect(arrowStorm().multiHit).toBe(5)
      })

      it('should prioritize marked enemies', () => {
        expect(arrowStorm().prioritizeMarked).toBe(true)
      })
    })
  })
})
