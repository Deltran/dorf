// src/stores/__tests__/battle-basic-attack-modifier.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('battle store - basic attack modifier passive', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('getBasicAttackDamagePercent', () => {
    it('returns 100 for heroes without modifier', () => {
      const hero = {
        template: { id: 'normal_hero' },
        wasAttacked: false
      }
      expect(store.getBasicAttackDamagePercent(hero)).toBe(100)
    })

    it('returns baseDamagePercent when not attacked', () => {
      const hero = {
        template: {
          id: 'rosara_the_unmoved',
          basicAttackModifier: {
            baseDamagePercent: 80,
            ifAttackedDamagePercent: 120
          }
        },
        wasAttacked: false
      }
      expect(store.getBasicAttackDamagePercent(hero)).toBe(80)
    })

    it('returns ifAttackedDamagePercent when attacked', () => {
      const hero = {
        template: {
          id: 'rosara_the_unmoved',
          basicAttackModifier: {
            baseDamagePercent: 80,
            ifAttackedDamagePercent: 120
          }
        },
        wasAttacked: true
      }
      expect(store.getBasicAttackDamagePercent(hero)).toBe(120)
    })
  })
})
