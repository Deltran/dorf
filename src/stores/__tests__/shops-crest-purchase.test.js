import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useShopsStore } from '../shops'
import { useInventoryStore } from '../inventory'
import { useShardsStore } from '../shards'
import { useQuestsStore } from '../quests'
import { useHeroesStore } from '../heroes'

describe('Shops Store - Crest Purchase', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should deduct crests when purchasing from crest shop', () => {
    const shopsStore = useShopsStore()
    const inventoryStore = useInventoryStore()
    const questsStore = useQuestsStore()

    // Setup: defeat Valinar and have crests
    questsStore.completedNodes.push('lake_genus_loci')
    inventoryStore.addItem('valinar_crest', 5)

    const shopItem = {
      itemId: 'tome_large',
      price: 2,
      sectionId: 'valinar'
    }

    const result = shopsStore.purchase('crest_shop', shopItem)

    expect(result.success).toBe(true)
    expect(inventoryStore.getItemCount('valinar_crest')).toBe(3)
    expect(inventoryStore.getItemCount('tome_large')).toBe(1)
  })

  it('should fail purchase if insufficient crests', () => {
    const shopsStore = useShopsStore()
    const inventoryStore = useInventoryStore()
    const questsStore = useQuestsStore()

    questsStore.completedNodes.push('lake_genus_loci')
    inventoryStore.addItem('valinar_crest', 1) // Only 1 crest

    const shopItem = {
      itemId: 'tome_large',
      price: 2, // Needs 2
      sectionId: 'valinar'
    }

    const result = shopsStore.purchase('crest_shop', shopItem)

    expect(result.success).toBe(false)
    expect(result.message).toContain('Insufficient')
  })

  it('should grant hero shards for shard items', () => {
    const shopsStore = useShopsStore()
    const inventoryStore = useInventoryStore()
    const shardsStore = useShardsStore()
    const questsStore = useQuestsStore()
    const heroesStore = useHeroesStore()

    // Setup
    questsStore.completedNodes.push('lake_genus_loci')
    inventoryStore.addItem('valinar_crest', 10)
    shardsStore.unlocked = true

    // Need a hero in collection for shards to be added to
    heroesStore.collection.push({
      instanceId: 'test-gallan-1',
      templateId: 'sir_gallan',
      shards: 0
    })

    const shopItem = {
      itemId: 'shards_sir_gallan',
      heroId: 'sir_gallan',
      shardCount: 10,
      price: 8,
      maxStock: 1,
      stockType: 'weekly',
      sectionId: 'valinar',
      requiresShardsUnlocked: true
    }

    const result = shopsStore.purchase('crest_shop', shopItem)

    expect(result.success).toBe(true)
    expect(inventoryStore.getItemCount('valinar_crest')).toBe(2)
    // Shards are added to the hero instance
    expect(heroesStore.collection[0].shards).toBe(10)
  })

  it('should track weekly stock for shard items', () => {
    const shopsStore = useShopsStore()
    const inventoryStore = useInventoryStore()
    const shardsStore = useShardsStore()
    const questsStore = useQuestsStore()
    const heroesStore = useHeroesStore()

    // Setup
    questsStore.completedNodes.push('lake_genus_loci')
    inventoryStore.addItem('valinar_crest', 20)
    shardsStore.unlocked = true

    // Need a hero in collection for shards to be added to
    heroesStore.collection.push({
      instanceId: 'test-gallan-1',
      templateId: 'sir_gallan',
      shards: 0
    })

    const shopItem = {
      itemId: 'shards_sir_gallan',
      heroId: 'sir_gallan',
      shardCount: 10,
      price: 8,
      maxStock: 1,
      stockType: 'weekly',
      sectionId: 'valinar',
      requiresShardsUnlocked: true
    }

    // First purchase should succeed
    const result1 = shopsStore.purchase('crest_shop', shopItem)
    expect(result1.success).toBe(true)

    // Second purchase should fail (weekly limit)
    const result2 = shopsStore.purchase('crest_shop', shopItem)
    expect(result2.success).toBe(false)
    expect(result2.message).toContain('Out of stock')
  })

  it('should not grant shards if shards system is locked', () => {
    const shopsStore = useShopsStore()
    const inventoryStore = useInventoryStore()
    const shardsStore = useShardsStore()
    const questsStore = useQuestsStore()

    // Setup - shards NOT unlocked
    questsStore.completedNodes.push('lake_genus_loci')
    inventoryStore.addItem('valinar_crest', 10)
    shardsStore.unlocked = false

    const shopItem = {
      itemId: 'shards_sir_gallan',
      heroId: 'sir_gallan',
      shardCount: 10,
      price: 8,
      maxStock: 1,
      stockType: 'weekly',
      sectionId: 'valinar',
      requiresShardsUnlocked: true
    }

    const result = shopsStore.purchase('crest_shop', shopItem)

    expect(result.success).toBe(false)
    expect(result.message).toContain('locked')
  })

  it('should fail with invalid section', () => {
    const shopsStore = useShopsStore()
    const inventoryStore = useInventoryStore()

    inventoryStore.addItem('valinar_crest', 5)

    const shopItem = {
      itemId: 'tome_large',
      price: 2,
      sectionId: 'invalid_section'
    }

    const result = shopsStore.purchase('crest_shop', shopItem)

    expect(result.success).toBe(false)
    expect(result.message).toContain('Invalid section')
  })
})
