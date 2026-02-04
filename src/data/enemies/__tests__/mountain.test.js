import { describe, it, expect } from 'vitest'
import { enemies } from '../mountain.js'
import { EffectType } from '../../statusEffects.js'

describe('Stormwind Peaks enemies', () => {
  describe('Harpy', () => {
    const harpy = enemies.harpy

    it('should have lowered ATK of 28', () => {
      expect(harpy.stats.atk).toBe(28)
    })

    it('should keep other stats unchanged', () => {
      expect(harpy.stats.hp).toBe(80)
      expect(harpy.stats.def).toBe(12)
      expect(harpy.stats.spd).toBe(18)
    })

    it('should have Diving Talon skill with cooldown 3', () => {
      expect(harpy.skill.name).toBe('Diving Talon')
      expect(harpy.skill.cooldown).toBe(3)
    })

    it('should grant self 40% evasion for 1 turn on skill use', () => {
      const effects = harpy.skill.effects
      expect(effects).toBeDefined()
      const evasion = effects.find(e => e.type === EffectType.EVASION)
      expect(evasion).toBeDefined()
      expect(evasion.target).toBe('self')
      expect(evasion.value).toBe(40)
      expect(evasion.duration).toBe(1)
    })
  })

  describe('Frost Elemental', () => {
    const frost = enemies.frost_elemental

    it('should keep same stats', () => {
      expect(frost.stats).toEqual({ hp: 100, atk: 35, def: 25, spd: 10 })
    })

    it('should have Glacial Grip skill (not Freezing Blast)', () => {
      expect(frost.skill.name).toBe('Glacial Grip')
    })

    it('should have cooldown 4', () => {
      expect(frost.skill.cooldown).toBe(4)
    })

    it('should NOT be AoE', () => {
      expect(frost.skill.targetType).toBeUndefined()
    })

    it('should apply SPD Down 30% for 2 turns', () => {
      const spdDown = frost.skill.effects.find(e => e.type === EffectType.SPD_DOWN)
      expect(spdDown).toBeDefined()
      expect(spdDown.value).toBe(30)
      expect(spdDown.duration).toBe(2)
    })

    it('should apply DEF Down 20% for 2 turns', () => {
      const defDown = frost.skill.effects.find(e => e.type === EffectType.DEF_DOWN)
      expect(defDown).toBeDefined()
      expect(defDown.value).toBe(20)
      expect(defDown.duration).toBe(2)
    })
  })

  describe('Mountain Giant', () => {
    const giant = enemies.mountain_giant

    it('should keep same stats', () => {
      expect(giant.stats).toEqual({ hp: 300, atk: 45, def: 30, spd: 3 })
    })

    it('should have Landslide skill (not Earthquake)', () => {
      expect(giant.skill.name).toBe('Landslide')
    })

    it('should have cooldown 5', () => {
      expect(giant.skill.cooldown).toBe(5)
    })

    it('should NOT be AoE', () => {
      expect(giant.skill.targetType).toBeUndefined()
    })

    it('should stun target for 1 turn', () => {
      const stun = giant.skill.effects.find(e => e.type === EffectType.STUN)
      expect(stun).toBeDefined()
      expect(stun.duration).toBe(1)
    })
  })

  // Unchanged enemies should still be intact
  describe('Storm Elemental (unchanged)', () => {
    it('should still exist', () => {
      expect(enemies.storm_elemental).toBeDefined()
    })
  })

  describe('Thunder Hawk (unchanged)', () => {
    it('should still exist', () => {
      expect(enemies.thunder_hawk).toBeDefined()
    })
  })

  describe('Harpy Chick (summonable)', () => {
    const chick = enemies.harpy_chick

    it('should exist', () => {
      expect(chick).toBeDefined()
    })

    it('should have correct stats', () => {
      expect(chick.stats).toEqual({ hp: 30, atk: 15, def: 3, spd: 16 })
    })

    it('should have no skill', () => {
      expect(chick.skill).toBeUndefined()
      expect(chick.skills).toBeUndefined()
    })
  })

  describe('Nesting Roc', () => {
    const roc = enemies.nesting_roc

    it('should exist', () => {
      expect(roc).toBeDefined()
    })

    it('should have correct stats', () => {
      expect(roc.stats).toEqual({ hp: 120, atk: 15, def: 20, spd: 8 })
    })

    it('should have Brood Call skill', () => {
      expect(roc.skill.name).toBe('Brood Call')
    })

    it('should summon a harpy_chick', () => {
      expect(roc.skill.summon).toBeDefined()
      expect(roc.skill.summon.templateId).toBe('harpy_chick')
      expect(roc.skill.summon.count).toBe(1)
    })

    it('should grant self DEF Up 20% for 2 turns', () => {
      const defUp = roc.skill.effects.find(e => e.type === EffectType.DEF_UP)
      expect(defUp).toBeDefined()
      expect(defUp.target).toBe('self')
      expect(defUp.value).toBe(20)
      expect(defUp.duration).toBe(2)
    })

    it('should have a fallbackSkill for when field is full', () => {
      expect(roc.skill.fallbackSkill).toBeDefined()
      expect(roc.skill.fallbackSkill.name).toBe('Protective Roost')
    })

    it('should have fallbackSkill that buffs DEF', () => {
      const defUp = roc.skill.fallbackSkill.effects.find(e => e.type === EffectType.DEF_UP)
      expect(defUp).toBeDefined()
      expect(defUp.target).toBe('self')
    })

    it('should have cooldown 3', () => {
      expect(roc.skill.cooldown).toBe(3)
    })
  })
})
