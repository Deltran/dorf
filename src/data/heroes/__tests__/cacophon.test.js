import { describe, it, expect } from 'vitest'
import { cacophon } from '../5star/cacophon'
import { EffectType } from '../../statusEffects'

describe('Cacophon, the Beautiful Disaster', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(cacophon.id).toBe('cacophon')
      expect(cacophon.name).toBe('Cacophon, the Beautiful Disaster')
    })

    it('should be a 5-star bard', () => {
      expect(cacophon.rarity).toBe(5)
      expect(cacophon.classId).toBe('bard')
    })

    it('should have correct base stats', () => {
      expect(cacophon.baseStats).toEqual({
        hp: 95,
        atk: 25,
        def: 22,
        spd: 16,
        mp: 60
      })
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(cacophon.skills).toHaveLength(5)
    })

    describe('Discordant Anthem', () => {
      const skill = cacophon.skills.find(s => s.name === 'Discordant Anthem')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target all allies', () => {
        expect(skill.targetType).toBe('all_allies')
      })

      it('should cost allies 5% max HP', () => {
        expect(skill.allyHpCostPercent).toBe(5)
      })

      it('should deal no direct damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should grant 25% ATK buff for 2 turns', () => {
        const atkUp = skill.effects.find(e => e.type === EffectType.ATK_UP)
        expect(atkUp).toBeDefined()
        expect(atkUp.value).toBe(25)
        expect(atkUp.duration).toBe(2)
        expect(atkUp.target).toBe('all_allies')
      })
    })

    describe('Vicious Verse', () => {
      const skill = cacophon.skills.find(s => s.name === 'Vicious Verse')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target ally', () => {
        expect(skill.targetType).toBe('ally')
      })

      it('should cost target ally 5% max HP', () => {
        expect(skill.allyHpCostPercent).toBe(5)
      })

      it('should deal no direct damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should grant Vicious buff with 30% bonus damage vs debuffed enemies', () => {
        const vicious = skill.effects.find(e => e.type === EffectType.VICIOUS)
        expect(vicious).toBeDefined()
        expect(vicious.bonusDamagePercent).toBe(30)
        expect(vicious.duration).toBe(2)
        expect(vicious.target).toBe('ally')
      })
    })

    describe('Tempo Shatter', () => {
      const skill = cacophon.skills.find(s => s.name === 'Tempo Shatter')

      it('should exist and unlock at level 3', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should target ally', () => {
        expect(skill.targetType).toBe('ally')
      })

      it('should cost target ally 6% max HP', () => {
        expect(skill.allyHpCostPercent).toBe(6)
      })

      it('should deal no direct damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should grant Shattered Tempo for turn order priority', () => {
        const tempo = skill.effects.find(e => e.type === EffectType.SHATTERED_TEMPO)
        expect(tempo).toBeDefined()
        expect(tempo.turnOrderPriority).toBe(2)
        expect(tempo.duration).toBe(1)
        expect(tempo.target).toBe('ally')
      })
    })

    describe('Screaming Echo', () => {
      const skill = cacophon.skills.find(s => s.name === 'Screaming Echo')

      it('should exist and unlock at level 6', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should target ally', () => {
        expect(skill.targetType).toBe('ally')
      })

      it('should cost target ally 6% max HP', () => {
        expect(skill.allyHpCostPercent).toBe(6)
      })

      it('should deal no direct damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should grant Echoing effect for AoE splash', () => {
        const echoing = skill.effects.find(e => e.type === EffectType.ECHOING)
        expect(echoing).toBeDefined()
        expect(echoing.splashPercent).toBe(50)
        expect(echoing.duration).toBe(1)
        expect(echoing.target).toBe('ally')
      })
    })

    describe('Warding Noise', () => {
      const skill = cacophon.skills.find(s => s.name === 'Warding Noise')

      it('should exist and unlock at level 12', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should target ally', () => {
        expect(skill.targetType).toBe('ally')
      })

      it('should cost target ally 5% max HP', () => {
        expect(skill.allyHpCostPercent).toBe(5)
      })

      it('should deal no direct damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should grant shield equal to 25% of target max HP for 2 turns', () => {
        const shield = skill.effects.find(e => e.type === EffectType.SHIELD)
        expect(shield).toBeDefined()
        expect(shield.shieldPercentMaxHp).toBe(25)
        expect(shield.duration).toBe(2)
        expect(shield.target).toBe('ally')
      })
    })
  })

  describe('finale', () => {
    it('should have Suffering\'s Crescendo finale', () => {
      expect(cacophon.finale).toBeDefined()
      expect(cacophon.finale.name).toBe("Suffering's Crescendo")
    })

    it('should target all allies', () => {
      expect(cacophon.finale.target).toBe('all_allies')
    })

    it('should have suffering_crescendo effect with scaling based on HP lost', () => {
      const effect = cacophon.finale.effects[0]
      expect(effect.type).toBe('suffering_crescendo')
      expect(effect.baseBuff).toBe(10)
      expect(effect.hpPerPercent).toBe(150)
      expect(effect.maxBonus).toBe(25)
      expect(effect.duration).toBe(3)
    })
  })

  describe('leader skill', () => {
    it('should have Harmonic Bleeding leader skill', () => {
      expect(cacophon.leaderSkill).toBeDefined()
      expect(cacophon.leaderSkill.name).toBe('Harmonic Bleeding')
    })

    it('should have correct description', () => {
      expect(cacophon.leaderSkill.description).toBe('All allies deal +15% damage but receive -30% healing. (Counts as debuff — can be cleansed.)')
    })

    it('should be a battle_start_debuff effect', () => {
      const effect = cacophon.leaderSkill.effects[0]
      expect(effect.type).toBe('battle_start_debuff')
    })

    it('should target all allies', () => {
      const effect = cacophon.leaderSkill.effects[0]
      expect(effect.target).toBe('all_allies')
    })

    it('should apply discordant_resonance with +15% damage and -30% healing', () => {
      const effect = cacophon.leaderSkill.effects[0]
      expect(effect.apply.effectType).toBe('discordant_resonance')
      expect(effect.apply.damageBonus).toBe(15)
      expect(effect.apply.healingPenalty).toBe(30)
    })
  })
})
