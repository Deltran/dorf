import { describe, it, expect } from 'vitest'
import { getItem, getItemsByType, UPGRADE_MATERIALS } from '../items.js'

describe('Equipment Upgrade Materials', () => {
  describe('UPGRADE_MATERIALS lookup table', () => {
    it('exports UPGRADE_MATERIALS constant', () => {
      expect(UPGRADE_MATERIALS).toBeDefined()
    })

    it('has weapon materials for tiers 1-4', () => {
      expect(UPGRADE_MATERIALS.weapon[1]).toBe('common_weapon_stone')
      expect(UPGRADE_MATERIALS.weapon[2]).toBe('uncommon_weapon_stone')
      expect(UPGRADE_MATERIALS.weapon[3]).toBe('rare_weapon_stone')
      expect(UPGRADE_MATERIALS.weapon[4]).toBe('epic_weapon_stone')
    })

    it('has armor materials for tiers 1-4', () => {
      expect(UPGRADE_MATERIALS.armor[1]).toBe('common_armor_plate')
      expect(UPGRADE_MATERIALS.armor[2]).toBe('uncommon_armor_plate')
      expect(UPGRADE_MATERIALS.armor[3]).toBe('rare_armor_plate')
      expect(UPGRADE_MATERIALS.armor[4]).toBe('epic_armor_plate')
    })

    it('has trinket materials for tiers 1-4', () => {
      expect(UPGRADE_MATERIALS.trinket[1]).toBe('common_gem_shard')
      expect(UPGRADE_MATERIALS.trinket[2]).toBe('uncommon_gem_shard')
      expect(UPGRADE_MATERIALS.trinket[3]).toBe('rare_gem_shard')
      expect(UPGRADE_MATERIALS.trinket[4]).toBe('epic_gem_shard')
    })

    it('has class materials for tiers 1-4', () => {
      expect(UPGRADE_MATERIALS.class[1]).toBe('common_class_token')
      expect(UPGRADE_MATERIALS.class[2]).toBe('uncommon_class_token')
      expect(UPGRADE_MATERIALS.class[3]).toBe('rare_class_token')
      expect(UPGRADE_MATERIALS.class[4]).toBe('epic_class_token')
    })
  })

  describe('Weapon materials (stones)', () => {
    it('has common_weapon_stone with correct properties', () => {
      const item = getItem('common_weapon_stone')
      expect(item).not.toBeNull()
      expect(item.name).toBe('Common Weapon Stone')
      expect(item.type).toBe('equipment_material')
      expect(item.rarity).toBe(1)
      expect(item.materialSlot).toBe('weapon')
      expect(item.materialTier).toBe(1)
    })

    it('has uncommon_weapon_stone with correct properties', () => {
      const item = getItem('uncommon_weapon_stone')
      expect(item).not.toBeNull()
      expect(item.name).toBe('Uncommon Weapon Stone')
      expect(item.type).toBe('equipment_material')
      expect(item.rarity).toBe(2)
      expect(item.materialSlot).toBe('weapon')
      expect(item.materialTier).toBe(2)
    })

    it('has rare_weapon_stone with correct properties', () => {
      const item = getItem('rare_weapon_stone')
      expect(item).not.toBeNull()
      expect(item.name).toBe('Rare Weapon Stone')
      expect(item.type).toBe('equipment_material')
      expect(item.rarity).toBe(3)
      expect(item.materialSlot).toBe('weapon')
      expect(item.materialTier).toBe(3)
    })

    it('has epic_weapon_stone with correct properties', () => {
      const item = getItem('epic_weapon_stone')
      expect(item).not.toBeNull()
      expect(item.name).toBe('Epic Weapon Stone')
      expect(item.type).toBe('equipment_material')
      expect(item.rarity).toBe(4)
      expect(item.materialSlot).toBe('weapon')
      expect(item.materialTier).toBe(4)
    })
  })

  describe('Armor materials (plates)', () => {
    it('has common_armor_plate with correct properties', () => {
      const item = getItem('common_armor_plate')
      expect(item).not.toBeNull()
      expect(item.name).toBe('Common Armor Plate')
      expect(item.type).toBe('equipment_material')
      expect(item.rarity).toBe(1)
      expect(item.materialSlot).toBe('armor')
      expect(item.materialTier).toBe(1)
    })

    it('has uncommon_armor_plate with correct properties', () => {
      const item = getItem('uncommon_armor_plate')
      expect(item).not.toBeNull()
      expect(item.name).toBe('Uncommon Armor Plate')
      expect(item.type).toBe('equipment_material')
      expect(item.rarity).toBe(2)
      expect(item.materialSlot).toBe('armor')
      expect(item.materialTier).toBe(2)
    })

    it('has rare_armor_plate with correct properties', () => {
      const item = getItem('rare_armor_plate')
      expect(item).not.toBeNull()
      expect(item.name).toBe('Rare Armor Plate')
      expect(item.type).toBe('equipment_material')
      expect(item.rarity).toBe(3)
      expect(item.materialSlot).toBe('armor')
      expect(item.materialTier).toBe(3)
    })

    it('has epic_armor_plate with correct properties', () => {
      const item = getItem('epic_armor_plate')
      expect(item).not.toBeNull()
      expect(item.name).toBe('Epic Armor Plate')
      expect(item.type).toBe('equipment_material')
      expect(item.rarity).toBe(4)
      expect(item.materialSlot).toBe('armor')
      expect(item.materialTier).toBe(4)
    })
  })

  describe('Trinket materials (gem shards)', () => {
    it('has common_gem_shard with correct properties', () => {
      const item = getItem('common_gem_shard')
      expect(item).not.toBeNull()
      expect(item.name).toBe('Common Gem Shard')
      expect(item.type).toBe('equipment_material')
      expect(item.rarity).toBe(1)
      expect(item.materialSlot).toBe('trinket')
      expect(item.materialTier).toBe(1)
    })

    it('has uncommon_gem_shard with correct properties', () => {
      const item = getItem('uncommon_gem_shard')
      expect(item).not.toBeNull()
      expect(item.name).toBe('Uncommon Gem Shard')
      expect(item.type).toBe('equipment_material')
      expect(item.rarity).toBe(2)
      expect(item.materialSlot).toBe('trinket')
      expect(item.materialTier).toBe(2)
    })

    it('has rare_gem_shard with correct properties', () => {
      const item = getItem('rare_gem_shard')
      expect(item).not.toBeNull()
      expect(item.name).toBe('Rare Gem Shard')
      expect(item.type).toBe('equipment_material')
      expect(item.rarity).toBe(3)
      expect(item.materialSlot).toBe('trinket')
      expect(item.materialTier).toBe(3)
    })

    it('has epic_gem_shard with correct properties', () => {
      const item = getItem('epic_gem_shard')
      expect(item).not.toBeNull()
      expect(item.name).toBe('Epic Gem Shard')
      expect(item.type).toBe('equipment_material')
      expect(item.rarity).toBe(4)
      expect(item.materialSlot).toBe('trinket')
      expect(item.materialTier).toBe(4)
    })
  })

  describe('Class item materials (tokens)', () => {
    it('has common_class_token with correct properties', () => {
      const item = getItem('common_class_token')
      expect(item).not.toBeNull()
      expect(item.name).toBe('Common Class Token')
      expect(item.type).toBe('equipment_material')
      expect(item.rarity).toBe(1)
      expect(item.materialSlot).toBe('class')
      expect(item.materialTier).toBe(1)
    })

    it('has uncommon_class_token with correct properties', () => {
      const item = getItem('uncommon_class_token')
      expect(item).not.toBeNull()
      expect(item.name).toBe('Uncommon Class Token')
      expect(item.type).toBe('equipment_material')
      expect(item.rarity).toBe(2)
      expect(item.materialSlot).toBe('class')
      expect(item.materialTier).toBe(2)
    })

    it('has rare_class_token with correct properties', () => {
      const item = getItem('rare_class_token')
      expect(item).not.toBeNull()
      expect(item.name).toBe('Rare Class Token')
      expect(item.type).toBe('equipment_material')
      expect(item.rarity).toBe(3)
      expect(item.materialSlot).toBe('class')
      expect(item.materialTier).toBe(3)
    })

    it('has epic_class_token with correct properties', () => {
      const item = getItem('epic_class_token')
      expect(item).not.toBeNull()
      expect(item.name).toBe('Epic Class Token')
      expect(item.type).toBe('equipment_material')
      expect(item.rarity).toBe(4)
      expect(item.materialSlot).toBe('class')
      expect(item.materialTier).toBe(4)
    })
  })

  describe('getItemsByType for equipment_material', () => {
    it('returns all 16 equipment materials', () => {
      const materials = getItemsByType('equipment_material')
      expect(materials.length).toBe(16)
    })

    it('includes all weapon materials', () => {
      const materials = getItemsByType('equipment_material')
      const weaponMaterials = materials.filter(m => m.materialSlot === 'weapon')
      expect(weaponMaterials.length).toBe(4)
    })

    it('includes all armor materials', () => {
      const materials = getItemsByType('equipment_material')
      const armorMaterials = materials.filter(m => m.materialSlot === 'armor')
      expect(armorMaterials.length).toBe(4)
    })

    it('includes all trinket materials', () => {
      const materials = getItemsByType('equipment_material')
      const trinketMaterials = materials.filter(m => m.materialSlot === 'trinket')
      expect(trinketMaterials.length).toBe(4)
    })

    it('includes all class materials', () => {
      const materials = getItemsByType('equipment_material')
      const classMaterials = materials.filter(m => m.materialSlot === 'class')
      expect(classMaterials.length).toBe(4)
    })

    it('all materials have descriptions', () => {
      const materials = getItemsByType('equipment_material')
      materials.forEach(material => {
        expect(material.description).toBeDefined()
        expect(material.description.length).toBeGreaterThan(0)
      })
    })
  })
})
