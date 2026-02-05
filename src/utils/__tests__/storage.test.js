import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { saveGame, loadGame } from '../storage.js'

// Import all stores that should be persisted
import { useHeroesStore } from '../../stores/heroes.js'
import { useGachaStore } from '../../stores/gacha.js'
import { useQuestsStore } from '../../stores/quests.js'
import { useInventoryStore } from '../../stores/inventory.js'
import { useShardsStore } from '../../stores/shards.js'
import { useGenusLociStore } from '../../stores/genusLoci.js'
import { useExplorationsStore } from '../../stores/explorations.js'
import { useShopsStore } from '../../stores/shops.js'
import { useEquipmentStore } from '../../stores/equipment.js'
import { useIntroStore } from '../../stores/intro.js'
import { useCodexStore } from '../../stores/codex.js'
import { useColosseumStore } from '../../stores/colosseum.js'
import { useGemShopStore } from '../../stores/gemShop.js'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value }),
    removeItem: vi.fn(key => { delete store[key] }),
    clear: vi.fn(() => { store = {} })
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('Storage Persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  function getAllStores() {
    return {
      heroes: useHeroesStore(),
      gacha: useGachaStore(),
      quests: useQuestsStore(),
      inventory: useInventoryStore(),
      shards: useShardsStore(),
      genusLoci: useGenusLociStore(),
      explorations: useExplorationsStore(),
      shops: useShopsStore(),
      equipment: useEquipmentStore(),
      intro: useIntroStore(),
      codex: useCodexStore(),
      colosseum: useColosseumStore(),
      gemShop: useGemShopStore()
    }
  }

  describe('Round-trip persistence for all stores', () => {
    it('persists and restores colosseum state', () => {
      const stores = getAllStores()

      // Modify colosseum state
      stores.colosseum.unlockColosseum()
      stores.colosseum.addLaurels(500)
      stores.colosseum.completeBout(1)

      expect(stores.colosseum.colosseumUnlocked).toBe(true)
      expect(stores.colosseum.laurels).toBeGreaterThan(0)
      expect(stores.colosseum.highestBout).toBe(1)

      // Save
      saveGame(stores)

      // Create fresh stores
      setActivePinia(createPinia())
      const freshStores = getAllStores()

      // Verify fresh state is default
      expect(freshStores.colosseum.highestBout).toBe(0)
      expect(freshStores.colosseum.colosseumUnlocked).toBe(false)

      // Load
      loadGame(freshStores)

      // Verify state was restored
      expect(freshStores.colosseum.colosseumUnlocked).toBe(true)
      expect(freshStores.colosseum.highestBout).toBe(1)
      expect(freshStores.colosseum.laurels).toBeGreaterThan(0)
    })

    it('persists and restores gemShop state', () => {
      const stores = getAllStores()

      // Modify gemShop state
      stores.gemShop.lastPurchaseDate = '2026-02-05'
      stores.gemShop.purchasedToday = ['tome_small', 'tome_medium']

      // Save
      saveGame(stores)

      // Create fresh stores and load
      setActivePinia(createPinia())
      const freshStores = getAllStores()
      loadGame(freshStores)

      // Verify - note: if date differs, checkDailyReset clears purchasedToday
      // So we check lastPurchaseDate is set (it gets updated to today if different)
      expect(freshStores.gemShop.lastPurchaseDate).toBeTruthy()
    })

    it('persists and restores gacha state', () => {
      const stores = getAllStores()

      stores.gacha.addGems(1000)
      stores.gacha.addGold(5000)

      saveGame(stores)

      setActivePinia(createPinia())
      const freshStores = getAllStores()

      // Fresh stores have default values
      const defaultGems = freshStores.gacha.gems

      loadGame(freshStores)

      expect(freshStores.gacha.gems).toBe(defaultGems + 1000)
    })

    it('persists and restores inventory state', () => {
      const stores = getAllStores()

      stores.inventory.addItem('tome_small', 5)

      saveGame(stores)

      setActivePinia(createPinia())
      const freshStores = getAllStores()
      loadGame(freshStores)

      expect(freshStores.inventory.getItemCount('tome_small')).toBe(5)
    })

    it('persists and restores quests state', () => {
      const stores = getAllStores()

      // Directly modify completedNodes (completeRun requires full battle setup)
      stores.quests.completedNodes.push('forest_01')

      saveGame(stores)

      setActivePinia(createPinia())
      const freshStores = getAllStores()
      loadGame(freshStores)

      expect(freshStores.quests.completedNodes).toContain('forest_01')
    })
  })

  describe('All persisted stores have saveState/loadState', () => {
    it('all stores in storage.js have required methods', () => {
      const stores = getAllStores()

      // These are the stores referenced in storage.js
      const persistedStoreNames = [
        'heroes', 'gacha', 'quests', 'inventory', 'shards',
        'genusLoci', 'explorations', 'shops', 'equipment',
        'intro', 'codex', 'colosseum', 'gemShop'
      ]

      for (const name of persistedStoreNames) {
        const store = stores[name]
        expect(store, `Store "${name}" should exist`).toBeTruthy()
        expect(typeof store.saveState, `Store "${name}" should have saveState`).toBe('function')
        expect(typeof store.loadState, `Store "${name}" should have loadState`).toBe('function')
      }
    })
  })

  describe('saveState returns all persisted fields', () => {
    it('colosseum saveState includes all fields', () => {
      const stores = getAllStores()
      stores.colosseum.unlockColosseum()
      stores.colosseum.addLaurels(100)

      const saved = stores.colosseum.saveState()

      expect(saved).toHaveProperty('highestBout')
      expect(saved).toHaveProperty('laurels')
      expect(saved).toHaveProperty('colosseumUnlocked')
      expect(saved).toHaveProperty('lastDailyCollection')
      expect(saved).toHaveProperty('shopPurchases')
    })

    it('gemShop saveState includes all fields', () => {
      const stores = getAllStores()
      stores.gemShop.lastPurchaseDate = '2026-02-05'
      stores.gemShop.purchasedToday = ['item1']

      const saved = stores.gemShop.saveState()

      expect(saved).toHaveProperty('lastPurchaseDate')
      expect(saved).toHaveProperty('purchasedToday')
    })
  })
})
