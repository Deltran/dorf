import { describe, it, expect } from 'vitest'
import { wandering_bard } from '../3star/wandering_bard'
import { EffectType } from '../../statusEffects'

describe('Wandering Bard (Harl the Handsom)', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(wandering_bard.id).toBe('wandering_bard')
      expect(wandering_bard.name).toBe('Harl the Handsom')
    })

    it('should be a 3-star bard', () => {
      expect(wandering_bard.rarity).toBe(3)
      expect(wandering_bard.classId).toBe('bard')
    })

    it('should have correct base stats with MP', () => {
      expect(wandering_bard.baseStats).toEqual({
        hp: 75,
        atk: 20,
        def: 20,
        spd: 15,
        mp: 70
      })
    })
  })

  describe('finale', () => {
    it('should have Standing Ovation finale', () => {
      expect(wandering_bard.finale).toBeDefined()
      expect(wandering_bard.finale.name).toBe('Standing Ovation')
    })

    it('should target all allies', () => {
      expect(wandering_bard.finale.target).toBe('all_allies')
    })

    it('should grant resources to all allies', () => {
      const resourceEffect = wandering_bard.finale.effects.find(e => e.type === 'resource_grant')
      expect(resourceEffect).toBeDefined()
      expect(resourceEffect.focusGrant).toBe(true)
      expect(resourceEffect.valorAmount).toBe(10)
      expect(resourceEffect.mpAmount).toBe(15)
      expect(resourceEffect.verseAmount).toBe(1)
    })

    it('should heal for 15% ATK', () => {
      const healEffect = wandering_bard.finale.effects.find(e => e.type === 'heal')
      expect(healEffect).toBeDefined()
      expect(healEffect.value).toBe(15)
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(wandering_bard.skills).toHaveLength(5)
    })

    describe('Inspiring Song (skill 1)', () => {
      it('should be a free bard skill (no mpCost)', () => {
        const skill = wandering_bard.skills.find(s => s.name === 'Inspiring Song')
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBeUndefined()
      })

      it('should target all allies', () => {
        const skill = wandering_bard.skills.find(s => s.name === 'Inspiring Song')
        expect(skill.targetType).toBe('all_allies')
      })

      it('should apply +15% ATK buff for 2 turns', () => {
        const skill = wandering_bard.skills.find(s => s.name === 'Inspiring Song')
        const atkUpEffect = skill.effects.find(e => e.type === EffectType.ATK_UP)
        expect(atkUpEffect).toBeDefined()
        expect(atkUpEffect.target).toBe('all_allies')
        expect(atkUpEffect.duration).toBe(2)
        expect(atkUpEffect.value).toBe(15)
      })
    })

    describe('Mana Melody (L1)', () => {
      it('should unlock at level 1', () => {
        const skill = wandering_bard.skills.find(s => s.name === 'Mana Melody')
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target all allies', () => {
        const skill = wandering_bard.skills.find(s => s.name === 'Mana Melody')
        expect(skill.targetType).toBe('all_allies')
      })

      it('should restore 10 MP to all allies', () => {
        const skill = wandering_bard.skills.find(s => s.name === 'Mana Melody')
        expect(skill.mpRestore).toBe(10)
      })
    })

    describe('Soothing Serenade (L3)', () => {
      it('should unlock at level 3', () => {
        const skill = wandering_bard.skills.find(s => s.name === 'Soothing Serenade')
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should target all allies', () => {
        const skill = wandering_bard.skills.find(s => s.name === 'Soothing Serenade')
        expect(skill.targetType).toBe('all_allies')
      })

      it('should heal from ATK stat (20% of ATK)', () => {
        const skill = wandering_bard.skills.find(s => s.name === 'Soothing Serenade')
        expect(skill.healFromStat).toEqual({
          stat: 'atk',
          percent: 20
        })
      })
    })

    describe('Ballad of Blackwall (L6)', () => {
      it('should unlock at level 6', () => {
        const skill = wandering_bard.skills.find(s => s.name === 'Ballad of Blackwall')
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should target all allies', () => {
        const skill = wandering_bard.skills.find(s => s.name === 'Ballad of Blackwall')
        expect(skill.targetType).toBe('all_allies')
      })

      it('should apply +20% DEF buff for 2 turns', () => {
        const skill = wandering_bard.skills.find(s => s.name === 'Ballad of Blackwall')
        const defUpEffect = skill.effects.find(e => e.type === EffectType.DEF_UP)
        expect(defUpEffect).toBeDefined()
        expect(defUpEffect.target).toBe('all_allies')
        expect(defUpEffect.duration).toBe(2)
        expect(defUpEffect.value).toBe(20)
      })
    })

    describe('Ballad of Echoes (L12)', () => {
      it('should unlock at level 12', () => {
        const skill = wandering_bard.skills.find(s => s.name === 'Ballad of Echoes')
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should target all allies with no damage', () => {
        const skill = wandering_bard.skills.find(s => s.name === 'Ballad of Echoes')
        expect(skill.targetType).toBe('all_allies')
        expect(skill.noDamage).toBe(true)
      })

      it('should extend all buff durations by 1 turn', () => {
        const skill = wandering_bard.skills.find(s => s.name === 'Ballad of Echoes')
        expect(skill.extendBuffs).toBe(1)
      })
    })
  })
})
