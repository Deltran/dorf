import { describe, it, expect } from 'vitest'
import { bones_mccready } from '../3star/bones_mccready'
import { EffectType } from '../../statusEffects'

describe('Bones McCready', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(bones_mccready.id).toBe('bones_mccready')
      expect(bones_mccready.name).toBe('Bones McCready')
    })

    it('should be a 3-star druid', () => {
      expect(bones_mccready.rarity).toBe(3)
      expect(bones_mccready.classId).toBe('druid')
    })

    it('should have correct base stats with MP', () => {
      expect(bones_mccready.baseStats).toEqual({
        hp: 85,
        atk: 22,
        def: 22,
        spd: 11,
        mp: 60
      })
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(bones_mccready.skills).toHaveLength(5)
    })

    describe('Roll the Bones (L1)', () => {
      it('should cost 12 MP and unlock at level 1', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Roll the Bones')
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(12)
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target ally with no damage', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Roll the Bones')
        expect(skill.targetType).toBe('ally')
        expect(skill.noDamage).toBe(true)
      })

      it('should be a dice heal skill with 1d6', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Roll the Bones')
        expect(skill.isDiceHeal).toBe(true)
        expect(skill.diceCount).toBe(1)
        expect(skill.diceSides).toBe(6)
      })

      it('should have three heal tiers based on dice roll', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Roll the Bones')
        expect(skill.diceTiers).toHaveLength(3)
        expect(skill.diceTiers[0]).toEqual({ min: 1, max: 2, healPercent: 50 })
        expect(skill.diceTiers[1]).toEqual({ min: 3, max: 4, healPercent: 100 })
        expect(skill.diceTiers[2]).toEqual({ min: 5, max: 6, healPercent: 150, applyRegen: true })
      })
    })

    describe('Snake Eyes (L1)', () => {
      it('should cost 14 MP and unlock at level 1', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Snake Eyes')
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(14)
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target enemy with no damage', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Snake Eyes')
        expect(skill.targetType).toBe('enemy')
        expect(skill.noDamage).toBe(true)
      })

      it('should be a dice effect skill with 2d6', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Snake Eyes')
        expect(skill.isDiceEffect).toBe(true)
        expect(skill.diceCount).toBe(2)
        expect(skill.diceSides).toBe(6)
      })

      it('should apply Poison (35% value) for 2 turns', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Snake Eyes')
        const poisonEffect = skill.effects.find(e => e.type === EffectType.POISON)
        expect(poisonEffect).toBeDefined()
        expect(poisonEffect.target).toBe('enemy')
        expect(poisonEffect.duration).toBe(2)
        expect(poisonEffect.value).toBe(35)
      })

      it('should extend duration by 2 turns on doubles', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Snake Eyes')
        expect(skill.onDoubles).toEqual({ extendDuration: 2 })
      })
    })

    describe('Fortune Teller (L3)', () => {
      it('should cost 18 MP and unlock at level 3', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Fortune Teller')
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(18)
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should target self with no damage', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Fortune Teller')
        expect(skill.targetType).toBe('self')
        expect(skill.noDamage).toBe(true)
      })

      it('should apply fortune_teller effect for 3 turns', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Fortune Teller')
        const fortuneEffect = skill.effects.find(e => e.type === 'fortune_teller')
        expect(fortuneEffect).toBeDefined()
        expect(fortuneEffect.target).toBe('self')
        expect(fortuneEffect.duration).toBe(3)
      })
    })

    describe('Loaded Bones (L6)', () => {
      it('should cost 16 MP and unlock at level 6', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Loaded Bones')
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(16)
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should target ally with no damage', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Loaded Bones')
        expect(skill.targetType).toBe('ally')
        expect(skill.noDamage).toBe(true)
      })

      it('should heal for 80% ATK', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Loaded Bones')
        expect(skill.healPercent).toBe(80)
      })

      it('should apply Loaded Dice effect for 99 turns (until consumed)', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Loaded Bones')
        const loadedDiceEffect = skill.effects.find(e => e.type === EffectType.LOADED_DICE)
        expect(loadedDiceEffect).toBeDefined()
        expect(loadedDiceEffect.target).toBe('ally')
        expect(loadedDiceEffect.duration).toBe(99)
      })
    })

    describe('Bones Never Lie (L12)', () => {
      it('should cost 28 MP and unlock at level 12', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Bones Never Lie')
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(28)
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should target all allies with no damage', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Bones Never Lie')
        expect(skill.targetType).toBe('all_allies')
        expect(skill.noDamage).toBe(true)
      })

      it('should be a dice heal skill with 3d6', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Bones Never Lie')
        expect(skill.isDiceHeal).toBe(true)
        expect(skill.diceCount).toBe(3)
        expect(skill.diceSides).toBe(6)
      })

      it('should have three heal tiers based on 3d6 dice roll', () => {
        const skill = bones_mccready.skills.find(s => s.name === 'Bones Never Lie')
        expect(skill.diceTiers).toHaveLength(3)
        expect(skill.diceTiers[0]).toEqual({ min: 3, max: 8, healPercent: 40 })
        expect(skill.diceTiers[1]).toEqual({ min: 9, max: 14, healPercent: 80 })
        expect(skill.diceTiers[2]).toEqual({ min: 15, max: 18, healPercent: 120, applyRegen: true })
      })
    })
  })
})
