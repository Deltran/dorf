import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEquipmentStore } from '../equipment'
import { useGachaStore } from '../gacha'
import { useInventoryStore } from '../inventory'

describe('equipment store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useEquipmentStore()
  })

  describe('initial state', () => {
    it('has empty ownedEquipment', () => {
      expect(store.ownedEquipment).toEqual({})
    })

    it('has empty equippedGear', () => {
      expect(store.equippedGear).toEqual({})
    })

    it('has blacksmithUnlocked as false', () => {
      expect(store.blacksmithUnlocked).toBe(false)
    })
  })

  describe('addEquipment', () => {
    it('adds new equipment with count 1 by default', () => {
      const result = store.addEquipment('rusty_shiv')

      expect(result).toBe(true)
      expect(store.ownedEquipment['rusty_shiv']).toBe(1)
    })

    it('adds equipment with specified count', () => {
      const result = store.addEquipment('rusty_shiv', 5)

      expect(result).toBe(true)
      expect(store.ownedEquipment['rusty_shiv']).toBe(5)
    })

    it('increments existing equipment count', () => {
      store.addEquipment('rusty_shiv', 2)
      store.addEquipment('rusty_shiv', 3)

      expect(store.ownedEquipment['rusty_shiv']).toBe(5)
    })

    it('handles multiple different equipment types', () => {
      store.addEquipment('rusty_shiv', 2)
      store.addEquipment('leather_armor', 1)
      store.addEquipment('lucky_charm', 3)

      expect(store.ownedEquipment['rusty_shiv']).toBe(2)
      expect(store.ownedEquipment['leather_armor']).toBe(1)
      expect(store.ownedEquipment['lucky_charm']).toBe(3)
    })
  })

  describe('removeEquipment', () => {
    it('decrements equipment count', () => {
      store.addEquipment('rusty_shiv', 5)

      const result = store.removeEquipment('rusty_shiv', 2)

      expect(result).toBe(true)
      expect(store.ownedEquipment['rusty_shiv']).toBe(3)
    })

    it('removes key when count reaches 0', () => {
      store.addEquipment('rusty_shiv', 2)

      store.removeEquipment('rusty_shiv', 2)

      expect(store.ownedEquipment['rusty_shiv']).toBeUndefined()
      expect('rusty_shiv' in store.ownedEquipment).toBe(false)
    })

    it('removes 1 by default', () => {
      store.addEquipment('rusty_shiv', 3)

      store.removeEquipment('rusty_shiv')

      expect(store.ownedEquipment['rusty_shiv']).toBe(2)
    })

    it('returns false if equipment not owned', () => {
      const result = store.removeEquipment('nonexistent_item')

      expect(result).toBe(false)
    })

    it('returns false if not enough owned', () => {
      store.addEquipment('rusty_shiv', 2)

      const result = store.removeEquipment('rusty_shiv', 5)

      expect(result).toBe(false)
      expect(store.ownedEquipment['rusty_shiv']).toBe(2) // Unchanged
    })
  })

  describe('getOwnedCount', () => {
    it('returns count for owned equipment', () => {
      store.addEquipment('rusty_shiv', 7)

      expect(store.getOwnedCount('rusty_shiv')).toBe(7)
    })

    it('returns 0 for equipment not owned', () => {
      expect(store.getOwnedCount('nonexistent_item')).toBe(0)
    })

    it('returns 0 after equipment is fully removed', () => {
      store.addEquipment('rusty_shiv', 1)
      store.removeEquipment('rusty_shiv', 1)

      expect(store.getOwnedCount('rusty_shiv')).toBe(0)
    })
  })

  describe('unlockBlacksmith', () => {
    it('sets blacksmithUnlocked to true', () => {
      store.unlockBlacksmith()

      expect(store.blacksmithUnlocked).toBe(true)
    })

    it('remains true after multiple calls', () => {
      store.unlockBlacksmith()
      store.unlockBlacksmith()

      expect(store.blacksmithUnlocked).toBe(true)
    })
  })

  describe('persistence', () => {
    it('saveState returns object with all state', () => {
      store.addEquipment('rusty_shiv', 3)
      store.addEquipment('leather_armor', 1)
      store.unlockBlacksmith()

      const saved = store.saveState()

      expect(saved.ownedEquipment).toEqual({ rusty_shiv: 3, leather_armor: 1 })
      expect(saved.equippedGear).toEqual({})
      expect(saved.blacksmithUnlocked).toBe(true)
    })

    it('loadState restores ownedEquipment', () => {
      const savedState = {
        ownedEquipment: { rusty_shiv: 5, leather_armor: 2 },
        equippedGear: {},
        blacksmithUnlocked: false
      }

      store.loadState(savedState)

      expect(store.ownedEquipment).toEqual({ rusty_shiv: 5, leather_armor: 2 })
    })

    it('loadState restores equippedGear', () => {
      const savedState = {
        ownedEquipment: {},
        equippedGear: {
          aurora_the_dawn: { weapon: 'rusty_shiv', armor: null, trinket: null, special: null }
        },
        blacksmithUnlocked: false
      }

      store.loadState(savedState)

      expect(store.equippedGear).toEqual({
        aurora_the_dawn: { weapon: 'rusty_shiv', armor: null, trinket: null, special: null }
      })
    })

    it('loadState restores blacksmithUnlocked', () => {
      const savedState = {
        ownedEquipment: {},
        equippedGear: {},
        blacksmithUnlocked: true
      }

      store.loadState(savedState)

      expect(store.blacksmithUnlocked).toBe(true)
    })

    it('saveState/loadState round-trips correctly', () => {
      // Setup initial state
      store.addEquipment('rusty_shiv', 3)
      store.addEquipment('leather_armor', 2)
      store.equippedGear['aurora_the_dawn'] = { weapon: 'rusty_shiv', armor: 'leather_armor', trinket: null, special: null }
      store.unlockBlacksmith()

      // Save
      const saved = store.saveState()

      // Create fresh store
      setActivePinia(createPinia())
      const newStore = useEquipmentStore()

      // Load
      newStore.loadState(saved)

      // Verify
      expect(newStore.ownedEquipment).toEqual({ rusty_shiv: 3, leather_armor: 2 })
      expect(newStore.equippedGear).toEqual({
        aurora_the_dawn: { weapon: 'rusty_shiv', armor: 'leather_armor', trinket: null, special: null }
      })
      expect(newStore.blacksmithUnlocked).toBe(true)
    })

    it('loadState handles partial state gracefully', () => {
      store.addEquipment('rusty_shiv', 5)
      store.unlockBlacksmith()

      // Load partial state (missing equippedGear)
      store.loadState({ ownedEquipment: { leather_armor: 1 } })

      // Should update what's provided
      expect(store.ownedEquipment).toEqual({ leather_armor: 1 })
      // Should keep old values for what's not provided
      expect(store.blacksmithUnlocked).toBe(true)
    })
  })

  describe('equip', () => {
    it('adds equipment to slot', () => {
      store.addEquipment('rusty_shiv', 1)

      const result = store.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')

      expect(result).toEqual({ success: true })
      expect(store.equippedGear['aurora_the_dawn']).toEqual({
        weapon: 'rusty_shiv',
        armor: null,
        trinket: null,
        special: null
      })
    })

    it('fails if not owned', () => {
      const result = store.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')

      expect(result).toEqual({ success: false, message: 'not owned' })
      expect(store.equippedGear['aurora_the_dawn']).toBeUndefined()
    })

    it('fails if all copies equipped to other templates', () => {
      store.addEquipment('rusty_shiv', 1)
      store.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')

      const result = store.equip('shadow_king', 'rusty_shiv', 'weapon')

      expect(result).toEqual({ success: false, message: 'already equipped' })
      // Original should still be equipped
      expect(store.equippedGear['aurora_the_dawn'].weapon).toBe('rusty_shiv')
      // Shadow king should not have gear entry
      expect(store.equippedGear['shadow_king']).toBeUndefined()
    })

    it('allows if you own 2+ copies and only 1 equipped', () => {
      store.addEquipment('rusty_shiv', 2)
      store.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')

      const result = store.equip('shadow_king', 'rusty_shiv', 'weapon')

      expect(result).toEqual({ success: true })
      expect(store.equippedGear['aurora_the_dawn'].weapon).toBe('rusty_shiv')
      expect(store.equippedGear['shadow_king'].weapon).toBe('rusty_shiv')
    })

    it('replaces existing equipment in slot', () => {
      store.addEquipment('rusty_shiv', 1)
      store.addEquipment('worn_blade', 1)
      store.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')

      const result = store.equip('aurora_the_dawn', 'worn_blade', 'weapon')

      expect(result).toEqual({ success: true })
      expect(store.equippedGear['aurora_the_dawn'].weapon).toBe('worn_blade')
    })
  })

  describe('unequip', () => {
    it('removes from slot', () => {
      store.addEquipment('rusty_shiv', 1)
      store.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')

      const result = store.unequip('aurora_the_dawn', 'weapon')

      expect(result).toBe(true)
      expect(store.equippedGear['aurora_the_dawn'].weapon).toBeNull()
    })

    it('returns false if nothing equipped', () => {
      const result = store.unequip('aurora_the_dawn', 'weapon')

      expect(result).toBe(false)
    })

    it('returns false if template has no gear entry', () => {
      const result = store.unequip('nonexistent_hero', 'weapon')

      expect(result).toBe(false)
    })
  })

  describe('getEquippedGear', () => {
    it('returns all slots for template with gear', () => {
      store.addEquipment('rusty_shiv', 1)
      store.addEquipment('scrap_leather', 1)
      store.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')
      store.equip('aurora_the_dawn', 'scrap_leather', 'armor')

      const gear = store.getEquippedGear('aurora_the_dawn')

      expect(gear).toEqual({
        weapon: 'rusty_shiv',
        armor: 'scrap_leather',
        trinket: null,
        special: null
      })
    })

    it('returns all null if template has no equipped gear', () => {
      const gear = store.getEquippedGear('aurora_the_dawn')

      expect(gear).toEqual({
        weapon: null,
        armor: null,
        trinket: null,
        special: null
      })
    })
  })

  describe('getAvailableForSlot', () => {
    it('returns unequipped weapon items for weapon slot', () => {
      store.addEquipment('rusty_shiv', 3)
      store.addEquipment('worn_blade', 1)
      store.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')

      const available = store.getAvailableForSlot('weapon')

      expect(available).toContainEqual({ id: 'rusty_shiv', count: 2 })
      expect(available).toContainEqual({ id: 'worn_blade', count: 1 })
    })

    it('returns unequipped armor items for armor slot', () => {
      store.addEquipment('scrap_leather', 2)

      const available = store.getAvailableForSlot('armor')

      expect(available).toContainEqual({ id: 'scrap_leather', count: 2 })
    })

    it('returns ring and cloak items for trinket slot', () => {
      store.addEquipment('cracked_ring', 2)
      store.addEquipment('tattered_shroud', 1)

      const available = store.getAvailableForSlot('trinket')

      expect(available).toContainEqual({ id: 'cracked_ring', count: 2 })
      expect(available).toContainEqual({ id: 'tattered_shroud', count: 1 })
    })

    it('returns class-specific items for special slot', () => {
      store.addEquipment('dented_buckler', 1) // shield (Knight)
      store.addEquipment('cracked_skull', 1) // war_trophy (Berserker)
      store.addEquipment('bent_shortbow', 1) // bow (Ranger)

      const available = store.getAvailableForSlot('special')

      expect(available).toContainEqual({ id: 'dented_buckler', count: 1 })
      expect(available).toContainEqual({ id: 'cracked_skull', count: 1 })
      expect(available).toContainEqual({ id: 'bent_shortbow', count: 1 })
    })

    it('excludes items with no available copies', () => {
      store.addEquipment('rusty_shiv', 1)
      store.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')

      const available = store.getAvailableForSlot('weapon')

      expect(available.find(i => i.id === 'rusty_shiv')).toBeUndefined()
    })

    it('does not include weapon items in trinket slot', () => {
      store.addEquipment('rusty_shiv', 1)
      store.addEquipment('cracked_ring', 1)

      const available = store.getAvailableForSlot('trinket')

      expect(available.find(i => i.id === 'rusty_shiv')).toBeUndefined()
      expect(available).toContainEqual({ id: 'cracked_ring', count: 1 })
    })
  })

  describe('canUpgrade', () => {
    let gachaStore
    let inventoryStore

    beforeEach(() => {
      gachaStore = useGachaStore()
      inventoryStore = useInventoryStore()
    })

    it('returns requirements when player has enough resources', () => {
      // Setup: 3 rusty_shiv (1-star weapon), enough gold, enough materials
      store.addEquipment('rusty_shiv', 3)
      gachaStore.gold = 1000
      inventoryStore.addItem('common_weapon_stone', 5)

      const result = store.canUpgrade('rusty_shiv')

      expect(result.canUpgrade).toBe(true)
      expect(result.copiesNeeded).toBe(2)
      expect(result.copiesHave).toBe(3)
      expect(result.goldCost).toBe(500) // tier 2 cost
      expect(result.goldHave).toBe(1000)
      expect(result.materialId).toBe('common_weapon_stone')
      expect(result.materialCount).toBe(2) // tier 2 requires 2
      expect(result.materialsHave).toBe(5)
      expect(result.resultId).toBe('worn_blade')
    })

    it('returns false when not enough copies', () => {
      store.addEquipment('rusty_shiv', 1) // Only 1, need 3 total (1 base + 2 fodder)
      gachaStore.gold = 10000
      inventoryStore.addItem('common_weapon_stone', 10)

      const result = store.canUpgrade('rusty_shiv')

      expect(result.canUpgrade).toBe(false)
      expect(result.copiesNeeded).toBe(2)
      expect(result.copiesHave).toBe(1)
    })

    it('returns false for max tier equipment with message', () => {
      store.addEquipment('kingslayer', 5) // 5-star, max tier
      gachaStore.gold = 100000
      inventoryStore.addItem('epic_weapon_stone', 100)

      const result = store.canUpgrade('kingslayer')

      expect(result.canUpgrade).toBe(false)
      expect(result.message).toBe('max tier')
    })

    it('returns correct material for armor slot', () => {
      store.addEquipment('scrap_leather', 3) // 1-star armor
      gachaStore.gold = 1000
      inventoryStore.addItem('common_armor_plate', 5)

      const result = store.canUpgrade('scrap_leather')

      expect(result.materialId).toBe('common_armor_plate')
    })

    it('returns correct material for trinket slot (ring)', () => {
      store.addEquipment('cracked_ring', 3) // 1-star ring
      gachaStore.gold = 1000
      inventoryStore.addItem('common_gem_shard', 5)

      const result = store.canUpgrade('cracked_ring')

      expect(result.materialId).toBe('common_gem_shard')
    })

    it('returns correct material for trinket slot (cloak)', () => {
      store.addEquipment('tattered_shroud', 3) // 1-star cloak
      gachaStore.gold = 1000
      inventoryStore.addItem('common_gem_shard', 5)

      const result = store.canUpgrade('tattered_shroud')

      expect(result.materialId).toBe('common_gem_shard')
    })

    it('returns correct material for class-specific slot (shield)', () => {
      store.addEquipment('dented_buckler', 3) // 1-star shield (knight)
      gachaStore.gold = 1000
      inventoryStore.addItem('common_class_token', 5)

      const result = store.canUpgrade('dented_buckler')

      expect(result.materialId).toBe('common_class_token')
    })
  })

  describe('upgrade', () => {
    let gachaStore
    let inventoryStore

    beforeEach(() => {
      gachaStore = useGachaStore()
      inventoryStore = useInventoryStore()
    })

    it('succeeds when all requirements met', () => {
      // Setup: 3 rusty_shiv (need 1 + 2 fodder), gold, materials
      store.addEquipment('rusty_shiv', 3)
      gachaStore.gold = 1000
      inventoryStore.addItem('common_weapon_stone', 5)

      const result = store.upgrade('rusty_shiv')

      expect(result.success).toBe(true)
      expect(result.resultId).toBe('worn_blade')
      expect(result.goldSpent).toBe(500)
      expect(result.materialsSpent).toBe(2)

      // Verify state changes
      expect(store.getOwnedCount('rusty_shiv')).toBe(0) // 3 - 3 = 0
      expect(store.getOwnedCount('worn_blade')).toBe(1) // gained 1
      expect(gachaStore.gold).toBe(500) // 1000 - 500
      expect(inventoryStore.getItemCount('common_weapon_stone')).toBe(3) // 5 - 2
    })

    it('fails when not enough gold', () => {
      store.addEquipment('rusty_shiv', 3)
      gachaStore.gold = 100 // Not enough (need 500)
      inventoryStore.addItem('common_weapon_stone', 5)

      const result = store.upgrade('rusty_shiv')

      expect(result.success).toBe(false)
      expect(result.message).toContain('gold')

      // Verify no changes
      expect(store.getOwnedCount('rusty_shiv')).toBe(3)
      expect(gachaStore.gold).toBe(100)
    })

    it('fails when not enough materials', () => {
      store.addEquipment('rusty_shiv', 3)
      gachaStore.gold = 1000
      inventoryStore.addItem('common_weapon_stone', 1) // Not enough (need 2)

      const result = store.upgrade('rusty_shiv')

      expect(result.success).toBe(false)
      expect(result.message).toContain('material')

      // Verify no changes
      expect(store.getOwnedCount('rusty_shiv')).toBe(3)
      expect(inventoryStore.getItemCount('common_weapon_stone')).toBe(1)
    })

    it('fails when not enough copies', () => {
      store.addEquipment('rusty_shiv', 2) // Need 3 (1 base + 2 fodder)
      gachaStore.gold = 1000
      inventoryStore.addItem('common_weapon_stone', 5)

      const result = store.upgrade('rusty_shiv')

      expect(result.success).toBe(false)
      expect(result.message).toContain('copies')

      // Verify no changes
      expect(store.getOwnedCount('rusty_shiv')).toBe(2)
    })

    it('consumes correct resources for higher tier upgrades', () => {
      // 3-star to 4-star upgrade
      store.addEquipment('steel_falchion', 3) // 3-star weapon
      gachaStore.gold = 10000
      inventoryStore.addItem('rare_weapon_stone', 10)

      const result = store.upgrade('steel_falchion')

      expect(result.success).toBe(true)
      expect(result.resultId).toBe('blackiron_cleaver')
      expect(result.goldSpent).toBe(4000) // tier 4 cost
      expect(result.materialsSpent).toBe(8) // tier 4 materials

      expect(store.getOwnedCount('steel_falchion')).toBe(0)
      expect(store.getOwnedCount('blackiron_cleaver')).toBe(1)
      expect(gachaStore.gold).toBe(6000) // 10000 - 4000
      expect(inventoryStore.getItemCount('rare_weapon_stone')).toBe(2) // 10 - 8
    })

    it('fails for max tier equipment', () => {
      store.addEquipment('kingslayer', 5)
      gachaStore.gold = 100000
      inventoryStore.addItem('epic_weapon_stone', 100)

      const result = store.upgrade('kingslayer')

      expect(result.success).toBe(false)
      expect(result.message).toBe('max tier')

      // Verify no changes
      expect(store.getOwnedCount('kingslayer')).toBe(5)
    })
  })
})
