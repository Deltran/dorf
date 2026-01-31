// src/stores/__tests__/battle-heartbreak.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('battle store - Heartbreak passive system', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('initializeHeartbreakStacks', () => {
    it('initializes Mara with 0 Heartbreak stacks', () => {
      const mara = {
        instanceId: 'mara1',
        template: {
          id: 'mara_thornheart',
          heartbreakPassive: { maxStacks: 5 }
        },
        currentHp: 500,
        maxHp: 500,
        heartbreakStacks: undefined
      }

      store.initializeHeartbreakStacks(mara)

      expect(mara.heartbreakStacks).toBe(0)
    })
  })

  describe('gainHeartbreakStack', () => {
    it('increases stacks by 1', () => {
      const mara = {
        instanceId: 'mara1',
        template: { heartbreakPassive: { maxStacks: 5 }, name: 'Mara' },
        heartbreakStacks: 2
      }

      store.gainHeartbreakStack(mara, 1)

      expect(mara.heartbreakStacks).toBe(3)
    })

    it('caps at maxStacks', () => {
      const mara = {
        instanceId: 'mara1',
        template: { heartbreakPassive: { maxStacks: 5 }, name: 'Mara' },
        heartbreakStacks: 4
      }

      store.gainHeartbreakStack(mara, 3)

      expect(mara.heartbreakStacks).toBe(5)
    })
  })

  describe('consumeAllHeartbreakStacks', () => {
    it('returns current stacks and resets to 0', () => {
      const mara = {
        instanceId: 'mara1',
        template: { heartbreakPassive: { maxStacks: 5 }, name: 'Mara' },
        heartbreakStacks: 4
      }

      const consumed = store.consumeAllHeartbreakStacks(mara)

      expect(consumed).toBe(4)
      expect(mara.heartbreakStacks).toBe(0)
    })
  })

  describe('getHeartbreakBonuses', () => {
    it('calculates ATK and lifesteal bonuses from stacks', () => {
      const mara = {
        instanceId: 'mara1',
        template: {
          heartbreakPassive: {
            maxStacks: 5,
            atkPerStack: 4,
            lifestealPerStack: 3
          }
        },
        heartbreakStacks: 3
      }

      const bonuses = store.getHeartbreakBonuses(mara)

      expect(bonuses.atkBonus).toBe(12)
      expect(bonuses.lifestealBonus).toBe(9)
    })
  })

  describe('checkHeartbreakAllyHpTrigger', () => {
    it('gains stack when ally drops below 50% HP', () => {
      const mara = {
        instanceId: 'mara1',
        template: {
          heartbreakPassive: {
            maxStacks: 5,
            triggers: { allyBelowHalfHp: true }
          },
          name: 'Mara'
        },
        heartbreakStacks: 0,
        currentHp: 500
      }

      const ally = {
        instanceId: 'ally1',
        currentHp: 600,
        maxHp: 1000,
        triggeredHeartbreak: false
      }

      store.checkHeartbreakAllyHpTrigger(mara, ally, 200)

      expect(mara.heartbreakStacks).toBe(1)
    })
  })

  describe('checkHeartbreakSelfDamageTrigger', () => {
    it('gains stack when Mara takes heavy damage (15%+ max HP)', () => {
      const mara = {
        instanceId: 'mara1',
        template: {
          heartbreakPassive: {
            maxStacks: 5,
            triggers: { heavyDamagePercent: 15 }
          },
          name: 'Mara'
        },
        heartbreakStacks: 0,
        currentHp: 500,
        maxHp: 500
      }

      store.checkHeartbreakSelfDamageTrigger(mara, 80)

      expect(mara.heartbreakStacks).toBe(1)
    })
  })
})
