import { describe, it, expect } from 'vitest'
import { enemies } from '../janxier.js'
import { EffectType } from '../../statusEffects.js'

describe('Janxier Floodplain enemies - Summoning', () => {
  describe('Mire Sprite (summonable)', () => {
    const sprite = enemies.mire_sprite

    it('should exist', () => {
      expect(sprite).toBeDefined()
    })

    it('should have correct stats', () => {
      expect(sprite.stats).toEqual({ hp: 50, atk: 35, def: 8, spd: 14 })
    })

    it('should have Bog Grip skill', () => {
      expect(sprite.skill.name).toBe('Bog Grip')
    })

    it('should apply SPD Down 25% for 2 turns', () => {
      const spdDown = sprite.skill.effects.find(e => e.type === EffectType.SPD_DOWN)
      expect(spdDown).toBeDefined()
      expect(spdDown.target).toBe('hero')
      expect(spdDown.value).toBe(25)
      expect(spdDown.duration).toBe(2)
    })

    it('should have cooldown 3', () => {
      expect(sprite.skill.cooldown).toBe(3)
    })
  })

  describe('Bog Witch', () => {
    const witch = enemies.bog_witch

    it('should exist', () => {
      expect(witch).toBeDefined()
    })

    it('should have correct stats', () => {
      expect(witch.stats).toEqual({ hp: 170, atk: 16, def: 24, spd: 10 })
    })

    it('should have Conjure Mire skill', () => {
      expect(witch.skill.name).toBe('Conjure Mire')
    })

    it('should be a noDamage skill', () => {
      expect(witch.skill.noDamage).toBe(true)
    })

    it('should summon a mire_sprite', () => {
      expect(witch.skill.summon).toBeDefined()
      expect(witch.skill.summon.templateId).toBe('mire_sprite')
      expect(witch.skill.summon.count).toBe(1)
    })

    it('should have cooldown 4', () => {
      expect(witch.skill.cooldown).toBe(4)
    })

    it('should have a fallbackSkill named Hex', () => {
      expect(witch.skill.fallbackSkill).toBeDefined()
      expect(witch.skill.fallbackSkill.name).toBe('Hex')
    })

    it('should have fallbackSkill that applies ATK Down 25% for 2 turns', () => {
      const atkDown = witch.skill.fallbackSkill.effects.find(e => e.type === EffectType.ATK_DOWN)
      expect(atkDown).toBeDefined()
      expect(atkDown.target).toBe('hero')
      expect(atkDown.value).toBe(25)
      expect(atkDown.duration).toBe(2)
    })
  })
})
