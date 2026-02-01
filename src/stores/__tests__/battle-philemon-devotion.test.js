// src/stores/__tests__/battle-philemon-devotion.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('Philemon Undying Devotion - Death Prevention with damage to source', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  it('damages Philemon when Death Prevention triggers on ally', () => {
    const philemon = {
      instanceId: 'philemon1',
      template: { name: 'Philemon' },
      currentHp: 1000,
      maxHp: 1000,
      statusEffects: []
    }

    const ally = {
      instanceId: 'ally1',
      template: { name: 'Ally' },
      currentHp: 50,
      maxHp: 500,
      statusEffects: [
        {
          type: EffectType.DEATH_PREVENTION,
          duration: 3,
          damageToSourceOnTrigger: 25,
          sourceId: 'philemon1',
          definition: { isDeathPrevention: true }
        }
      ]
    }

    store.heroes = [philemon, ally]

    store.applyDamage(ally, 100, 'attack', null)

    expect(ally.currentHp).toBe(1)
    expect(philemon.currentHp).toBe(750)
  })

  it('does not damage source if Death Prevention does not trigger', () => {
    const philemon = {
      instanceId: 'philemon1',
      template: { name: 'Philemon' },
      currentHp: 1000,
      maxHp: 1000,
      statusEffects: []
    }

    const ally = {
      instanceId: 'ally1',
      template: { name: 'Ally' },
      currentHp: 500,
      maxHp: 500,
      statusEffects: [
        {
          type: EffectType.DEATH_PREVENTION,
          duration: 3,
          damageToSourceOnTrigger: 25,
          sourceId: 'philemon1',
          definition: { isDeathPrevention: true }
        }
      ]
    }

    store.heroes = [philemon, ally]

    store.applyDamage(ally, 100, 'attack', null)

    expect(philemon.currentHp).toBe(1000)
  })
})
