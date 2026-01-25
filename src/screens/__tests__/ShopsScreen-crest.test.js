import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useShopsStore } from '../../stores/shops'
import { useInventoryStore } from '../../stores/inventory'
import { useQuestsStore } from '../../stores/quests'
import { useShardsStore } from '../../stores/shards'
import { getShop } from '../../data/shops'

describe('ShopsScreen - Crest Shop Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Section Visibility', () => {
    it('should hide all sections when no bosses defeated', () => {
      const questsStore = useQuestsStore()
      const shop = getShop('crest_shop')

      const unlockedSections = shop.sections.filter(section =>
        questsStore.completedNodes.includes(section.unlockCondition?.completedNode)
      )

      expect(unlockedSections).toHaveLength(0)
    })

    it('should show Valinar section after defeating Valinar', () => {
      const questsStore = useQuestsStore()
      questsStore.completedNodes.push('lake_genus_loci')

      const shop = getShop('crest_shop')
      const unlockedSections = shop.sections.filter(section =>
        questsStore.completedNodes.includes(section.unlockCondition?.completedNode)
      )

      expect(unlockedSections).toHaveLength(1)
      expect(unlockedSections[0].id).toBe('valinar')
    })

    it('should show Great Troll section after defeating Great Troll', () => {
      const questsStore = useQuestsStore()
      questsStore.completedNodes.push('hibernation_den')

      const shop = getShop('crest_shop')
      const unlockedSections = shop.sections.filter(section =>
        questsStore.completedNodes.includes(section.unlockCondition?.completedNode)
      )

      expect(unlockedSections).toHaveLength(1)
      expect(unlockedSections[0].id).toBe('great_troll')
    })

    it('should show both sections after defeating both bosses', () => {
      const questsStore = useQuestsStore()
      questsStore.completedNodes.push('lake_genus_loci')
      questsStore.completedNodes.push('hibernation_den')

      const shop = getShop('crest_shop')
      const unlockedSections = shop.sections.filter(section =>
        questsStore.completedNodes.includes(section.unlockCondition?.completedNode)
      )

      expect(unlockedSections).toHaveLength(2)
    })
  })

  describe('Shard Item Visibility', () => {
    it('should hide shard items when shards not unlocked', () => {
      const shardsStore = useShardsStore()
      // shardsStore.unlocked is false by default

      const shop = getShop('crest_shop')
      const shardItems = shop.inventory.filter(item => item.requiresShardsUnlocked)

      // All shard items should be filtered out when checking isUnlocked
      shardItems.forEach(item => {
        const shouldShow = !item.requiresShardsUnlocked || shardsStore.isUnlocked
        expect(shouldShow).toBe(false)
      })
    })

    it('should show shard items when shards unlocked', () => {
      const shardsStore = useShardsStore()
      shardsStore.unlock()

      const shop = getShop('crest_shop')
      const shardItems = shop.inventory.filter(item => item.requiresShardsUnlocked)

      shardItems.forEach(item => {
        const shouldShow = !item.requiresShardsUnlocked || shardsStore.isUnlocked
        expect(shouldShow).toBe(true)
      })
    })

    it('should have at least one shard item requiring unlock', () => {
      const shop = getShop('crest_shop')
      const shardItems = shop.inventory.filter(item => item.requiresShardsUnlocked)

      expect(shardItems.length).toBeGreaterThan(0)
    })
  })

  describe('Crest Count Display', () => {
    it('should correctly count crests per section', () => {
      const inventoryStore = useInventoryStore()

      inventoryStore.addItem('valinar_crest', 5)
      inventoryStore.addItem('great_troll_crest', 10)

      expect(inventoryStore.getItemCount('valinar_crest')).toBe(5)
      expect(inventoryStore.getItemCount('great_troll_crest')).toBe(10)
    })

    it('should return 0 for crests not yet obtained', () => {
      const inventoryStore = useInventoryStore()

      expect(inventoryStore.getItemCount('valinar_crest')).toBe(0)
      expect(inventoryStore.getItemCount('great_troll_crest')).toBe(0)
    })

    it('should update crest count after adding more', () => {
      const inventoryStore = useInventoryStore()

      inventoryStore.addItem('valinar_crest', 3)
      expect(inventoryStore.getItemCount('valinar_crest')).toBe(3)

      inventoryStore.addItem('valinar_crest', 2)
      expect(inventoryStore.getItemCount('valinar_crest')).toBe(5)
    })
  })

  describe('Section-Item Mapping', () => {
    it('should have correct crestId for each section', () => {
      const shop = getShop('crest_shop')

      const valinarSection = shop.sections.find(s => s.id === 'valinar')
      expect(valinarSection.crestId).toBe('valinar_crest')

      const greatTrollSection = shop.sections.find(s => s.id === 'great_troll')
      expect(greatTrollSection.crestId).toBe('great_troll_crest')
    })

    it('should have items correctly assigned to sections', () => {
      const shop = getShop('crest_shop')

      const valinarItems = shop.inventory.filter(item => item.sectionId === 'valinar')
      const greatTrollItems = shop.inventory.filter(item => item.sectionId === 'great_troll')

      expect(valinarItems.length).toBeGreaterThan(0)
      expect(greatTrollItems.length).toBeGreaterThan(0)

      // Each item should have a price
      valinarItems.forEach(item => {
        expect(item.price).toBeGreaterThan(0)
      })
      greatTrollItems.forEach(item => {
        expect(item.price).toBeGreaterThan(0)
      })
    })
  })

  describe('Purchase Integration', () => {
    it('should successfully purchase item with sufficient crests', () => {
      const inventoryStore = useInventoryStore()
      const shopsStore = useShopsStore()
      const questsStore = useQuestsStore()

      // Unlock the section first
      questsStore.completedNodes.push('lake_genus_loci')

      // Add crests
      inventoryStore.addItem('valinar_crest', 10)

      const shop = getShop('crest_shop')
      const item = shop.inventory.find(i => i.sectionId === 'valinar' && !i.requiresShardsUnlocked)

      const result = shopsStore.purchase('crest_shop', item)

      expect(result.success).toBe(true)
      expect(inventoryStore.getItemCount('valinar_crest')).toBe(10 - item.price)
    })

    it('should fail purchase with insufficient crests', () => {
      const inventoryStore = useInventoryStore()
      const shopsStore = useShopsStore()
      const questsStore = useQuestsStore()

      // Unlock the section
      questsStore.completedNodes.push('lake_genus_loci')

      // Add only 1 crest
      inventoryStore.addItem('valinar_crest', 1)

      const shop = getShop('crest_shop')
      // Find an item that costs more than 1 crest
      const item = shop.inventory.find(i => i.sectionId === 'valinar' && i.price > 1)

      const result = shopsStore.purchase('crest_shop', item)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Insufficient crests')
    })
  })
})
