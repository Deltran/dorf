// src/stores/shops.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getShop } from '../data/shops.js'
import { getItem } from '../data/items.js'
import { useGachaStore } from './gacha.js'
import { useInventoryStore } from './inventory.js'
import { useShardsStore } from './shards.js'

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

  function getWeekStart(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d.toISOString().split('T')[0]
  }

  function checkWeeklyReset() {
    const weekStart = getWeekStart(new Date())
    if (purchases.value.lastWeeklyReset !== weekStart) {
      purchases.value.weekly = {}
      purchases.value.lastWeeklyReset = weekStart
    }
  }

  function getWeeklyPurchaseCount(shopId, itemId) {
    checkWeeklyReset()
    return purchases.value.weekly?.[shopId]?.[itemId] || 0
  }

  function getRemainingWeeklyStock(shopId, itemId, maxStock) {
    return maxStock - getWeeklyPurchaseCount(shopId, itemId)
  }

  function purchaseWeekly(shopId, itemId) {
    checkWeeklyReset()
    if (!purchases.value.weekly) {
      purchases.value.weekly = {}
    }
    if (!purchases.value.weekly[shopId]) {
      purchases.value.weekly[shopId] = {}
    }
    purchases.value.weekly[shopId][itemId] =
      (purchases.value.weekly[shopId][itemId] || 0) + 1
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

    const inventoryStore = useInventoryStore()

    // Check for crest currency - need to validate section first
    if (shop.currency === 'crest') {
      const section = shop.sections?.find(s => s.id === shopItem.sectionId)
      if (!section) {
        return { success: false, message: 'Invalid section' }
      }

      // Check if shards system is required and locked
      if (shopItem.requiresShardsUnlocked) {
        const shardsStore = useShardsStore()
        if (!shardsStore.unlocked) {
          return { success: false, message: 'Shards system is locked' }
        }
      }

      // Check weekly stock for weekly items
      if (shopItem.stockType === 'weekly' && shopItem.maxStock) {
        const remainingWeekly = getRemainingWeeklyStock(shopId, shopItem.itemId, shopItem.maxStock)
        if (remainingWeekly <= 0) {
          return { success: false, message: 'Out of stock (weekly limit reached)' }
        }
      }

      // Check crest balance
      const crestId = section.crestId
      if (inventoryStore.getItemCount(crestId) < shopItem.price) {
        return { success: false, message: 'Insufficient crests' }
      }

      // Deduct crests
      inventoryStore.removeItem(crestId, shopItem.price)

      // Track weekly purchase if applicable
      if (shopItem.stockType === 'weekly') {
        purchaseWeekly(shopId, shopItem.itemId)
      }

      // Grant hero shards or item
      if (shopItem.heroId && shopItem.shardCount) {
        const shardsStore = useShardsStore()
        shardsStore.addShards(shopItem.heroId, shopItem.shardCount)
      } else {
        inventoryStore.addItem(shopItem.itemId, 1)
      }

      return { success: true, message: 'Purchase successful' }
    }

    // Non-crest currency handling (gold/gems)
    const item = getItem(shopItem.itemId)
    if (!item) return { success: false, message: 'Item not found' }

    const remaining = getRemainingStock(shopId, shopItem.itemId, shopItem.maxStock)
    if (remaining <= 0) return { success: false, message: 'Sold out' }

    const gachaStore = useGachaStore()

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
    checkWeeklyReset()
  }

  return {
    purchases,
    checkMidnightReset,
    getRemainingStock,
    purchase,
    getSecondsUntilReset,
    saveState,
    loadState,
    getWeekStart,
    getWeeklyPurchaseCount,
    getRemainingWeeklyStock,
    purchaseWeekly
  }
})
