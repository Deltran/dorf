import { describe, it, expect } from 'vitest'
import { vashek_the_unrelenting } from '../3star/vashek_the_unrelenting'
import { EffectType } from '../../statusEffects'

describe('Vashek the Unrelenting', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(vashek_the_unrelenting.id).toBe('vashek_the_unrelenting')
      expect(vashek_the_unrelenting.name).toBe('Vashek')
    })

    it('should be a 3-star knight', () => {
      expect(vashek_the_unrelenting.rarity).toBe(3)
      expect(vashek_the_unrelenting.classId).toBe('knight')
    })

    it('should have correct base stats (no MP for knights with Valor)', () => {
      expect(vashek_the_unrelenting.baseStats).toEqual({
        hp: 110,
        atk: 22,
        def: 28,
        spd: 10
      })
      expect(vashek_the_unrelenting.baseStats.mp).toBeUndefined()
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(vashek_the_unrelenting.skills).toHaveLength(5)
    })

    describe('Hold the Line (L1)', () => {
      it('should require 0 Valor and unlock at level 1', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Hold the Line')
        expect(skill).toBeDefined()
        expect(skill.valorRequired).toBe(0)
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target enemy', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Hold the Line')
        expect(skill.targetType).toBe('enemy')
      })

      it('should have scaling damage based on Valor', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Hold the Line')
        expect(skill.damage).toEqual({
          base: 80,
          at25: 90,
          at50: 100,
          at75: 110,
          at100: 120
        })
      })

      it('should have conditional bonus damage when any ally is below 50% HP', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Hold the Line')
        expect(skill.conditionalBonusDamage).toBeDefined()
        expect(skill.conditionalBonusDamage.condition).toBe('anyAllyBelowHalfHp')
        expect(skill.conditionalBonusDamage.bonusPercent).toEqual({
          base: 20,
          at50: 25,
          at75: 30,
          at100: 35
        })
      })
    })

    describe('Brothers in Arms (L1)', () => {
      it('should require 0 Valor and unlock at level 1', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Brothers in Arms')
        expect(skill).toBeDefined()
        expect(skill.valorRequired).toBe(0)
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target ally (excluding self) with no damage', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Brothers in Arms')
        expect(skill.targetType).toBe('ally')
        expect(skill.excludeSelf).toBe(true)
        expect(skill.noDamage).toBe(true)
      })

      it('should grant DEF buff to ally with scaling values', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Brothers in Arms')
        const defUpEffect = skill.effects.find(e => e.type === EffectType.DEF_UP)
        expect(defUpEffect).toBeDefined()
        expect(defUpEffect.target).toBe('ally')
        expect(defUpEffect.duration).toBe(2)
        expect(defUpEffect.value).toEqual({
          base: 10,
          at25: 15,
          at50: 20,
          at75: 25,
          at100: 30
        })
      })

      it('should grant ATK buff to self with scaling values', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Brothers in Arms')
        const atkUpEffect = skill.effects.find(e => e.type === EffectType.ATK_UP)
        expect(atkUpEffect).toBeDefined()
        expect(atkUpEffect.target).toBe('self')
        expect(atkUpEffect.duration).toBe(2)
        expect(atkUpEffect.value).toEqual({
          base: 5,
          at50: 10,
          at75: 15,
          at100: 20
        })
      })
    })

    describe('Forward, Together (L3)', () => {
      it('should require 25 Valor and unlock at level 3', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Forward, Together')
        expect(skill).toBeDefined()
        expect(skill.valorRequired).toBe(25)
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should target all allies with no damage', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Forward, Together')
        expect(skill.targetType).toBe('all_allies')
        expect(skill.noDamage).toBe(true)
      })

      it('should deal 10% max HP self-damage', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Forward, Together')
        expect(skill.selfDamagePercentMaxHp).toBe(10)
      })

      it('should grant ATK buff to all allies with scaling duration and value', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Forward, Together')
        const atkUpEffect = skill.effects.find(e => e.type === EffectType.ATK_UP)
        expect(atkUpEffect).toBeDefined()
        expect(atkUpEffect.target).toBe('all_allies')
        expect(atkUpEffect.duration).toEqual({ base: 2, at100: 3 })
        expect(atkUpEffect.value).toEqual({
          base: 10,
          at50: 15,
          at75: 20,
          at100: 25
        })
      })
    })

    describe('Unyielding (L6 Passive)', () => {
      it('should be a passive skill unlocked at level 6', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Unyielding')
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
        expect(skill.isPassive).toBe(true)
        expect(skill.passiveType).toBe('allySaveOnce')
      })

      it('should save ally from death when Vashek is above 50% HP', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Unyielding')
        expect(skill.saveAllyOnDeath).toBeDefined()
        expect(skill.saveAllyOnDeath.vashekMinHpPercent).toBe(50)
      })

      it('should share 50% of killing blow damage', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Unyielding')
        expect(skill.saveAllyOnDeath.damageSharePercent).toBe(50)
      })

      it('should only trigger once per battle', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Unyielding')
        expect(skill.saveAllyOnDeath.oncePerBattle).toBe(true)
      })
    })

    describe('Shoulder to Shoulder (L12)', () => {
      it('should require 50 Valor and unlock at level 12', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Shoulder to Shoulder')
        expect(skill).toBeDefined()
        expect(skill.valorRequired).toBe(50)
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should target all allies with no damage', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Shoulder to Shoulder')
        expect(skill.targetType).toBe('all_allies')
        expect(skill.noDamage).toBe(true)
      })

      it('should grant ATK buff per surviving ally with scaling duration and value', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Shoulder to Shoulder')
        const atkUpEffect = skill.effects.find(e => e.type === EffectType.ATK_UP)
        expect(atkUpEffect).toBeDefined()
        expect(atkUpEffect.target).toBe('all_allies')
        expect(atkUpEffect.duration).toEqual({ base: 2, at100: 3 })
        expect(atkUpEffect.valuePerAlly).toEqual({
          base: 5,
          at75: 7,
          at100: 8
        })
      })

      it('should grant DEF buff per surviving ally with scaling duration and value', () => {
        const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Shoulder to Shoulder')
        const defUpEffect = skill.effects.find(e => e.type === EffectType.DEF_UP)
        expect(defUpEffect).toBeDefined()
        expect(defUpEffect.target).toBe('all_allies')
        expect(defUpEffect.duration).toEqual({ base: 2, at100: 3 })
        expect(defUpEffect.valuePerAlly).toEqual({
          base: 5,
          at75: 7,
          at100: 8
        })
      })
    })
  })
})
