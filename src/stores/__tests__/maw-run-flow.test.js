// src/stores/__tests__/maw-run-flow.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMawStore } from '../maw.js'

describe('Maw Run Flow', () => {
  let mawStore

  beforeEach(() => {
    setActivePinia(createPinia())
    mawStore = useMawStore()
    mawStore.ensurePlayerSalt()
    mawStore.selectTier(1)
  })

  it('startRun creates an active run', () => {
    const result = mawStore.startRun()
    expect(result.success).toBe(true)
    expect(mawStore.activeRun).toBeTruthy()
    expect(mawStore.activeRun.wave).toBe(1)
    expect(mawStore.activeRun.boons).toEqual([])
    expect(mawStore.activeRun.tier).toBe(1)
  })

  it('startRun rejects without tier selected', () => {
    mawStore.selectedTier = null
    const result = mawStore.startRun()
    expect(result.success).toBe(false)
  })

  it('completeWave accrues rewards', () => {
    mawStore.startRun()
    const mockPartyState = { hero1: { currentHp: 100 } }
    const result = mawStore.completeWave(mockPartyState)

    expect(result.success).toBe(true)
    expect(mawStore.activeRun.rewards.gold).toBeGreaterThan(0)
    expect(mawStore.activeRun.rewards.dregs).toBeGreaterThan(0)
  })

  it('completeWave updates bestDepth', () => {
    mawStore.startRun()
    mawStore.completeWave({})
    expect(mawStore.bestDepth).toBe(1)
  })

  it('completeWave offers 3 boons after non-boss wave', () => {
    mawStore.startRun()
    const result = mawStore.completeWave({})
    expect(result.runComplete).toBe(false)
    expect(mawStore.activeRun.pendingBoonSelection).toBe(true)
    expect(mawStore.activeRun.boonOfferings).toHaveLength(3)
  })

  it('selectBoon adds boon and advances wave', () => {
    mawStore.startRun()
    mawStore.completeWave({})
    const boonId = mawStore.activeRun.boonOfferings[0].id

    const result = mawStore.selectBoon(boonId)
    expect(result.success).toBe(true)
    expect(mawStore.activeRun.boons).toHaveLength(1)
    expect(mawStore.activeRun.wave).toBe(2)
    expect(mawStore.activeRun.pendingBoonSelection).toBe(false)
  })

  it('selectBoon rejects invalid boon id', () => {
    mawStore.startRun()
    mawStore.completeWave({})
    const result = mawStore.selectBoon('totally_fake_boon')
    expect(result.success).toBe(false)
  })

  it('full run through 11 waves', () => {
    mawStore.startRun()

    for (let wave = 1; wave <= 10; wave++) {
      const result = mawStore.completeWave({})
      expect(result.success).toBe(true)

      if (wave < 10) {
        // Not boss wave — pick a boon
        expect(result.runComplete).toBeFalsy()
        const boon = mawStore.activeRun.boonOfferings[0]
        mawStore.selectBoon(boon.id)
      } else {
        // Wave 10 complete — pick boon, then next is boss
        mawStore.selectBoon(mawStore.activeRun.boonOfferings[0].id)
      }
    }

    // Wave 11 — boss
    expect(mawStore.activeRun.wave).toBe(11)
    const bossResult = mawStore.completeWave({})
    expect(bossResult.runComplete).toBe(true)
    expect(mawStore.bestDepth).toBe(11)
  })

  it('completeWave on boss unlocks next tier', () => {
    mawStore.startRun()

    // Run through all waves
    for (let wave = 1; wave <= 10; wave++) {
      mawStore.completeWave({})
      mawStore.selectBoon(mawStore.activeRun.boonOfferings[0].id)
    }
    mawStore.completeWave({}) // Boss wave 11

    expect(mawStore.tierUnlocks[2]).toBe(true)
  })

  it('closeMaw banks rewards with rest bonus', () => {
    mawStore.daysSkipped = 1 // 1.9x multiplier
    mawStore.startRun()
    mawStore.completeWave({})
    mawStore.selectBoon(mawStore.activeRun.boonOfferings[0].id)

    const result = mawStore.closeMaw()
    expect(result.success).toBe(true)
    expect(result.rewards.dregs).toBeGreaterThan(0)
    expect(mawStore.dregs).toBe(result.rewards.dregs)
    expect(mawStore.closed).toBe(true)
    expect(mawStore.daysSkipped).toBe(0) // consumed
  })

  it('closeMaw rejects if no rewards', () => {
    const result = mawStore.closeMaw()
    expect(result.success).toBe(false)
  })

  it('endRun clears active run', () => {
    mawStore.startRun()
    mawStore.endRun()
    expect(mawStore.activeRun).toBeNull()
  })

  it('boon offerings are deterministic (same seed = same offerings)', () => {
    mawStore.startRun()
    mawStore.completeWave({})
    const offerings1 = [...mawStore.activeRun.boonOfferings]

    // End and restart — same seed
    mawStore.endRun()
    mawStore.startRun()
    mawStore.completeWave({})
    const offerings2 = [...mawStore.activeRun.boonOfferings]

    expect(offerings1.map(b => b.id)).toEqual(offerings2.map(b => b.id))
  })
})

describe('Maw Store — Shop', () => {
  let mawStore

  beforeEach(() => {
    setActivePinia(createPinia())
    mawStore = useMawStore()
    mawStore.dregs = 500
  })

  it('purchaseShopItem deducts dregs and tracks purchase', () => {
    const result = mawStore.purchaseShopItem('dregs_gold_pack')
    expect(result.success).toBe(true)
    expect(result.reward).toBeTruthy()
    expect(mawStore.dregs).toBe(480) // 500 - 20
    expect(mawStore.shopPurchases.dregs_gold_pack).toBe(1)
  })

  it('purchaseShopItem rejects if insufficient dregs', () => {
    mawStore.dregs = 5
    const result = mawStore.purchaseShopItem('dregs_gold_pack')
    expect(result.success).toBe(false)
  })

  it('purchaseShopItem respects stock limits', () => {
    // Buy max stock of gem packs (maxStock: 5)
    for (let i = 0; i < 5; i++) {
      mawStore.purchaseShopItem('dregs_gem_pack')
    }
    const result = mawStore.purchaseShopItem('dregs_gem_pack')
    expect(result.success).toBe(false)
  })

  it('getShopItemStock returns remaining stock', () => {
    expect(mawStore.getShopItemStock('dregs_gem_pack')).toBe(5)
    mawStore.purchaseShopItem('dregs_gem_pack')
    expect(mawStore.getShopItemStock('dregs_gem_pack')).toBe(4)
  })

  it('unlimited stock items always available', () => {
    expect(mawStore.getShopItemStock('dregs_gold_pack')).toBe(Infinity)
    for (let i = 0; i < 10; i++) {
      mawStore.purchaseShopItem('dregs_gold_pack')
    }
    expect(mawStore.getShopItemStock('dregs_gold_pack')).toBe(Infinity)
  })
})
