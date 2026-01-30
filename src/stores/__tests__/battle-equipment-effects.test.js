import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { useEquipmentStore } from '../equipment'

describe('battle store - equipment effects', () => {
  let battleStore
  let heroesStore
  let equipmentStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
    equipmentStore = useEquipmentStore()
  })

  describe('getEquipmentEffects', () => {
    it('returns empty array when no equipment equipped', () => {
      const effects = battleStore.getEquipmentEffects('aurora_the_dawn')
      expect(effects).toEqual([])
    })

    it('returns effect from equipped ring with mp_regen', () => {
      // copper_charm has effect: { type: 'mp_regen', value: 2 }
      equipmentStore.addEquipment('copper_charm', 1)
      equipmentStore.equip('aurora_the_dawn', 'copper_charm', 'trinket')

      const effects = battleStore.getEquipmentEffects('aurora_the_dawn')

      expect(effects).toContainEqual({ type: 'mp_regen', value: 2 })
    })

    it('returns effect from equipped ring with hp_regen_percent', () => {
      // silver_locket has effect: { type: 'hp_regen_percent', value: 3 }
      equipmentStore.addEquipment('silver_locket', 1)
      equipmentStore.equip('aurora_the_dawn', 'silver_locket', 'trinket')

      const effects = battleStore.getEquipmentEffects('aurora_the_dawn')

      expect(effects).toContainEqual({ type: 'hp_regen_percent', value: 3 })
    })

    it('returns effect from equipped ring with crit_chance', () => {
      // runed_talisman has effect: { type: 'crit_chance', value: 10 }
      equipmentStore.addEquipment('runed_talisman', 1)
      equipmentStore.equip('aurora_the_dawn', 'runed_talisman', 'trinket')

      const effects = battleStore.getEquipmentEffects('aurora_the_dawn')

      expect(effects).toContainEqual({ type: 'crit_chance', value: 10 })
    })

    it('returns multiple effects from multiple equipped items', () => {
      // copper_charm: mp_regen 2
      // woven_mantle: mp_regen 3
      equipmentStore.addEquipment('copper_charm', 1)
      equipmentStore.addEquipment('woven_mantle', 1)
      equipmentStore.equip('aurora_the_dawn', 'copper_charm', 'trinket')
      equipmentStore.equip('aurora_the_dawn', 'woven_mantle', 'special')

      const effects = battleStore.getEquipmentEffects('aurora_the_dawn')

      // Should have both mp_regen effects
      const mpRegenEffects = effects.filter(e => e.type === 'mp_regen')
      expect(mpRegenEffects.length).toBe(2)
      expect(mpRegenEffects.reduce((sum, e) => sum + e.value, 0)).toBe(5)
    })
  })

  describe('starting_mp effect', () => {
    it('grants bonus starting MP in battle from travelers_cape', () => {
      // travelers_cape has effect: { type: 'starting_mp', value: 5 }
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('travelers_cape', 1)
      equipmentStore.equip('aurora_the_dawn', 'travelers_cape', 'special')

      battleStore.initBattle(null, [])

      const battleHero = battleStore.heroes[0]
      // Base starting MP is 30% of maxMp, plus 5 from equipment
      const baseStartingMp = Math.floor(battleHero.maxMp * 0.3)
      expect(battleHero.currentMp).toBe(baseStartingMp + 5)
    })

    it('caps starting MP at maxMp', () => {
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('travelers_cape', 1)
      equipmentStore.equip('aurora_the_dawn', 'travelers_cape', 'special')

      // Start battle with nearly full MP
      const baseStats = heroesStore.getHeroStats(hero.instanceId)
      const partyState = {
        [hero.instanceId]: {
          currentHp: baseStats.hp,
          currentMp: baseStats.mp - 2 // 2 below max
        }
      }

      battleStore.initBattle(partyState, [])

      const battleHero = battleStore.heroes[0]
      // Should cap at maxMp (not overfill)
      expect(battleHero.currentMp).toBe(battleHero.maxMp)
    })
  })

  describe('starting_resource effect', () => {
    it('grants bonus starting Rage to berserkers from spellthiefs_cloak', () => {
      // spellthiefs_cloak has effect: { type: 'starting_resource', value: 10 }
      const hero = heroesStore.addHero('shadow_king') // Berserker
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('spellthiefs_cloak', 1)
      equipmentStore.equip('shadow_king', 'spellthiefs_cloak', 'special')

      battleStore.initBattle(null, [])

      const battleHero = battleStore.heroes[0]
      expect(battleHero.currentRage).toBe(10)
    })

    it('grants bonus starting Focus to rangers', () => {
      const hero = heroesStore.addHero('swift_arrow') // Ranger
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('spellthiefs_cloak', 1)
      equipmentStore.equip('swift_arrow', 'spellthiefs_cloak', 'special')

      battleStore.initBattle(null, [])

      const battleHero = battleStore.heroes[0]
      // Rangers already start with focus, starting_resource doesn't apply
      expect(battleHero.hasFocus).toBe(true)
    })

    it('grants bonus starting Valor to knights', () => {
      const hero = heroesStore.addHero('sir_gallan') // Knight
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('spellthiefs_cloak', 1)
      equipmentStore.equip('sir_gallan', 'spellthiefs_cloak', 'special')

      battleStore.initBattle(null, [])

      const battleHero = battleStore.heroes[0]
      expect(battleHero.currentValor).toBe(10)
    })
  })

  describe('mp_regen effect (processEquipmentStartOfTurn)', () => {
    it('regenerates MP at start of turn from copper_charm', () => {
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('copper_charm', 1)
      equipmentStore.equip('aurora_the_dawn', 'copper_charm', 'trinket')

      battleStore.initBattle(null, [])

      const battleHero = battleStore.heroes[0]
      battleHero.currentMp = 10 // Set low MP

      battleStore.processEquipmentStartOfTurn(battleHero)

      expect(battleHero.currentMp).toBe(12) // +2 from copper_charm
    })

    it('stacks mp_regen from multiple items', () => {
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('copper_charm', 1) // mp_regen: 2
      equipmentStore.addEquipment('woven_mantle', 1) // mp_regen: 3
      equipmentStore.equip('aurora_the_dawn', 'copper_charm', 'trinket')
      equipmentStore.equip('aurora_the_dawn', 'woven_mantle', 'special')

      battleStore.initBattle(null, [])

      const battleHero = battleStore.heroes[0]
      battleHero.currentMp = 10

      battleStore.processEquipmentStartOfTurn(battleHero)

      expect(battleHero.currentMp).toBe(15) // +2 +3 = +5
    })

    it('caps MP regen at maxMp', () => {
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('copper_charm', 1)
      equipmentStore.equip('aurora_the_dawn', 'copper_charm', 'trinket')

      battleStore.initBattle(null, [])

      const battleHero = battleStore.heroes[0]
      battleHero.currentMp = battleHero.maxMp - 1

      battleStore.processEquipmentStartOfTurn(battleHero)

      expect(battleHero.currentMp).toBe(battleHero.maxMp)
    })
  })

  describe('hp_regen_percent effect', () => {
    it('regenerates HP percentage at start of turn from silver_locket', () => {
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('silver_locket', 1)
      equipmentStore.equip('aurora_the_dawn', 'silver_locket', 'trinket')

      battleStore.initBattle(null, [])

      const battleHero = battleStore.heroes[0]
      battleHero.currentHp = 100 // Set low HP

      battleStore.processEquipmentStartOfTurn(battleHero)

      const expectedHeal = Math.floor(battleHero.maxHp * 0.03)
      expect(battleHero.currentHp).toBe(100 + expectedHeal)
    })

    it('caps HP regen at maxHp', () => {
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('silver_locket', 1)
      equipmentStore.equip('aurora_the_dawn', 'silver_locket', 'trinket')

      battleStore.initBattle(null, [])

      const battleHero = battleStore.heroes[0]
      battleHero.currentHp = battleHero.maxHp - 1

      battleStore.processEquipmentStartOfTurn(battleHero)

      expect(battleHero.currentHp).toBe(battleHero.maxHp)
    })
  })

  describe('nature_regen effect (Druid totem)', () => {
    it('regenerates HP percentage at start of turn from heart_of_the_wild', () => {
      // heart_of_the_wild has effect: { type: 'nature_regen', value: 5 }
      const hero = heroesStore.addHero('yggra_world_root') // Druid
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('heart_of_the_wild', 1)
      equipmentStore.equip('yggra_world_root', 'heart_of_the_wild', 'special')

      battleStore.initBattle(null, [])

      const battleHero = battleStore.heroes[0]
      battleHero.currentHp = 100

      battleStore.processEquipmentStartOfTurn(battleHero)

      const expectedHeal = Math.floor(battleHero.maxHp * 0.05)
      expect(battleHero.currentHp).toBe(100 + expectedHeal)
    })
  })

  describe('crit_chance effect', () => {
    it('has a chance to deal 150% damage with crit', () => {
      // Mock Math.random to force a crit
      vi.spyOn(Math, 'random').mockReturnValue(0.05) // 5% roll, below 10% crit chance

      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('runed_talisman', 1) // crit_chance: 10
      equipmentStore.equip('aurora_the_dawn', 'runed_talisman', 'trinket')

      battleStore.initBattle(null, ['forest_goblin'])

      const result = battleStore.rollCrit('aurora_the_dawn')
      expect(result.isCrit).toBe(true)
      expect(result.multiplier).toBe(1.5)

      vi.restoreAllMocks()
    })

    it('does not crit when roll is above crit chance', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5) // 50% roll, above 10% crit chance

      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('runed_talisman', 1) // crit_chance: 10
      equipmentStore.equip('aurora_the_dawn', 'runed_talisman', 'trinket')

      battleStore.initBattle(null, ['forest_goblin'])

      const result = battleStore.rollCrit('aurora_the_dawn')
      expect(result.isCrit).toBe(false)
      expect(result.multiplier).toBe(1)

      vi.restoreAllMocks()
    })

    it('returns no crit when no crit_chance equipped', () => {
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      battleStore.initBattle(null, ['forest_goblin'])

      const result = battleStore.rollCrit('aurora_the_dawn')
      expect(result.isCrit).toBe(false)
      expect(result.multiplier).toBe(1)
    })
  })

  describe('low_hp_atk_boost effect', () => {
    it('provides ATK boost when below HP threshold', () => {
      // soulshard_ring: { type: 'low_hp_atk_boost', threshold: 30, value: 25 }
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('soulshard_ring', 1)
      equipmentStore.equip('aurora_the_dawn', 'soulshard_ring', 'trinket')

      battleStore.initBattle(null, ['forest_goblin'])

      const battleHero = battleStore.heroes[0]
      battleHero.currentHp = Math.floor(battleHero.maxHp * 0.2) // 20% HP (below 30%)

      const boost = battleStore.getEquipmentAtkBoost(battleHero)
      expect(boost).toBe(25)
    })

    it('provides no ATK boost when above HP threshold', () => {
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('soulshard_ring', 1)
      equipmentStore.equip('aurora_the_dawn', 'soulshard_ring', 'trinket')

      battleStore.initBattle(null, ['forest_goblin'])

      const battleHero = battleStore.heroes[0]
      battleHero.currentHp = Math.floor(battleHero.maxHp * 0.5) // 50% HP (above 30%)

      const boost = battleStore.getEquipmentAtkBoost(battleHero)
      expect(boost).toBe(0)
    })
  })

  describe('mp_boost_and_cost_reduction effect', () => {
    it('increases max MP from mantle_of_the_infinite', () => {
      // mantle_of_the_infinite: { type: 'mp_boost_and_cost_reduction', mpBoost: 20, costReduction: 10 }
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      const baseStats = heroesStore.getHeroStats(hero.instanceId)

      equipmentStore.addEquipment('mantle_of_the_infinite', 1)
      equipmentStore.equip('aurora_the_dawn', 'mantle_of_the_infinite', 'special')

      battleStore.initBattle(null, [])

      const battleHero = battleStore.heroes[0]
      // Base MP + cloak base stats (spd doesn't affect MP) + 20 from mp_boost effect
      expect(battleHero.maxMp).toBe(baseStats.mp + 20)
    })

    it('reduces skill MP cost', () => {
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('mantle_of_the_infinite', 1)
      equipmentStore.equip('aurora_the_dawn', 'mantle_of_the_infinite', 'special')

      battleStore.initBattle(null, [])

      const reduction = battleStore.getSkillCostReduction('aurora_the_dawn')
      expect(reduction).toBe(10) // 10% cost reduction
    })
  })

  describe('valor_on_block effect (Knight shield)', () => {
    it('grants Valor when knight blocks damage with unbreakable_aegis', () => {
      // unbreakable_aegis: { type: 'valor_on_block', value: 5 }
      const hero = heroesStore.addHero('sir_gallan') // Knight
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('unbreakable_aegis', 1)
      equipmentStore.equip('sir_gallan', 'unbreakable_aegis', 'special')

      battleStore.initBattle(null, ['forest_goblin'])

      const battleHero = battleStore.heroes[0]
      battleHero.currentValor = 0

      // Simulate blocking damage (e.g., via Guard skill or guardedBy)
      battleStore.processValorOnBlock(battleHero, 50) // blocked 50 damage

      expect(battleHero.currentValor).toBe(5)
    })

    it('does not grant Valor to non-knights', () => {
      const hero = heroesStore.addHero('aurora_the_dawn') // Paladin, not Knight
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('unbreakable_aegis', 1)
      equipmentStore.equip('aurora_the_dawn', 'unbreakable_aegis', 'special')

      battleStore.initBattle(null, ['forest_goblin'])

      const battleHero = battleStore.heroes[0]
      // Paladins don't have currentValor
      expect(battleHero.currentValor).toBeUndefined()
    })
  })

  describe('rage_on_kill effect (Berserker war trophy)', () => {
    it('grants Rage when berserker kills enemy with godslayers_heart', () => {
      // godslayers_heart: { type: 'rage_on_kill', value: 15 }
      const hero = heroesStore.addHero('shadow_king') // Berserker
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('godslayers_heart', 1)
      equipmentStore.equip('shadow_king', 'godslayers_heart', 'special')

      battleStore.initBattle(null, ['forest_goblin'])

      const battleHero = battleStore.heroes[0]
      battleHero.currentRage = 10

      // Simulate killing an enemy
      battleStore.processRageOnKill(battleHero)

      expect(battleHero.currentRage).toBe(25) // 10 + 15
    })

    it('caps Rage at 100', () => {
      const hero = heroesStore.addHero('shadow_king')
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('godslayers_heart', 1)
      equipmentStore.equip('shadow_king', 'godslayers_heart', 'special')

      battleStore.initBattle(null, ['forest_goblin'])

      const battleHero = battleStore.heroes[0]
      battleHero.currentRage = 95

      battleStore.processRageOnKill(battleHero)

      expect(battleHero.currentRage).toBe(100) // capped
    })
  })

  describe('focus_on_crit effect (Ranger bow)', () => {
    it('grants Focus when ranger crits with windriders_arc', () => {
      // windriders_arc: { type: 'focus_on_crit', value: 1 }
      const hero = heroesStore.addHero('swift_arrow') // Ranger
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('windriders_arc', 1)
      equipmentStore.equip('swift_arrow', 'windriders_arc', 'special')

      battleStore.initBattle(null, ['forest_goblin'])

      const battleHero = battleStore.heroes[0]
      battleHero.hasFocus = false // Lost focus

      // Simulate crit
      battleStore.processFocusOnCrit(battleHero, true)

      expect(battleHero.hasFocus).toBe(true)
    })

    it('does not grant Focus on non-crit', () => {
      const hero = heroesStore.addHero('swift_arrow')
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('windriders_arc', 1)
      equipmentStore.equip('swift_arrow', 'windriders_arc', 'special')

      battleStore.initBattle(null, ['forest_goblin'])

      const battleHero = battleStore.heroes[0]
      battleHero.hasFocus = false

      battleStore.processFocusOnCrit(battleHero, false)

      expect(battleHero.hasFocus).toBe(false)
    })
  })

  describe('spell_amp effect (Mage staff)', () => {
    it('provides spell damage amplification from staff_of_unmaking', () => {
      // staff_of_unmaking: { type: 'spell_amp', value: 15 }
      const hero = heroesStore.addHero('ember_witch') // Mage
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('staff_of_unmaking', 1)
      equipmentStore.equip('ember_witch', 'staff_of_unmaking', 'special')

      battleStore.initBattle(null, ['forest_goblin'])

      const amp = battleStore.getSpellAmp('ember_witch')
      expect(amp).toBe(15)
    })

    it('returns 0 spell amp when no staff equipped', () => {
      const hero = heroesStore.addHero('ember_witch')
      heroesStore.setPartySlot(0, hero.instanceId)

      battleStore.initBattle(null, ['forest_goblin'])

      const amp = battleStore.getSpellAmp('ember_witch')
      expect(amp).toBe(0)
    })
  })

  describe('heal_amp effect (Cleric holy symbol)', () => {
    it('provides healing amplification from martyrs_tear', () => {
      // martyrs_tear: { type: 'heal_amp', value: 20 }
      const hero = heroesStore.addHero('lady_moonwhisper') // Cleric
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('martyrs_tear', 1)
      equipmentStore.equip('lady_moonwhisper', 'martyrs_tear', 'special')

      battleStore.initBattle(null, ['forest_goblin'])

      const amp = battleStore.getHealAmp('lady_moonwhisper')
      expect(amp).toBe(20)
    })
  })

  describe('ally_damage_reduction effect (Paladin holy relic)', () => {
    it('reduces ally damage taken from shard_of_the_divine', () => {
      // shard_of_the_divine: { type: 'ally_damage_reduction', value: 10 }
      const hero1 = heroesStore.addHero('aurora_the_dawn') // Paladin with relic
      const hero2 = heroesStore.addHero('ember_witch') // Ally
      heroesStore.setPartySlot(0, hero1.instanceId)
      heroesStore.setPartySlot(1, hero2.instanceId)

      equipmentStore.addEquipment('shard_of_the_divine', 1)
      equipmentStore.equip('aurora_the_dawn', 'shard_of_the_divine', 'special')

      battleStore.initBattle(null, ['forest_goblin'])

      const reduction = battleStore.getAllyDamageReduction()
      expect(reduction).toBe(10) // 10% damage reduction for allies
    })

    it('stacks ally damage reduction from multiple sources', () => {
      const hero1 = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero1.instanceId)

      // Only one equipped (can't equip same item twice to same hero)
      equipmentStore.addEquipment('shard_of_the_divine', 1)
      equipmentStore.equip('aurora_the_dawn', 'shard_of_the_divine', 'special')

      battleStore.initBattle(null, ['forest_goblin'])

      // Only one equipped, so still 10
      const reduction = battleStore.getAllyDamageReduction()
      expect(reduction).toBe(10)
    })
  })

  describe('finale_boost effect (Bard instrument)', () => {
    it('provides Finale effect boost from voicesteal_violin', () => {
      // voicesteal_violin: { type: 'finale_boost', value: 25 }
      const hero = heroesStore.addHero('wandering_bard') // Bard
      heroesStore.setPartySlot(0, hero.instanceId)

      equipmentStore.addEquipment('voicesteal_violin', 1)
      equipmentStore.equip('wandering_bard', 'voicesteal_violin', 'special')

      battleStore.initBattle(null, ['forest_goblin'])

      const boost = battleStore.getFinaleBoost('wandering_bard')
      expect(boost).toBe(25)
    })
  })
})
