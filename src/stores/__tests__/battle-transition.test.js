// src/stores/__tests__/battle-transition.test.js
// TDD tests for battle transition signaling system
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore, BattleState } from '../battle'
import { useHeroesStore } from '../heroes'

describe('battle store - transition signaling', () => {
  let battleStore
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function setupParty() {
    const instance = heroesStore.addHero('militia_soldier')
    heroesStore.setPartySlot(0, instance.instanceId)
  }

  describe('waitingForTransition after initBattle', () => {
    it('should set waitingForTransition to true after initBattle', () => {
      setupParty()
      battleStore.initBattle(null, ['goblin_scout'])

      expect(battleStore.waitingForTransition).toBe(true)
    })

    it('should remain in STARTING state even after advancing timers', () => {
      setupParty()
      battleStore.initBattle(null, ['goblin_scout'])

      // Advance timers well past the old 500ms setTimeout
      vi.advanceTimersByTime(1000)

      // State should still be STARTING — startNextTurn should NOT have been
      // called automatically via setTimeout
      expect(battleStore.state).toBe(BattleState.STARTING)
    })
  })

  describe('signalTransitionComplete', () => {
    it('should set waitingForTransition to false when called while waiting', () => {
      setupParty()
      battleStore.initBattle(null, ['goblin_scout'])

      expect(battleStore.waitingForTransition).toBe(true)

      battleStore.signalTransitionComplete()

      expect(battleStore.waitingForTransition).toBe(false)
    })

    it('should be a no-op when waitingForTransition is already false', () => {
      // Don't initBattle — waitingForTransition should be false by default
      expect(battleStore.waitingForTransition).toBe(false)

      // Should not throw or cause errors
      expect(() => battleStore.signalTransitionComplete()).not.toThrow()

      expect(battleStore.waitingForTransition).toBe(false)
    })
  })
})
