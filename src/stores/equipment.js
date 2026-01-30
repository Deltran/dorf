// src/stores/equipment.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getEquipment, CLASS_SLOTS } from '../data/equipment.js'
import { useGachaStore } from './gacha'
import { useInventoryStore } from './inventory'
import { UPGRADE_MATERIALS } from '../data/items.js'

// Upgrade costs by target tier
const UPGRADE_GOLD_COST = { 2: 500, 3: 1500, 4: 4000, 5: 10000 }
const UPGRADE_MATERIAL_COUNT = { 2: 2, 3: 4, 4: 8, 5: 15 }

/**
 * Get the material slot type for an equipment slot
 * @param {string} equipmentSlot - The equipment slot type
 * @returns {string} The material slot type ('weapon', 'armor', 'trinket', or 'class')
 */
function getMaterialSlotType(equipmentSlot) {
  if (equipmentSlot === 'weapon') return 'weapon'
  if (equipmentSlot === 'armor') return 'armor'
  if (equipmentSlot === 'ring' || equipmentSlot === 'cloak') return 'trinket'
  return 'class' // All class-specific slots use class materials
}

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

  /**
   * Check if an equipment can be upgraded and what resources are needed
   * @param {string} equipmentId - The equipment ID to check
   * @returns {object} Upgrade requirements and availability
   */
  function canUpgrade(equipmentId) {
    const equipment = getEquipment(equipmentId)
    if (!equipment) {
      return { canUpgrade: false, message: 'equipment not found' }
    }

    // Check if max tier
    if (equipment.upgradesTo === null) {
      return { canUpgrade: false, message: 'max tier' }
    }

    const gachaStore = useGachaStore()
    const inventoryStore = useInventoryStore()

    // Get target tier (current rarity + 1)
    const targetTier = equipment.rarity + 1

    // Calculate requirements
    const copiesNeeded = 2 // Always need 2 copies as fodder
    const copiesHave = getOwnedCount(equipmentId)
    const goldCost = UPGRADE_GOLD_COST[targetTier]
    const goldHave = gachaStore.gold

    // Determine material type based on slot
    const materialSlotType = getMaterialSlotType(equipment.slot)
    const materialId = UPGRADE_MATERIALS[materialSlotType][equipment.rarity]
    const materialCount = UPGRADE_MATERIAL_COUNT[targetTier]
    const materialsHave = inventoryStore.getItemCount(materialId)

    // Check if can afford (need 3 total copies: 1 to upgrade + 2 fodder)
    const canAfford =
      copiesHave >= copiesNeeded + 1 &&
      goldHave >= goldCost &&
      materialsHave >= materialCount

    return {
      canUpgrade: canAfford,
      copiesNeeded,
      copiesHave,
      goldCost,
      goldHave,
      materialId,
      materialCount,
      materialsHave,
      resultId: equipment.upgradesTo
    }
  }

  /**
   * Upgrade equipment to the next tier
   * @param {string} equipmentId - The equipment ID to upgrade
   * @returns {object} Result with success status and details
   */
  function upgrade(equipmentId) {
    const requirements = canUpgrade(equipmentId)

    // Check for max tier
    if (requirements.message === 'max tier') {
      return { success: false, message: 'max tier' }
    }

    // Check for equipment not found
    if (requirements.message === 'equipment not found') {
      return { success: false, message: 'equipment not found' }
    }

    // Check specific requirements
    if (requirements.copiesHave < requirements.copiesNeeded + 1) {
      return { success: false, message: 'not enough copies' }
    }

    if (requirements.goldHave < requirements.goldCost) {
      return { success: false, message: 'not enough gold' }
    }

    if (requirements.materialsHave < requirements.materialCount) {
      return { success: false, message: 'not enough materials' }
    }

    // Consume resources
    const gachaStore = useGachaStore()
    const inventoryStore = useInventoryStore()

    // Remove 3 copies (1 base + 2 fodder)
    removeEquipment(equipmentId, 3)

    // Spend gold
    gachaStore.spendGold(requirements.goldCost)

    // Spend materials
    inventoryStore.removeItem(requirements.materialId, requirements.materialCount)

    // Add upgraded equipment
    addEquipment(requirements.resultId, 1)

    return {
      success: true,
      resultId: requirements.resultId,
      goldSpent: requirements.goldCost,
      materialsSpent: requirements.materialCount
    }
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
    canUpgrade,
    upgrade,
    // Persistence
    saveState,
    loadState
  }
})
