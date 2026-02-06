import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHeroesStore } from '../heroes.js'
import { useInventoryStore } from '../inventory.js'

describe('heroes store - canMergeHero always returns full requirements', () => {
  let heroesStore
  let inventoryStore

  beforeEach(() => {
    setActivePinia(createPinia())
    heroesStore = useHeroesStore()
    inventoryStore = useInventoryStore()
  })

  // Helper: add a hero and return its instanceId
  function addHero(templateId) {
    heroesStore.addHero(templateId)
    const heroes = heroesStore.collection.filter(h => h.templateId === templateId)
    return heroes[heroes.length - 1].instanceId
  }

  describe('goldCost is always present', () => {
    it('includes goldCost even when copies are insufficient (1-star hero)', () => {
      // 1-star hero needs 1 copy to merge to 2-star, gold = (1+1)*1000 = 2000
      const id = addHero('farm_hand')
      const info = heroesStore.canMergeHero(id)

      expect(info.canMerge).toBe(false)
      expect(info.goldCost).toBe(2000)
    })

    it('includes goldCost even when copies are insufficient (3-star hero)', () => {
      // 3-star hero needs 3 copies, gold = (3+1)*1000 = 4000
      const id = addHero('town_guard')
      const info = heroesStore.canMergeHero(id)

      expect(info.canMerge).toBe(false)
      expect(info.goldCost).toBe(4000)
    })
  })

  describe('material requirements are always present for 3-star and 4-star heroes', () => {
    it('includes requiredMaterial for 3-star hero even when copies are insufficient', () => {
      // 3-star -> 4-star requires shard_dragon_heart
      const id = addHero('town_guard')
      const info = heroesStore.canMergeHero(id)

      expect(info.canMerge).toBe(false)
      expect(info.requiredMaterial).toBe('shard_dragon_heart')
      expect(info.requiredMaterialName).toBe('Shard of Dragon Heart')
    })

    it('includes requiredMaterial for 4-star hero even when copies are insufficient', () => {
      // 4-star -> 5-star requires dragon_heart
      const id = addHero('sir_gallan')
      const info = heroesStore.canMergeHero(id)

      expect(info.canMerge).toBe(false)
      expect(info.requiredMaterial).toBe('dragon_heart')
      expect(info.requiredMaterialName).toBe('Dragon Heart')
    })

    it('does NOT include requiredMaterial for 1-star hero', () => {
      const id = addHero('farm_hand')
      const info = heroesStore.canMergeHero(id)

      expect(info.requiredMaterial).toBeUndefined()
      expect(info.requiredMaterialName).toBeUndefined()
    })

    it('does NOT include requiredMaterial for 2-star hero', () => {
      const id = addHero('militia_soldier')
      const info = heroesStore.canMergeHero(id)

      expect(info.requiredMaterial).toBeUndefined()
      expect(info.requiredMaterialName).toBeUndefined()
    })
  })

  describe('hasMaterial reflects inventory state', () => {
    it('hasMaterial is false when shard_dragon_heart is not in inventory', () => {
      // Add enough 3-star copies for merge
      const baseId = addHero('town_guard')
      addHero('town_guard')
      addHero('town_guard')
      addHero('town_guard') // need 3 copies + base

      const info = heroesStore.canMergeHero(baseId)

      expect(info.copiesHave).toBeGreaterThanOrEqual(info.copiesNeeded)
      expect(info.requiredMaterial).toBe('shard_dragon_heart')
      expect(info.canMerge).toBe(false)
    })

    it('canMerge is true when shard_dragon_heart is in inventory and copies are sufficient', () => {
      const baseId = addHero('town_guard')
      addHero('town_guard')
      addHero('town_guard')
      addHero('town_guard')
      inventoryStore.addItem('shard_dragon_heart', 1)

      const info = heroesStore.canMergeHero(baseId)

      expect(info.canMerge).toBe(true)
      expect(info.requiredMaterial).toBe('shard_dragon_heart')
    })
  })

  describe('complete requirements object shape', () => {
    it('returns all requirement fields for a 3-star hero with no copies', () => {
      const id = addHero('town_guard')
      const info = heroesStore.canMergeHero(id)

      // All these fields should always be present
      expect(info).toHaveProperty('canMerge', false)
      expect(info).toHaveProperty('copiesNeeded', 3)
      expect(info).toHaveProperty('copiesHave', 0)
      expect(info).toHaveProperty('requiredStarLevel', 3)
      expect(info).toHaveProperty('goldCost', 4000)
      expect(info).toHaveProperty('requiredMaterial', 'shard_dragon_heart')
      expect(info).toHaveProperty('requiredMaterialName', 'Shard of Dragon Heart')
    })

    it('returns all requirement fields for a 4-star hero with no copies', () => {
      const id = addHero('sir_gallan')
      const info = heroesStore.canMergeHero(id)

      expect(info).toHaveProperty('canMerge', false)
      expect(info).toHaveProperty('copiesNeeded', 4)
      expect(info).toHaveProperty('copiesHave', 0)
      expect(info).toHaveProperty('requiredStarLevel', 4)
      expect(info).toHaveProperty('goldCost', 5000)
      expect(info).toHaveProperty('requiredMaterial', 'dragon_heart')
      expect(info).toHaveProperty('requiredMaterialName', 'Dragon Heart')
    })

    it('still returns goldCost and material when canMerge is true', () => {
      const baseId = addHero('town_guard')
      addHero('town_guard')
      addHero('town_guard')
      addHero('town_guard')
      inventoryStore.addItem('shard_dragon_heart', 1)

      const info = heroesStore.canMergeHero(baseId)

      expect(info.canMerge).toBe(true)
      expect(info.goldCost).toBe(4000)
      expect(info.requiredMaterial).toBe('shard_dragon_heart')
      expect(info.requiredMaterialName).toBe('Shard of Dragon Heart')
    })
  })
})
