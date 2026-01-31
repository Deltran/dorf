import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('Fortune Swap System', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  describe('executeFortuneSwap', () => {
    const swapPairs = {
      [EffectType.ATK_UP]: EffectType.ATK_DOWN,
      [EffectType.ATK_DOWN]: EffectType.ATK_UP,
      [EffectType.DEF_UP]: EffectType.DEF_DOWN,
      [EffectType.DEF_DOWN]: EffectType.DEF_UP,
      [EffectType.REGEN]: EffectType.POISON,
      [EffectType.POISON]: EffectType.REGEN
    }
    const dispelList = [EffectType.STUN, EffectType.SHIELD]

    it('should swap ATK_UP on ally to ATK_DOWN on enemy', () => {
      const allies = [{
        instanceId: 'hero_1',
        statusEffects: [{ type: EffectType.ATK_UP, duration: 2, value: 20 }]
      }]
      const enemies = [{
        id: 'enemy_1',
        statusEffects: []
      }]

      const result = battleStore.executeFortuneSwap(allies, enemies, swapPairs, dispelList, 'fortuna_1')

      expect(allies[0].statusEffects).toHaveLength(0)
      expect(enemies[0].statusEffects).toContainEqual(
        expect.objectContaining({ type: EffectType.ATK_DOWN, duration: 2, value: 20 })
      )
      expect(result.swapped).toBe(1)
    })

    it('should swap POISON on enemy to REGEN on ally', () => {
      const allies = [{
        instanceId: 'hero_1',
        statusEffects: []
      }]
      const enemies = [{
        id: 'enemy_1',
        statusEffects: [{ type: EffectType.POISON, duration: 3, value: 30 }]
      }]

      const result = battleStore.executeFortuneSwap(allies, enemies, swapPairs, dispelList, 'fortuna_1')

      expect(enemies[0].statusEffects).toHaveLength(0)
      expect(allies[0].statusEffects).toContainEqual(
        expect.objectContaining({ type: EffectType.REGEN, duration: 3, value: 30 })
      )
    })

    it('should dispel effects in dispelList', () => {
      const allies = [{
        instanceId: 'hero_1',
        statusEffects: [{ type: EffectType.SHIELD, duration: 2, shieldHp: 100 }]
      }]
      const enemies = [{
        id: 'enemy_1',
        statusEffects: [{ type: EffectType.STUN, duration: 1 }]
      }]

      const result = battleStore.executeFortuneSwap(allies, enemies, swapPairs, dispelList, 'fortuna_1')

      expect(allies[0].statusEffects).toHaveLength(0)
      expect(enemies[0].statusEffects).toHaveLength(0)
      expect(result.dispelled).toBe(2)
    })

    it('should preserve duration and value when swapping', () => {
      const allies = [{
        instanceId: 'hero_1',
        statusEffects: [{ type: EffectType.DEF_UP, duration: 5, value: 35 }]
      }]
      const enemies = [{ id: 'enemy_1', statusEffects: [] }]

      battleStore.executeFortuneSwap(allies, enemies, swapPairs, dispelList, 'fortuna_1')

      const swapped = enemies[0].statusEffects[0]
      expect(swapped.type).toBe(EffectType.DEF_DOWN)
      expect(swapped.duration).toBe(5)
      expect(swapped.value).toBe(35)
      expect(swapped.sourceId).toBe('fortuna_1')
    })

    it('should return isEmpty true when no effects to process', () => {
      const allies = [{ instanceId: 'hero_1', statusEffects: [] }]
      const enemies = [{ id: 'enemy_1', statusEffects: [] }]

      const result = battleStore.executeFortuneSwap(allies, enemies, swapPairs, dispelList, 'fortuna_1')

      expect(result.isEmpty).toBe(true)
      expect(result.swapped).toBe(0)
      expect(result.dispelled).toBe(0)
    })
  })
})
