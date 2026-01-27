import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('desperation debuff scaling', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  it('resolveEffectValue returns base value when no desperationBonus', () => {
    const effect = { value: 10 }
    const hero = {}
    expect(store.resolveEffectValue(effect, hero)).toBe(10)
  })

  it('resolveEffectValue adds desperation bonus based on party missing HP', () => {
    // Set up heroes with 50% avg missing HP
    store.heroes = [
      { currentHp: 50, maxHp: 100 },
      { currentHp: 100, maxHp: 200 }
    ]
    const effect = { value: 10, desperationBonus: 15 }
    const hero = {}
    const result = store.resolveEffectValue(effect, hero)
    // 10 + floor(15 * 0.5) = 10 + 7 = 17
    expect(result).toBe(17)
  })

  it('resolveEffectValue returns base value when party is full HP', () => {
    store.heroes = [
      { currentHp: 100, maxHp: 100 },
      { currentHp: 200, maxHp: 200 }
    ]
    const effect = { value: 10, desperationBonus: 15 }
    const hero = {}
    expect(store.resolveEffectValue(effect, hero)).toBe(10)
  })

  it('resolveEffectValue scales with severe desperation', () => {
    store.heroes = [
      { currentHp: 10, maxHp: 100 },
      { currentHp: 20, maxHp: 200 }
    ]
    const effect = { value: 10, desperationBonus: 15 }
    const hero = {}
    const result = store.resolveEffectValue(effect, hero)
    // avg missing = (0.9 + 0.9) / 2 = 0.9
    // 10 + floor(15 * 0.9) = 10 + 13 = 23
    expect(result).toBe(23)
  })
})
