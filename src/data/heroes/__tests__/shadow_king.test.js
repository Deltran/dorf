import { describe, it, expect } from 'vitest'
import { shadow_king } from '../5star/shadow_king'
import { EffectType } from '../../statusEffects'

describe('The Shadow King', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(shadow_king.id).toBe('shadow_king')
      expect(shadow_king.name).toBe('The Shadow King')
    })

    it('should be a 5-star berserker', () => {
      expect(shadow_king.rarity).toBe(5)
      expect(shadow_king.classId).toBe('berserker')
    })

    it('should have correct base stats', () => {
      expect(shadow_king.baseStats).toEqual({
        hp: 110,
        atk: 55,
        def: 25,
        spd: 18
      })
    })

    it('should have epithet and intro quote', () => {
      expect(shadow_king.epithet).toBe('Avatar of the Endless Night')
      expect(shadow_king.introQuote).toBe('Kneel before the darkness, mortal.')
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(shadow_king.skills).toHaveLength(5)
    })

    describe('Void Strike', () => {
      const skill = shadow_king.skills.find(s => s.name === 'Void Strike')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should cost 50 rage', () => {
        expect(skill.rageCost).toBe(50)
      })

      it('should target enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should ignore 50% of enemy DEF', () => {
        expect(skill.ignoreDef).toBe(50)
      })
    })

    describe('Mantle of Empty Hate', () => {
      const skill = shadow_king.skills.find(s => s.name === 'Mantle of Empty Hate')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should cost 30 rage', () => {
        expect(skill.rageCost).toBe(30)
      })

      it('should target self', () => {
        expect(skill.targetType).toBe('self')
      })

      it('should grant ATK_UP 30% for 3 turns', () => {
        const atkUp = skill.effects.find(e => e.type === EffectType.ATK_UP)
        expect(atkUp).toBeDefined()
        expect(atkUp.value).toBe(30)
        expect(atkUp.duration).toBe(3)
        expect(atkUp.target).toBe('self')
      })

      it('should apply self-poison for 15% ATK for 3 turns', () => {
        const poison = skill.effects.find(e => e.type === EffectType.POISON)
        expect(poison).toBeDefined()
        expect(poison.atkPercent).toBe(15)
        expect(poison.duration).toBe(3)
        expect(poison.target).toBe('self')
      })
    })

    describe('Consume Shadow', () => {
      const skill = shadow_king.skills.find(s => s.name === 'Consume Shadow')

      it('should exist and unlock at level 3', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should cost 0 rage', () => {
        expect(skill.rageCost).toBe(0)
      })

      it('should target self', () => {
        expect(skill.targetType).toBe('self')
      })

      it('should require having debuffs to use', () => {
        expect(skill.useCondition).toBe('has_debuffs')
      })

      it('should consume debuffs for rage and damage', () => {
        expect(skill.consumeDebuffs).toBeDefined()
        expect(skill.consumeDebuffs.ragePerDebuff).toBe(15)
        expect(skill.consumeDebuffs.damagePercentPerDebuff).toBe(40)
      })
    })

    describe('Stares Back', () => {
      const skill = shadow_king.skills.find(s => s.name === 'Stares Back')

      it('should exist and unlock at level 6', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should cost 30 rage', () => {
        expect(skill.rageCost).toBe(30)
      })

      it('should target self', () => {
        expect(skill.targetType).toBe('self')
      })

      it('should grant 100% thorns for 3 turns', () => {
        const thorns = skill.effects.find(e => e.type === EffectType.THORNS)
        expect(thorns).toBeDefined()
        expect(thorns.value).toBe(100)
        expect(thorns.duration).toBe(3)
        expect(thorns.target).toBe('self')
      })
    })

    describe('Crushing Eternity', () => {
      const skill = shadow_king.skills.find(s => s.name === 'Crushing Eternity')

      it('should exist and unlock at level 12', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should consume all rage', () => {
        expect(skill.rageCost).toBe('all')
      })

      it('should target enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should hit 3 times', () => {
        expect(skill.multiHit).toBe(3)
      })

      it('should have base damage of 50% and scale with rage', () => {
        expect(skill.baseDamage).toBe(50)
        expect(skill.damagePerRage).toBe(1)
      })
    })
  })

  describe('leader skill', () => {
    it('should have Lord of Shadows leader skill', () => {
      expect(shadow_king.leaderSkill).toBeDefined()
      expect(shadow_king.leaderSkill.name).toBe('Lord of Shadows')
    })

    it('should have correct description', () => {
      expect(shadow_king.leaderSkill.description).toBe('On round 1, all allies gain +25% ATK for 2 turns')
    })

    it('should be a timed effect triggering on round 1', () => {
      const effect = shadow_king.leaderSkill.effects[0]
      expect(effect.type).toBe('timed')
      expect(effect.triggerRound).toBe(1)
    })

    it('should target all allies', () => {
      const effect = shadow_king.leaderSkill.effects[0]
      expect(effect.target).toBe('all_allies')
    })

    it('should apply 25% ATK buff for 2 turns', () => {
      const effect = shadow_king.leaderSkill.effects[0]
      expect(effect.apply.effectType).toBe('atk_up')
      expect(effect.apply.value).toBe(25)
      expect(effect.apply.duration).toBe(2)
    })
  })
})
