import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { bones_mccready } from '../../data/heroes/3star/bones_mccready'

describe('Bones McCready Battle Integration', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Roll the Bones skill execution', () => {
    it('should heal based on dice roll tier', () => {
      // Mock Math.random to return a value that gives roll of 5 (for 1d6: (0.666...) * 6 + 1 = ~5)
      vi.spyOn(Math, 'random').mockReturnValue(0.7) // 0.7 * 6 = 4.2, floor + 1 = 5

      const bones = {
        instanceId: 'bones_1',
        template: bones_mccready,
        currentHp: 85,
        maxHp: 85,
        currentMp: 60,
        atk: 22,
        statusEffects: []
      }
      const target = {
        instanceId: 'ally_1',
        currentHp: 50,
        maxHp: 100,
        statusEffects: []
      }

      const skill = bones_mccready.skills.find(s => s.name === 'Roll the Bones')
      battleStore.executeDiceHeal(bones, target, skill)

      // Roll 5 = tier (5-6) = 150% ATK heal = 22 * 1.5 = 33
      expect(target.currentHp).toBe(83)
      expect(target.statusEffects).toContainEqual(
        expect.objectContaining({ type: 'regen' })
      )
    })

    it('should use loaded dice when present', () => {
      const bones = {
        instanceId: 'bones_1',
        template: bones_mccready,
        currentHp: 85,
        maxHp: 85,
        currentMp: 60,
        atk: 22,
        statusEffects: []
      }
      const target = {
        instanceId: 'ally_1',
        currentHp: 50,
        maxHp: 100,
        statusEffects: [{ type: 'loaded_dice', duration: 99 }]
      }

      const skill = bones_mccready.skills.find(s => s.name === 'Roll the Bones')
      const result = battleStore.executeDiceHeal(bones, target, skill)

      expect(result.roll).toBe(6)
      expect(target.statusEffects.find(e => e.type === 'loaded_dice')).toBeUndefined()
    })

    it('should not overheal past maxHp', () => {
      // Mock Math.random to give roll of 6 (highest tier)
      vi.spyOn(Math, 'random').mockReturnValue(0.9) // 0.9 * 6 = 5.4, floor + 1 = 6

      const bones = {
        instanceId: 'bones_1',
        template: bones_mccready,
        currentHp: 85,
        maxHp: 85,
        currentMp: 60,
        atk: 22,
        statusEffects: []
      }
      const target = {
        instanceId: 'ally_1',
        currentHp: 95,
        maxHp: 100,
        statusEffects: []
      }

      const skill = bones_mccready.skills.find(s => s.name === 'Roll the Bones')
      battleStore.executeDiceHeal(bones, target, skill)

      expect(target.currentHp).toBe(100) // Capped at maxHp
    })

    it('should apply different tiers correctly', () => {
      // Test tier 1 (1-2) = 50% ATK
      vi.spyOn(Math, 'random').mockReturnValue(0.1) // 0.1 * 6 = 0.6, floor + 1 = 1

      const bones = {
        instanceId: 'bones_1',
        template: bones_mccready,
        atk: 20,
        statusEffects: []
      }
      const target = {
        instanceId: 'ally_1',
        currentHp: 50,
        maxHp: 100,
        statusEffects: []
      }

      const skill = bones_mccready.skills.find(s => s.name === 'Roll the Bones')
      const result = battleStore.executeDiceHeal(bones, target, skill)

      // Roll 1 = tier (1-2) = 50% ATK heal = 20 * 0.5 = 10
      expect(target.currentHp).toBe(60)
      expect(result.tier.healPercent).toBe(50)
      // Low roll should NOT apply regen
      expect(target.statusEffects.find(e => e.type === 'regen')).toBeUndefined()
    })
  })

  describe('Snake Eyes skill execution', () => {
    it('should extend poison duration on doubles', () => {
      // Mock to get doubles (both dice roll same value)
      // For 2d6, we need two calls returning same value
      let callCount = 0
      vi.spyOn(Math, 'random').mockImplementation(() => {
        callCount++
        return 0.4 // Both return 0.4, which gives floor(0.4*6)+1 = 3
      })

      const bones = {
        instanceId: 'bones_1',
        template: bones_mccready,
        atk: 22,
        statusEffects: []
      }
      const enemy = {
        id: 'enemy_1',
        statusEffects: []
      }

      const skill = bones_mccready.skills.find(s => s.name === 'Snake Eyes')
      battleStore.executeDiceEffect(bones, enemy, skill)

      const poison = enemy.statusEffects.find(e => e.type === 'poison')
      expect(poison).toBeDefined()
      expect(poison.duration).toBe(4) // Base 2 + 2 from doubles
    })

    it('should apply normal duration without doubles', () => {
      // Mock to get non-doubles (different values)
      let callCount = 0
      vi.spyOn(Math, 'random').mockImplementation(() => {
        callCount++
        return callCount === 1 ? 0.1 : 0.8 // First: 1, Second: 5
      })

      const bones = {
        instanceId: 'bones_1',
        template: bones_mccready,
        atk: 22,
        statusEffects: []
      }
      const enemy = {
        id: 'enemy_1',
        statusEffects: []
      }

      const skill = bones_mccready.skills.find(s => s.name === 'Snake Eyes')
      const result = battleStore.executeDiceEffect(bones, enemy, skill)

      const poison = enemy.statusEffects.find(e => e.type === 'poison')
      expect(poison).toBeDefined()
      expect(poison.duration).toBe(2) // Base duration only
      expect(result.isDoubles).toBe(false)
    })

    it('should return isDoubles flag in result', () => {
      // Mock to get doubles
      vi.spyOn(Math, 'random').mockReturnValue(0.7) // Both dice get same value

      const bones = {
        instanceId: 'bones_1',
        template: bones_mccready,
        atk: 22,
        statusEffects: []
      }
      const enemy = {
        id: 'enemy_1',
        statusEffects: []
      }

      const skill = bones_mccready.skills.find(s => s.name === 'Snake Eyes')
      const result = battleStore.executeDiceEffect(bones, enemy, skill)

      expect(result.isDoubles).toBe(true)
      // 0.7 * 6 = 4.2, floor + 1 = 5. Two 5s = 10 total
      expect(result.roll).toBe(10)
    })
  })
})
