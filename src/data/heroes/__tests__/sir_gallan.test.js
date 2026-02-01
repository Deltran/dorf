import { describe, it, expect } from 'vitest'
import { sir_gallan } from '../4star/sir_gallan'
import { EffectType } from '../../statusEffects'

describe('Sir Gallan', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(sir_gallan.id).toBe('sir_gallan')
      expect(sir_gallan.name).toBe('Sir Gallan')
    })

    it('should be a 4-star knight', () => {
      expect(sir_gallan.rarity).toBe(4)
      expect(sir_gallan.classId).toBe('knight')
    })

    it('should have correct base stats', () => {
      expect(sir_gallan.baseStats).toEqual({
        hp: 130,
        atk: 30,
        def: 45,
        spd: 10,
        mp: 50
      })
    })

    it('should have epithet and intro quote', () => {
      expect(sir_gallan.epithet).toBe('Shield of the Realm')
      expect(sir_gallan.introQuote).toBe('My blade stands ready.')
    })

    it('should NOT have a leader skill (4-star)', () => {
      expect(sir_gallan.leaderSkill).toBeUndefined()
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(sir_gallan.skills).toHaveLength(5)
    })

    describe('L1: Challenge', () => {
      const challenge = () => sir_gallan.skills.find(s => s.name === 'Challenge')

      it('should exist and be unlocked at level 1', () => {
        expect(challenge()).toBeDefined()
        expect(challenge().skillUnlockLevel).toBe(1)
      })

      it('should require 0 Valor', () => {
        expect(challenge().valorRequired).toBe(0)
      })

      it('should target self with no damage', () => {
        expect(challenge().targetType).toBe('self')
        expect(challenge().noDamage).toBe(true)
      })

      it('should be a defensive skill with cooldown', () => {
        expect(challenge().defensive).toBe(true)
        expect(challenge().cooldown).toBe(1)
      })

      it('should apply TAUNT with duration scaling', () => {
        const tauntEffect = challenge().effects.find(e => e.type === EffectType.TAUNT)
        expect(tauntEffect).toBeDefined()
        expect(tauntEffect.target).toBe('self')
        expect(tauntEffect.duration).toEqual({ base: 2, at100: 3 })
      })

      it('should apply DEF_UP at 50 Valor with duration scaling', () => {
        const defEffect = challenge().effects.find(e => e.type === EffectType.DEF_UP)
        expect(defEffect).toBeDefined()
        expect(defEffect.target).toBe('self')
        expect(defEffect.value).toBe(10)
        expect(defEffect.valorThreshold).toBe(50)
        expect(defEffect.duration).toEqual({ base: 2, at100: 3 })
      })
    })

    describe('L1: Shield Bash', () => {
      const shieldBash = () => sir_gallan.skills.find(s => s.name === 'Shield Bash')

      it('should exist and be unlocked at level 1', () => {
        expect(shieldBash()).toBeDefined()
        expect(shieldBash().skillUnlockLevel).toBe(1)
      })

      it('should require 25 Valor', () => {
        expect(shieldBash().valorRequired).toBe(25)
      })

      it('should target a single enemy', () => {
        expect(shieldBash().targetType).toBe('enemy')
      })

      it('should apply ATK_DOWN with scaling duration and value', () => {
        const atkDownEffect = shieldBash().effects.find(e => e.type === EffectType.ATK_DOWN)
        expect(atkDownEffect).toBeDefined()
        expect(atkDownEffect.target).toBe('enemy')
        expect(atkDownEffect.duration).toEqual({ base: 2, at50: 3 })
        expect(atkDownEffect.value).toEqual({ base: 20, at25: 25 })
      })
    })

    describe('L3: Oath of Protection', () => {
      const oath = () => sir_gallan.skills.find(s => s.name === 'Oath of Protection')

      it('should exist and be unlocked at level 3', () => {
        expect(oath()).toBeDefined()
        expect(oath().skillUnlockLevel).toBe(3)
      })

      it('should require 25 Valor', () => {
        expect(oath().valorRequired).toBe(25)
      })

      it('should target ally but exclude self', () => {
        expect(oath().targetType).toBe('ally')
        expect(oath().excludeSelf).toBe(true)
      })

      it('should deal no damage and be defensive', () => {
        expect(oath().noDamage).toBe(true)
        expect(oath().defensive).toBe(true)
      })

      it('should apply GUARDIAN_LINK with scaling properties', () => {
        const linkEffect = oath().effects.find(e => e.type === EffectType.GUARDIAN_LINK)
        expect(linkEffect).toBeDefined()
        expect(linkEffect.target).toBe('ally')
        expect(linkEffect.duration).toEqual({ base: 2, at75: 3 })
        expect(linkEffect.redirectPercent).toEqual({ base: 30, at50: 40, at100: 50 })
        expect(linkEffect.valorOnRedirect).toBe(5)
      })
    })

    describe('L6: Defensive Footwork', () => {
      const footwork = () => sir_gallan.skills.find(s => s.name === 'Defensive Footwork')

      it('should exist and be unlocked at level 6', () => {
        expect(footwork()).toBeDefined()
        expect(footwork().skillUnlockLevel).toBe(6)
      })

      it('should require 25 Valor', () => {
        expect(footwork().valorRequired).toBe(25)
      })

      it('should target a single enemy', () => {
        expect(footwork().targetType).toBe('enemy')
      })

      it('should use DEF stat for damage', () => {
        expect(footwork().useStat).toBe('def')
      })

      it('should have conditional pre-buff when attacked', () => {
        expect(footwork().conditionalPreBuff).toBeDefined()
        expect(footwork().conditionalPreBuff.condition).toBe('wasAttacked')
      })

      it('should grant scaling DEF_UP when condition is met', () => {
        const preBuff = footwork().conditionalPreBuff.effect
        expect(preBuff.type).toBe(EffectType.DEF_UP)
        expect(preBuff.target).toBe('self')
        expect(preBuff.duration).toBe(2)
        expect(preBuff.value).toEqual({ base: 10, at50: 15, at75: 20, at100: 25 })
      })
    })

    describe('L12: Fortress Stance', () => {
      const fortress = () => sir_gallan.skills.find(s => s.name === 'Fortress Stance')

      it('should exist and be unlocked at level 12', () => {
        expect(fortress()).toBeDefined()
        expect(fortress().skillUnlockLevel).toBe(12)
      })

      it('should require 50 Valor', () => {
        expect(fortress().valorRequired).toBe(50)
      })

      it('should target self with no damage', () => {
        expect(fortress().targetType).toBe('self')
        expect(fortress().noDamage).toBe(true)
      })

      it('should be a defensive skill', () => {
        expect(fortress().defensive).toBe(true)
      })

      it('should apply DAMAGE_REDUCTION for 2 turns', () => {
        const drEffect = fortress().effects.find(e => e.type === EffectType.DAMAGE_REDUCTION)
        expect(drEffect).toBeDefined()
        expect(drEffect.target).toBe('self')
        expect(drEffect.duration).toBe(2)
        expect(drEffect.value).toBe(50)
      })

      it('should apply REFLECT for 2 turns', () => {
        const reflectEffect = fortress().effects.find(e => e.type === EffectType.REFLECT)
        expect(reflectEffect).toBeDefined()
        expect(reflectEffect.target).toBe('self')
        expect(reflectEffect.duration).toBe(2)
        expect(reflectEffect.value).toBe(30)
      })

      it('should apply DEBUFF_IMMUNE at 100 Valor', () => {
        const immuneEffect = fortress().effects.find(e => e.type === EffectType.DEBUFF_IMMUNE)
        expect(immuneEffect).toBeDefined()
        expect(immuneEffect.target).toBe('self')
        expect(immuneEffect.duration).toBe(2)
        expect(immuneEffect.valorThreshold).toBe(100)
      })
    })
  })
})
