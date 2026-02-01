import { describe, it, expect } from 'vitest'
import { aurora_the_dawn } from '../5star/aurora_the_dawn'
import { EffectType } from '../../statusEffects'

describe('Aurora the Dawn', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(aurora_the_dawn.id).toBe('aurora_the_dawn')
      expect(aurora_the_dawn.name).toBe('Aurora the Dawn')
    })

    it('should be a 5-star paladin', () => {
      expect(aurora_the_dawn.rarity).toBe(5)
      expect(aurora_the_dawn.classId).toBe('paladin')
    })

    it('should have correct base stats', () => {
      expect(aurora_the_dawn.baseStats).toEqual({
        hp: 140,
        atk: 28,
        def: 30,
        spd: 12,
        mp: 60
      })
    })

    it('should have epithet and intro quote', () => {
      expect(aurora_the_dawn.epithet).toBe('The Dawn')
      expect(aurora_the_dawn.introQuote).toBe('Light breaks even the longest darkness.')
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(aurora_the_dawn.skills).toHaveLength(5)
    })

    describe('Holy Strike', () => {
      const skill = aurora_the_dawn.skills.find(s => s.name === 'Holy Strike')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should cost 15 MP', () => {
        expect(skill.mpCost).toBe(15)
      })

      it('should target enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should deal 120% ATK damage', () => {
        expect(skill.damagePercent).toBe(120)
      })

      it('should heal self for 50% of damage dealt', () => {
        expect(skill.healSelfPercent).toBe(50)
      })
    })

    describe('Guardian Link', () => {
      const skill = aurora_the_dawn.skills.find(s => s.name === 'Guardian Link')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should cost 20 MP', () => {
        expect(skill.mpCost).toBe(20)
      })

      it('should target ally', () => {
        expect(skill.targetType).toBe('ally')
      })

      it('should deal no direct damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should apply Guardian Link effect for 3 turns with 40% redirect', () => {
        const guardianLink = skill.effects.find(e => e.type === EffectType.GUARDIAN_LINK)
        expect(guardianLink).toBeDefined()
        expect(guardianLink.duration).toBe(3)
        expect(guardianLink.redirectPercent).toBe(40)
        expect(guardianLink.target).toBe('ally')
      })
    })

    describe('Consecrated Ground', () => {
      const skill = aurora_the_dawn.skills.find(s => s.name === 'Consecrated Ground')

      it('should exist and unlock at level 3', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should cost 18 MP', () => {
        expect(skill.mpCost).toBe(18)
      })

      it('should target ally', () => {
        expect(skill.targetType).toBe('ally')
      })

      it('should deal no direct damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should apply 25% damage reduction for 3 turns', () => {
        const damageReduction = skill.effects.find(e => e.type === EffectType.DAMAGE_REDUCTION)
        expect(damageReduction).toBeDefined()
        expect(damageReduction.duration).toBe(3)
        expect(damageReduction.value).toBe(25)
        expect(damageReduction.target).toBe('ally')
      })
    })

    describe("Judgment's Echo", () => {
      const skill = aurora_the_dawn.skills.find(s => s.name === "Judgment's Echo")

      it('should exist and unlock at level 6', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should cost 25 MP', () => {
        expect(skill.mpCost).toBe(25)
      })

      it('should target self', () => {
        expect(skill.targetType).toBe('self')
      })

      it('should deal no direct damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should apply Damage Store effect for 2 turns', () => {
        const damageStore = skill.effects.find(e => e.type === EffectType.DAMAGE_STORE)
        expect(damageStore).toBeDefined()
        expect(damageStore.duration).toBe(2)
        expect(damageStore.target).toBe('self')
      })
    })

    describe('Divine Sacrifice', () => {
      const skill = aurora_the_dawn.skills.find(s => s.name === 'Divine Sacrifice')

      it('should exist and unlock at level 12', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should cost 35 MP', () => {
        expect(skill.mpCost).toBe(35)
      })

      it('should target self', () => {
        expect(skill.targetType).toBe('self')
      })

      it('should deal no direct damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should apply Divine Sacrifice effect for 2 turns with 50% DR and 15% heal per turn', () => {
        const divineSacrifice = skill.effects.find(e => e.type === EffectType.DIVINE_SACRIFICE)
        expect(divineSacrifice).toBeDefined()
        expect(divineSacrifice.duration).toBe(2)
        expect(divineSacrifice.damageReduction).toBe(50)
        expect(divineSacrifice.healPerTurn).toBe(15)
        expect(divineSacrifice.target).toBe('self')
      })
    })
  })

  describe('leader skill', () => {
    it("should have Dawn's Protection leader skill", () => {
      expect(aurora_the_dawn.leaderSkill).toBeDefined()
      expect(aurora_the_dawn.leaderSkill.name).toBe("Dawn's Protection")
    })

    it('should have correct description', () => {
      expect(aurora_the_dawn.leaderSkill.description).toBe('Non-knight allies gain +15% DEF')
    })

    it('should be a passive effect', () => {
      const effect = aurora_the_dawn.leaderSkill.effects[0]
      expect(effect.type).toBe('passive')
    })

    it('should buff DEF stat by 15%', () => {
      const effect = aurora_the_dawn.leaderSkill.effects[0]
      expect(effect.stat).toBe('def')
      expect(effect.value).toBe(15)
    })

    it('should have condition that excludes knights', () => {
      const effect = aurora_the_dawn.leaderSkill.effects[0]
      expect(effect.condition).toBeDefined()
      expect(effect.condition.classId).toEqual({ not: 'knight' })
    })
  })
})
