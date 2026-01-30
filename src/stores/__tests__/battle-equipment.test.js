import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { useEquipmentStore } from '../equipment'

describe('battle store - equipment integration', () => {
  let battleStore
  let heroesStore
  let equipmentStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
    equipmentStore = useEquipmentStore()
  })

  describe('getEquipmentBonuses', () => {
    it('returns zero stats when no equipment equipped', () => {
      const bonuses = battleStore.getEquipmentBonuses('aurora_the_dawn')

      expect(bonuses).toEqual({ hp: 0, atk: 0, def: 0, spd: 0, mp: 0 })
    })

    it('returns stats from a single equipped weapon', () => {
      equipmentStore.addEquipment('rusty_shiv', 1)
      equipmentStore.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')

      const bonuses = battleStore.getEquipmentBonuses('aurora_the_dawn')

      expect(bonuses.atk).toBe(5) // rusty_shiv has { atk: 5 }
      expect(bonuses.hp).toBe(0)
      expect(bonuses.def).toBe(0)
      expect(bonuses.spd).toBe(0)
    })

    it('returns stats from a single equipped armor', () => {
      equipmentStore.addEquipment('scrap_leather', 1)
      equipmentStore.equip('aurora_the_dawn', 'scrap_leather', 'armor')

      const bonuses = battleStore.getEquipmentBonuses('aurora_the_dawn')

      expect(bonuses.def).toBe(3) // scrap_leather has { def: 3, hp: 20 }
      expect(bonuses.hp).toBe(20)
      expect(bonuses.atk).toBe(0)
    })

    it('sums stats from multiple equipped items', () => {
      // Equip weapon, armor, and trinket
      equipmentStore.addEquipment('rusty_shiv', 1) // { atk: 5 }
      equipmentStore.addEquipment('scrap_leather', 1) // { def: 3, hp: 20 }
      equipmentStore.addEquipment('cracked_ring', 1) // { atk: 2, def: 2 }
      equipmentStore.addEquipment('tattered_shroud', 1) // { spd: 3 }

      equipmentStore.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')
      equipmentStore.equip('aurora_the_dawn', 'scrap_leather', 'armor')
      equipmentStore.equip('aurora_the_dawn', 'cracked_ring', 'trinket')
      equipmentStore.equip('aurora_the_dawn', 'tattered_shroud', 'special')

      const bonuses = battleStore.getEquipmentBonuses('aurora_the_dawn')

      expect(bonuses.atk).toBe(7) // 5 + 2
      expect(bonuses.def).toBe(5) // 3 + 2
      expect(bonuses.hp).toBe(20) // 20
      expect(bonuses.spd).toBe(3) // 3
    })

    it('handles high-tier equipment with multiple stats', () => {
      // warlords_mantle: { def: 50, hp: 300 }
      equipmentStore.addEquipment('warlords_mantle', 1)
      equipmentStore.equip('aurora_the_dawn', 'warlords_mantle', 'armor')

      const bonuses = battleStore.getEquipmentBonuses('aurora_the_dawn')

      expect(bonuses.def).toBe(50)
      expect(bonuses.hp).toBe(300)
    })
  })

  describe('initBattle - equipment stat application', () => {
    it('applies equipment bonuses to hero stats in battle', () => {
      // Add hero with equipment
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      // Get base stats before equipment
      const baseStats = heroesStore.getHeroStats(hero.instanceId)

      // Equip weapon with +5 ATK
      equipmentStore.addEquipment('rusty_shiv', 1)
      equipmentStore.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')

      // Start battle
      battleStore.initBattle(null, [])

      const battleHero = battleStore.heroes[0]

      // Stats should include equipment bonuses
      expect(battleHero.stats.atk).toBe(baseStats.atk + 5)
      expect(battleHero.stats.hp).toBe(baseStats.hp) // No HP bonus from weapon
    })

    it('applies multiple equipment bonuses correctly', () => {
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      const baseStats = heroesStore.getHeroStats(hero.instanceId)

      // Equip multiple items
      equipmentStore.addEquipment('rusty_shiv', 1) // { atk: 5 }
      equipmentStore.addEquipment('scrap_leather', 1) // { def: 3, hp: 20 }
      equipmentStore.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')
      equipmentStore.equip('aurora_the_dawn', 'scrap_leather', 'armor')

      battleStore.initBattle(null, [])

      const battleHero = battleStore.heroes[0]

      expect(battleHero.stats.atk).toBe(baseStats.atk + 5)
      expect(battleHero.stats.def).toBe(baseStats.def + 3)
      expect(battleHero.stats.hp).toBe(baseStats.hp + 20)
      expect(battleHero.maxHp).toBe(baseStats.hp + 20)
      expect(battleHero.currentHp).toBe(baseStats.hp + 20) // Full HP at battle start
    })

    it('does not apply equipment bonuses to heroes on expedition', () => {
      // Add hero and set them on expedition
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)
      heroesStore.lockHeroToExploration(hero.instanceId, 'some_exploration_node')

      const baseStats = heroesStore.getHeroStats(hero.instanceId)

      // Equip weapon with +5 ATK
      equipmentStore.addEquipment('rusty_shiv', 1)
      equipmentStore.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')

      // Start battle (hero still in party for the test but on expedition)
      // Note: In real game, heroes on expedition wouldn't be in party,
      // but we test the guard logic here
      battleStore.initBattle(null, [])

      const battleHero = battleStore.heroes[0]

      // Stats should NOT include equipment bonuses (hero on expedition)
      expect(battleHero.stats.atk).toBe(baseStats.atk)
    })

    it('heroes without equipment get no bonuses', () => {
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      const baseStats = heroesStore.getHeroStats(hero.instanceId)

      // No equipment equipped
      battleStore.initBattle(null, [])

      const battleHero = battleStore.heroes[0]

      // Stats should be base stats only
      expect(battleHero.stats.atk).toBe(baseStats.atk)
      expect(battleHero.stats.def).toBe(baseStats.def)
      expect(battleHero.stats.hp).toBe(baseStats.hp)
      expect(battleHero.stats.spd).toBe(baseStats.spd)
    })

    it('applies equipment bonuses to maxMp when equipment has mp stat', () => {
      const hero = heroesStore.addHero('ember_witch') // Mage with high MP
      heroesStore.setPartySlot(0, hero.instanceId)

      const baseStats = heroesStore.getHeroStats(hero.instanceId)

      // Equip staff with MP bonus
      equipmentStore.addEquipment('gnarled_branch', 1) // { atk: 4, mp: 5 }
      equipmentStore.equip('ember_witch', 'gnarled_branch', 'special')

      battleStore.initBattle(null, [])

      const battleHero = battleStore.heroes[0]

      expect(battleHero.stats.mp).toBe(baseStats.mp + 5)
      expect(battleHero.maxMp).toBe(baseStats.mp + 5)
    })

    it('preserves existing currentHp from saved state with equipment bonuses', () => {
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      const baseStats = heroesStore.getHeroStats(hero.instanceId)

      // Equip armor with HP bonus
      equipmentStore.addEquipment('scrap_leather', 1) // { def: 3, hp: 20 }
      equipmentStore.equip('aurora_the_dawn', 'scrap_leather', 'armor')

      // Saved state with partial HP
      const partyState = {
        [hero.instanceId]: {
          currentHp: 50,
          currentMp: 20
        }
      }

      battleStore.initBattle(partyState, [])

      const battleHero = battleStore.heroes[0]

      // maxHp should include equipment bonus
      expect(battleHero.maxHp).toBe(baseStats.hp + 20)
      // currentHp should be preserved from saved state
      expect(battleHero.currentHp).toBe(50)
    })

    it('equipment bonuses stack with level scaling', () => {
      // Add a hero and level them up
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.addExp(hero.instanceId, 10000) // Level up significantly
      heroesStore.setPartySlot(0, hero.instanceId)

      const leveledStats = heroesStore.getHeroStats(hero.instanceId)

      // Equip weapon
      equipmentStore.addEquipment('kingslayer', 1) // { atk: 80 }
      equipmentStore.equip('aurora_the_dawn', 'kingslayer', 'weapon')

      battleStore.initBattle(null, [])

      const battleHero = battleStore.heroes[0]

      // Equipment adds flat bonus on top of level-scaled stats
      expect(battleHero.stats.atk).toBe(leveledStats.atk + 80)
    })
  })
})
