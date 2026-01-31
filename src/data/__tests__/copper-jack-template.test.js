import { describe, it, expect } from 'vitest'
import { copper_jack } from '../heroes/4star/copper_jack'
import { EffectType } from '../statusEffects'

describe('Copper Jack Hero Template', () => {
  it('should have correct basic properties', () => {
    expect(copper_jack.id).toBe('copper_jack')
    expect(copper_jack.name).toBe('Copper Jack')
    expect(copper_jack.rarity).toBe(4)
    expect(copper_jack.classId).toBe('berserker')
  })

  it('should have correct base stats', () => {
    expect(copper_jack.baseStats).toEqual({
      hp: 95, atk: 45, def: 20, spd: 14
    })
  })

  it('should have hasCoinFlip flag', () => {
    expect(copper_jack.hasCoinFlip).toBe(true)
  })

  it('should have coinFlipEffects defined', () => {
    expect(copper_jack.coinFlipEffects).toEqual({
      heads: { damageMultiplier: 2.5, firstHitOnly: true },
      tails: { selfDamagePercent: 15, rageGain: 25 }
    })
  })

  it('should have 5 skills', () => {
    expect(copper_jack.skills).toHaveLength(5)
  })

  describe('Weighted Toss skill', () => {
    const skill = copper_jack.skills.find(s => s.name === 'Weighted Toss')

    it('should exist with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.damagePercent).toBe(120)
      expect(skill.rageCost).toBe(20)
      expect(skill.coinFlipBonus).toBe(40)
    })
  })

  describe('All In skill', () => {
    const skill = copper_jack.skills.find(s => s.name === 'All In')

    it('should be multi-hit with per-hit coin flips', () => {
      expect(skill.multiHit).toBe(2)
      expect(skill.perHitCoinFlip).toBe(true)
    })
  })

  describe('Jackpot skill', () => {
    const skill = copper_jack.skills.find(s => s.name === 'Jackpot')

    it('should flip 5 coins', () => {
      expect(skill.jackpotFlips).toBe(5)
      expect(skill.damagePerHeads).toBe(60)
      expect(skill.ragePerTails).toBe(15)
      expect(skill.atkPerTails).toBe(5)
    })
  })
})
