import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getItem } from '../data/items.js'
import { getQuestNode } from '../data/quests/index.js'
import { useQuestsStore } from './quests.js'
import { useGachaStore } from './gacha.js'
import { useInventoryStore } from './inventory.js'

export const useGemShopStore = defineStore('gemShop', () => {
  // State
  const lastPurchaseDate = ref(null)
  const purchasedToday = ref([])

  // Get today's date string for deterministic selection
  function getTodayString() {
    return new Date().toISOString().split('T')[0]
  }

  // Check if daily reset is needed
  function checkDailyReset() {
    const today = getTodayString()
    if (lastPurchaseDate.value !== today) {
      purchasedToday.value = []
      lastPurchaseDate.value = today
    }
  }

  // Get all eligible items from completed quest nodes
  function getEligibleItems() {
    const questsStore = useQuestsStore()
    const completedNodes = questsStore.completedNodes

    // Gather all unique item IDs from completed nodes
    const itemIds = new Set()
    for (const nodeId of completedNodes) {
      const node = getQuestNode(nodeId)
      if (node?.itemDrops) {
        for (const drop of node.itemDrops) {
          itemIds.add(drop.itemId)
        }
      }
    }

    // Split items by rarity
    const cheap = []
    const expensive = []

    for (const itemId of itemIds) {
      const item = getItem(itemId)
      if (item) {
        if (item.rarity <= 2) {
          cheap.push(item)
        } else {
          expensive.push(item)
        }
      }
    }

    return { cheap, expensive }
  }

  // Calculate price for an item: sellReward × 3 (with gold→gem conversion at 5:1)
  function calculatePrice(itemId) {
    const item = getItem(itemId)
    if (!item?.sellReward) return 0

    let baseGems = 0
    if (item.sellReward.gems) {
      baseGems = item.sellReward.gems
    } else if (item.sellReward.gold) {
      baseGems = Math.floor(item.sellReward.gold / 5)
    }

    return baseGems * 3
  }

  // Seeded random number generator using date
  function seededRandom(seed) {
    // Simple hash function for string seed
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    // Use the hash to create a pseudo-random number
    const x = Math.sin(hash) * 10000
    return x - Math.floor(x)
  }

  // Get today's shop items (deterministic based on date)
  function getTodaysItems() {
    checkDailyReset()

    const { cheap, expensive } = getEligibleItems()
    const today = getTodayString()
    const items = []

    // No items available
    if (cheap.length === 0 && expensive.length === 0) {
      return []
    }

    // If we have expensive items, pick 1 cheap + 1 expensive
    if (expensive.length > 0 && cheap.length > 0) {
      const cheapIndex = Math.floor(seededRandom(today + '_cheap') * cheap.length)
      const expensiveIndex = Math.floor(seededRandom(today + '_expensive') * expensive.length)

      items.push({
        id: cheap[cheapIndex].id,
        item: cheap[cheapIndex],
        price: calculatePrice(cheap[cheapIndex].id)
      })
      items.push({
        id: expensive[expensiveIndex].id,
        item: expensive[expensiveIndex],
        price: calculatePrice(expensive[expensiveIndex].id)
      })
    } else if (cheap.length >= 2) {
      // No expensive items, pick 2 cheap
      const index1 = Math.floor(seededRandom(today + '_cheap1') * cheap.length)
      let index2 = Math.floor(seededRandom(today + '_cheap2') * cheap.length)
      // Make sure we don't pick the same item twice if possible
      if (cheap.length > 1 && index2 === index1) {
        index2 = (index2 + 1) % cheap.length
      }

      items.push({
        id: cheap[index1].id,
        item: cheap[index1],
        price: calculatePrice(cheap[index1].id)
      })
      items.push({
        id: cheap[index2].id,
        item: cheap[index2],
        price: calculatePrice(cheap[index2].id)
      })
    } else if (cheap.length === 1) {
      // Only 1 cheap item available
      items.push({
        id: cheap[0].id,
        item: cheap[0],
        price: calculatePrice(cheap[0].id)
      })
      items.push({
        id: cheap[0].id,
        item: cheap[0],
        price: calculatePrice(cheap[0].id)
      })
    } else if (expensive.length >= 1) {
      // Only expensive items available
      const index1 = Math.floor(seededRandom(today + '_exp1') * expensive.length)
      let index2 = Math.floor(seededRandom(today + '_exp2') * expensive.length)
      if (expensive.length > 1 && index2 === index1) {
        index2 = (index2 + 1) % expensive.length
      }

      items.push({
        id: expensive[index1].id,
        item: expensive[index1],
        price: calculatePrice(expensive[index1].id)
      })
      if (expensive.length > 1) {
        items.push({
          id: expensive[index2].id,
          item: expensive[index2],
          price: calculatePrice(expensive[index2].id)
        })
      } else {
        items.push({
          id: expensive[0].id,
          item: expensive[0],
          price: calculatePrice(expensive[0].id)
        })
      }
    }

    return items
  }

  // Purchase an item from today's selection
  function purchaseItem(itemId) {
    checkDailyReset()

    const gachaStore = useGachaStore()
    const inventoryStore = useInventoryStore()

    // Check if item is in today's selection
    const todaysItems = getTodaysItems()
    const shopItem = todaysItems.find(i => i.id === itemId)

    if (!shopItem) {
      return { success: false, message: 'Item not available in today\'s selection' }
    }

    // Check if already purchased
    if (purchasedToday.value.includes(itemId)) {
      return { success: false, message: 'You have already purchased this item today' }
    }

    // Check if sufficient gems
    if (gachaStore.gems < shopItem.price) {
      return { success: false, message: 'Insufficient gems' }
    }

    // Execute purchase
    gachaStore.spendGems(shopItem.price)
    inventoryStore.addItem(itemId, 1)
    purchasedToday.value.push(itemId)

    return { success: true, message: 'Purchase successful!' }
  }

  // Get time until midnight reset
  function getTimeUntilReset() {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)

    const diffMs = midnight - now
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return { hours, minutes }
  }

  // Persistence
  function saveState() {
    return {
      lastPurchaseDate: lastPurchaseDate.value,
      purchasedToday: purchasedToday.value
    }
  }

  function loadState(savedState) {
    if (savedState?.lastPurchaseDate !== undefined) {
      lastPurchaseDate.value = savedState.lastPurchaseDate
    }
    if (savedState?.purchasedToday !== undefined) {
      purchasedToday.value = savedState.purchasedToday
    }
    // Check for daily reset after loading
    checkDailyReset()
  }

  return {
    // State
    lastPurchaseDate,
    purchasedToday,
    // Actions
    getEligibleItems,
    calculatePrice,
    getTodaysItems,
    purchaseItem,
    checkDailyReset,
    getTimeUntilReset,
    saveState,
    loadState
  }
})
