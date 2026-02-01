import { describe, it, expect } from 'vitest'
import { lady_moonwhisper } from '../4star/lady_moonwhisper'
import { EffectType } from '../../statusEffects'

describe('Lady Moonwhisper', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(lady_moonwhisper.id).toBe('lady_moonwhisper')
      expect(lady_moonwhisper.name).toBe('Lady Moonwhisper')
    })

    it('should be a 4-star cleric', () => {
      expect(lady_moonwhisper.rarity).toBe(4)
      expect(lady_moonwhisper.classId).toBe('cleric')
    })

    it('should have correct base stats', () => {
      expect(lady_moonwhisper.baseStats).toEqual({
        hp: 95,
        atk: 25,
        def: 30,
        spd: 11,
        mp: 80
      })
    })

    it('should NOT have a leader skill (4-star)', () => {
      expect(lady_moonwhisper.leaderSkill).toBeUndefined()
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(lady_moonwhisper.skills).toHaveLength(5)
    })

    describe('L1: Lunar Blessing', () => {
      const lunarBlessing = () => lady_moonwhisper.skills.find(s => s.name === 'Lunar Blessing')

      it('should exist and be unlocked at level 1', () => {
        expect(lunarBlessing()).toBeDefined()
        expect(lunarBlessing().skillUnlockLevel).toBe(1)
      })

      it('should cost 22 MP', () => {
        expect(lunarBlessing().mpCost).toBe(22)
      })

      it('should target an ally', () => {
        expect(lunarBlessing().targetType).toBe('ally')
      })

      it('should apply DEF_UP for 2 turns at 20%', () => {
        const defEffect = lunarBlessing().effects.find(e => e.type === EffectType.DEF_UP)
        expect(defEffect).toBeDefined()
        expect(defEffect.target).toBe('ally')
        expect(defEffect.duration).toBe(2)
        expect(defEffect.value).toBe(20)
      })
    })

    describe('L1: Moonveil', () => {
      const moonveil = () => lady_moonwhisper.skills.find(s => s.name === 'Moonveil')

      it('should exist and be unlocked at level 1', () => {
        expect(moonveil()).toBeDefined()
        expect(moonveil().skillUnlockLevel).toBe(1)
      })

      it('should cost 20 MP', () => {
        expect(moonveil().mpCost).toBe(20)
      })

      it('should target an ally with no damage', () => {
        expect(moonveil().targetType).toBe('ally')
        expect(moonveil().noDamage).toBe(true)
      })

      it('should apply UNTARGETABLE for 2 turns', () => {
        const untargetableEffect = moonveil().effects.find(e => e.type === EffectType.UNTARGETABLE)
        expect(untargetableEffect).toBeDefined()
        expect(untargetableEffect.target).toBe('ally')
        expect(untargetableEffect.duration).toBe(2)
      })
    })

    describe('L3: Purifying Light', () => {
      const purifyingLight = () => lady_moonwhisper.skills.find(s => s.name === 'Purifying Light')

      it('should exist and be unlocked at level 3', () => {
        expect(purifyingLight()).toBeDefined()
        expect(purifyingLight().skillUnlockLevel).toBe(3)
      })

      it('should cost 18 MP', () => {
        expect(purifyingLight().mpCost).toBe(18)
      })

      it('should target an ally with no damage', () => {
        expect(purifyingLight().targetType).toBe('ally')
        expect(purifyingLight().noDamage).toBe(true)
      })

      it('should cleanse debuffs', () => {
        expect(purifyingLight().cleanse).toBe('debuffs')
      })
    })

    describe('L6: Silver Mist', () => {
      const silverMist = () => lady_moonwhisper.skills.find(s => s.name === 'Silver Mist')

      it('should exist and be unlocked at level 6', () => {
        expect(silverMist()).toBeDefined()
        expect(silverMist().skillUnlockLevel).toBe(6)
      })

      it('should cost 18 MP', () => {
        expect(silverMist().mpCost).toBe(18)
      })

      it('should target an ally with no damage', () => {
        expect(silverMist().targetType).toBe('ally')
        expect(silverMist().noDamage).toBe(true)
      })

      it('should apply EVASION for 3 turns at 40%', () => {
        const evasionEffect = silverMist().effects.find(e => e.type === EffectType.EVASION)
        expect(evasionEffect).toBeDefined()
        expect(evasionEffect.target).toBe('ally')
        expect(evasionEffect.duration).toBe(3)
        expect(evasionEffect.value).toBe(40)
      })

      it('should restore 5 MP to caster on evade', () => {
        const evasionEffect = silverMist().effects.find(e => e.type === EffectType.EVASION)
        expect(evasionEffect.onEvade).toBeDefined()
        expect(evasionEffect.onEvade.restoreMp).toBe(5)
        expect(evasionEffect.onEvade.to).toBe('caster')
      })
    })

    describe("L12: Full Moon's Embrace", () => {
      const fullMoon = () => lady_moonwhisper.skills.find(s => s.name === "Full Moon's Embrace")

      it('should exist and be unlocked at level 12', () => {
        expect(fullMoon()).toBeDefined()
        expect(fullMoon().skillUnlockLevel).toBe(12)
      })

      it('should cost 35 MP', () => {
        expect(fullMoon().mpCost).toBe(35)
      })

      it('should target a dead ally with no damage', () => {
        expect(fullMoon().targetType).toBe('dead_ally')
        expect(fullMoon().noDamage).toBe(true)
      })

      it('should revive ally at 40% HP', () => {
        expect(fullMoon().revive).toBeDefined()
        expect(fullMoon().revive.hpPercent).toBe(40)
      })

      it('should apply UNTARGETABLE for 1 turn after revive', () => {
        const untargetableEffect = fullMoon().effects.find(e => e.type === EffectType.UNTARGETABLE)
        expect(untargetableEffect).toBeDefined()
        expect(untargetableEffect.target).toBe('ally')
        expect(untargetableEffect.duration).toBe(1)
      })
    })
  })
})
