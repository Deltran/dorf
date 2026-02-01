import { describe, it, expect } from 'vitest'
import { yggra_world_root } from '../5star/yggra_world_root'
import { EffectType } from '../../statusEffects'

describe('Yggra, the World Root', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(yggra_world_root.id).toBe('yggra_world_root')
      expect(yggra_world_root.name).toBe('Yggra, the World Root')
    })

    it('should be a 5-star druid', () => {
      expect(yggra_world_root.rarity).toBe(5)
      expect(yggra_world_root.classId).toBe('druid')
    })

    it('should have correct base stats', () => {
      expect(yggra_world_root.baseStats).toEqual({
        hp: 120,
        atk: 28,
        def: 35,
        spd: 10,
        mp: 75
      })
    })

    it('should have epithet and intro quote', () => {
      expect(yggra_world_root.epithet).toBe('The World Root')
      expect(yggra_world_root.introQuote).toBe('All things return to the earth.')
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(yggra_world_root.skills).toHaveLength(5)
    })

    describe('Blessing of the World Root', () => {
      const skill = yggra_world_root.skills.find(s => s.name === 'Blessing of the World Root')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should cost 22 MP', () => {
        expect(skill.mpCost).toBe(22)
      })

      it('should target all allies', () => {
        expect(skill.targetType).toBe('all_allies')
      })

      it('should heal for 55% ATK', () => {
        expect(skill.healPercent).toBe(55)
      })
    })

    describe('Grasping Roots', () => {
      const skill = yggra_world_root.skills.find(s => s.name === 'Grasping Roots')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should cost 15 MP', () => {
        expect(skill.mpCost).toBe(15)
      })

      it('should target enemy with no damage', () => {
        expect(skill.targetType).toBe('enemy')
        expect(skill.noDamage).toBe(true)
      })

      it('should apply poison for 50% ATK for 2 turns', () => {
        const poison = skill.effects.find(e => e.type === EffectType.POISON)
        expect(poison).toBeDefined()
        expect(poison.atkPercent).toBe(50)
        expect(poison.duration).toBe(2)
        expect(poison.target).toBe('enemy')
      })
    })

    describe('Bark Shield', () => {
      const skill = yggra_world_root.skills.find(s => s.name === 'Bark Shield')

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

      it('should grant 50% thorns for 3 turns', () => {
        const thorns = skill.effects.find(e => e.type === EffectType.THORNS)
        expect(thorns).toBeDefined()
        expect(thorns.value).toBe(50)
        expect(thorns.duration).toBe(3)
        expect(thorns.target).toBe('ally')
      })
    })

    describe("Nature's Reclamation", () => {
      const skill = yggra_world_root.skills.find(s => s.name === "Nature's Reclamation")

      it('should exist and unlock at level 6', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should cost 28 MP', () => {
        expect(skill.mpCost).toBe(28)
      })

      it('should target enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should deal 150% ATK damage', () => {
        expect(skill.damagePercent).toBe(150)
      })

      it('should heal all allies for 25% of damage dealt', () => {
        expect(skill.healAlliesPercent).toBe(25)
      })
    })

    describe("World Root's Embrace", () => {
      const skill = yggra_world_root.skills.find(s => s.name === "World Root's Embrace")

      it('should exist and unlock at level 12', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should cost 35 MP', () => {
        expect(skill.mpCost).toBe(35)
      })

      it('should target all allies with no damage', () => {
        expect(skill.targetType).toBe('all_allies')
        expect(skill.noDamage).toBe(true)
      })

      it('should grant death prevention for 2 turns with heal on trigger', () => {
        const deathPrevention = skill.effects.find(e => e.type === EffectType.DEATH_PREVENTION)
        expect(deathPrevention).toBeDefined()
        expect(deathPrevention.duration).toBe(2)
        expect(deathPrevention.healOnTrigger).toBe(50)
        expect(deathPrevention.target).toBe('all_allies')
      })
    })
  })

  describe('leader skill', () => {
    it('should have Ancient Awakening leader skill', () => {
      expect(yggra_world_root.leaderSkill).toBeDefined()
      expect(yggra_world_root.leaderSkill.name).toBe('Ancient Awakening')
    })

    it('should have correct description', () => {
      expect(yggra_world_root.leaderSkill.description).toBe('All allies regenerate 3% of their max HP at the start of each round')
    })

    it('should be a passive_regen effect', () => {
      const effect = yggra_world_root.leaderSkill.effects[0]
      expect(effect.type).toBe('passive_regen')
    })

    it('should target all allies and heal 3% max HP', () => {
      const effect = yggra_world_root.leaderSkill.effects[0]
      expect(effect.target).toBe('all_allies')
      expect(effect.percentMaxHp).toBe(3)
    })
  })
})
