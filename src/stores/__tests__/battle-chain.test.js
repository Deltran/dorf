import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('battle store - chain bounce', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('getChainTargets', () => {
    it('returns up to maxBounces additional targets excluding primary', () => {
      const primary = { id: 'e1' }
      const enemies = [
        { id: 'e1', currentHp: 50 },
        { id: 'e2', currentHp: 50 },
        { id: 'e3', currentHp: 50 },
        { id: 'e4', currentHp: 50 }
      ]
      const targets = store.getChainTargets(primary, enemies, 2)
      expect(targets.length).toBe(2)
      expect(targets.every(t => t.id !== 'e1')).toBe(true)
    })

    it('returns fewer targets if not enough enemies', () => {
      const primary = { id: 'e1' }
      const enemies = [
        { id: 'e1', currentHp: 50 },
        { id: 'e2', currentHp: 50 }
      ]
      const targets = store.getChainTargets(primary, enemies, 2)
      expect(targets.length).toBe(1)
      expect(targets[0].id).toBe('e2')
    })

    it('excludes dead enemies', () => {
      const primary = { id: 'e1' }
      const enemies = [
        { id: 'e1', currentHp: 50 },
        { id: 'e2', currentHp: 0 },
        { id: 'e3', currentHp: 50 }
      ]
      const targets = store.getChainTargets(primary, enemies, 2)
      expect(targets.length).toBe(1)
      expect(targets[0].id).toBe('e3')
    })
  })
})
