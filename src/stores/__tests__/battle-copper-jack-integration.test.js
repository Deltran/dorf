import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { copper_jack } from '../../data/heroes/4star/copper_jack'

describe('Copper Jack Battle Integration', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  describe('Weighted Toss with coin flip bonus', () => {
    it('should add bonus damage if coin was flipped this turn', () => {
      const jack = {
        instanceId: 'jack_1',
        template: copper_jack,
        currentHp: 95,
        maxHp: 95,
        atk: 45,
        currentRage: 50,
        coinFlippedThisTurn: true,
        statusEffects: []
      }

      const skill = copper_jack.skills.find(s => s.name === 'Weighted Toss')
      const damage = battleStore.calculateCoinFlipSkillDamage(jack, skill)

      // (120 + 40) = 160% of 45 = 72
      expect(damage).toBe(72)
    })

    it('should not add bonus if coin was not flipped', () => {
      const jack = {
        instanceId: 'jack_1',
        template: copper_jack,
        atk: 45,
        coinFlippedThisTurn: false,
        statusEffects: []
      }

      const skill = copper_jack.skills.find(s => s.name === 'Weighted Toss')
      const damage = battleStore.calculateCoinFlipSkillDamage(jack, skill)

      // 120% of 45 = 54
      expect(damage).toBe(54)
    })
  })

  describe('Double Down with self-damage bonus', () => {
    it('should deal bonus damage if tails self-damage occurred', () => {
      const jack = {
        instanceId: 'jack_1',
        template: copper_jack,
        atk: 45,
        tookSelfDamageThisTurn: true,
        statusEffects: []
      }

      const skill = copper_jack.skills.find(s => s.name === 'Double Down')
      const damage = battleStore.calculateCoinFlipSkillDamage(jack, skill)

      // selfDamageBonusPercent: 250% of 45 = 112 (rounded down)
      expect(damage).toBe(112)
    })

    it('should deal normal damage if no self-damage occurred', () => {
      const jack = {
        instanceId: 'jack_1',
        template: copper_jack,
        atk: 45,
        tookSelfDamageThisTurn: false,
        statusEffects: []
      }

      const skill = copper_jack.skills.find(s => s.name === 'Double Down')
      const damage = battleStore.calculateCoinFlipSkillDamage(jack, skill)

      // 150% of 45 = 67 (rounded down)
      expect(damage).toBe(67)
    })
  })

  describe('Jackpot multi-flip', () => {
    it('should calculate damage and buffs from 5 flips', () => {
      // Mock Math.random to return: heads, heads, tails, heads, tails
      // heads = < 0.5, tails = >= 0.5
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.3) // heads
        .mockReturnValueOnce(0.2) // heads
        .mockReturnValueOnce(0.7) // tails
        .mockReturnValueOnce(0.1) // heads
        .mockReturnValueOnce(0.8) // tails

      const jack = {
        instanceId: 'jack_1',
        template: copper_jack,
        atk: 45,
        currentRage: 50,
        statusEffects: []
      }

      const skill = copper_jack.skills.find(s => s.name === 'Jackpot')
      const result = battleStore.executeJackpot(jack, skill)

      // 3 heads * 60% = 180% ATK = 81 damage
      expect(result.damage).toBe(81)
      // 2 tails * 15 rage = 30 rage gained
      expect(result.rageGained).toBe(30)
      // 2 tails = 2 ATK buff stacks
      expect(result.atkBuffStacks).toBe(2)
      expect(result.heads).toBe(3)
      expect(result.tails).toBe(2)

      vi.restoreAllMocks()
    })

    it('should add ATK buff effect for tails', () => {
      // Mock Math.random to return all tails (>= 0.5)
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.6)
        .mockReturnValueOnce(0.7)
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.9)
        .mockReturnValueOnce(0.5)

      const jack = {
        instanceId: 'jack_1',
        template: copper_jack,
        atk: 45,
        currentRage: 50,
        statusEffects: []
      }

      const skill = copper_jack.skills.find(s => s.name === 'Jackpot')
      const result = battleStore.executeJackpot(jack, skill)

      // 5 tails * 5% = 25% ATK buff
      expect(jack.statusEffects).toContainEqual(
        expect.objectContaining({
          type: 'atk_up',
          duration: 3,
          value: 25,
          sourceId: 'jack_1'
        })
      )
      // 5 tails * 15 = 75 rage, capped at 100
      expect(jack.currentRage).toBe(100)

      vi.restoreAllMocks()
    })

    it('should not add ATK buff if all heads', () => {
      // Mock Math.random to return all heads (< 0.5)
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.3)
        .mockReturnValueOnce(0.4)
        .mockReturnValueOnce(0.0)

      const jack = {
        instanceId: 'jack_1',
        template: copper_jack,
        atk: 45,
        currentRage: 50,
        statusEffects: []
      }

      const skill = copper_jack.skills.find(s => s.name === 'Jackpot')
      const result = battleStore.executeJackpot(jack, skill)

      // 5 heads * 60% = 300% ATK = 135 damage
      expect(result.damage).toBe(135)
      expect(result.rageGained).toBe(0)
      expect(result.atkBuffStacks).toBe(0)
      expect(jack.statusEffects).toHaveLength(0)

      vi.restoreAllMocks()
    })
  })
})
