import { describe, it, expect } from 'vitest'
import {
  equipment,
  SLOT_TYPES,
  CLASS_SLOTS,
  SLOT_ICONS,
  getEquipment,
  getAllEquipment,
  getEquipmentBySlot,
  getUpgradePath,
  isClassSlot,
  getClassSlotType
} from '../equipment'

describe('SLOT_TYPES constant', () => {
  it('defines all universal slot types', () => {
    expect(SLOT_TYPES.WEAPON).toBe('weapon')
    expect(SLOT_TYPES.ARMOR).toBe('armor')
    expect(SLOT_TYPES.RING).toBe('ring')
    expect(SLOT_TYPES.CLOAK).toBe('cloak')
  })

  it('defines all class-specific slot types', () => {
    expect(SLOT_TYPES.SHIELD).toBe('shield')
    expect(SLOT_TYPES.WAR_TROPHY).toBe('war_trophy')
    expect(SLOT_TYPES.BOW).toBe('bow')
    expect(SLOT_TYPES.STAFF).toBe('staff')
    expect(SLOT_TYPES.HOLY_SYMBOL).toBe('holy_symbol')
    expect(SLOT_TYPES.HOLY_RELIC).toBe('holy_relic')
    expect(SLOT_TYPES.TOTEM).toBe('totem')
    expect(SLOT_TYPES.INSTRUMENT).toBe('instrument')
  })
})

describe('CLASS_SLOTS constant', () => {
  it('maps knight to shield', () => {
    expect(CLASS_SLOTS.knight).toBe('shield')
  })

  it('maps berserker to war_trophy', () => {
    expect(CLASS_SLOTS.berserker).toBe('war_trophy')
  })

  it('maps ranger to bow', () => {
    expect(CLASS_SLOTS.ranger).toBe('bow')
  })

  it('maps mage to staff', () => {
    expect(CLASS_SLOTS.mage).toBe('staff')
  })

  it('maps cleric to holy_symbol', () => {
    expect(CLASS_SLOTS.cleric).toBe('holy_symbol')
  })

  it('maps paladin to holy_relic', () => {
    expect(CLASS_SLOTS.paladin).toBe('holy_relic')
  })

  it('maps druid to totem', () => {
    expect(CLASS_SLOTS.druid).toBe('totem')
  })

  it('maps bard to instrument', () => {
    expect(CLASS_SLOTS.bard).toBe('instrument')
  })
})

describe('SLOT_ICONS constant', () => {
  it('has emoji icons for all slots', () => {
    expect(SLOT_ICONS.weapon).toBeDefined()
    expect(SLOT_ICONS.armor).toBeDefined()
    expect(SLOT_ICONS.ring).toBeDefined()
    expect(SLOT_ICONS.cloak).toBeDefined()
    expect(SLOT_ICONS.shield).toBeDefined()
    expect(SLOT_ICONS.war_trophy).toBeDefined()
    expect(SLOT_ICONS.bow).toBeDefined()
    expect(SLOT_ICONS.staff).toBeDefined()
    expect(SLOT_ICONS.holy_symbol).toBeDefined()
    expect(SLOT_ICONS.holy_relic).toBeDefined()
    expect(SLOT_ICONS.totem).toBeDefined()
    expect(SLOT_ICONS.instrument).toBeDefined()
  })
})

describe('equipment data structure', () => {
  it('has 60 total equipment items', () => {
    const allEquipment = getAllEquipment()
    expect(allEquipment.length).toBe(60)
  })

  it('has 5 items per slot type', () => {
    const slots = ['weapon', 'armor', 'ring', 'cloak', 'shield', 'war_trophy', 'bow', 'staff', 'holy_symbol', 'holy_relic', 'totem', 'instrument']
    slots.forEach(slot => {
      const items = getEquipmentBySlot(slot)
      expect(items.length).toBe(5)
    })
  })

  it('each equipment has required fields', () => {
    const allEquipment = getAllEquipment()
    allEquipment.forEach(item => {
      expect(item.id).toBeDefined()
      expect(item.name).toBeDefined()
      expect(item.slot).toBeDefined()
      expect(item.rarity).toBeGreaterThanOrEqual(1)
      expect(item.rarity).toBeLessThanOrEqual(5)
      expect(item.stats).toBeDefined()
      expect(item).toHaveProperty('effect')
      expect(item).toHaveProperty('upgradesTo')
    })
  })

  it('rarity 5 items have no upgradesTo', () => {
    const allEquipment = getAllEquipment()
    const maxRarity = allEquipment.filter(e => e.rarity === 5)
    maxRarity.forEach(item => {
      expect(item.upgradesTo).toBeNull()
    })
  })

  it('rarity 1-4 items have valid upgradesTo references', () => {
    const allEquipment = getAllEquipment()
    const upgradeable = allEquipment.filter(e => e.rarity < 5)
    upgradeable.forEach(item => {
      expect(item.upgradesTo).not.toBeNull()
      const nextItem = getEquipment(item.upgradesTo)
      expect(nextItem).not.toBeNull()
      expect(nextItem.rarity).toBe(item.rarity + 1)
      expect(nextItem.slot).toBe(item.slot)
    })
  })
})

describe('weapon equipment (5 items)', () => {
  it('has rusty_shiv as rarity 1 weapon', () => {
    const item = getEquipment('rusty_shiv')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('weapon')
    expect(item.rarity).toBe(1)
    expect(item.stats.atk).toBe(5)
    expect(item.upgradesTo).toBe('worn_blade')
  })

  it('has worn_blade as rarity 2 weapon', () => {
    const item = getEquipment('worn_blade')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('weapon')
    expect(item.rarity).toBe(2)
    expect(item.stats.atk).toBe(12)
  })

  it('has steel_falchion as rarity 3 weapon', () => {
    const item = getEquipment('steel_falchion')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('weapon')
    expect(item.rarity).toBe(3)
    expect(item.stats.atk).toBe(25)
  })

  it('has blackiron_cleaver as rarity 4 weapon', () => {
    const item = getEquipment('blackiron_cleaver')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('weapon')
    expect(item.rarity).toBe(4)
    expect(item.stats.atk).toBe(45)
  })

  it('has kingslayer as rarity 5 weapon', () => {
    const item = getEquipment('kingslayer')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('weapon')
    expect(item.rarity).toBe(5)
    expect(item.stats.atk).toBe(80)
    expect(item.upgradesTo).toBeNull()
  })
})

describe('armor equipment (5 items)', () => {
  it('has scrap_leather as rarity 1 armor', () => {
    const item = getEquipment('scrap_leather')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('armor')
    expect(item.rarity).toBe(1)
    expect(item.stats.def).toBeDefined()
    expect(item.stats.hp).toBeDefined()
  })

  it('has studded_hide as rarity 2 armor', () => {
    const item = getEquipment('studded_hide')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('armor')
    expect(item.rarity).toBe(2)
  })

  it('has chain_hauberk as rarity 3 armor', () => {
    const item = getEquipment('chain_hauberk')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('armor')
    expect(item.rarity).toBe(3)
  })

  it('has blackiron_plate as rarity 4 armor', () => {
    const item = getEquipment('blackiron_plate')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('armor')
    expect(item.rarity).toBe(4)
  })

  it('has warlords_mantle as rarity 5 armor', () => {
    const item = getEquipment('warlords_mantle')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('armor')
    expect(item.rarity).toBe(5)
    expect(item.upgradesTo).toBeNull()
  })
})

describe('ring equipment (5 items with effects)', () => {
  it('has cracked_ring as rarity 1 ring', () => {
    const item = getEquipment('cracked_ring')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('ring')
    expect(item.rarity).toBe(1)
  })

  it('has copper_charm as rarity 2 ring with mp_regen effect', () => {
    const item = getEquipment('copper_charm')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('ring')
    expect(item.rarity).toBe(2)
    expect(item.effect).not.toBeNull()
    expect(item.effect.type).toBe('mp_regen')
  })

  it('has silver_locket as rarity 3 ring with hp_regen_percent effect', () => {
    const item = getEquipment('silver_locket')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('ring')
    expect(item.rarity).toBe(3)
    expect(item.effect.type).toBe('hp_regen_percent')
  })

  it('has runed_talisman as rarity 4 ring with crit_chance and evasion effects', () => {
    const item = getEquipment('runed_talisman')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('ring')
    expect(item.rarity).toBe(4)
    expect(item.effect.type).toBe('crit_chance')
    expect(item.effect.value).toBeGreaterThan(0)
  })

  it('has soulshard_ring as rarity 5 ring with low_hp_atk_boost effect', () => {
    const item = getEquipment('soulshard_ring')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('ring')
    expect(item.rarity).toBe(5)
    expect(item.effect.type).toBe('low_hp_atk_boost')
    expect(item.effect.threshold).toBeDefined()
    expect(item.effect.value).toBeDefined()
    expect(item.upgradesTo).toBeNull()
  })
})

describe('cloak equipment (5 items with effects)', () => {
  it('has tattered_shroud as rarity 1 cloak', () => {
    const item = getEquipment('tattered_shroud')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('cloak')
    expect(item.rarity).toBe(1)
    expect(item.stats.spd).toBeDefined()
  })

  it('has travelers_cape as rarity 2 cloak with starting_mp effect', () => {
    const item = getEquipment('travelers_cape')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('cloak')
    expect(item.rarity).toBe(2)
    expect(item.effect).not.toBeNull()
    expect(item.effect.type).toBe('starting_mp')
  })

  it('has woven_mantle as rarity 3 cloak with mp_regen effect', () => {
    const item = getEquipment('woven_mantle')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('cloak')
    expect(item.rarity).toBe(3)
    expect(item.effect.type).toBe('mp_regen')
  })

  it('has spellthiefs_cloak as rarity 4 cloak with starting_resource effect', () => {
    const item = getEquipment('spellthiefs_cloak')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('cloak')
    expect(item.rarity).toBe(4)
    expect(item.effect.type).toBe('starting_resource')
  })

  it('has mantle_of_the_infinite as rarity 5 cloak with mp_boost_and_cost_reduction effect', () => {
    const item = getEquipment('mantle_of_the_infinite')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('cloak')
    expect(item.rarity).toBe(5)
    expect(item.effect.type).toBe('mp_boost_and_cost_reduction')
    expect(item.upgradesTo).toBeNull()
  })
})

describe('shield equipment (Knight class slot)', () => {
  it('has dented_buckler as rarity 1 shield', () => {
    const item = getEquipment('dented_buckler')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('shield')
    expect(item.rarity).toBe(1)
  })

  it('has wooden_kite_shield as rarity 2 shield', () => {
    const item = getEquipment('wooden_kite_shield')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('shield')
    expect(item.rarity).toBe(2)
  })

  it('has iron_heater as rarity 3 shield', () => {
    const item = getEquipment('iron_heater')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('shield')
    expect(item.rarity).toBe(3)
  })

  it('has blackiron_bulwark as rarity 4 shield', () => {
    const item = getEquipment('blackiron_bulwark')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('shield')
    expect(item.rarity).toBe(4)
  })

  it('has unbreakable_aegis as rarity 5 shield with class effect', () => {
    const item = getEquipment('unbreakable_aegis')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('shield')
    expect(item.rarity).toBe(5)
    expect(item.effect).not.toBeNull()
    expect(item.upgradesTo).toBeNull()
  })
})

describe('war_trophy equipment (Berserker class slot)', () => {
  it('has cracked_skull as rarity 1 war_trophy', () => {
    const item = getEquipment('cracked_skull')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('war_trophy')
    expect(item.rarity).toBe(1)
  })

  it('has severed_claw as rarity 2 war_trophy', () => {
    const item = getEquipment('severed_claw')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('war_trophy')
    expect(item.rarity).toBe(2)
  })

  it('has warchiefs_fang as rarity 3 war_trophy', () => {
    const item = getEquipment('warchiefs_fang')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('war_trophy')
    expect(item.rarity).toBe(3)
  })

  it('has demon_horn as rarity 4 war_trophy', () => {
    const item = getEquipment('demon_horn')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('war_trophy')
    expect(item.rarity).toBe(4)
  })

  it('has godslayers_heart as rarity 5 war_trophy with class effect', () => {
    const item = getEquipment('godslayers_heart')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('war_trophy')
    expect(item.rarity).toBe(5)
    expect(item.effect).not.toBeNull()
    expect(item.upgradesTo).toBeNull()
  })
})

describe('bow equipment (Ranger class slot)', () => {
  it('has bent_shortbow as rarity 1 bow', () => {
    const item = getEquipment('bent_shortbow')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('bow')
    expect(item.rarity).toBe(1)
  })

  it('has hunters_longbow as rarity 2 bow', () => {
    const item = getEquipment('hunters_longbow')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('bow')
    expect(item.rarity).toBe(2)
  })

  it('has composite_bow as rarity 3 bow', () => {
    const item = getEquipment('composite_bow')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('bow')
    expect(item.rarity).toBe(3)
  })

  it('has shadowwood_recurve as rarity 4 bow', () => {
    const item = getEquipment('shadowwood_recurve')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('bow')
    expect(item.rarity).toBe(4)
  })

  it('has windriders_arc as rarity 5 bow with class effect', () => {
    const item = getEquipment('windriders_arc')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('bow')
    expect(item.rarity).toBe(5)
    expect(item.effect).not.toBeNull()
    expect(item.upgradesTo).toBeNull()
  })
})

describe('staff equipment (Mage class slot)', () => {
  it('has gnarled_branch as rarity 1 staff', () => {
    const item = getEquipment('gnarled_branch')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('staff')
    expect(item.rarity).toBe(1)
  })

  it('has apprentices_rod as rarity 2 staff', () => {
    const item = getEquipment('apprentices_rod')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('staff')
    expect(item.rarity).toBe(2)
  })

  it('has runed_staff as rarity 3 staff', () => {
    const item = getEquipment('runed_staff')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('staff')
    expect(item.rarity).toBe(3)
  })

  it('has crystalcore_scepter as rarity 4 staff', () => {
    const item = getEquipment('crystalcore_scepter')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('staff')
    expect(item.rarity).toBe(4)
  })

  it('has staff_of_unmaking as rarity 5 staff with class effect', () => {
    const item = getEquipment('staff_of_unmaking')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('staff')
    expect(item.rarity).toBe(5)
    expect(item.effect).not.toBeNull()
    expect(item.upgradesTo).toBeNull()
  })
})

describe('holy_symbol equipment (Cleric class slot)', () => {
  it('has tarnished_pendant as rarity 1 holy_symbol', () => {
    const item = getEquipment('tarnished_pendant')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('holy_symbol')
    expect(item.rarity).toBe(1)
  })

  it('has wooden_icon as rarity 2 holy_symbol', () => {
    const item = getEquipment('wooden_icon')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('holy_symbol')
    expect(item.rarity).toBe(2)
  })

  it('has silver_ankh as rarity 3 holy_symbol', () => {
    const item = getEquipment('silver_ankh')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('holy_symbol')
    expect(item.rarity).toBe(3)
  })

  it('has blessed_reliquary as rarity 4 holy_symbol', () => {
    const item = getEquipment('blessed_reliquary')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('holy_symbol')
    expect(item.rarity).toBe(4)
  })

  it('has martyrs_tear as rarity 5 holy_symbol with class effect', () => {
    const item = getEquipment('martyrs_tear')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('holy_symbol')
    expect(item.rarity).toBe(5)
    expect(item.effect).not.toBeNull()
    expect(item.upgradesTo).toBeNull()
  })
})

describe('holy_relic equipment (Paladin class slot)', () => {
  it('has faded_prayer_beads as rarity 1 holy_relic', () => {
    const item = getEquipment('faded_prayer_beads')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('holy_relic')
    expect(item.rarity).toBe(1)
  })

  it('has pilgrims_token as rarity 2 holy_relic', () => {
    const item = getEquipment('pilgrims_token')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('holy_relic')
    expect(item.rarity).toBe(2)
  })

  it('has sanctified_censer as rarity 3 holy_relic', () => {
    const item = getEquipment('sanctified_censer')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('holy_relic')
    expect(item.rarity).toBe(3)
  })

  it('has radiant_chalice as rarity 4 holy_relic', () => {
    const item = getEquipment('radiant_chalice')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('holy_relic')
    expect(item.rarity).toBe(4)
  })

  it('has shard_of_the_divine as rarity 5 holy_relic with class effect', () => {
    const item = getEquipment('shard_of_the_divine')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('holy_relic')
    expect(item.rarity).toBe(5)
    expect(item.effect).not.toBeNull()
    expect(item.upgradesTo).toBeNull()
  })
})

describe('totem equipment (Druid class slot)', () => {
  it('has chipped_antler as rarity 1 totem', () => {
    const item = getEquipment('chipped_antler')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('totem')
    expect(item.rarity).toBe(1)
  })

  it('has carved_bone as rarity 2 totem', () => {
    const item = getEquipment('carved_bone')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('totem')
    expect(item.rarity).toBe(2)
  })

  it('has spiritwood_fetish as rarity 3 totem', () => {
    const item = getEquipment('spiritwood_fetish')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('totem')
    expect(item.rarity).toBe(3)
  })

  it('has beastlords_effigy as rarity 4 totem', () => {
    const item = getEquipment('beastlords_effigy')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('totem')
    expect(item.rarity).toBe(4)
  })

  it('has heart_of_the_wild as rarity 5 totem with class effect', () => {
    const item = getEquipment('heart_of_the_wild')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('totem')
    expect(item.rarity).toBe(5)
    expect(item.effect).not.toBeNull()
    expect(item.upgradesTo).toBeNull()
  })
})

describe('instrument equipment (Bard class slot)', () => {
  it('has cracked_whistle as rarity 1 instrument', () => {
    const item = getEquipment('cracked_whistle')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('instrument')
    expect(item.rarity).toBe(1)
  })

  it('has worn_lute as rarity 2 instrument', () => {
    const item = getEquipment('worn_lute')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('instrument')
    expect(item.rarity).toBe(2)
  })

  it('has silver_flute as rarity 3 instrument', () => {
    const item = getEquipment('silver_flute')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('instrument')
    expect(item.rarity).toBe(3)
  })

  it('has enchanted_harp as rarity 4 instrument', () => {
    const item = getEquipment('enchanted_harp')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('instrument')
    expect(item.rarity).toBe(4)
  })

  it('has voicesteal_violin as rarity 5 instrument with class effect', () => {
    const item = getEquipment('voicesteal_violin')
    expect(item).not.toBeNull()
    expect(item.slot).toBe('instrument')
    expect(item.rarity).toBe(5)
    expect(item.effect).not.toBeNull()
    expect(item.upgradesTo).toBeNull()
  })
})

describe('getEquipment function', () => {
  it('returns equipment by id', () => {
    const item = getEquipment('rusty_shiv')
    expect(item).not.toBeNull()
    expect(item.id).toBe('rusty_shiv')
  })

  it('returns null for unknown id', () => {
    const item = getEquipment('nonexistent_item')
    expect(item).toBeNull()
  })
})

describe('getAllEquipment function', () => {
  it('returns array of all equipment', () => {
    const all = getAllEquipment()
    expect(Array.isArray(all)).toBe(true)
    expect(all.length).toBe(60)
  })
})

describe('getEquipmentBySlot function', () => {
  it('returns all equipment for a slot', () => {
    const weapons = getEquipmentBySlot('weapon')
    expect(weapons.length).toBe(5)
    weapons.forEach(w => expect(w.slot).toBe('weapon'))
  })

  it('returns empty array for unknown slot', () => {
    const unknown = getEquipmentBySlot('nonexistent_slot')
    expect(unknown).toEqual([])
  })
})

describe('getUpgradePath function', () => {
  it('returns full upgrade path from rarity 1 weapon', () => {
    const path = getUpgradePath('rusty_shiv')
    expect(path.length).toBe(5)
    expect(path[0].id).toBe('rusty_shiv')
    expect(path[1].id).toBe('worn_blade')
    expect(path[2].id).toBe('steel_falchion')
    expect(path[3].id).toBe('blackiron_cleaver')
    expect(path[4].id).toBe('kingslayer')
  })

  it('returns partial path from mid-tier item', () => {
    const path = getUpgradePath('steel_falchion')
    expect(path.length).toBe(3)
    expect(path[0].id).toBe('steel_falchion')
    expect(path[2].id).toBe('kingslayer')
  })

  it('returns single item for max rarity', () => {
    const path = getUpgradePath('kingslayer')
    expect(path.length).toBe(1)
    expect(path[0].id).toBe('kingslayer')
  })

  it('returns empty array for unknown id', () => {
    const path = getUpgradePath('nonexistent')
    expect(path).toEqual([])
  })
})

describe('isClassSlot function', () => {
  it('returns true for class-specific slots', () => {
    expect(isClassSlot('shield')).toBe(true)
    expect(isClassSlot('war_trophy')).toBe(true)
    expect(isClassSlot('bow')).toBe(true)
    expect(isClassSlot('staff')).toBe(true)
    expect(isClassSlot('holy_symbol')).toBe(true)
    expect(isClassSlot('holy_relic')).toBe(true)
    expect(isClassSlot('totem')).toBe(true)
    expect(isClassSlot('instrument')).toBe(true)
  })

  it('returns false for universal slots', () => {
    expect(isClassSlot('weapon')).toBe(false)
    expect(isClassSlot('armor')).toBe(false)
    expect(isClassSlot('ring')).toBe(false)
    expect(isClassSlot('cloak')).toBe(false)
  })
})

describe('getClassSlotType function', () => {
  it('returns shield for knight', () => {
    expect(getClassSlotType('knight')).toBe('shield')
  })

  it('returns war_trophy for berserker', () => {
    expect(getClassSlotType('berserker')).toBe('war_trophy')
  })

  it('returns bow for ranger', () => {
    expect(getClassSlotType('ranger')).toBe('bow')
  })

  it('returns staff for mage', () => {
    expect(getClassSlotType('mage')).toBe('staff')
  })

  it('returns holy_symbol for cleric', () => {
    expect(getClassSlotType('cleric')).toBe('holy_symbol')
  })

  it('returns holy_relic for paladin', () => {
    expect(getClassSlotType('paladin')).toBe('holy_relic')
  })

  it('returns totem for druid', () => {
    expect(getClassSlotType('druid')).toBe('totem')
  })

  it('returns instrument for bard', () => {
    expect(getClassSlotType('bard')).toBe('instrument')
  })

  it('returns null for unknown class', () => {
    expect(getClassSlotType('unknown')).toBeNull()
  })
})
