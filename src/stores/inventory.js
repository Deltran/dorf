// src/stores/inventory.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getItem } from '../data/items.js'
import { useGachaStore } from './gacha.js'

export const useInventoryStore = defineStore('inventory', () => {
  // State - items stored as { itemId: count }
  const items = ref({})

  // Getters
  const itemList = computed(() => {
    return Object.entries(items.value)
      .filter(([_, count]) => count > 0)
      .map(([itemId, count]) => ({
        ...getItem(itemId),
        count
      }))
      .sort((a, b) => {
        // Sort by type (xp first), then rarity (desc), then name
        if (a.type !== b.type) {
          return a.type === 'xp' ? -1 : 1
        }
        if (a.rarity !== b.rarity) {
          return b.rarity - a.rarity
        }
        return a.name.localeCompare(b.name)
      })
  })

  const totalItemCount = computed(() =>
    Object.values(items.value).reduce((sum, count) => sum + count, 0)
  )

  const xpItemCount = computed(() => {
    return itemList.value
      .filter(item => item.type === 'xp')
      .reduce((sum, item) => sum + item.count, 0)
  })

  // Actions
  function addItem(itemId, count = 1) {
    const item = getItem(itemId)
    if (!item) {
      console.warn(`Unknown item: ${itemId}`)
      return false
    }
    items.value[itemId] = (items.value[itemId] || 0) + count
    return true
  }

  function removeItem(itemId, count = 1) {
    if ((items.value[itemId] || 0) < count) return false
    items.value[itemId] -= count
    if (items.value[itemId] <= 0) {
      delete items.value[itemId]
    }
    return true
  }

  function getItemCount(itemId) {
    return items.value[itemId] || 0
  }

  function sellItem(itemId, count = 1) {
    const item = getItem(itemId)
    if (!item?.sellReward) return false
    if (!removeItem(itemId, count)) return false

    const reward = item.sellReward
    const gachaStore = useGachaStore()

    if (reward.gems) {
      gachaStore.addGems(reward.gems * count)
    }
    if (reward.items) {
      for (const r of reward.items) {
        addItem(r.itemId, r.count * count)
      }
    }

    return true
  }

  // Persistence
  function saveState() {
    return { items: items.value }
  }

  function loadState(savedState) {
    if (savedState.items) items.value = savedState.items
  }

  return {
    // State
    items,
    // Getters
    itemList,
    totalItemCount,
    xpItemCount,
    // Actions
    addItem,
    removeItem,
    getItemCount,
    sellItem,
    // Persistence
    saveState,
    loadState
  }
})
