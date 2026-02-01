import { describe, it, expect } from 'vitest'
import { town_guard } from '../3star/town_guard'
import { EffectType } from '../../statusEffects'

describe('Town Guard (Kensin)', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(town_guard.id).toBe('town_guard')
      expect(town_guard.name).toBe('Kensin')
    })

    it('should be a 3-star knight', () => {
      expect(town_guard.rarity).toBe(3)
      expect(town_guard.classId).toBe('knight')
    })

    it('should have correct epithet and intro quote', () => {
      expect(town_guard.epithet).toBe('Keeper of the Gate')
      expect(town_guard.introQuote).toBe('Halt! State your business.')
    })

    it('should have correct base stats (no MP for knights with Valor)', () => {
      expect(town_guard.baseStats).toEqual({ hp: 110, atk: 22, def: 35, spd: 8 })
      expect(town_guard.baseStats.mp).toBeUndefined()
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(town_guard.skills).toHaveLength(5)
    })

    describe('Stand and Fight (L1)', () => {
      it('should require 25 Valor and unlock at level 1', () => {
        const skill = town_guard.skills.find(s => s.name === 'Stand and Fight')
        expect(skill).toBeDefined()
        expect(skill.valorRequired).toBe(25)
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should be a self-targeting defensive skill with no damage', () => {
        const skill = town_guard.skills.find(s => s.name === 'Stand and Fight')
        expect(skill.targetType).toBe('self')
        expect(skill.noDamage).toBe(true)
        expect(skill.defensive).toBe(true)
      })

      it('should apply Taunt with scaling duration (base 2, at50: 3 turns)', () => {
        const skill = town_guard.skills.find(s => s.name === 'Stand and Fight')
        const tauntEffect = skill.effects.find(e => e.type === EffectType.TAUNT)
        expect(tauntEffect).toBeDefined()
        expect(tauntEffect.target).toBe('self')
        expect(tauntEffect.duration).toEqual({ base: 2, at50: 3 })
      })

      it('should apply Damage Reduction at 75 Valor threshold', () => {
        const skill = town_guard.skills.find(s => s.name === 'Stand and Fight')
        const drEffect = skill.effects.find(e => e.type === EffectType.DAMAGE_REDUCTION)
        expect(drEffect).toBeDefined()
        expect(drEffect.target).toBe('self')
        expect(drEffect.duration).toEqual({ base: 2, at50: 3 })
        expect(drEffect.value).toBe(15)
        expect(drEffect.valorThreshold).toBe(75)
      })
    })

    describe('Retribution (L1)', () => {
      it('should require 0 Valor and unlock at level 1', () => {
        const skill = town_guard.skills.find(s => s.name === 'Retribution')
        expect(skill).toBeDefined()
        expect(skill.valorRequired).toBe(0)
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target enemy', () => {
        const skill = town_guard.skills.find(s => s.name === 'Retribution')
        expect(skill.targetType).toBe('enemy')
      })

      it('should have scaling damage based on Valor', () => {
        const skill = town_guard.skills.find(s => s.name === 'Retribution')
        expect(skill.damage).toEqual({
          base: 100,
          at25: 120,
          at50: 140,
          at75: 160,
          at100: 180
        })
      })
    })

    describe('Reinforce (L3)', () => {
      it('should require 50 Valor and unlock at level 3', () => {
        const skill = town_guard.skills.find(s => s.name === 'Reinforce')
        expect(skill).toBeDefined()
        expect(skill.valorRequired).toBe(50)
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should target ally with no damage', () => {
        const skill = town_guard.skills.find(s => s.name === 'Reinforce')
        expect(skill.targetType).toBe('ally')
        expect(skill.noDamage).toBe(true)
        expect(skill.defensive).toBe(true)
      })

      it('should cleanse ATK/DEF debuffs, with SPD at 100 Valor', () => {
        const skill = town_guard.skills.find(s => s.name === 'Reinforce')
        expect(skill.cleanse).toEqual({
          types: ['atk', 'def'],
          at100Types: ['atk', 'def', 'spd']
        })
      })

      it('should heal based on DEF stat with scaling percentage', () => {
        const skill = town_guard.skills.find(s => s.name === 'Reinforce')
        expect(skill.healFromStat).toEqual({
          stat: 'def',
          percent: { base: 10, at75: 15 }
        })
      })
    })

    describe('Riposte (L6)', () => {
      it('should require 0 Valor and unlock at level 6', () => {
        const skill = town_guard.skills.find(s => s.name === 'Riposte')
        expect(skill).toBeDefined()
        expect(skill.valorRequired).toBe(0)
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should be a self-targeting defensive skill with no damage', () => {
        const skill = town_guard.skills.find(s => s.name === 'Riposte')
        expect(skill.targetType).toBe('self')
        expect(skill.noDamage).toBe(true)
        expect(skill.defensive).toBe(true)
      })

      it('should apply Riposte effect with scaling duration and value', () => {
        const skill = town_guard.skills.find(s => s.name === 'Riposte')
        const riposteEffect = skill.effects.find(e => e.type === EffectType.RIPOSTE)
        expect(riposteEffect).toBeDefined()
        expect(riposteEffect.target).toBe('self')
        expect(riposteEffect.duration).toEqual({ base: 2, at75: 3 })
        expect(riposteEffect.value).toEqual({ base: 80, at50: 100 })
        expect(riposteEffect.noDefCheck).toBe(true)
      })
    })

    describe('Judgment of Steel (L12)', () => {
      it('should consume all Valor, require 50, and unlock at level 12', () => {
        const skill = town_guard.skills.find(s => s.name === 'Judgment of Steel')
        expect(skill).toBeDefined()
        expect(skill.valorCost).toBe('all')
        expect(skill.valorRequired).toBe(50)
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should target enemy', () => {
        const skill = town_guard.skills.find(s => s.name === 'Judgment of Steel')
        expect(skill.targetType).toBe('enemy')
      })

      it('should deal base damage plus bonus per Valor consumed', () => {
        const skill = town_guard.skills.find(s => s.name === 'Judgment of Steel')
        expect(skill.baseDamage).toBe(50)
        expect(skill.damagePerValor).toBe(2)
      })

      it('should apply 20% DEF debuff for 2 turns', () => {
        const skill = town_guard.skills.find(s => s.name === 'Judgment of Steel')
        const defDownEffect = skill.effects.find(e => e.type === EffectType.DEF_DOWN)
        expect(defDownEffect).toBeDefined()
        expect(defDownEffect.target).toBe('enemy')
        expect(defDownEffect.duration).toBe(2)
        expect(defDownEffect.value).toBe(20)
      })
    })
  })
})
