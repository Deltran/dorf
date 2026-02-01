import { describe, it, expect } from 'vitest'
import { grandmother_rot } from '../5star/grandmother_rot'
import { EffectType } from '../../statusEffects'

describe('Grandmother Rot', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(grandmother_rot.id).toBe('grandmother_rot')
      expect(grandmother_rot.name).toBe('Grandmother Rot')
    })

    it('should be a 5-star druid', () => {
      expect(grandmother_rot.rarity).toBe(5)
      expect(grandmother_rot.classId).toBe('druid')
    })

    it('should have correct base stats', () => {
      expect(grandmother_rot.baseStats).toEqual({
        hp: 115,
        atk: 30,
        def: 32,
        spd: 11,
        mp: 80
      })
    })

    it('should have epithet and intro quote', () => {
      expect(grandmother_rot.epithet).toBe('The Compost Mother')
      expect(grandmother_rot.introQuote).toBe('Come now, dear. Everything blooms eventually... even you.')
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(grandmother_rot.skills).toHaveLength(5)
    })

    describe('Mulching Strike', () => {
      const skill = grandmother_rot.skills.find(s => s.name === 'Mulching Strike')

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

      it('should deal 90% ATK damage', () => {
        expect(skill.damagePercent).toBe(90)
      })

      it('should heal self for 20% of damage dealt', () => {
        expect(skill.healSelfPercent).toBe(20)
      })
    })

    describe('Decomposition', () => {
      const skill = grandmother_rot.skills.find(s => s.name === 'Decomposition')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should cost 20 MP', () => {
        expect(skill.mpCost).toBe(20)
      })

      it('should target ally with no damage', () => {
        expect(skill.targetType).toBe('ally')
        expect(skill.noDamage).toBe(true)
      })

      it('should apply Decomposition effect for 3 turns', () => {
        const decomp = skill.effects.find(e => e.type === EffectType.DECOMPOSITION)
        expect(decomp).toBeDefined()
        expect(decomp.duration).toBe(3)
        expect(decomp.target).toBe('ally')
      })

      it('should grant shield based on ATK and heal on expiry', () => {
        const decomp = skill.effects.find(e => e.type === EffectType.DECOMPOSITION)
        expect(decomp.shieldAtkPercent).toBe(10)
        expect(decomp.healAtkPercent).toBe(25)
      })
    })

    describe('Blight Bloom', () => {
      const skill = grandmother_rot.skills.find(s => s.name === 'Blight Bloom')

      it('should exist and unlock at level 3', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should cost 25 MP', () => {
        expect(skill.mpCost).toBe(25)
      })

      it('should target all enemies', () => {
        expect(skill.targetType).toBe('all_enemies')
      })

      it('should deal 60% ATK damage normally', () => {
        expect(skill.damagePercent).toBe(60)
      })

      it('should deal 90% ATK damage if enemy is poisoned', () => {
        expect(skill.ifPoisoned).toBeDefined()
        expect(skill.ifPoisoned.damagePercent).toBe(90)
      })
    })

    describe('Fungal Network', () => {
      const skill = grandmother_rot.skills.find(s => s.name === 'Fungal Network')

      it('should exist and unlock at level 6', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should cost 32 MP', () => {
        expect(skill.mpCost).toBe(32)
      })

      it('should target all allies', () => {
        expect(skill.targetType).toBe('all_allies')
      })

      it('should heal for 15% ATK normally', () => {
        expect(skill.healPercent).toBe(15)
      })

      it('should heal for 35% ATK if ally is poisoned and remove poison', () => {
        expect(skill.ifPoisoned).toBeDefined()
        expect(skill.ifPoisoned.healPercent).toBe(35)
        expect(skill.ifPoisoned.removePoisonFromAllies).toBe(true)
      })
    })

    describe('The Great Composting', () => {
      const skill = grandmother_rot.skills.find(s => s.name === 'The Great Composting')

      it('should exist and unlock at level 12', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should cost 45 MP', () => {
        expect(skill.mpCost).toBe(45)
      })

      it('should target all allies with no damage', () => {
        expect(skill.targetType).toBe('all_allies')
        expect(skill.noDamage).toBe(true)
      })

      it('should consume poison from enemies', () => {
        expect(skill.consumesPoisonFromEnemies).toBe(true)
      })

      it('should have baseline regen effect', () => {
        expect(skill.baselineRegen).toBeDefined()
        expect(skill.baselineRegen.type).toBe('regen')
        expect(skill.baselineRegen.target).toBe('all_allies')
        expect(skill.baselineRegen.duration).toBe(2)
        expect(skill.baselineRegen.atkPercent).toBe(5)
      })
    })
  })

  describe('leader skill', () => {
    it('should have The Circle Continues leader skill', () => {
      expect(grandmother_rot.leaderSkill).toBeDefined()
      expect(grandmother_rot.leaderSkill.name).toBe('The Circle Continues')
    })

    it('should have correct description', () => {
      expect(grandmother_rot.leaderSkill.description).toBe("At the start of each round, if any enemy has poison, all allies heal for 5% of Grandmother Rot's ATK and extend all poison effects by 1 turn.")
    })

    it('should be a passive_round_start effect', () => {
      const effect = grandmother_rot.leaderSkill.effects[0]
      expect(effect.type).toBe('passive_round_start')
    })

    it('should have condition requiring enemy poison', () => {
      const effect = grandmother_rot.leaderSkill.effects[0]
      expect(effect.condition.hasEffect).toBe('poison')
    })

    it('should heal allies for 5% ATK', () => {
      const effect = grandmother_rot.leaderSkill.effects[0]
      expect(effect.heal.atkPercent).toBe(5)
    })

    it('should extend poison effects by 1 turn', () => {
      const effect = grandmother_rot.leaderSkill.effects[0]
      expect(effect.extendEffect.type).toBe('poison')
      expect(effect.extendEffect.duration).toBe(1)
    })
  })
})
