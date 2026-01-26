import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('battle store - verse helpers', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('isBard', () => {
    it('returns true for units with verse resourceType', () => {
      const bard = { class: { resourceType: 'verse' } }
      expect(store.isBard(bard)).toBe(true)
    })

    it('returns false for non-bards', () => {
      const knight = { class: { resourceType: 'valor' } }
      expect(store.isBard(knight)).toBe(false)
    })

    it('returns false for units without class', () => {
      const unit = {}
      expect(store.isBard(unit)).toBe(false)
    })
  })

  describe('gainVerse', () => {
    it('increases currentVerses by 1', () => {
      const unit = { currentVerses: 0 }
      store.gainVerse(unit)
      expect(unit.currentVerses).toBe(1)
    })

    it('caps verses at 3', () => {
      const unit = { currentVerses: 3 }
      store.gainVerse(unit)
      expect(unit.currentVerses).toBe(3)
    })

    it('does nothing if unit has no currentVerses property', () => {
      const unit = {}
      store.gainVerse(unit)
      expect(unit.currentVerses).toBeUndefined()
    })
  })
})
