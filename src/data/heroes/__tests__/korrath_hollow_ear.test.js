import { describe, it, expect } from 'vitest'
import { korrath_hollow_ear } from '../5star/korrath_hollow_ear'
import { EffectType } from '../../statusEffects'

describe('Korrath of the Hollow Ear', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(korrath_hollow_ear.id).toBe('korrath_hollow_ear')
      expect(korrath_hollow_ear.name).toBe('Korrath of the Hollow Ear')
    })

    it('should be a 5-star ranger', () => {
      expect(korrath_hollow_ear.rarity).toBe(5)
      expect(korrath_hollow_ear.classId).toBe('ranger')
    })

    it('should have correct base stats', () => {
      expect(korrath_hollow_ear.baseStats).toEqual({
        hp: 95,
        atk: 48,
        def: 20,
        spd: 22
      })
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(korrath_hollow_ear.skills).toHaveLength(5)
    })

    describe('Whisper Shot', () => {
      const skill = korrath_hollow_ear.skills.find(s => s.name === 'Whisper Shot')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should deal 110% ATK damage normally', () => {
        expect(skill.damagePercent).toBe(110)
      })

      it('should have execute bonus below 30% HP', () => {
        expect(skill.executeBonus).toBeDefined()
        expect(skill.executeBonus.threshold).toBe(30)
        expect(skill.executeBonus.damagePercent).toBe(150)
      })
    })

    describe('Spirit Mark', () => {
      const skill = korrath_hollow_ear.skills.find(s => s.name === 'Spirit Mark')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target enemy with no damage', () => {
        expect(skill.targetType).toBe('enemy')
        expect(skill.noDamage).toBe(true)
      })

      it('should apply Marked effect for 3 turns with 25% increased damage', () => {
        const marked = skill.effects.find(e => e.type === EffectType.MARKED)
        expect(marked).toBeDefined()
        expect(marked.duration).toBe(3)
        expect(marked.value).toBe(25)
        expect(marked.target).toBe('enemy')
      })
    })

    describe('Deathecho Volley', () => {
      const skill = korrath_hollow_ear.skills.find(s => s.name === 'Deathecho Volley')

      it('should exist and unlock at level 3', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should target all enemies', () => {
        expect(skill.targetType).toBe('all_enemies')
      })

      it('should deal 60% ATK damage as base', () => {
        expect(skill.damagePercent).toBe(60)
      })

      it('should have bonus damage per enemy death', () => {
        expect(skill.bonusDamagePerDeath).toBeDefined()
        expect(skill.bonusDamagePerDeath.perDeath).toBe(15)
        expect(skill.bonusDamagePerDeath.maxBonus).toBe(60)
      })
    })

    describe('Spirit Volley', () => {
      const skill = korrath_hollow_ear.skills.find(s => s.name === 'Spirit Volley')

      it('should exist and unlock at level 6', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should target random enemies', () => {
        expect(skill.targetType).toBe('random_enemies')
      })

      it('should hit 5 times', () => {
        expect(skill.multiHit).toBe(5)
      })

      it('should deal 50% ATK damage per hit', () => {
        expect(skill.damagePercent).toBe(50)
      })

      it('should prioritize marked enemies', () => {
        expect(skill.prioritizeMarked).toBe(true)
      })
    })

    describe('The Last Drumbeat', () => {
      const skill = korrath_hollow_ear.skills.find(s => s.name === 'The Last Drumbeat')

      it('should exist and unlock at level 12', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should target enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should deal 200% ATK damage', () => {
        expect(skill.damagePercent).toBe(200)
      })

      it('should ignore 75% of enemy DEF', () => {
        expect(skill.ignoreDef).toBe(75)
      })

      it('should reset turn order on kill', () => {
        expect(skill.onKill).toBeDefined()
        expect(skill.onKill.resetTurnOrder).toBe(true)
      })
    })
  })

  describe('leader skill', () => {
    it('should have Blood Remembers leader skill', () => {
      expect(korrath_hollow_ear.leaderSkill).toBeDefined()
      expect(korrath_hollow_ear.leaderSkill.name).toBe('Blood Remembers')
    })

    it('should have correct description', () => {
      expect(korrath_hollow_ear.leaderSkill.description).toBe('On round 2, all allies gain +20% ATK and +15% SPD for 3 turns')
    })

    it('should be a timed effect triggering on round 2', () => {
      const effect = korrath_hollow_ear.leaderSkill.effects[0]
      expect(effect.type).toBe('timed')
      expect(effect.triggerRound).toBe(2)
    })

    it('should target all allies', () => {
      const effect = korrath_hollow_ear.leaderSkill.effects[0]
      expect(effect.target).toBe('all_allies')
    })

    it('should apply both ATK and SPD buffs', () => {
      const effect = korrath_hollow_ear.leaderSkill.effects[0]
      expect(effect.apply).toHaveLength(2)

      const atkBuff = effect.apply.find(e => e.effectType === 'atk_up')
      expect(atkBuff).toBeDefined()
      expect(atkBuff.value).toBe(20)
      expect(atkBuff.duration).toBe(3)

      const spdBuff = effect.apply.find(e => e.effectType === 'spd_up')
      expect(spdBuff).toBeDefined()
      expect(spdBuff.value).toBe(15)
      expect(spdBuff.duration).toBe(3)
    })
  })
})
