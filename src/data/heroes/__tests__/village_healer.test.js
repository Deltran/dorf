import { describe, it, expect } from 'vitest'
import { village_healer } from '../3star/village_healer'
import { EffectType } from '../../statusEffects'

describe('Village Healer (Grandma Helga)', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(village_healer.id).toBe('village_healer')
      expect(village_healer.name).toBe('Grandma Helga')
    })

    it('should be a 3-star cleric', () => {
      expect(village_healer.rarity).toBe(3)
      expect(village_healer.classId).toBe('cleric')
    })

    it('should have correct base stats with MP', () => {
      expect(village_healer.baseStats).toEqual({
        hp: 80,
        atk: 18,
        def: 25,
        spd: 9,
        mp: 65
      })
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(village_healer.skills).toHaveLength(5)
    })

    describe('Healing Touch (L1)', () => {
      it('should cost 15 MP and unlock at level 1', () => {
        const skill = village_healer.skills.find(s => s.name === 'Healing Touch')
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(15)
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target ally for healing (120% ATK heal implied by description)', () => {
        const skill = village_healer.skills.find(s => s.name === 'Healing Touch')
        expect(skill.targetType).toBe('ally')
      })
    })

    describe('Cup of Tea (L1)', () => {
      it('should cost 12 MP and unlock at level 1', () => {
        const skill = village_healer.skills.find(s => s.name === 'Cup of Tea')
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(12)
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target ally with no damage', () => {
        const skill = village_healer.skills.find(s => s.name === 'Cup of Tea')
        expect(skill.targetType).toBe('ally')
        expect(skill.noDamage).toBe(true)
      })

      it('should apply Regen (25% ATK per turn) for 3 turns', () => {
        const skill = village_healer.skills.find(s => s.name === 'Cup of Tea')
        const regenEffect = skill.effects.find(e => e.type === EffectType.REGEN)
        expect(regenEffect).toBeDefined()
        expect(regenEffect.target).toBe('ally')
        expect(regenEffect.duration).toBe(3)
        expect(regenEffect.atkPercent).toBe(25)
      })
    })

    describe('Mana Spring (L3)', () => {
      it('should cost 10 MP and unlock at level 3', () => {
        const skill = village_healer.skills.find(s => s.name === 'Mana Spring')
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(10)
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should target ally with no damage', () => {
        const skill = village_healer.skills.find(s => s.name === 'Mana Spring')
        expect(skill.targetType).toBe('ally')
        expect(skill.noDamage).toBe(true)
      })

      it('should apply MP Regen (5 MP per turn) for 3 turns', () => {
        const skill = village_healer.skills.find(s => s.name === 'Mana Spring')
        const mpRegenEffect = skill.effects.find(e => e.type === EffectType.MP_REGEN)
        expect(mpRegenEffect).toBeDefined()
        expect(mpRegenEffect.target).toBe('ally')
        expect(mpRegenEffect.duration).toBe(3)
        expect(mpRegenEffect.value).toBe(5)
      })
    })

    describe('There There, Dear (L6)', () => {
      it('should cost 18 MP and unlock at level 6', () => {
        const skill = village_healer.skills.find(s => s.name === 'There There, Dear')
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(18)
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should target ally (heals 90% ATK implied by description)', () => {
        const skill = village_healer.skills.find(s => s.name === 'There There, Dear')
        expect(skill.targetType).toBe('ally')
      })

      it('should apply +15% ATK buff for 2 turns', () => {
        const skill = village_healer.skills.find(s => s.name === 'There There, Dear')
        const atkUpEffect = skill.effects.find(e => e.type === EffectType.ATK_UP)
        expect(atkUpEffect).toBeDefined()
        expect(atkUpEffect.target).toBe('ally')
        expect(atkUpEffect.duration).toBe(2)
        expect(atkUpEffect.value).toBe(15)
      })
    })

    describe('Second Helping (L12)', () => {
      it('should cost 28 MP and unlock at level 12', () => {
        const skill = village_healer.skills.find(s => s.name === 'Second Helping')
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(28)
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should target all allies (heals 80% ATK)', () => {
        const skill = village_healer.skills.find(s => s.name === 'Second Helping')
        expect(skill.targetType).toBe('all_allies')
      })

      it('should grant Well Fed effect with correct parameters', () => {
        const skill = village_healer.skills.find(s => s.name === 'Second Helping')
        expect(skill.wellFedEffect).toBeDefined()
        expect(skill.wellFedEffect.duration).toBe(3)
        expect(skill.wellFedEffect.atkPercent).toBe(100)
        expect(skill.wellFedEffect.threshold).toBe(30)
      })
    })
  })
})
