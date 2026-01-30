// src/stores/equipment.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEquipmentStore = defineStore('equipment', () => {
  // State
  // ownedEquipment: Object mapping equipmentId to count (e.g., { 'rusty_shiv': 2 })
  const ownedEquipment = ref({})

  // equippedGear: Object mapping templateId to slot assignments
  // e.g., { 'aurora_the_dawn': { weapon: 'rusty_shiv', armor: null, trinket: null, special: null } }
  const equippedGear = ref({})

  // blacksmithUnlocked: Boolean, starts false
  const blacksmithUnlocked = ref(false)

  // Actions

  /**
   * Add equipment to owned inventory
   * @param {string} equipmentId - The equipment ID to add
   * @param {number} count - Number to add (default: 1)
   * @returns {boolean} Always returns true
   */
  function addEquipment(equipmentId, count = 1) {
    ownedEquipment.value[equipmentId] = (ownedEquipment.value[equipmentId] || 0) + count
    return true
  }

  /**
   * Remove equipment from owned inventory
   * @param {string} equipmentId - The equipment ID to remove
   * @param {number} count - Number to remove (default: 1)
   * @returns {boolean} False if not enough owned, true otherwise
   */
  function removeEquipment(equipmentId, count = 1) {
    const current = ownedEquipment.value[equipmentId] || 0
    if (current < count) {
      return false
    }
    ownedEquipment.value[equipmentId] = current - count
    if (ownedEquipment.value[equipmentId] <= 0) {
      delete ownedEquipment.value[equipmentId]
    }
    return true
  }

  /**
   * Get the count of a specific equipment
   * @param {string} equipmentId - The equipment ID to check
   * @returns {number} Count owned, or 0 if not owned
   */
  function getOwnedCount(equipmentId) {
    return ownedEquipment.value[equipmentId] || 0
  }

  /**
   * Unlock the blacksmith feature
   */
  function unlockBlacksmith() {
    blacksmithUnlocked.value = true
  }

  // Persistence

  /**
   * Save current state for persistence
   * @returns {Object} State object to save
   */
  function saveState() {
    return {
      ownedEquipment: ownedEquipment.value,
      equippedGear: equippedGear.value,
      blacksmithUnlocked: blacksmithUnlocked.value
    }
  }

  /**
   * Load state from saved data
   * @param {Object} savedState - Previously saved state
   */
  function loadState(savedState) {
    if (savedState.ownedEquipment !== undefined) {
      ownedEquipment.value = savedState.ownedEquipment
    }
    if (savedState.equippedGear !== undefined) {
      equippedGear.value = savedState.equippedGear
    }
    if (savedState.blacksmithUnlocked !== undefined) {
      blacksmithUnlocked.value = savedState.blacksmithUnlocked
    }
  }

  return {
    // State
    ownedEquipment,
    equippedGear,
    blacksmithUnlocked,
    // Actions
    addEquipment,
    removeEquipment,
    getOwnedCount,
    unlockBlacksmith,
    // Persistence
    saveState,
    loadState
  }
})
