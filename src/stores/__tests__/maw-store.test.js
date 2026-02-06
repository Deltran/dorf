// src/stores/__tests__/maw-store.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMawStore } from '../maw.js'

describe('Maw Store — Daily State', () => {
  let mawStore

  beforeEach(() => {
    setActivePinia(createPinia())
    mawStore = useMawStore()
  })

  it('initializes with default state', () => {
    expect(mawStore.selectedTier).toBeNull()
    expect(mawStore.bestDepth).toBe(0)
    expect(mawStore.pendingRewards).toBeNull()
    expect(mawStore.closed).toBe(false)
    expect(mawStore.dregs).toBe(0)
    expect(mawStore.tierUnlocks[1]).toBe(true)
    expect(mawStore.activeRun).toBeNull()
  })

  it('generates playerSalt on first use if not set', () => {
    expect(mawStore.playerSalt).toBeNull()
    mawStore.ensurePlayerSalt()
    expect(mawStore.playerSalt).toBeTruthy()
    expect(typeof mawStore.playerSalt).toBe('string')
  })

  it('selectTier locks in a tier for the day', () => {
    mawStore.ensurePlayerSalt()
    const result = mawStore.selectTier(1)
    expect(result.success).toBe(true)
    expect(mawStore.selectedTier).toBe(1)
  })

  it('selectTier rejects locked tiers', () => {
    const result = mawStore.selectTier(2)
    expect(result.success).toBe(false)
    expect(mawStore.selectedTier).toBeNull()
  })

  it('selectTier rejects if already selected today', () => {
    mawStore.ensurePlayerSalt()
    mawStore.selectTier(1)
    const result = mawStore.selectTier(1)
    expect(result.success).toBe(false)
  })

  it('selectTier rejects if closed for the day', () => {
    mawStore.ensurePlayerSalt()
    mawStore.selectTier(1)
    mawStore.closed = true
    mawStore.selectedTier = null
    const result = mawStore.selectTier(1)
    expect(result.success).toBe(false)
  })

  it('checkDailyReset clears daily state on new day', () => {
    mawStore.ensurePlayerSalt()
    mawStore.selectTier(1)
    mawStore.bestDepth = 5
    mawStore.closed = true
    mawStore.lastPlayDate = '2026-02-05'

    // Simulate next day by calling reset
    mawStore.checkDailyReset()

    expect(mawStore.selectedTier).toBeNull()
    expect(mawStore.bestDepth).toBe(0)
    expect(mawStore.closed).toBe(false)
    expect(mawStore.pendingRewards).toBeNull()
    expect(mawStore.activeRun).toBeNull()
  })

  it('checkDailyReset does nothing if same day', () => {
    mawStore.ensurePlayerSalt()
    mawStore.lastPlayDate = new Date().toISOString().split('T')[0]
    mawStore.selectedTier = 1
    mawStore.bestDepth = 5

    mawStore.checkDailyReset()

    expect(mawStore.selectedTier).toBe(1)
    expect(mawStore.bestDepth).toBe(5)
  })

  it('tracks days skipped for rest bonus', () => {
    mawStore.ensurePlayerSalt()
    // Simulate 2 days skipped
    mawStore.lastPlayDate = '2026-02-04'
    // Mock today as 2026-02-06
    vi.spyOn(mawStore, 'getTodayDate').mockReturnValue('2026-02-06')
    mawStore.checkDailyReset()

    expect(mawStore.daysSkipped).toBe(2)
  })

  it('caps rest bonus at 3 days', () => {
    mawStore.ensurePlayerSalt()
    mawStore.lastPlayDate = '2026-01-20'
    vi.spyOn(mawStore, 'getTodayDate').mockReturnValue('2026-02-06')
    mawStore.checkDailyReset()

    expect(mawStore.daysSkipped).toBe(3)
  })

  it('calculates rest bonus multiplier', () => {
    mawStore.daysSkipped = 0
    expect(mawStore.getRestBonusMultiplier()).toBe(1.0)
    mawStore.daysSkipped = 1
    expect(mawStore.getRestBonusMultiplier()).toBe(1.9)
    mawStore.daysSkipped = 2
    expect(mawStore.getRestBonusMultiplier()).toBe(2.8)
    mawStore.daysSkipped = 3
    expect(mawStore.getRestBonusMultiplier()).toBe(3.7)
  })
})

describe('Maw Store — Persistence', () => {
  let mawStore

  beforeEach(() => {
    setActivePinia(createPinia())
    mawStore = useMawStore()
  })

  it('saveState returns all persisted fields', () => {
    mawStore.dregs = 100
    mawStore.tierUnlocks = { 1: true, 2: true }
    mawStore.playerSalt = 'test123'

    const saved = mawStore.saveState()
    expect(saved.dregs).toBe(100)
    expect(saved.tierUnlocks[2]).toBe(true)
    expect(saved.playerSalt).toBe('test123')
  })

  it('loadState restores from saved data', () => {
    mawStore.loadState({
      dregs: 250,
      tierUnlocks: { 1: true, 2: true, 3: true },
      playerSalt: 'saved_salt',
      shopPurchases: { dregs_gold_pack: 3 }
    })

    expect(mawStore.dregs).toBe(250)
    expect(mawStore.tierUnlocks[3]).toBe(true)
    expect(mawStore.playerSalt).toBe('saved_salt')
    expect(mawStore.shopPurchases.dregs_gold_pack).toBe(3)
  })

  it('round-trips through save/load', () => {
    mawStore.dregs = 100
    mawStore.ensurePlayerSalt()
    mawStore.selectTier(1)
    mawStore.startRun()
    mawStore.completeWave({})
    mawStore.selectBoon(mawStore.activeRun.boonOfferings[0].id)

    const saved = mawStore.saveState()

    const freshPinia = createPinia()
    setActivePinia(freshPinia)
    const freshStore = useMawStore()
    freshStore.loadState(saved)

    expect(freshStore.dregs).toBe(100)
    expect(freshStore.selectedTier).toBe(1)
    expect(freshStore.activeRun.wave).toBe(2)
    expect(freshStore.activeRun.boons).toHaveLength(1)
  })
})
