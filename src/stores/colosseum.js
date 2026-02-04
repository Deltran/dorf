// src/stores/colosseum.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getColosseumBout, colosseumBouts, getColosseumShopItems } from '../data/colosseum.js'

export const useColosseumStore = defineStore('colosseum', () => {
  const highestBout = ref(0)
  const laurels = ref(0)
  const colosseumUnlocked = ref(false)
  const lastDailyCollection = ref(null) // 'YYYY-MM-DD'

  function getTodayDate() {
    return new Date().toISOString().split('T')[0]
  }

  function unlockColosseum() {
    colosseumUnlocked.value = true
  }

  function getCurrentBout() {
    const nextBout = highestBout.value + 1
    if (nextBout > 50) return null
    return getColosseumBout(nextBout)
  }

  function completeBout(boutNumber) {
    const bout = getColosseumBout(boutNumber)
    if (!bout) return { success: false, message: 'Invalid bout' }

    // Must be the next bout or a replay of a cleared bout
    const isNextBout = boutNumber === highestBout.value + 1
    const isReplay = boutNumber <= highestBout.value

    if (!isNextBout && !isReplay) {
      return { success: false, message: 'Cannot skip bouts' }
    }

    if (isNextBout) {
      highestBout.value = boutNumber
      laurels.value += bout.firstClearReward
      return {
        success: true,
        firstClear: true,
        laurelsEarned: bout.firstClearReward,
        newDailyIncome: getDailyIncome()
      }
    }

    // Replay — no first-clear bonus
    return {
      success: true,
      firstClear: false,
      laurelsEarned: 0
    }
  }

  function getDailyIncome() {
    let income = 0
    for (let i = 1; i <= highestBout.value; i++) {
      const bout = getColosseumBout(i)
      if (bout) income += bout.dailyCoins
    }
    return income
  }

  function collectDailyLaurels() {
    const today = getTodayDate()
    if (lastDailyCollection.value === today) {
      return { collected: 0, alreadyCollected: true }
    }

    const income = getDailyIncome()
    laurels.value += income
    lastDailyCollection.value = today
    return { collected: income }
  }

  function spendLaurels(amount) {
    if (amount <= 0) return false
    if (laurels.value < amount) return false
    laurels.value -= amount
    return true
  }

  function addLaurels(amount) {
    laurels.value += amount
  }

  // --- Shop methods ---
  const shopPurchases = ref({}) // { itemId: count }

  function purchaseColosseumItem(itemId) {
    const shopItems = getColosseumShopItems()
    const item = shopItems.find(i => i.id === itemId)
    if (!item) return { success: false, message: 'Item not found' }

    // Block placeholder heroes
    if (item.placeholder) return { success: false, message: 'Not yet available' }

    // Check stock
    const remaining = getColosseumItemStock(itemId)
    if (remaining <= 0) return { success: false, message: 'Out of stock' }

    // Check laurels
    if (laurels.value < item.cost) return { success: false, message: 'Insufficient laurels' }

    // Deduct and track
    laurels.value -= item.cost
    shopPurchases.value[itemId] = (shopPurchases.value[itemId] || 0) + 1

    return { success: true, message: `Purchased ${item.name}` }
  }

  function getColosseumItemStock(itemId) {
    const shopItems = getColosseumShopItems()
    const item = shopItems.find(i => i.id === itemId)
    if (!item) return 0
    return item.maxStock - (shopPurchases.value[itemId] || 0)
  }

  function getColosseumShopDisplay() {
    const shopItems = getColosseumShopItems()
    return shopItems.map(item => ({
      ...item,
      remainingStock: getColosseumItemStock(item.id)
    }))
  }

  return {
    // State
    highestBout,
    laurels,
    colosseumUnlocked,
    lastDailyCollection,
    // Actions
    unlockColosseum,
    getCurrentBout,
    completeBout,
    getDailyIncome,
    collectDailyLaurels,
    spendLaurels,
    addLaurels,
    // Shop
    shopPurchases,
    purchaseColosseumItem,
    getColosseumItemStock,
    getColosseumShopDisplay
  }
}, {
  persist: {
    key: 'dorf-colosseum',
    paths: ['highestBout', 'laurels', 'colosseumUnlocked', 'lastDailyCollection', 'shopPurchases']
  }
})
