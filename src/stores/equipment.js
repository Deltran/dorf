// src/stores/equipment.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getEquipment, CLASS_SLOTS } from '../data/equipment.js'

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

  /**
   * Count how many copies of an equipment are currently equipped across all templates
   * @param {string} equipmentId - The equipment ID to count
   * @returns {number} Number of equipped copies
   */
  function getEquippedCount(equipmentId) {
    let count = 0
    for (const templateId in equippedGear.value) {
      const gear = equippedGear.value[templateId]
      for (const slot in gear) {
        if (gear[slot] === equipmentId) {
          count++
        }
      }
    }
    return count
  }

  /**
   * Equip equipment to a hero template's slot
   * @param {string} templateId - Hero template id (e.g., 'aurora_the_dawn')
   * @param {string} equipmentId - Equipment id (e.g., 'rusty_shiv')
   * @param {string} slotType - 'weapon' | 'armor' | 'trinket' | 'special'
   * @returns {{ success: boolean, message?: string }}
   */
  function equip(templateId, equipmentId, slotType) {
    // Check if equipment is owned
    const ownedCount = getOwnedCount(equipmentId)
    if (ownedCount === 0) {
      return { success: false, message: 'not owned' }
    }

    // Check if there are available copies (owned - already equipped elsewhere)
    const currentlyEquipped = getEquippedCount(equipmentId)
    // If replacing same slot on same template, that doesn't count against available
    const isReplacing = equippedGear.value[templateId]?.[slotType] === equipmentId
    const effectiveEquipped = isReplacing ? currentlyEquipped - 1 : currentlyEquipped

    if (effectiveEquipped >= ownedCount) {
      return { success: false, message: 'already equipped' }
    }

    // Create gear entry if it doesn't exist
    if (!equippedGear.value[templateId]) {
      equippedGear.value[templateId] = {
        weapon: null,
        armor: null,
        trinket: null,
        special: null
      }
    }

    // Equip the item
    equippedGear.value[templateId][slotType] = equipmentId

    return { success: true }
  }

  /**
   * Unequip equipment from a slot
   * @param {string} templateId - Hero template id
   * @param {string} slotType - 'weapon' | 'armor' | 'trinket' | 'special'
   * @returns {boolean} True if something was unequipped, false if slot was empty
   */
  function unequip(templateId, slotType) {
    const gear = equippedGear.value[templateId]
    if (!gear) {
      return false
    }
    if (gear[slotType] === null) {
      return false
    }
    gear[slotType] = null
    return true
  }

  /**
   * Get all equipped gear for a template
   * @param {string} templateId - Hero template id
   * @returns {{ weapon: string|null, armor: string|null, trinket: string|null, special: string|null }}
   */
  function getEquippedGear(templateId) {
    const gear = equippedGear.value[templateId]
    if (!gear) {
      return {
        weapon: null,
        armor: null,
        trinket: null,
        special: null
      }
    }
    return { ...gear }
  }

  /**
   * Get available equipment for a slot type
   * @param {string} slotType - 'weapon' | 'armor' | 'trinket' | 'special'
   * @returns {Array<{ id: string, count: number }>}
   */
  function getAvailableForSlot(slotType) {
    const result = []

    // Determine which equipment slots match the given slot type
    const matchingSlots = []
    if (slotType === 'weapon') {
      matchingSlots.push('weapon')
    } else if (slotType === 'armor') {
      matchingSlots.push('armor')
    } else if (slotType === 'trinket') {
      matchingSlots.push('ring', 'cloak')
    } else if (slotType === 'special') {
      // All class-specific slots
      matchingSlots.push(...Object.values(CLASS_SLOTS))
    }

    // Check each owned equipment
    for (const equipmentId in ownedEquipment.value) {
      const equip = getEquipment(equipmentId)
      if (!equip) continue

      // Check if this equipment's slot matches
      if (!matchingSlots.includes(equip.slot)) continue

      const ownedCount = ownedEquipment.value[equipmentId]
      const equippedCount = getEquippedCount(equipmentId)
      const availableCount = ownedCount - equippedCount

      if (availableCount > 0) {
        result.push({ id: equipmentId, count: availableCount })
      }
    }

    return result
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
    equip,
    unequip,
    getEquippedGear,
    getAvailableForSlot,
    // Persistence
    saveState,
    loadState
  }
})
