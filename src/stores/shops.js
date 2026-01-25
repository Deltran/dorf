// src/stores/shops.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getShop } from '../data/shops.js'
import { getItem } from '../data/items.js'
import { useGachaStore } from './gacha.js'
import { useInventoryStore } from './inventory.js'

export const useShopsStore = defineStore('shops', () => {
  // State - tracks purchases: { shopId: { itemId: purchaseCount }, lastReset: 'YYYY-MM-DD' }
  const purchases = ref({})

  function getTodayDate() {
    return new Date().toISOString().split('T')[0]
  }

  function checkMidnightReset() {
    const today = getTodayDate()
    if (purchases.value.lastReset !== today) {
      purchases.value = { lastReset: today }
    }
  }

  function getRemainingStock(shopId, itemId, maxStock) {
    checkMidnightReset()
    const purchased = purchases.value[shopId]?.[itemId] || 0
    return maxStock - purchased
  }

  function purchase(shopId, shopItem) {
    checkMidnightReset()

    const shop = getShop(shopId)
    if (!shop) return { success: false, message: 'Shop not found' }

    const item = getItem(shopItem.itemId)
    if (!item) return { success: false, message: 'Item not found' }

    const remaining = getRemainingStock(shopId, shopItem.itemId, shopItem.maxStock)
    if (remaining <= 0) return { success: false, message: 'Sold out' }

    const gachaStore = useGachaStore()
    const inventoryStore = useInventoryStore()

    // Spend currency
    let spent = false
    if (shop.currency === 'gold') {
      spent = gachaStore.spendGold(shopItem.price)
    } else if (shop.currency === 'gems') {
      spent = gachaStore.spendGems(shopItem.price)
    }

    if (!spent) return { success: false, message: 'Insufficient funds' }

    // Track purchase
    if (!purchases.value[shopId]) {
      purchases.value[shopId] = {}
    }
    purchases.value[shopId][shopItem.itemId] =
      (purchases.value[shopId][shopItem.itemId] || 0) + 1

    // Grant item
    inventoryStore.addItem(shopItem.itemId, 1)

    return { success: true, message: 'Purchase successful' }
  }

  function getSecondsUntilReset() {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    return Math.floor((midnight - now) / 1000)
  }

  // Persistence
  function saveState() {
    return { purchases: purchases.value }
  }

  function loadState(savedState) {
    if (savedState.purchases) {
      purchases.value = savedState.purchases
    }
    checkMidnightReset()
  }

  return {
    purchases,
    checkMidnightReset,
    getRemainingStock,
    purchase,
    getSecondsUntilReset,
    saveState,
    loadState
  }
})
