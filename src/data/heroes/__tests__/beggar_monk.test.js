import { describe, it, expect } from 'vitest'
import { beggar_monk } from '../1star/beggar_monk'
import { EffectType } from '../../statusEffects'

describe('Beggar Monk (Vagrant Bil)', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(beggar_monk.id).toBe('beggar_monk')
      expect(beggar_monk.name).toBe('Vagrant Bil')
    })

    it('should be a 1-star cleric', () => {
      expect(beggar_monk.rarity).toBe(1)
      expect(beggar_monk.classId).toBe('cleric')
    })

    it('should have correct base stats with MP', () => {
      expect(beggar_monk.baseStats).toEqual({ hp: 60, atk: 12, def: 15, spd: 9, mp: 45 })
    })
  })

  describe('skills', () => {
    it('should have 4 skills total', () => {
      expect(beggar_monk.skills).toHaveLength(4)
    })

    describe('Minor Heal (L1)', () => {
      it('should cost 10 MP and unlock at level 1', () => {
        const skill = beggar_monk.skills.find(s => s.name === 'Minor Heal')
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(10)
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target ally', () => {
        const skill = beggar_monk.skills.find(s => s.name === 'Minor Heal')
        expect(skill.targetType).toBe('ally')
      })

      it('should have base 40% heal with 80% desperation bonus', () => {
        const skill = beggar_monk.skills.find(s => s.name === 'Minor Heal')
        expect(skill.healPercent).toBe(40)
        expect(skill.desperationHealBonus).toBe(80)
      })
    })

    describe('Worthless Words (L3)', () => {
      it('should cost 8 MP and unlock at level 3', () => {
        const skill = beggar_monk.skills.find(s => s.name === 'Worthless Words')
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(8)
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should target enemy with no damage', () => {
        const skill = beggar_monk.skills.find(s => s.name === 'Worthless Words')
        expect(skill.targetType).toBe('enemy')
        expect(skill.noDamage).toBe(true)
      })

      it('should apply ATK down with desperation bonus', () => {
        const skill = beggar_monk.skills.find(s => s.name === 'Worthless Words')
        expect(skill.effects).toHaveLength(1)
        const atkDownEffect = skill.effects[0]
        expect(atkDownEffect.type).toBe(EffectType.ATK_DOWN)
        expect(atkDownEffect.target).toBe('enemy')
        expect(atkDownEffect.duration).toBe(2)
        expect(atkDownEffect.value).toBe(10)
        expect(atkDownEffect.desperationBonus).toBe(15)
      })
    })

    describe("Nobody's Curse (L6)", () => {
      it('should cost 8 MP and unlock at level 6', () => {
        const skill = beggar_monk.skills.find(s => s.name === "Nobody's Curse")
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(8)
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should target enemy with no damage', () => {
        const skill = beggar_monk.skills.find(s => s.name === "Nobody's Curse")
        expect(skill.targetType).toBe('enemy')
        expect(skill.noDamage).toBe(true)
      })

      it('should apply DEF down for 3 turns with desperation bonus', () => {
        const skill = beggar_monk.skills.find(s => s.name === "Nobody's Curse")
        expect(skill.effects).toHaveLength(1)
        const defDownEffect = skill.effects[0]
        expect(defDownEffect.type).toBe(EffectType.DEF_DOWN)
        expect(defDownEffect.target).toBe('enemy')
        expect(defDownEffect.duration).toBe(3)
        expect(defDownEffect.value).toBe(10)
        expect(defDownEffect.desperationBonus).toBe(15)
      })
    })

    describe("Beggar's Prayer (L12)", () => {
      it('should cost 16 MP and unlock at level 12', () => {
        const skill = beggar_monk.skills.find(s => s.name === "Beggar's Prayer")
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(16)
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should target all allies', () => {
        const skill = beggar_monk.skills.find(s => s.name === "Beggar's Prayer")
        expect(skill.targetType).toBe('all_allies')
      })

      it('should heal with base 25% and 50% desperation bonus', () => {
        const skill = beggar_monk.skills.find(s => s.name === "Beggar's Prayer")
        expect(skill.healPercent).toBe(25)
        expect(skill.desperationHealBonus).toBe(50)
      })

      it('should apply ATK down to all enemies with desperation bonus', () => {
        const skill = beggar_monk.skills.find(s => s.name === "Beggar's Prayer")
        expect(skill.effects).toHaveLength(1)
        const atkDownEffect = skill.effects[0]
        expect(atkDownEffect.type).toBe(EffectType.ATK_DOWN)
        expect(atkDownEffect.target).toBe('all_enemies')
        expect(atkDownEffect.duration).toBe(2)
        expect(atkDownEffect.value).toBe(10)
        expect(atkDownEffect.desperationBonus).toBe(15)
      })
    })
  })
})
