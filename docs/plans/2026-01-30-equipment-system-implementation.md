# Equipment System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement an equipment system where heroes equip gear across 4 slots (weapon, armor, trinket, special) with merge-to-upgrade progression.

**Architecture:** Equipment data lives in `src/data/equipment.js`. A new `equipment.js` store manages owned equipment and template-level bindings. Heroes store gains `equippedGear` state. UI integrates into HeroesScreen (equip/view), ShopsScreen (blacksmith section), and InventoryScreen (upgrade action).

**Tech Stack:** Vue 3 Composition API, Pinia stores, existing rarity/item patterns

---

## Task 1: Define Equipment Data

**Files:**
- Create: `src/data/equipment.js`
- Create: `src/data/__tests__/equipment.test.js`

**Step 1: Write the failing test**

```javascript
// src/data/__tests__/equipment.test.js
import { describe, it, expect } from 'vitest'
import {
  getEquipment,
  getAllEquipment,
  getEquipmentBySlot,
  getUpgradePath,
  SLOT_TYPES,
  CLASS_SLOTS
} from '../equipment'

describe('equipment data', () => {
  describe('SLOT_TYPES', () => {
    it('defines all universal slots', () => {
      expect(SLOT_TYPES).toContain('weapon')
      expect(SLOT_TYPES).toContain('armor')
      expect(SLOT_TYPES).toContain('ring')
      expect(SLOT_TYPES).toContain('cloak')
    })
  })

  describe('CLASS_SLOTS', () => {
    it('maps each class to a special slot', () => {
      expect(CLASS_SLOTS.knight).toBe('shield')
      expect(CLASS_SLOTS.berserker).toBe('war_trophy')
      expect(CLASS_SLOTS.ranger).toBe('bow')
      expect(CLASS_SLOTS.mage).toBe('staff')
      expect(CLASS_SLOTS.cleric).toBe('holy_symbol')
      expect(CLASS_SLOTS.paladin).toBe('holy_relic')
      expect(CLASS_SLOTS.druid).toBe('totem')
      expect(CLASS_SLOTS.bard).toBe('instrument')
    })
  })

  describe('getEquipment', () => {
    it('returns equipment by id', () => {
      const rustyShiv = getEquipment('rusty_shiv')
      expect(rustyShiv).toBeDefined()
      expect(rustyShiv.name).toBe('Rusty Shiv')
      expect(rustyShiv.slot).toBe('weapon')
      expect(rustyShiv.rarity).toBe(1)
    })

    it('returns undefined for unknown id', () => {
      expect(getEquipment('nonexistent')).toBeUndefined()
    })
  })

  describe('getEquipmentBySlot', () => {
    it('returns all weapons', () => {
      const weapons = getEquipmentBySlot('weapon')
      expect(weapons.length).toBe(5)
      expect(weapons.map(w => w.rarity)).toEqual([1, 2, 3, 4, 5])
    })

    it('returns all shields', () => {
      const shields = getEquipmentBySlot('shield')
      expect(shields.length).toBe(5)
    })
  })

  describe('getUpgradePath', () => {
    it('returns full upgrade path for weapon', () => {
      const path = getUpgradePath('rusty_shiv')
      expect(path.map(e => e.id)).toEqual([
        'rusty_shiv',
        'worn_blade',
        'steel_falchion',
        'blackiron_cleaver',
        'kingslayer'
      ])
    })

    it('returns single item for max tier', () => {
      const path = getUpgradePath('kingslayer')
      expect(path.length).toBe(1)
      expect(path[0].id).toBe('kingslayer')
    })
  })

  describe('equipment stats', () => {
    it('weapons have atk stat scaling with rarity', () => {
      const shiv = getEquipment('rusty_shiv')
      const kingslayer = getEquipment('kingslayer')
      expect(shiv.stats.atk).toBeLessThan(kingslayer.stats.atk)
    })

    it('armor has def and hp stats', () => {
      const armor = getEquipment('scrap_leather')
      expect(armor.stats.def).toBeDefined()
      expect(armor.stats.hp).toBeDefined()
    })
  })

  describe('equipment effects', () => {
    it('weapons have no effects', () => {
      const weapon = getEquipment('rusty_shiv')
      expect(weapon.effect).toBeNull()
    })

    it('rings have effects', () => {
      const ring = getEquipment('cracked_ring')
      expect(ring.effect).toBeDefined()
      expect(ring.effect.type).toBe('mp_regen')
    })

    it('class items have signature effects', () => {
      const shield = getEquipment('dented_buckler')
      expect(shield.effect).toBeDefined()
      expect(shield.effect.type).toBe('damage_block')
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd /home/deltran/code/dorf/.worktrees/equipment && npm test -- src/data/__tests__/equipment.test.js`
Expected: FAIL with "Cannot find module '../equipment'"

**Step 3: Write equipment data**

```javascript
// src/data/equipment.js

export const SLOT_TYPES = ['weapon', 'armor', 'ring', 'cloak']

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

// Slot icons for UI
export const SLOT_ICONS = {
  weapon: '⚔️',
  armor: '🛡️',
  ring: '💍',
  cloak: '🧥',
  shield: '🛡️',
  war_trophy: '💀',
  bow: '🏹',
  staff: '🪄',
  holy_symbol: '✝️',
  holy_relic: '📿',
  totem: '🦌',
  instrument: '🎵'
}

const equipment = {
  // === WEAPONS ===
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

  // === ARMOR ===
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

  // === RINGS ===
  cracked_ring: {
    id: 'cracked_ring',
    name: 'Cracked Ring',
    slot: 'ring',
    rarity: 1,
    stats: { atk: 2, def: 2 },
    effect: { type: 'mp_regen', value: 1 },
    upgradesTo: 'copper_charm'
  },
  copper_charm: {
    id: 'copper_charm',
    name: 'Copper Charm',
    slot: 'ring',
    rarity: 2,
    stats: { atk: 5, def: 5 },
    effect: { type: 'hp_regen_percent', value: 2 },
    upgradesTo: 'silver_locket'
  },
  silver_locket: {
    id: 'silver_locket',
    name: 'Silver Locket',
    slot: 'ring',
    rarity: 3,
    stats: { atk: 10, def: 10 },
    effect: { type: 'crit_chance', value: 8 },
    upgradesTo: 'runed_talisman'
  },
  runed_talisman: {
    id: 'runed_talisman',
    name: 'Runed Talisman',
    slot: 'ring',
    rarity: 4,
    stats: { atk: 18, def: 18 },
    effect: { type: 'evasion', value: 5 },
    upgradesTo: 'soulshard_ring'
  },
  soulshard_ring: {
    id: 'soulshard_ring',
    name: 'Soulshard Ring',
    slot: 'ring',
    rarity: 5,
    stats: { atk: 30, def: 30 },
    effect: { type: 'low_hp_atk_boost', value: 15, threshold: 50 },
    upgradesTo: null
  },

  // === CLOAKS ===
  tattered_shroud: {
    id: 'tattered_shroud',
    name: 'Tattered Shroud',
    slot: 'cloak',
    rarity: 1,
    stats: { spd: 2 },
    effect: { type: 'starting_mp', value: 2 },
    upgradesTo: 'travelers_cape'
  },
  travelers_cape: {
    id: 'travelers_cape',
    name: "Traveler's Cape",
    slot: 'cloak',
    rarity: 2,
    stats: { spd: 5 },
    effect: { type: 'mp_regen', value: 1 },
    upgradesTo: 'woven_mantle'
  },
  woven_mantle: {
    id: 'woven_mantle',
    name: 'Woven Mantle',
    slot: 'cloak',
    rarity: 3,
    stats: { spd: 10 },
    effect: { type: 'starting_resource', value: 5 },
    upgradesTo: 'spellthiefs_cloak'
  },
  spellthiefs_cloak: {
    id: 'spellthiefs_cloak',
    name: "Spellthief's Cloak",
    slot: 'cloak',
    rarity: 4,
    stats: { spd: 18 },
    effect: { type: 'first_skill_free', value: true },
    upgradesTo: 'mantle_of_the_infinite'
  },
  mantle_of_the_infinite: {
    id: 'mantle_of_the_infinite',
    name: 'Mantle of the Infinite',
    slot: 'cloak',
    rarity: 5,
    stats: { spd: 30 },
    effect: { type: 'mp_boost_and_cost_reduction', maxMpPercent: 20, costReduction: 1 },
    upgradesTo: null
  },

  // === KNIGHT SHIELDS ===
  dented_buckler: {
    id: 'dented_buckler',
    name: 'Dented Buckler',
    slot: 'shield',
    rarity: 1,
    stats: { def: 3 },
    effect: { type: 'damage_block', value: 2 },
    upgradesTo: 'wooden_kite_shield'
  },
  wooden_kite_shield: {
    id: 'wooden_kite_shield',
    name: 'Wooden Kite Shield',
    slot: 'shield',
    rarity: 2,
    stats: { def: 7 },
    effect: { type: 'damage_block', value: 5 },
    upgradesTo: 'iron_heater'
  },
  iron_heater: {
    id: 'iron_heater',
    name: 'Iron Heater',
    slot: 'shield',
    rarity: 3,
    stats: { def: 14 },
    effect: { type: 'damage_block', value: 10 },
    upgradesTo: 'blackiron_bulwark'
  },
  blackiron_bulwark: {
    id: 'blackiron_bulwark',
    name: 'Blackiron Bulwark',
    slot: 'shield',
    rarity: 4,
    stats: { def: 25 },
    effect: { type: 'damage_block', value: 18 },
    upgradesTo: 'unbreakable_aegis'
  },
  unbreakable_aegis: {
    id: 'unbreakable_aegis',
    name: 'Unbreakable Aegis',
    slot: 'shield',
    rarity: 5,
    stats: { def: 45 },
    effect: { type: 'damage_block', value: 30 },
    upgradesTo: null
  },

  // === BERSERKER WAR TROPHIES ===
  cracked_skull: {
    id: 'cracked_skull',
    name: 'Cracked Skull',
    slot: 'war_trophy',
    rarity: 1,
    stats: { atk: 3 },
    effect: { type: 'low_hp_atk_boost', value: 5, threshold: 50 },
    upgradesTo: 'severed_claw'
  },
  severed_claw: {
    id: 'severed_claw',
    name: 'Severed Claw',
    slot: 'war_trophy',
    rarity: 2,
    stats: { atk: 7 },
    effect: { type: 'low_hp_atk_boost', value: 10, threshold: 50 },
    upgradesTo: 'warchiefs_fang'
  },
  warchiefs_fang: {
    id: 'warchiefs_fang',
    name: "Warchief's Fang",
    slot: 'war_trophy',
    rarity: 3,
    stats: { atk: 14 },
    effect: { type: 'low_hp_atk_boost', value: 18, threshold: 50 },
    upgradesTo: 'demon_horn'
  },
  demon_horn: {
    id: 'demon_horn',
    name: 'Demon Horn',
    slot: 'war_trophy',
    rarity: 4,
    stats: { atk: 25 },
    effect: { type: 'low_hp_atk_boost', value: 28, threshold: 50 },
    upgradesTo: 'godslayers_heart'
  },
  godslayers_heart: {
    id: 'godslayers_heart',
    name: "Godslayer's Heart",
    slot: 'war_trophy',
    rarity: 5,
    stats: { atk: 45 },
    effect: { type: 'low_hp_atk_boost', value: 40, threshold: 50 },
    upgradesTo: null
  },

  // === RANGER BOWS ===
  bent_shortbow: {
    id: 'bent_shortbow',
    name: 'Bent Shortbow',
    slot: 'bow',
    rarity: 1,
    stats: { atk: 3 },
    effect: { type: 'crit_chance', value: 3 },
    upgradesTo: 'hunters_longbow'
  },
  hunters_longbow: {
    id: 'hunters_longbow',
    name: "Hunter's Longbow",
    slot: 'bow',
    rarity: 2,
    stats: { atk: 7 },
    effect: { type: 'crit_chance', value: 6 },
    upgradesTo: 'composite_bow'
  },
  composite_bow: {
    id: 'composite_bow',
    name: 'Composite Bow',
    slot: 'bow',
    rarity: 3,
    stats: { atk: 14 },
    effect: { type: 'crit_chance', value: 10 },
    upgradesTo: 'shadowwood_recurve'
  },
  shadowwood_recurve: {
    id: 'shadowwood_recurve',
    name: 'Shadowwood Recurve',
    slot: 'bow',
    rarity: 4,
    stats: { atk: 25 },
    effect: { type: 'crit_chance', value: 15 },
    upgradesTo: 'windriders_arc'
  },
  windriders_arc: {
    id: 'windriders_arc',
    name: "Windrider's Arc",
    slot: 'bow',
    rarity: 5,
    stats: { atk: 45 },
    effect: { type: 'crit_chance', value: 22 },
    upgradesTo: null
  },

  // === MAGE STAFFS ===
  gnarled_branch: {
    id: 'gnarled_branch',
    name: 'Gnarled Branch',
    slot: 'staff',
    rarity: 1,
    stats: { atk: 3 },
    effect: { type: 'skill_damage_boost', value: 3 },
    upgradesTo: 'apprentices_rod'
  },
  apprentices_rod: {
    id: 'apprentices_rod',
    name: "Apprentice's Rod",
    slot: 'staff',
    rarity: 2,
    stats: { atk: 7 },
    effect: { type: 'skill_damage_boost', value: 6 },
    upgradesTo: 'runed_staff'
  },
  runed_staff: {
    id: 'runed_staff',
    name: 'Runed Staff',
    slot: 'staff',
    rarity: 3,
    stats: { atk: 14 },
    effect: { type: 'skill_damage_boost', value: 10 },
    upgradesTo: 'crystalcore_scepter'
  },
  crystalcore_scepter: {
    id: 'crystalcore_scepter',
    name: 'Crystalcore Scepter',
    slot: 'staff',
    rarity: 4,
    stats: { atk: 25 },
    effect: { type: 'skill_damage_boost', value: 15 },
    upgradesTo: 'staff_of_unmaking'
  },
  staff_of_unmaking: {
    id: 'staff_of_unmaking',
    name: 'Staff of Unmaking',
    slot: 'staff',
    rarity: 5,
    stats: { atk: 45 },
    effect: { type: 'skill_damage_boost', value: 22 },
    upgradesTo: null
  },

  // === CLERIC HOLY SYMBOLS ===
  tarnished_pendant: {
    id: 'tarnished_pendant',
    name: 'Tarnished Pendant',
    slot: 'holy_symbol',
    rarity: 1,
    stats: { def: 2 },
    effect: { type: 'healing_boost', value: 3 },
    upgradesTo: 'wooden_icon'
  },
  wooden_icon: {
    id: 'wooden_icon',
    name: 'Wooden Icon',
    slot: 'holy_symbol',
    rarity: 2,
    stats: { def: 5 },
    effect: { type: 'healing_boost', value: 6 },
    upgradesTo: 'silver_ankh'
  },
  silver_ankh: {
    id: 'silver_ankh',
    name: 'Silver Ankh',
    slot: 'holy_symbol',
    rarity: 3,
    stats: { def: 10 },
    effect: { type: 'healing_boost', value: 10 },
    upgradesTo: 'blessed_reliquary'
  },
  blessed_reliquary: {
    id: 'blessed_reliquary',
    name: 'Blessed Reliquary',
    slot: 'holy_symbol',
    rarity: 4,
    stats: { def: 18 },
    effect: { type: 'healing_boost', value: 15 },
    upgradesTo: 'martyrs_tear'
  },
  martyrs_tear: {
    id: 'martyrs_tear',
    name: "Martyr's Tear",
    slot: 'holy_symbol',
    rarity: 5,
    stats: { def: 30 },
    effect: { type: 'healing_boost', value: 22 },
    upgradesTo: null
  },

  // === PALADIN HOLY RELICS ===
  faded_prayer_beads: {
    id: 'faded_prayer_beads',
    name: 'Faded Prayer Beads',
    slot: 'holy_relic',
    rarity: 1,
    stats: { atk: 2, def: 2 },
    effect: { type: 'atk_def_boost', value: 2 },
    upgradesTo: 'pilgrims_token'
  },
  pilgrims_token: {
    id: 'pilgrims_token',
    name: "Pilgrim's Token",
    slot: 'holy_relic',
    rarity: 2,
    stats: { atk: 5, def: 5 },
    effect: { type: 'atk_def_boost', value: 4 },
    upgradesTo: 'sanctified_censer'
  },
  sanctified_censer: {
    id: 'sanctified_censer',
    name: 'Sanctified Censer',
    slot: 'holy_relic',
    rarity: 3,
    stats: { atk: 10, def: 10 },
    effect: { type: 'atk_def_boost', value: 7 },
    upgradesTo: 'radiant_chalice'
  },
  radiant_chalice: {
    id: 'radiant_chalice',
    name: 'Radiant Chalice',
    slot: 'holy_relic',
    rarity: 4,
    stats: { atk: 18, def: 18 },
    effect: { type: 'atk_def_boost', value: 11 },
    upgradesTo: 'shard_of_the_divine'
  },
  shard_of_the_divine: {
    id: 'shard_of_the_divine',
    name: 'Shard of the Divine',
    slot: 'holy_relic',
    rarity: 5,
    stats: { atk: 30, def: 30 },
    effect: { type: 'atk_def_boost', value: 16 },
    upgradesTo: null
  },

  // === DRUID TOTEMS ===
  chipped_antler: {
    id: 'chipped_antler',
    name: 'Chipped Antler',
    slot: 'totem',
    rarity: 1,
    stats: { hp: 15 },
    effect: { type: 'hp_regen_flat', value: 3 },
    upgradesTo: 'carved_bone'
  },
  carved_bone: {
    id: 'carved_bone',
    name: 'Carved Bone',
    slot: 'totem',
    rarity: 2,
    stats: { hp: 35 },
    effect: { type: 'hp_regen_flat', value: 6 },
    upgradesTo: 'spiritwood_fetish'
  },
  spiritwood_fetish: {
    id: 'spiritwood_fetish',
    name: 'Spiritwood Fetish',
    slot: 'totem',
    rarity: 3,
    stats: { hp: 70 },
    effect: { type: 'hp_regen_flat', value: 10 },
    upgradesTo: 'beastlords_effigy'
  },
  beastlords_effigy: {
    id: 'beastlords_effigy',
    name: "Beastlord's Effigy",
    slot: 'totem',
    rarity: 4,
    stats: { hp: 120 },
    effect: { type: 'hp_regen_flat', value: 16 },
    upgradesTo: 'heart_of_the_wild'
  },
  heart_of_the_wild: {
    id: 'heart_of_the_wild',
    name: 'Heart of the Wild',
    slot: 'totem',
    rarity: 5,
    stats: { hp: 200 },
    effect: { type: 'hp_regen_flat', value: 25 },
    upgradesTo: null
  },

  // === BARD INSTRUMENTS ===
  cracked_whistle: {
    id: 'cracked_whistle',
    name: 'Cracked Whistle',
    slot: 'instrument',
    rarity: 1,
    stats: { spd: 2 },
    effect: { type: 'finale_boost', value: 5 },
    upgradesTo: 'worn_lute'
  },
  worn_lute: {
    id: 'worn_lute',
    name: 'Worn Lute',
    slot: 'instrument',
    rarity: 2,
    stats: { spd: 5 },
    effect: { type: 'finale_boost', value: 10 },
    upgradesTo: 'silver_flute'
  },
  silver_flute: {
    id: 'silver_flute',
    name: 'Silver Flute',
    slot: 'instrument',
    rarity: 3,
    stats: { spd: 10 },
    effect: { type: 'finale_boost', value: 16 },
    upgradesTo: 'enchanted_harp'
  },
  enchanted_harp: {
    id: 'enchanted_harp',
    name: 'Enchanted Harp',
    slot: 'instrument',
    rarity: 4,
    stats: { spd: 18 },
    effect: { type: 'finale_boost', value: 24 },
    upgradesTo: 'voicesteal_violin'
  },
  voicesteal_violin: {
    id: 'voicesteal_violin',
    name: 'Voicesteal Violin',
    slot: 'instrument',
    rarity: 5,
    stats: { spd: 30 },
    effect: { type: 'finale_boost', value: 35 },
    upgradesTo: null
  }
}

export function getEquipment(id) {
  return equipment[id]
}

export function getAllEquipment() {
  return Object.values(equipment)
}

export function getEquipmentBySlot(slot) {
  return Object.values(equipment)
    .filter(e => e.slot === slot)
    .sort((a, b) => a.rarity - b.rarity)
}

export function getUpgradePath(equipmentId) {
  const path = []
  let current = getEquipment(equipmentId)

  // Walk backwards to find the start
  const allEquip = getAllEquipment()
  let start = current
  while (true) {
    const prev = allEquip.find(e => e.upgradesTo === start.id)
    if (!prev) break
    start = prev
  }

  // Walk forward from start
  current = start
  while (current) {
    path.push(current)
    current = current.upgradesTo ? getEquipment(current.upgradesTo) : null
  }

  return path
}

export function getTrinketSlot() {
  // Returns 'ring' or 'cloak' - both are valid trinket types
  return 'trinket'
}

export function isClassSlot(slot) {
  return Object.values(CLASS_SLOTS).includes(slot)
}

export function getClassSlotType(classId) {
  return CLASS_SLOTS[classId] || null
}
```

**Step 4: Run test to verify it passes**

Run: `cd /home/deltran/code/dorf/.worktrees/equipment && npm test -- src/data/__tests__/equipment.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/equipment.js src/data/__tests__/equipment.test.js
git commit -m "feat(equipment): add equipment data with all item lines

Defines 60 equipment items across weapon, armor, ring, cloak, and 8
class-specific slots. Each has stats, effects, and upgrade paths.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Define Upgrade Materials

**Files:**
- Modify: `src/data/items.js`
- Create: `src/data/__tests__/equipment-materials.test.js`

**Step 1: Write the failing test**

```javascript
// src/data/__tests__/equipment-materials.test.js
import { describe, it, expect } from 'vitest'
import { getItem, getItemsByType, UPGRADE_MATERIALS } from '../items'

describe('equipment upgrade materials', () => {
  describe('UPGRADE_MATERIALS constant', () => {
    it('maps slot and tier to material id', () => {
      expect(UPGRADE_MATERIALS.weapon[1]).toBe('common_weapon_stone')
      expect(UPGRADE_MATERIALS.weapon[2]).toBe('uncommon_weapon_stone')
      expect(UPGRADE_MATERIALS.weapon[3]).toBe('rare_weapon_stone')
      expect(UPGRADE_MATERIALS.weapon[4]).toBe('epic_weapon_stone')
    })

    it('has materials for all slots', () => {
      expect(UPGRADE_MATERIALS.weapon).toBeDefined()
      expect(UPGRADE_MATERIALS.armor).toBeDefined()
      expect(UPGRADE_MATERIALS.trinket).toBeDefined()
      expect(UPGRADE_MATERIALS.class).toBeDefined()
    })
  })

  describe('material items', () => {
    it('common weapon stone exists', () => {
      const mat = getItem('common_weapon_stone')
      expect(mat).toBeDefined()
      expect(mat.name).toBe('Common Weapon Stone')
      expect(mat.type).toBe('equipment_material')
      expect(mat.rarity).toBe(1)
    })

    it('epic armor plate exists', () => {
      const mat = getItem('epic_armor_plate')
      expect(mat).toBeDefined()
      expect(mat.name).toBe('Epic Armor Plate')
      expect(mat.type).toBe('equipment_material')
      expect(mat.rarity).toBe(4)
    })

    it('can filter by equipment_material type', () => {
      const mats = getItemsByType('equipment_material')
      expect(mats.length).toBe(16)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd /home/deltran/code/dorf/.worktrees/equipment && npm test -- src/data/__tests__/equipment-materials.test.js`
Expected: FAIL

**Step 3: Add materials to items.js**

Add to `src/data/items.js`:

```javascript
// Add after existing items, before the export functions

// === EQUIPMENT UPGRADE MATERIALS ===

// Weapon materials
export const common_weapon_stone = {
  id: 'common_weapon_stone',
  name: 'Common Weapon Stone',
  description: 'A rough stone used to forge basic weapons.',
  type: 'equipment_material',
  rarity: 1,
  materialSlot: 'weapon',
  materialTier: 1
}

export const uncommon_weapon_stone = {
  id: 'uncommon_weapon_stone',
  name: 'Uncommon Weapon Stone',
  description: 'A quality stone for crafting reliable weapons.',
  type: 'equipment_material',
  rarity: 2,
  materialSlot: 'weapon',
  materialTier: 2
}

export const rare_weapon_stone = {
  id: 'rare_weapon_stone',
  name: 'Rare Weapon Stone',
  description: 'A precious stone that holds great power.',
  type: 'equipment_material',
  rarity: 3,
  materialSlot: 'weapon',
  materialTier: 3
}

export const epic_weapon_stone = {
  id: 'epic_weapon_stone',
  name: 'Epic Weapon Stone',
  description: 'A legendary stone said to forge weapons of kings.',
  type: 'equipment_material',
  rarity: 4,
  materialSlot: 'weapon',
  materialTier: 4
}

// Armor materials
export const common_armor_plate = {
  id: 'common_armor_plate',
  name: 'Common Armor Plate',
  description: 'A simple metal plate for basic armor.',
  type: 'equipment_material',
  rarity: 1,
  materialSlot: 'armor',
  materialTier: 1
}

export const uncommon_armor_plate = {
  id: 'uncommon_armor_plate',
  name: 'Uncommon Armor Plate',
  description: 'A sturdy plate for crafting reliable protection.',
  type: 'equipment_material',
  rarity: 2,
  materialSlot: 'armor',
  materialTier: 2
}

export const rare_armor_plate = {
  id: 'rare_armor_plate',
  name: 'Rare Armor Plate',
  description: 'A tempered plate of exceptional quality.',
  type: 'equipment_material',
  rarity: 3,
  materialSlot: 'armor',
  materialTier: 3
}

export const epic_armor_plate = {
  id: 'epic_armor_plate',
  name: 'Epic Armor Plate',
  description: 'A masterwork plate forged in dragonfire.',
  type: 'equipment_material',
  rarity: 4,
  materialSlot: 'armor',
  materialTier: 4
}

// Trinket materials (gem shards)
export const common_gem_shard = {
  id: 'common_gem_shard',
  name: 'Common Gem Shard',
  description: 'A dull crystal fragment with faint magic.',
  type: 'equipment_material',
  rarity: 1,
  materialSlot: 'trinket',
  materialTier: 1
}

export const uncommon_gem_shard = {
  id: 'uncommon_gem_shard',
  name: 'Uncommon Gem Shard',
  description: 'A glowing shard pulsing with energy.',
  type: 'equipment_material',
  rarity: 2,
  materialSlot: 'trinket',
  materialTier: 2
}

export const rare_gem_shard = {
  id: 'rare_gem_shard',
  name: 'Rare Gem Shard',
  description: 'A brilliant crystal humming with power.',
  type: 'equipment_material',
  rarity: 3,
  materialSlot: 'trinket',
  materialTier: 3
}

export const epic_gem_shard = {
  id: 'epic_gem_shard',
  name: 'Epic Gem Shard',
  description: 'A prismatic shard radiating ancient magic.',
  type: 'equipment_material',
  rarity: 4,
  materialSlot: 'trinket',
  materialTier: 4
}

// Class item materials (tokens)
export const common_class_token = {
  id: 'common_class_token',
  name: 'Common Class Token',
  description: 'A worn token bearing a class symbol.',
  type: 'equipment_material',
  rarity: 1,
  materialSlot: 'class',
  materialTier: 1
}

export const uncommon_class_token = {
  id: 'uncommon_class_token',
  name: 'Uncommon Class Token',
  description: 'A polished token with intricate engravings.',
  type: 'equipment_material',
  rarity: 2,
  materialSlot: 'class',
  materialTier: 2
}

export const rare_class_token = {
  id: 'rare_class_token',
  name: 'Rare Class Token',
  description: 'A gleaming token blessed by masters.',
  type: 'equipment_material',
  rarity: 3,
  materialSlot: 'class',
  materialTier: 3
}

export const epic_class_token = {
  id: 'epic_class_token',
  name: 'Epic Class Token',
  description: 'A legendary token of ultimate mastery.',
  type: 'equipment_material',
  rarity: 4,
  materialSlot: 'class',
  materialTier: 4
}

// Material lookup table
export const UPGRADE_MATERIALS = {
  weapon: {
    1: 'common_weapon_stone',
    2: 'uncommon_weapon_stone',
    3: 'rare_weapon_stone',
    4: 'epic_weapon_stone'
  },
  armor: {
    1: 'common_armor_plate',
    2: 'uncommon_armor_plate',
    3: 'rare_armor_plate',
    4: 'epic_armor_plate'
  },
  trinket: {
    1: 'common_gem_shard',
    2: 'uncommon_gem_shard',
    3: 'rare_gem_shard',
    4: 'epic_gem_shard'
  },
  class: {
    1: 'common_class_token',
    2: 'uncommon_class_token',
    3: 'rare_class_token',
    4: 'epic_class_token'
  }
}
```

Also add all new materials to the `items` object and ensure `getItemsByType` works.

**Step 4: Run test to verify it passes**

Run: `cd /home/deltran/code/dorf/.worktrees/equipment && npm test -- src/data/__tests__/equipment-materials.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/items.js src/data/__tests__/equipment-materials.test.js
git commit -m "feat(equipment): add 16 upgrade materials

Adds slot-specific and tier-specific materials for equipment upgrades:
weapon stones, armor plates, gem shards, and class tokens.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create Equipment Store - Basic State

**Files:**
- Create: `src/stores/equipment.js`
- Create: `src/stores/__tests__/equipment.test.js`

**Step 1: Write the failing test**

```javascript
// src/stores/__tests__/equipment.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEquipmentStore } from '../equipment'

describe('equipment store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('starts with empty owned equipment', () => {
      const store = useEquipmentStore()
      expect(store.ownedEquipment).toEqual({})
    })

    it('starts with empty equipped gear', () => {
      const store = useEquipmentStore()
      expect(store.equippedGear).toEqual({})
    })

    it('starts with blacksmith locked', () => {
      const store = useEquipmentStore()
      expect(store.blacksmithUnlocked).toBe(false)
    })
  })

  describe('addEquipment', () => {
    it('adds equipment to owned list', () => {
      const store = useEquipmentStore()
      store.addEquipment('rusty_shiv')
      expect(store.ownedEquipment['rusty_shiv']).toBe(1)
    })

    it('increments count for duplicates', () => {
      const store = useEquipmentStore()
      store.addEquipment('rusty_shiv')
      store.addEquipment('rusty_shiv')
      expect(store.ownedEquipment['rusty_shiv']).toBe(2)
    })

    it('adds specified count', () => {
      const store = useEquipmentStore()
      store.addEquipment('rusty_shiv', 3)
      expect(store.ownedEquipment['rusty_shiv']).toBe(3)
    })
  })

  describe('removeEquipment', () => {
    it('decrements count', () => {
      const store = useEquipmentStore()
      store.addEquipment('rusty_shiv', 3)
      store.removeEquipment('rusty_shiv')
      expect(store.ownedEquipment['rusty_shiv']).toBe(2)
    })

    it('removes key when count reaches 0', () => {
      const store = useEquipmentStore()
      store.addEquipment('rusty_shiv')
      store.removeEquipment('rusty_shiv')
      expect(store.ownedEquipment['rusty_shiv']).toBeUndefined()
    })

    it('returns false if not owned', () => {
      const store = useEquipmentStore()
      const result = store.removeEquipment('rusty_shiv')
      expect(result).toBe(false)
    })
  })

  describe('getOwnedCount', () => {
    it('returns count for owned equipment', () => {
      const store = useEquipmentStore()
      store.addEquipment('rusty_shiv', 5)
      expect(store.getOwnedCount('rusty_shiv')).toBe(5)
    })

    it('returns 0 for unowned equipment', () => {
      const store = useEquipmentStore()
      expect(store.getOwnedCount('rusty_shiv')).toBe(0)
    })
  })

  describe('unlockBlacksmith', () => {
    it('unlocks the blacksmith', () => {
      const store = useEquipmentStore()
      store.unlockBlacksmith()
      expect(store.blacksmithUnlocked).toBe(true)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd /home/deltran/code/dorf/.worktrees/equipment && npm test -- src/stores/__tests__/equipment.test.js`
Expected: FAIL

**Step 3: Create equipment store**

```javascript
// src/stores/equipment.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getEquipment, CLASS_SLOTS } from '@/data/equipment'

export const useEquipmentStore = defineStore('equipment', () => {
  // === STATE ===

  // Equipment inventory: { equipmentId: count }
  const ownedEquipment = ref({})

  // Template-level equipment bindings: { templateId: { weapon, armor, trinket, special } }
  const equippedGear = ref({})

  // Blacksmith unlock flag
  const blacksmithUnlocked = ref(false)

  // === ACTIONS ===

  function addEquipment(equipmentId, count = 1) {
    if (!ownedEquipment.value[equipmentId]) {
      ownedEquipment.value[equipmentId] = 0
    }
    ownedEquipment.value[equipmentId] += count
    return true
  }

  function removeEquipment(equipmentId, count = 1) {
    if (!ownedEquipment.value[equipmentId] || ownedEquipment.value[equipmentId] < count) {
      return false
    }
    ownedEquipment.value[equipmentId] -= count
    if (ownedEquipment.value[equipmentId] <= 0) {
      delete ownedEquipment.value[equipmentId]
    }
    return true
  }

  function getOwnedCount(equipmentId) {
    return ownedEquipment.value[equipmentId] || 0
  }

  function unlockBlacksmith() {
    blacksmithUnlocked.value = true
  }

  // === PERSISTENCE ===

  function saveState() {
    return {
      ownedEquipment: ownedEquipment.value,
      equippedGear: equippedGear.value,
      blacksmithUnlocked: blacksmithUnlocked.value
    }
  }

  function loadState(savedState) {
    if (savedState.ownedEquipment) {
      ownedEquipment.value = savedState.ownedEquipment
    }
    if (savedState.equippedGear) {
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

    // Persistence
    saveState,
    loadState
  }
})
```

**Step 4: Run test to verify it passes**

Run: `cd /home/deltran/code/dorf/.worktrees/equipment && npm test -- src/stores/__tests__/equipment.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/equipment.js src/stores/__tests__/equipment.test.js
git commit -m "feat(equipment): create equipment store with basic state

Manages owned equipment counts, template-level gear bindings, and
blacksmith unlock flag. Includes persistence methods.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Equipment Store - Equip/Unequip

**Files:**
- Modify: `src/stores/equipment.js`
- Modify: `src/stores/__tests__/equipment.test.js`

**Step 1: Add failing tests**

Add to `src/stores/__tests__/equipment.test.js`:

```javascript
describe('equip', () => {
  it('equips weapon to hero template', () => {
    const store = useEquipmentStore()
    store.addEquipment('rusty_shiv')
    const result = store.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')
    expect(result.success).toBe(true)
    expect(store.equippedGear['aurora_the_dawn'].weapon).toBe('rusty_shiv')
  })

  it('fails if equipment not owned', () => {
    const store = useEquipmentStore()
    const result = store.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')
    expect(result.success).toBe(false)
    expect(result.message).toContain('not owned')
  })

  it('fails if equipment already equipped to another template', () => {
    const store = useEquipmentStore()
    store.addEquipment('rusty_shiv')
    store.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')
    const result = store.equip('shadow_king', 'rusty_shiv', 'weapon')
    expect(result.success).toBe(false)
    expect(result.message).toContain('already equipped')
  })

  it('allows equipping if you own multiple copies', () => {
    const store = useEquipmentStore()
    store.addEquipment('rusty_shiv', 2)
    store.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')
    const result = store.equip('shadow_king', 'rusty_shiv', 'weapon')
    expect(result.success).toBe(true)
  })
})

describe('unequip', () => {
  it('removes equipment from slot', () => {
    const store = useEquipmentStore()
    store.addEquipment('rusty_shiv')
    store.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')
    store.unequip('aurora_the_dawn', 'weapon')
    expect(store.equippedGear['aurora_the_dawn'].weapon).toBeNull()
  })

  it('returns false if nothing equipped', () => {
    const store = useEquipmentStore()
    const result = store.unequip('aurora_the_dawn', 'weapon')
    expect(result).toBe(false)
  })
})

describe('getEquippedGear', () => {
  it('returns all slots for template', () => {
    const store = useEquipmentStore()
    store.addEquipment('rusty_shiv')
    store.addEquipment('scrap_leather')
    store.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')
    store.equip('aurora_the_dawn', 'scrap_leather', 'armor')

    const gear = store.getEquippedGear('aurora_the_dawn')
    expect(gear.weapon).toBe('rusty_shiv')
    expect(gear.armor).toBe('scrap_leather')
    expect(gear.trinket).toBeNull()
    expect(gear.special).toBeNull()
  })
})

describe('getAvailableForSlot', () => {
  it('returns unequipped equipment for slot', () => {
    const store = useEquipmentStore()
    store.addEquipment('rusty_shiv', 2)
    store.addEquipment('worn_blade')
    store.equip('aurora_the_dawn', 'rusty_shiv', 'weapon')

    const available = store.getAvailableForSlot('weapon')
    expect(available).toContainEqual({ id: 'rusty_shiv', count: 1 })
    expect(available).toContainEqual({ id: 'worn_blade', count: 1 })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd /home/deltran/code/dorf/.worktrees/equipment && npm test -- src/stores/__tests__/equipment.test.js`
Expected: FAIL

**Step 3: Add equip/unequip functions**

Add to `src/stores/equipment.js`:

```javascript
function equip(templateId, equipmentId, slotType) {
  const equipment = getEquipment(equipmentId)
  if (!equipment) {
    return { success: false, message: 'Equipment not found' }
  }

  // Check ownership
  const owned = getOwnedCount(equipmentId)
  if (owned === 0) {
    return { success: false, message: 'Equipment not owned' }
  }

  // Count how many are already equipped
  let equippedCount = 0
  for (const tId of Object.keys(equippedGear.value)) {
    const gear = equippedGear.value[tId]
    for (const slot of Object.keys(gear)) {
      if (gear[slot] === equipmentId) {
        equippedCount++
      }
    }
  }

  if (equippedCount >= owned) {
    return { success: false, message: 'Equipment already equipped to another hero' }
  }

  // Initialize template gear if needed
  if (!equippedGear.value[templateId]) {
    equippedGear.value[templateId] = {
      weapon: null,
      armor: null,
      trinket: null,
      special: null
    }
  }

  equippedGear.value[templateId][slotType] = equipmentId
  return { success: true }
}

function unequip(templateId, slotType) {
  if (!equippedGear.value[templateId]) {
    return false
  }
  if (!equippedGear.value[templateId][slotType]) {
    return false
  }
  equippedGear.value[templateId][slotType] = null
  return true
}

function getEquippedGear(templateId) {
  return equippedGear.value[templateId] || {
    weapon: null,
    armor: null,
    trinket: null,
    special: null
  }
}

function getAvailableForSlot(slotType) {
  const result = []

  for (const [equipmentId, count] of Object.entries(ownedEquipment.value)) {
    const equipment = getEquipment(equipmentId)
    if (!equipment) continue

    // Check slot compatibility
    const equipSlot = equipment.slot
    let matches = false

    if (slotType === 'weapon' && equipSlot === 'weapon') matches = true
    if (slotType === 'armor' && equipSlot === 'armor') matches = true
    if (slotType === 'trinket' && (equipSlot === 'ring' || equipSlot === 'cloak')) matches = true
    if (slotType === 'special' && Object.values(CLASS_SLOTS).includes(equipSlot)) matches = true

    if (!matches) continue

    // Count how many are equipped
    let equippedCount = 0
    for (const tId of Object.keys(equippedGear.value)) {
      const gear = equippedGear.value[tId]
      for (const slot of Object.keys(gear)) {
        if (gear[slot] === equipmentId) {
          equippedCount++
        }
      }
    }

    const available = count - equippedCount
    if (available > 0) {
      result.push({ id: equipmentId, count: available })
    }
  }

  return result
}
```

**Step 4: Run test to verify it passes**

Run: `cd /home/deltran/code/dorf/.worktrees/equipment && npm test -- src/stores/__tests__/equipment.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/equipment.js src/stores/__tests__/equipment.test.js
git commit -m "feat(equipment): add equip/unequip functionality

Equipment binds to hero templates. Tracks equipped counts against owned
counts. getAvailableForSlot returns unequipped items matching slot type.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Equipment Store - Upgrade System

**Files:**
- Modify: `src/stores/equipment.js`
- Modify: `src/stores/__tests__/equipment.test.js`

**Step 1: Add failing tests**

Add to `src/stores/__tests__/equipment.test.js`:

```javascript
import { useGachaStore } from '../gacha'
import { useInventoryStore } from '../inventory'

describe('canUpgrade', () => {
  beforeEach(() => {
    // Need gacha and inventory stores for upgrade tests
  })

  it('returns upgrade requirements', () => {
    const store = useEquipmentStore()
    store.addEquipment('rusty_shiv', 2)

    const result = store.canUpgrade('rusty_shiv')
    expect(result.canUpgrade).toBe(true)
    expect(result.copiesNeeded).toBe(2)
    expect(result.copiesHave).toBe(2)
    expect(result.goldCost).toBeGreaterThan(0)
    expect(result.materialId).toBe('common_weapon_stone')
    expect(result.materialCount).toBeGreaterThan(0)
    expect(result.resultId).toBe('worn_blade')
  })

  it('returns false if not enough copies', () => {
    const store = useEquipmentStore()
    store.addEquipment('rusty_shiv', 1)

    const result = store.canUpgrade('rusty_shiv')
    expect(result.canUpgrade).toBe(false)
    expect(result.copiesNeeded).toBe(2)
    expect(result.copiesHave).toBe(1)
  })

  it('returns false for max tier equipment', () => {
    const store = useEquipmentStore()
    store.addEquipment('kingslayer', 2)

    const result = store.canUpgrade('kingslayer')
    expect(result.canUpgrade).toBe(false)
    expect(result.message).toContain('max tier')
  })
})

describe('upgrade', () => {
  it('upgrades equipment when requirements met', () => {
    const equipStore = useEquipmentStore()
    const gachaStore = useGachaStore()
    const inventoryStore = useInventoryStore()

    equipStore.addEquipment('rusty_shiv', 2)
    gachaStore.addGold(10000)
    inventoryStore.addItem('common_weapon_stone', 5)

    const result = equipStore.upgrade('rusty_shiv')
    expect(result.success).toBe(true)
    expect(equipStore.getOwnedCount('rusty_shiv')).toBe(0)
    expect(equipStore.getOwnedCount('worn_blade')).toBe(1)
  })

  it('fails if not enough gold', () => {
    const equipStore = useEquipmentStore()
    const gachaStore = useGachaStore()
    const inventoryStore = useInventoryStore()

    equipStore.addEquipment('rusty_shiv', 2)
    gachaStore.gold = 0
    inventoryStore.addItem('common_weapon_stone', 5)

    const result = equipStore.upgrade('rusty_shiv')
    expect(result.success).toBe(false)
    expect(result.message).toContain('gold')
  })

  it('fails if not enough materials', () => {
    const equipStore = useEquipmentStore()
    const gachaStore = useGachaStore()

    equipStore.addEquipment('rusty_shiv', 2)
    gachaStore.addGold(10000)
    // No materials added

    const result = equipStore.upgrade('rusty_shiv')
    expect(result.success).toBe(false)
    expect(result.message).toContain('material')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd /home/deltran/code/dorf/.worktrees/equipment && npm test -- src/stores/__tests__/equipment.test.js`
Expected: FAIL

**Step 3: Add upgrade functions**

Add to `src/stores/equipment.js`:

```javascript
import { useGachaStore } from './gacha'
import { useInventoryStore } from './inventory'
import { UPGRADE_MATERIALS } from '@/data/items'

// Upgrade costs scale with target tier
const UPGRADE_GOLD_COST = {
  2: 500,    // 1★ → 2★
  3: 1500,   // 2★ → 3★
  4: 4000,   // 3★ → 4★
  5: 10000   // 4★ → 5★
}

const UPGRADE_MATERIAL_COUNT = {
  2: 2,   // 1★ → 2★
  3: 4,   // 2★ → 3★
  4: 8,   // 3★ → 4★
  5: 15   // 4★ → 5★
}

function getMaterialSlotType(equipmentSlot) {
  if (equipmentSlot === 'weapon') return 'weapon'
  if (equipmentSlot === 'armor') return 'armor'
  if (equipmentSlot === 'ring' || equipmentSlot === 'cloak') return 'trinket'
  // All class slots use class materials
  return 'class'
}

function canUpgrade(equipmentId) {
  const equipment = getEquipment(equipmentId)
  if (!equipment) {
    return { canUpgrade: false, message: 'Equipment not found' }
  }

  if (!equipment.upgradesTo) {
    return { canUpgrade: false, message: 'Equipment is at max tier' }
  }

  const targetEquipment = getEquipment(equipment.upgradesTo)
  const targetTier = targetEquipment.rarity

  const copiesNeeded = 2
  const copiesHave = getOwnedCount(equipmentId)

  const goldCost = UPGRADE_GOLD_COST[targetTier]
  const materialSlot = getMaterialSlotType(equipment.slot)
  const materialId = UPGRADE_MATERIALS[materialSlot][equipment.rarity]
  const materialCount = UPGRADE_MATERIAL_COUNT[targetTier]

  const inventoryStore = useInventoryStore()
  const materialsHave = inventoryStore.getItemCount(materialId)

  const gachaStore = useGachaStore()
  const goldHave = gachaStore.gold

  const canUpgradeResult = copiesHave >= copiesNeeded &&
                           goldHave >= goldCost &&
                           materialsHave >= materialCount

  return {
    canUpgrade: canUpgradeResult,
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

function upgrade(equipmentId) {
  const check = canUpgrade(equipmentId)

  if (!check.canUpgrade) {
    if (check.copiesHave < check.copiesNeeded) {
      return { success: false, message: 'Not enough copies' }
    }
    if (check.goldHave < check.goldCost) {
      return { success: false, message: 'Not enough gold' }
    }
    if (check.materialsHave < check.materialCount) {
      return { success: false, message: 'Not enough material' }
    }
    return { success: false, message: check.message || 'Cannot upgrade' }
  }

  const gachaStore = useGachaStore()
  const inventoryStore = useInventoryStore()

  // Consume resources
  removeEquipment(equipmentId, 2)
  gachaStore.spendGold(check.goldCost)
  inventoryStore.removeItem(check.materialId, check.materialCount)

  // Add result
  addEquipment(check.resultId, 1)

  return {
    success: true,
    resultId: check.resultId,
    goldSpent: check.goldCost,
    materialsSpent: check.materialCount
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd /home/deltran/code/dorf/.worktrees/equipment && npm test -- src/stores/__tests__/equipment.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/equipment.js src/stores/__tests__/equipment.test.js
git commit -m "feat(equipment): add merge-to-upgrade system

Equipment upgrades require 2 copies + gold + materials. Consumes
resources and produces next tier item. Costs scale with target tier.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Integrate Equipment Stats into Battle

**Files:**
- Modify: `src/stores/battle.js`
- Create: `src/stores/__tests__/battle-equipment.test.js`

**Step 1: Write the failing test**

```javascript
// src/stores/__tests__/battle-equipment.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { useEquipmentStore } from '../equipment'

describe('battle equipment integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('applies weapon ATK bonus to hero', () => {
    const heroesStore = useHeroesStore()
    const equipStore = useEquipmentStore()
    const battleStore = useBattleStore()

    // Add Aurora to collection and party
    heroesStore.addHero('aurora_the_dawn')
    const aurora = heroesStore.collection[0]
    heroesStore.addToParty(aurora.instanceId)

    // Equip weapon
    equipStore.addEquipment('kingslayer')
    equipStore.equip('aurora_the_dawn', 'kingslayer', 'weapon')

    // Start battle
    battleStore.initBattle([{ enemies: ['forest_goblin'] }])

    // Check that hero has boosted ATK
    const heroInBattle = battleStore.heroes[0]
    const baseAtk = heroesStore.getHeroStats(aurora).atk
    expect(heroInBattle.currentAtk).toBe(baseAtk + 80) // Kingslayer gives +80 ATK
  })

  it('applies armor DEF and HP bonus', () => {
    const heroesStore = useHeroesStore()
    const equipStore = useEquipmentStore()
    const battleStore = useBattleStore()

    heroesStore.addHero('aurora_the_dawn')
    const aurora = heroesStore.collection[0]
    heroesStore.addToParty(aurora.instanceId)

    equipStore.addEquipment('warlords_mantle')
    equipStore.equip('aurora_the_dawn', 'warlords_mantle', 'armor')

    battleStore.initBattle([{ enemies: ['forest_goblin'] }])

    const heroInBattle = battleStore.heroes[0]
    const baseStats = heroesStore.getHeroStats(aurora)
    expect(heroInBattle.currentDef).toBe(baseStats.def + 50)
    expect(heroInBattle.maxHp).toBe(baseStats.hp + 300)
  })

  it('does not apply equipment to heroes on expedition', () => {
    const heroesStore = useHeroesStore()
    const equipStore = useEquipmentStore()
    const battleStore = useBattleStore()

    heroesStore.addHero('aurora_the_dawn')
    const aurora = heroesStore.collection[0]
    aurora.explorationNodeId = 'some_exploration' // Simulate on expedition
    heroesStore.addToParty(aurora.instanceId)

    equipStore.addEquipment('kingslayer')
    equipStore.equip('aurora_the_dawn', 'kingslayer', 'weapon')

    battleStore.initBattle([{ enemies: ['forest_goblin'] }])

    const heroInBattle = battleStore.heroes[0]
    const baseAtk = heroesStore.getHeroStats(aurora).atk
    expect(heroInBattle.currentAtk).toBe(baseAtk) // No bonus
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd /home/deltran/code/dorf/.worktrees/equipment && npm test -- src/stores/__tests__/battle-equipment.test.js`
Expected: FAIL

**Step 3: Integrate equipment into battle init**

In `src/stores/battle.js`, modify the hero initialization in `initBattle`:

```javascript
import { useEquipmentStore } from './equipment'
import { getEquipment } from '@/data/equipment'

// In initBattle, where heroes are set up:
function getEquipmentBonuses(templateId, isOnExpedition) {
  if (isOnExpedition) {
    return { atk: 0, def: 0, hp: 0, spd: 0 }
  }

  const equipStore = useEquipmentStore()
  const gear = equipStore.getEquippedGear(templateId)

  const bonuses = { atk: 0, def: 0, hp: 0, spd: 0 }

  for (const slotType of ['weapon', 'armor', 'trinket', 'special']) {
    const equipmentId = gear[slotType]
    if (!equipmentId) continue

    const equipment = getEquipment(equipmentId)
    if (!equipment || !equipment.stats) continue

    for (const [stat, value] of Object.entries(equipment.stats)) {
      if (bonuses[stat] !== undefined) {
        bonuses[stat] += value
      }
    }
  }

  return bonuses
}

// Then in the hero setup loop:
const equipBonuses = getEquipmentBonuses(hero.templateId, !!hero.explorationNodeId)
// Apply to currentAtk, currentDef, maxHp, currentSpd
```

**Step 4: Run test to verify it passes**

Run: `cd /home/deltran/code/dorf/.worktrees/equipment && npm test -- src/stores/__tests__/battle-equipment.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/battle.js src/stores/__tests__/battle-equipment.test.js
git commit -m "feat(equipment): integrate equipment stats into battle

Equipment bonuses apply to hero stats at battle start. Heroes on
expedition do not receive equipment bonuses per design.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Equipment Effects in Battle (Placeholder)

**Files:**
- Modify: `src/stores/battle.js`
- Modify: `src/stores/__tests__/battle-equipment.test.js`

**Note:** This task sets up the effect application framework. Individual effects (crit, evasion boost, etc.) can be implemented incrementally.

**Step 1: Write failing test for one effect**

```javascript
describe('equipment effects', () => {
  it('applies mp_regen effect at start of turn', () => {
    const heroesStore = useHeroesStore()
    const equipStore = useEquipmentStore()
    const battleStore = useBattleStore()

    heroesStore.addHero('aurora_the_dawn')
    const aurora = heroesStore.collection[0]
    heroesStore.addToParty(aurora.instanceId)

    // Cracked Ring: +1 MP regen per turn
    equipStore.addEquipment('cracked_ring')
    equipStore.equip('aurora_the_dawn', 'cracked_ring', 'trinket')

    battleStore.initBattle([{ enemies: ['forest_goblin'] }])

    const heroInBattle = battleStore.heroes[0]
    const startMp = heroInBattle.currentMp

    // Process start of turn
    battleStore.processStartOfTurnEffects(heroInBattle)

    expect(heroInBattle.currentMp).toBe(Math.min(startMp + 1, heroInBattle.maxMp))
  })
})
```

**Step 2-5:** Implement effect processing framework and commit.

---

## Task 8: Hero Detail Equipment UI

**Files:**
- Modify: `src/screens/HeroesScreen.vue`
- Create: `src/components/EquipmentSlot.vue`

**Note:** This adds the equipment section to hero detail view. Details in implementation.

---

## Task 9: Equipment Selection Modal

**Files:**
- Create: `src/components/EquipmentSelectModal.vue`

**Note:** Modal for selecting equipment to equip to a slot.

---

## Task 10: Blacksmith Section in Shops

**Files:**
- Modify: `src/screens/ShopsScreen.vue`
- Create: `src/components/BlacksmithSection.vue`

**Note:** Adds blacksmith tab/section for equipment management and upgrades.

---

## Task 11: Inventory Equipment Integration

**Files:**
- Modify: `src/screens/InventoryScreen.vue`

**Note:** Add "Upgrade" action to equipment items in inventory detail view.

---

## Task 12: Persistence Integration

**Files:**
- Modify: `src/App.vue` (or wherever save/load is handled)

**Note:** Add equipment store to save/load cycle.

---

## Summary

| Task | Description | Complexity |
|------|-------------|------------|
| 1 | Equipment data definitions | Medium |
| 2 | Upgrade materials in items.js | Low |
| 3 | Equipment store - basic state | Low |
| 4 | Equipment store - equip/unequip | Medium |
| 5 | Equipment store - upgrade system | Medium |
| 6 | Battle stat integration | Medium |
| 7 | Battle effect framework | High |
| 8 | Hero detail equipment UI | Medium |
| 9 | Equipment selection modal | Medium |
| 10 | Blacksmith shop section | Medium |
| 11 | Inventory integration | Low |
| 12 | Persistence | Low |

Tasks 1-6 are the core system. Tasks 7-12 are UI and polish.
