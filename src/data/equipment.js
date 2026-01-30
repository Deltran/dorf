// src/data/equipment.js
// Equipment definitions for heroes - 60 items across 12 slot types

export const SLOT_TYPES = {
  // Universal slots (all classes)
  WEAPON: 'weapon',
  ARMOR: 'armor',
  RING: 'ring',
  CLOAK: 'cloak',
  // Class-specific slots
  SHIELD: 'shield',           // Knight
  WAR_TROPHY: 'war_trophy',   // Berserker
  BOW: 'bow',                 // Ranger
  STAFF: 'staff',             // Mage
  HOLY_SYMBOL: 'holy_symbol', // Cleric
  HOLY_RELIC: 'holy_relic',   // Paladin
  TOTEM: 'totem',             // Druid
  INSTRUMENT: 'instrument'    // Bard
}

export const CLASS_SLOTS = {
  knight: 'shield',
  berserker: 'war_trophy',
  ranger: 'bow',
  mage: 'staff',
  cleric: 'holy_symbol',
  paladin: 'holy_relic',
  druid: 'totem',
  bard: 'instrument'
}

export const SLOT_ICONS = {
  weapon: '🗡️',
  armor: '🛡️',
  ring: '💍',
  cloak: '🧥',
  shield: '🛡️',
  war_trophy: '💀',
  bow: '🏹',
  staff: '🪄',
  holy_symbol: '✝️',
  holy_relic: '⭐',
  totem: '🦴',
  instrument: '🎵'
}

// Equipment data object - keyed by id for fast lookup
export const equipment = {
  // ===== WEAPONS (Universal) =====
  // ATK scaling: 5, 12, 25, 45, 80
  rusty_shiv: {
    id: 'rusty_shiv',
    name: 'Rusty Shiv',
    slot: 'weapon',
    rarity: 1,
    stats: { atk: 5 },
    effect: null,
    upgradesTo: 'worn_blade'
  },
  worn_blade: {
    id: 'worn_blade',
    name: 'Worn Blade',
    slot: 'weapon',
    rarity: 2,
    stats: { atk: 12 },
    effect: null,
    upgradesTo: 'steel_falchion'
  },
  steel_falchion: {
    id: 'steel_falchion',
    name: 'Steel Falchion',
    slot: 'weapon',
    rarity: 3,
    stats: { atk: 25 },
    effect: null,
    upgradesTo: 'blackiron_cleaver'
  },
  blackiron_cleaver: {
    id: 'blackiron_cleaver',
    name: 'Blackiron Cleaver',
    slot: 'weapon',
    rarity: 4,
    stats: { atk: 45 },
    effect: null,
    upgradesTo: 'kingslayer'
  },
  kingslayer: {
    id: 'kingslayer',
    name: 'Kingslayer',
    slot: 'weapon',
    rarity: 5,
    stats: { atk: 80 },
    effect: null,
    upgradesTo: null
  },

  // ===== ARMOR (Universal) =====
  // DEF + HP scaling
  scrap_leather: {
    id: 'scrap_leather',
    name: 'Scrap Leather',
    slot: 'armor',
    rarity: 1,
    stats: { def: 3, hp: 20 },
    effect: null,
    upgradesTo: 'studded_hide'
  },
  studded_hide: {
    id: 'studded_hide',
    name: 'Studded Hide',
    slot: 'armor',
    rarity: 2,
    stats: { def: 8, hp: 50 },
    effect: null,
    upgradesTo: 'chain_hauberk'
  },
  chain_hauberk: {
    id: 'chain_hauberk',
    name: 'Chain Hauberk',
    slot: 'armor',
    rarity: 3,
    stats: { def: 15, hp: 100 },
    effect: null,
    upgradesTo: 'blackiron_plate'
  },
  blackiron_plate: {
    id: 'blackiron_plate',
    name: 'Blackiron Plate',
    slot: 'armor',
    rarity: 4,
    stats: { def: 28, hp: 180 },
    effect: null,
    upgradesTo: 'warlords_mantle'
  },
  warlords_mantle: {
    id: 'warlords_mantle',
    name: "Warlord's Mantle",
    slot: 'armor',
    rarity: 5,
    stats: { def: 50, hp: 300 },
    effect: null,
    upgradesTo: null
  },

  // ===== RINGS (Universal) =====
  // ATK + DEF with effects at higher tiers
  cracked_ring: {
    id: 'cracked_ring',
    name: 'Cracked Ring',
    slot: 'ring',
    rarity: 1,
    stats: { atk: 2, def: 2 },
    effect: null,
    upgradesTo: 'copper_charm'
  },
  copper_charm: {
    id: 'copper_charm',
    name: 'Copper Charm',
    slot: 'ring',
    rarity: 2,
    stats: { atk: 5, def: 5 },
    effect: { type: 'mp_regen', value: 2 }, // +2 MP per turn
    upgradesTo: 'silver_locket'
  },
  silver_locket: {
    id: 'silver_locket',
    name: 'Silver Locket',
    slot: 'ring',
    rarity: 3,
    stats: { atk: 10, def: 10 },
    effect: { type: 'hp_regen_percent', value: 3 }, // 3% max HP per turn
    upgradesTo: 'runed_talisman'
  },
  runed_talisman: {
    id: 'runed_talisman',
    name: 'Runed Talisman',
    slot: 'ring',
    rarity: 4,
    stats: { atk: 18, def: 18 },
    effect: { type: 'crit_chance', value: 10 }, // +10% crit chance
    upgradesTo: 'soulshard_ring'
  },
  soulshard_ring: {
    id: 'soulshard_ring',
    name: 'Soulshard Ring',
    slot: 'ring',
    rarity: 5,
    stats: { atk: 30, def: 30 },
    effect: { type: 'low_hp_atk_boost', threshold: 30, value: 25 }, // +25% ATK when below 30% HP
    upgradesTo: null
  },

  // ===== CLOAKS (Universal) =====
  // SPD with effects at higher tiers
  tattered_shroud: {
    id: 'tattered_shroud',
    name: 'Tattered Shroud',
    slot: 'cloak',
    rarity: 1,
    stats: { spd: 3 },
    effect: null,
    upgradesTo: 'travelers_cape'
  },
  travelers_cape: {
    id: 'travelers_cape',
    name: "Traveler's Cape",
    slot: 'cloak',
    rarity: 2,
    stats: { spd: 6 },
    effect: { type: 'starting_mp', value: 5 }, // Start battle with +5 MP
    upgradesTo: 'woven_mantle'
  },
  woven_mantle: {
    id: 'woven_mantle',
    name: 'Woven Mantle',
    slot: 'cloak',
    rarity: 3,
    stats: { spd: 12 },
    effect: { type: 'mp_regen', value: 3 }, // +3 MP per turn
    upgradesTo: 'spellthiefs_cloak'
  },
  spellthiefs_cloak: {
    id: 'spellthiefs_cloak',
    name: "Spellthief's Cloak",
    slot: 'cloak',
    rarity: 4,
    stats: { spd: 20 },
    effect: { type: 'starting_resource', value: 10 }, // Start with +10% class resource
    upgradesTo: 'mantle_of_the_infinite'
  },
  mantle_of_the_infinite: {
    id: 'mantle_of_the_infinite',
    name: 'Mantle of the Infinite',
    slot: 'cloak',
    rarity: 5,
    stats: { spd: 35 },
    effect: { type: 'mp_boost_and_cost_reduction', mpBoost: 20, costReduction: 10 }, // +20 max MP, -10% skill cost
    upgradesTo: null
  },

  // ===== SHIELDS (Knight) =====
  dented_buckler: {
    id: 'dented_buckler',
    name: 'Dented Buckler',
    slot: 'shield',
    rarity: 1,
    stats: { def: 4, hp: 15 },
    effect: null,
    upgradesTo: 'wooden_kite_shield'
  },
  wooden_kite_shield: {
    id: 'wooden_kite_shield',
    name: 'Wooden Kite Shield',
    slot: 'shield',
    rarity: 2,
    stats: { def: 10, hp: 35 },
    effect: null,
    upgradesTo: 'iron_heater'
  },
  iron_heater: {
    id: 'iron_heater',
    name: 'Iron Heater',
    slot: 'shield',
    rarity: 3,
    stats: { def: 18, hp: 70 },
    effect: null,
    upgradesTo: 'blackiron_bulwark'
  },
  blackiron_bulwark: {
    id: 'blackiron_bulwark',
    name: 'Blackiron Bulwark',
    slot: 'shield',
    rarity: 4,
    stats: { def: 32, hp: 120 },
    effect: null,
    upgradesTo: 'unbreakable_aegis'
  },
  unbreakable_aegis: {
    id: 'unbreakable_aegis',
    name: 'Unbreakable Aegis',
    slot: 'shield',
    rarity: 5,
    stats: { def: 55, hp: 200 },
    effect: { type: 'valor_on_block', value: 5 }, // Gain 5 Valor when blocking damage
    upgradesTo: null
  },

  // ===== WAR TROPHIES (Berserker) =====
  cracked_skull: {
    id: 'cracked_skull',
    name: 'Cracked Skull',
    slot: 'war_trophy',
    rarity: 1,
    stats: { atk: 3, hp: 10 },
    effect: null,
    upgradesTo: 'severed_claw'
  },
  severed_claw: {
    id: 'severed_claw',
    name: 'Severed Claw',
    slot: 'war_trophy',
    rarity: 2,
    stats: { atk: 8, hp: 25 },
    effect: null,
    upgradesTo: 'warchiefs_fang'
  },
  warchiefs_fang: {
    id: 'warchiefs_fang',
    name: "Warchief's Fang",
    slot: 'war_trophy',
    rarity: 3,
    stats: { atk: 15, hp: 50 },
    effect: null,
    upgradesTo: 'demon_horn'
  },
  demon_horn: {
    id: 'demon_horn',
    name: 'Demon Horn',
    slot: 'war_trophy',
    rarity: 4,
    stats: { atk: 28, hp: 90 },
    effect: null,
    upgradesTo: 'godslayers_heart'
  },
  godslayers_heart: {
    id: 'godslayers_heart',
    name: "Godslayer's Heart",
    slot: 'war_trophy',
    rarity: 5,
    stats: { atk: 50, hp: 150 },
    effect: { type: 'rage_on_kill', value: 15 }, // Gain 15 Rage on kill
    upgradesTo: null
  },

  // ===== BOWS (Ranger) =====
  bent_shortbow: {
    id: 'bent_shortbow',
    name: 'Bent Shortbow',
    slot: 'bow',
    rarity: 1,
    stats: { atk: 4, spd: 2 },
    effect: null,
    upgradesTo: 'hunters_longbow'
  },
  hunters_longbow: {
    id: 'hunters_longbow',
    name: "Hunter's Longbow",
    slot: 'bow',
    rarity: 2,
    stats: { atk: 10, spd: 4 },
    effect: null,
    upgradesTo: 'composite_bow'
  },
  composite_bow: {
    id: 'composite_bow',
    name: 'Composite Bow',
    slot: 'bow',
    rarity: 3,
    stats: { atk: 18, spd: 8 },
    effect: null,
    upgradesTo: 'shadowwood_recurve'
  },
  shadowwood_recurve: {
    id: 'shadowwood_recurve',
    name: 'Shadowwood Recurve',
    slot: 'bow',
    rarity: 4,
    stats: { atk: 32, spd: 14 },
    effect: null,
    upgradesTo: 'windriders_arc'
  },
  windriders_arc: {
    id: 'windriders_arc',
    name: "Windrider's Arc",
    slot: 'bow',
    rarity: 5,
    stats: { atk: 55, spd: 25 },
    effect: { type: 'focus_on_crit', value: 1 }, // Gain 1 Focus on critical hit
    upgradesTo: null
  },

  // ===== STAFFS (Mage) =====
  gnarled_branch: {
    id: 'gnarled_branch',
    name: 'Gnarled Branch',
    slot: 'staff',
    rarity: 1,
    stats: { atk: 4, mp: 5 },
    effect: null,
    upgradesTo: 'apprentices_rod'
  },
  apprentices_rod: {
    id: 'apprentices_rod',
    name: "Apprentice's Rod",
    slot: 'staff',
    rarity: 2,
    stats: { atk: 9, mp: 10 },
    effect: null,
    upgradesTo: 'runed_staff'
  },
  runed_staff: {
    id: 'runed_staff',
    name: 'Runed Staff',
    slot: 'staff',
    rarity: 3,
    stats: { atk: 16, mp: 20 },
    effect: null,
    upgradesTo: 'crystalcore_scepter'
  },
  crystalcore_scepter: {
    id: 'crystalcore_scepter',
    name: 'Crystalcore Scepter',
    slot: 'staff',
    rarity: 4,
    stats: { atk: 28, mp: 35 },
    effect: null,
    upgradesTo: 'staff_of_unmaking'
  },
  staff_of_unmaking: {
    id: 'staff_of_unmaking',
    name: 'Staff of Unmaking',
    slot: 'staff',
    rarity: 5,
    stats: { atk: 48, mp: 60 },
    effect: { type: 'spell_amp', value: 15 }, // +15% spell damage
    upgradesTo: null
  },

  // ===== HOLY SYMBOLS (Cleric) =====
  tarnished_pendant: {
    id: 'tarnished_pendant',
    name: 'Tarnished Pendant',
    slot: 'holy_symbol',
    rarity: 1,
    stats: { def: 2, mp: 5 },
    effect: null,
    upgradesTo: 'wooden_icon'
  },
  wooden_icon: {
    id: 'wooden_icon',
    name: 'Wooden Icon',
    slot: 'holy_symbol',
    rarity: 2,
    stats: { def: 5, mp: 10 },
    effect: null,
    upgradesTo: 'silver_ankh'
  },
  silver_ankh: {
    id: 'silver_ankh',
    name: 'Silver Ankh',
    slot: 'holy_symbol',
    rarity: 3,
    stats: { def: 10, mp: 20 },
    effect: null,
    upgradesTo: 'blessed_reliquary'
  },
  blessed_reliquary: {
    id: 'blessed_reliquary',
    name: 'Blessed Reliquary',
    slot: 'holy_symbol',
    rarity: 4,
    stats: { def: 18, mp: 35 },
    effect: null,
    upgradesTo: 'martyrs_tear'
  },
  martyrs_tear: {
    id: 'martyrs_tear',
    name: "Martyr's Tear",
    slot: 'holy_symbol',
    rarity: 5,
    stats: { def: 30, mp: 60 },
    effect: { type: 'heal_amp', value: 20 }, // +20% healing done
    upgradesTo: null
  },

  // ===== HOLY RELICS (Paladin) =====
  faded_prayer_beads: {
    id: 'faded_prayer_beads',
    name: 'Faded Prayer Beads',
    slot: 'holy_relic',
    rarity: 1,
    stats: { atk: 2, def: 2, hp: 10 },
    effect: null,
    upgradesTo: 'pilgrims_token'
  },
  pilgrims_token: {
    id: 'pilgrims_token',
    name: "Pilgrim's Token",
    slot: 'holy_relic',
    rarity: 2,
    stats: { atk: 5, def: 5, hp: 25 },
    effect: null,
    upgradesTo: 'sanctified_censer'
  },
  sanctified_censer: {
    id: 'sanctified_censer',
    name: 'Sanctified Censer',
    slot: 'holy_relic',
    rarity: 3,
    stats: { atk: 10, def: 10, hp: 50 },
    effect: null,
    upgradesTo: 'radiant_chalice'
  },
  radiant_chalice: {
    id: 'radiant_chalice',
    name: 'Radiant Chalice',
    slot: 'holy_relic',
    rarity: 4,
    stats: { atk: 18, def: 18, hp: 90 },
    effect: null,
    upgradesTo: 'shard_of_the_divine'
  },
  shard_of_the_divine: {
    id: 'shard_of_the_divine',
    name: 'Shard of the Divine',
    slot: 'holy_relic',
    rarity: 5,
    stats: { atk: 30, def: 30, hp: 150 },
    effect: { type: 'ally_damage_reduction', value: 10 }, // Allies take 10% less damage
    upgradesTo: null
  },

  // ===== TOTEMS (Druid) =====
  chipped_antler: {
    id: 'chipped_antler',
    name: 'Chipped Antler',
    slot: 'totem',
    rarity: 1,
    stats: { atk: 2, hp: 15 },
    effect: null,
    upgradesTo: 'carved_bone'
  },
  carved_bone: {
    id: 'carved_bone',
    name: 'Carved Bone',
    slot: 'totem',
    rarity: 2,
    stats: { atk: 5, hp: 35 },
    effect: null,
    upgradesTo: 'spiritwood_fetish'
  },
  spiritwood_fetish: {
    id: 'spiritwood_fetish',
    name: 'Spiritwood Fetish',
    slot: 'totem',
    rarity: 3,
    stats: { atk: 10, hp: 70 },
    effect: null,
    upgradesTo: 'beastlords_effigy'
  },
  beastlords_effigy: {
    id: 'beastlords_effigy',
    name: "Beastlord's Effigy",
    slot: 'totem',
    rarity: 4,
    stats: { atk: 18, hp: 120 },
    effect: null,
    upgradesTo: 'heart_of_the_wild'
  },
  heart_of_the_wild: {
    id: 'heart_of_the_wild',
    name: 'Heart of the Wild',
    slot: 'totem',
    rarity: 5,
    stats: { atk: 30, hp: 200 },
    effect: { type: 'nature_regen', value: 5 }, // Regenerate 5% max HP per turn
    upgradesTo: null
  },

  // ===== INSTRUMENTS (Bard) =====
  cracked_whistle: {
    id: 'cracked_whistle',
    name: 'Cracked Whistle',
    slot: 'instrument',
    rarity: 1,
    stats: { atk: 2, spd: 3 },
    effect: null,
    upgradesTo: 'worn_lute'
  },
  worn_lute: {
    id: 'worn_lute',
    name: 'Worn Lute',
    slot: 'instrument',
    rarity: 2,
    stats: { atk: 5, spd: 6 },
    effect: null,
    upgradesTo: 'silver_flute'
  },
  silver_flute: {
    id: 'silver_flute',
    name: 'Silver Flute',
    slot: 'instrument',
    rarity: 3,
    stats: { atk: 10, spd: 12 },
    effect: null,
    upgradesTo: 'enchanted_harp'
  },
  enchanted_harp: {
    id: 'enchanted_harp',
    name: 'Enchanted Harp',
    slot: 'instrument',
    rarity: 4,
    stats: { atk: 18, spd: 20 },
    effect: null,
    upgradesTo: 'voicesteal_violin'
  },
  voicesteal_violin: {
    id: 'voicesteal_violin',
    name: 'Voicesteal Violin',
    slot: 'instrument',
    rarity: 5,
    stats: { atk: 30, spd: 35 },
    effect: { type: 'finale_boost', value: 25 }, // +25% Finale effect power
    upgradesTo: null
  }
}

// Helper functions

/**
 * Get equipment by ID
 * @param {string} id - Equipment ID
 * @returns {object|null} Equipment object or null if not found
 */
export function getEquipment(id) {
  return equipment[id] || null
}

/**
 * Get all equipment as an array
 * @returns {object[]} Array of all equipment objects
 */
export function getAllEquipment() {
  return Object.values(equipment)
}

/**
 * Get all equipment for a specific slot
 * @param {string} slot - Slot type
 * @returns {object[]} Array of equipment for that slot
 */
export function getEquipmentBySlot(slot) {
  return Object.values(equipment).filter(e => e.slot === slot)
}

/**
 * Get the full upgrade path for an equipment item
 * @param {string} equipmentId - Starting equipment ID
 * @returns {object[]} Array of equipment in upgrade order
 */
export function getUpgradePath(equipmentId) {
  const path = []
  let current = getEquipment(equipmentId)

  while (current) {
    path.push(current)
    if (current.upgradesTo) {
      current = getEquipment(current.upgradesTo)
    } else {
      current = null
    }
  }

  return path
}

/**
 * Check if a slot is class-specific
 * @param {string} slot - Slot type
 * @returns {boolean} True if class-specific
 */
export function isClassSlot(slot) {
  return Object.values(CLASS_SLOTS).includes(slot)
}

/**
 * Get the class-specific slot type for a class
 * @param {string} classId - Class ID
 * @returns {string|null} Slot type or null if not found
 */
export function getClassSlotType(classId) {
  return CLASS_SLOTS[classId] || null
}
