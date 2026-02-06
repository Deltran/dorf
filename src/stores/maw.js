// src/stores/maw.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createSeed, SeededRandom } from '../utils/seededRandom.js'
import { getAllBoons, getPayoffsForSeed } from '../data/maw/boons.js'
import { getWaveConfig, TIER_CONFIG, BOSS_WAVE } from '../data/maw/waves.js'
import { getMawShopItem } from '../data/maw/shop.js'

export const useMawStore = defineStore('maw', () => {
  // Daily state
  const selectedTier = ref(null)
  const bestDepth = ref(0)
  const pendingRewards = ref(null)
  const closed = ref(false)
  const runAttempts = ref(0)
  const lastPlayDate = ref(null)
  const daysSkipped = ref(0)

  // Active run
  const activeRun = ref(null)

  // Last failed run (for "one more run" display)
  const lastRunBoons = ref([])
  const lastRunDepth = ref(0)

  // Permanent state
  const mawUnlocked = ref(false)
  const tierUnlocks = ref({ 1: true })
  const dregs = ref(0)
  const playerSalt = ref(null)
  const shopPurchases = ref({})

  function unlockMaw() {
    mawUnlocked.value = true
  }

  function getTodayDate() {
    return new Date().toISOString().split('T')[0]
  }

  function ensurePlayerSalt() {
    if (!playerSalt.value) {
      playerSalt.value = Math.random().toString(36).substring(2, 10)
    }
  }

  function selectTier(tier) {
    if (closed.value) return { success: false, message: 'The Maw is closed for today.' }
    if (selectedTier.value !== null) return { success: false, message: 'Tier already selected today.' }
    if (!tierUnlocks.value[tier]) return { success: false, message: 'Tier not unlocked.' }

    ensurePlayerSalt()
    selectedTier.value = tier
    lastPlayDate.value = getTodayDate()
    return { success: true }
  }

  function checkDailyReset() {
    const today = getTodayDate()
    if (lastPlayDate.value && lastPlayDate.value !== today) {
      // Calculate days skipped
      const lastDate = new Date(lastPlayDate.value)
      const todayDate = new Date(today)
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24))
      daysSkipped.value = Math.min(Math.max(diffDays, 0), 3)

      // Auto-bank best run rewards if not closed
      if (pendingRewards.value && !closed.value) {
        // Auto-close with pending rewards (rest bonus applied at claim time)
      }

      // Reset daily state
      selectedTier.value = null
      bestDepth.value = 0
      pendingRewards.value = null
      closed.value = false
      runAttempts.value = 0
      lastRunBoons.value = []
      lastRunDepth.value = 0
      activeRun.value = null
      lastPlayDate.value = today
    }
  }

  function getRestBonusMultiplier() {
    // 0 days: 1.0, 1 day: 1.9, 2 days: 2.8, 3 days: 3.7
    return 1.0 + (daysSkipped.value * 0.9)
  }

  function getDailySeed() {
    ensurePlayerSalt()
    return createSeed(getTodayDate(), selectedTier.value || 1, playerSalt.value)
  }

  // === Run Management ===

  function startRun() {
    if (!selectedTier.value) return { success: false, message: 'No tier selected.' }
    if (closed.value) return { success: false, message: 'Maw is closed for today.' }

    runAttempts.value += 1

    activeRun.value = {
      tier: selectedTier.value,
      wave: 1,
      boons: [],
      partyState: null,
      rewards: { gold: 0, gems: 0, dregs: 0, items: [] },
      pendingBoonSelection: false,
      boonOfferings: null
    }

    return { success: true }
  }

  function completeWave(partyState) {
    if (!activeRun.value) return { success: false }

    const wave = activeRun.value.wave
    const waveConfig = getWaveConfig(wave)
    const tierConfig = TIER_CONFIG[activeRun.value.tier]

    // Accrue rewards
    activeRun.value.rewards.gold += Math.floor(waveConfig.goldReward * tierConfig.rewardMultiplier)
    activeRun.value.rewards.dregs += Math.floor(waveConfig.dregsReward * tierConfig.rewardMultiplier)

    // Save party state
    activeRun.value.partyState = partyState

    // Update best depth
    if (wave > bestDepth.value) {
      bestDepth.value = wave
      pendingRewards.value = { ...activeRun.value.rewards }
    }

    // Check if boss beaten
    if (wave === BOSS_WAVE) {
      // Unlock next tier
      const nextTier = activeRun.value.tier + 1
      if (nextTier <= 5 && !tierUnlocks.value[nextTier]) {
        tierUnlocks.value = { ...tierUnlocks.value, [nextTier]: true }
      }
      return { success: true, runComplete: true }
    }

    // Generate boon offerings for selection
    activeRun.value.pendingBoonSelection = true
    activeRun.value.boonOfferings = generateBoonOfferings()

    return { success: true, runComplete: false, boonOfferings: activeRun.value.boonOfferings }
  }

  function generateBoonOfferings() {
    const seed = getDailySeed()
    const wave = activeRun.value.wave
    const rng = new SeededRandom(seed + wave * 1000)

    const allBoons = getAllBoons()
    const pickedIds = new Set(activeRun.value.boons.map(b => b.id))
    const available = allBoons.filter(b => !pickedIds.has(b.id))

    if (available.length < 3) return available

    // Weighted by rarity
    const rarityWeights = { common: 60, rare: 30, epic: 10 }

    // Check if player has any seed boons — if so, try to offer a payoff
    const playerSeeds = activeRun.value.boons.filter(b => b.isSeed)
    let guaranteedPayoff = null

    if (playerSeeds.length > 0) {
      const allPayoffs = []
      for (const seedBoon of playerSeeds) {
        const payoffs = getPayoffsForSeed(seedBoon).filter(p => !pickedIds.has(p.id))
        allPayoffs.push(...payoffs)
      }
      if (allPayoffs.length > 0) {
        guaranteedPayoff = rng.pick(allPayoffs)
      }
    }

    const offerings = []

    if (guaranteedPayoff) {
      offerings.push(guaranteedPayoff)
    }

    // Fill remaining slots
    const remaining = available.filter(b => !offerings.some(o => o.id === b.id))
    const weighted = remaining.map(b => ({
      item: b,
      weight: rarityWeights[b.rarity] || 60
    }))

    while (offerings.length < 3 && weighted.length > 0) {
      const pick = rng.weightedPick(weighted)
      offerings.push(pick.item)
      const idx = weighted.indexOf(pick)
      if (idx !== -1) weighted.splice(idx, 1)
    }

    return offerings
  }

  function selectBoon(boonId) {
    if (!activeRun.value?.pendingBoonSelection) return { success: false }

    const offering = activeRun.value.boonOfferings?.find(b => b.id === boonId)
    if (!offering) return { success: false, message: 'Invalid boon selection.' }

    activeRun.value.boons.push(offering)
    activeRun.value.pendingBoonSelection = false
    activeRun.value.boonOfferings = null
    activeRun.value.wave += 1

    return { success: true }
  }

  function failRun() {
    if (!activeRun.value) return { success: false }

    const runRewards = { ...activeRun.value.rewards }
    const depth = activeRun.value.wave
    const boons = [...activeRun.value.boons]

    // Save last run data for "one more run" display
    lastRunBoons.value = boons
    lastRunDepth.value = depth

    // Update best depth and pending rewards if this run went further
    if (depth > bestDepth.value) {
      bestDepth.value = depth
      pendingRewards.value = { ...runRewards }
    }

    // Clear the run — player can try again
    activeRun.value = null

    return { success: true, rewards: runRewards, depth, boons }
  }

  function endRun() {
    if (!activeRun.value) return { success: false }
    activeRun.value = null
    return { success: true }
  }

  function closeMaw() {
    if (closed.value) return { success: false, message: 'Already closed.' }
    if (!pendingRewards.value) return { success: false, message: 'No rewards to claim.' }

    const multiplier = getRestBonusMultiplier()
    const rewards = {
      gold: Math.floor(pendingRewards.value.gold * multiplier),
      gems: Math.floor((pendingRewards.value.gems || 0) * multiplier),
      dregs: Math.floor(pendingRewards.value.dregs * multiplier)
    }

    dregs.value += rewards.dregs
    closed.value = true
    activeRun.value = null
    daysSkipped.value = 0

    return { success: true, rewards }
  }

  // === Between-Wave Recovery ===

  function applyBetweenWaveRecovery(partyState) {
    // +10% max HP, +5% max MP, all other resources preserved
    const recovered = {}
    for (const [instanceId, state] of Object.entries(partyState)) {
      recovered[instanceId] = { ...state }
      // HP recovery: heal 10% of maxHp (maxHp not in partyState, will be resolved at init)
      recovered[instanceId].hpRecoveryPercent = 10
      recovered[instanceId].mpRecoveryPercent = 5
    }
    return recovered
  }

  // === Dregs Shop ===

  function purchaseShopItem(itemId) {
    const item = getMawShopItem(itemId)
    if (!item) return { success: false, message: 'Item not found.' }

    if (item.maxStock) {
      const purchased = shopPurchases.value[itemId] || 0
      if (purchased >= item.maxStock) return { success: false, message: 'Out of stock.' }
    }

    if (dregs.value < item.cost) return { success: false, message: 'Insufficient Dregs.' }

    dregs.value -= item.cost
    shopPurchases.value = {
      ...shopPurchases.value,
      [itemId]: (shopPurchases.value[itemId] || 0) + 1
    }

    return { success: true, reward: item.reward }
  }

  function getShopItemStock(itemId) {
    const item = getMawShopItem(itemId)
    if (!item) return 0
    if (!item.maxStock) return Infinity
    return item.maxStock - (shopPurchases.value[itemId] || 0)
  }

  // === Persistence ===

  function saveState() {
    return {
      mawUnlocked: mawUnlocked.value,
      selectedTier: selectedTier.value,
      bestDepth: bestDepth.value,
      pendingRewards: pendingRewards.value,
      closed: closed.value,
      runAttempts: runAttempts.value,
      lastRunBoons: lastRunBoons.value,
      lastRunDepth: lastRunDepth.value,
      lastPlayDate: lastPlayDate.value,
      daysSkipped: daysSkipped.value,
      activeRun: activeRun.value,
      tierUnlocks: tierUnlocks.value,
      dregs: dregs.value,
      playerSalt: playerSalt.value,
      shopPurchases: shopPurchases.value
    }
  }

  function loadState(savedState) {
    if (savedState?.mawUnlocked !== undefined) mawUnlocked.value = savedState.mawUnlocked
    if (savedState?.selectedTier !== undefined) selectedTier.value = savedState.selectedTier
    if (savedState?.bestDepth !== undefined) bestDepth.value = savedState.bestDepth
    if (savedState?.pendingRewards !== undefined) pendingRewards.value = savedState.pendingRewards
    if (savedState?.closed !== undefined) closed.value = savedState.closed
    if (savedState?.runAttempts !== undefined) runAttempts.value = savedState.runAttempts
    if (savedState?.lastRunBoons !== undefined) lastRunBoons.value = savedState.lastRunBoons
    if (savedState?.lastRunDepth !== undefined) lastRunDepth.value = savedState.lastRunDepth
    if (savedState?.lastPlayDate !== undefined) lastPlayDate.value = savedState.lastPlayDate
    if (savedState?.daysSkipped !== undefined) daysSkipped.value = savedState.daysSkipped
    if (savedState?.activeRun !== undefined) activeRun.value = savedState.activeRun
    if (savedState?.tierUnlocks !== undefined) tierUnlocks.value = savedState.tierUnlocks
    if (savedState?.dregs !== undefined) dregs.value = savedState.dregs
    if (savedState?.playerSalt !== undefined) playerSalt.value = savedState.playerSalt
    if (savedState?.shopPurchases !== undefined) shopPurchases.value = savedState.shopPurchases
  }

  return {
    // State
    mawUnlocked, selectedTier, bestDepth, pendingRewards, closed, runAttempts,
    lastRunBoons, lastRunDepth,
    lastPlayDate, daysSkipped, activeRun,
    tierUnlocks, dregs, playerSalt, shopPurchases,
    // Actions
    unlockMaw, getTodayDate, ensurePlayerSalt, selectTier,
    checkDailyReset, getRestBonusMultiplier, getDailySeed,
    startRun, completeWave, selectBoon, failRun, endRun, closeMaw,
    applyBetweenWaveRecovery, generateBoonOfferings,
    purchaseShopItem, getShopItemStock,
    // Persistence
    saveState, loadState
  }
})
