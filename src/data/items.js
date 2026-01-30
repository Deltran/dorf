// src/data/items.js

export const items = {
  tome_small: {
    id: 'tome_small',
    name: 'Faded Tome',
    description: 'A worn book of basic knowledge.',
    type: 'xp',
    rarity: 1,
    xpValue: 50,
    sellReward: { gold: 50 }
  },
  tome_medium: {
    id: 'tome_medium',
    name: 'Knowledge Tome',
    description: 'A well-preserved collection of teachings.',
    type: 'xp',
    rarity: 2,
    xpValue: 200,
    sellReward: { gold: 200 }
  },
  tome_large: {
    id: 'tome_large',
    name: 'Ancient Codex',
    description: 'Centuries of wisdom bound in leather.',
    type: 'xp',
    rarity: 3,
    xpValue: 500,
    sellReward: { gold: 500 }
  },
  useless_rock: {
    id: 'useless_rock',
    name: 'Useless Rock',
    description: "It's a rock. Completely useless.",
    type: 'junk',
    rarity: 1,
    sellReward: { gems: 5 }
  },
  shiny_pebble: {
    id: 'shiny_pebble',
    name: 'Shiny Pebble',
    description: 'At least it sparkles a little.',
    type: 'junk',
    rarity: 1,
    sellReward: { gems: 8 }
  },
  goblin_trinket: {
    id: 'goblin_trinket',
    name: 'Goblin Trinket',
    description: 'A crude charm made from bone and string.',
    type: 'junk',
    rarity: 2,
    sellReward: { gems: 15 }
  },
  shard_dragon_heart: {
    id: 'shard_dragon_heart',
    name: 'Shard of Dragon Heart',
    description: 'A fragment of crystallized dragon essence. Required to ascend a hero from 3-star to 4-star.',
    type: 'merge_material',
    rarity: 3,
    sellReward: { gems: 100 }
  },
  dragon_heart: {
    id: 'dragon_heart',
    name: 'Dragon Heart',
    description: 'A complete dragon heart, pulsing with ancient power. Required to ascend a hero from 4-star to 5-star.',
    type: 'merge_material',
    rarity: 4,
    sellReward: { gems: 500 }
  },
  lake_tower_key: {
    id: 'lake_tower_key',
    name: 'Lake Tower Key',
    description: 'An ancient key that grants passage to the Lake Tower. Used to challenge Valinar.',
    type: 'key',
    rarity: 3
  },
  valinar_crest: {
    id: 'valinar_crest',
    name: "Valinar's Crest",
    description: 'A battle-worn crest pried from the Lake Tower Guardian. Its purpose remains unknown.',
    type: 'genusLoci',
    rarity: 4
  },
  den_key: {
    id: 'den_key',
    name: 'Den Key',
    description: 'A heavy iron key covered in claw marks. Grants passage to the Hibernation Den.',
    type: 'key',
    rarity: 3
  },
  great_troll_crest: {
    id: 'great_troll_crest',
    name: "Great Troll's Crest",
    description: 'A mossy stone emblem torn from the Great Troll. Its purpose remains unknown.',
    type: 'genusLoci',
    rarity: 4
  },
  eruption_vent_key: {
    id: 'eruption_vent_key',
    name: 'Eruption Vent Key',
    description: 'A key forged in volcanic glass. It pulses with heat, granting passage to the Eruption Vent.',
    type: 'key',
    rarity: 3
  },
  pyroclast_crest: {
    id: 'pyroclast_crest',
    name: "Pyroclast's Crest",
    description: 'A searing emblem torn from the Living Eruption. Its surface still glows with molten fury.',
    type: 'genusLoci',
    rarity: 4
  },
  magical_rocks: {
    id: 'magical_rocks',
    name: 'Magical Rocks',
    description: "I don't know how powerful the magic is, but they glow, so they are worth something.",
    type: 'junk',
    rarity: 3,
    sellReward: { gold: 600 }
  },
  // Region tokens - auto-collect rewards from completed quests
  token_whispering_woods: {
    id: 'token_whispering_woods',
    name: 'Whispering Woods Token',
    description: 'Instantly collect rewards from a completed Whispering Woods quest.',
    type: 'token',
    rarity: 3,
    region: 'Whispering Woods'
  },
  token_whisper_lake: {
    id: 'token_whisper_lake',
    name: 'Whisper Lake Token',
    description: 'Instantly collect rewards from a completed Whisper Lake quest.',
    type: 'token',
    rarity: 3,
    region: 'Whisper Lake'
  },
  token_echoing_caverns: {
    id: 'token_echoing_caverns',
    name: 'Echoing Caverns Token',
    description: 'Instantly collect rewards from a completed Echoing Caverns quest.',
    type: 'token',
    rarity: 3,
    region: 'Echoing Caverns'
  },
  token_stormwind_peaks: {
    id: 'token_stormwind_peaks',
    name: 'Stormwind Peaks Token',
    description: 'Instantly collect rewards from a completed Stormwind Peaks quest.',
    type: 'token',
    rarity: 3,
    region: 'Stormwind Peaks'
  },
  token_blistering_cliffs: {
    id: 'token_blistering_cliffs',
    name: 'Blistering Cliffs Token',
    description: 'Instantly collect rewards from a completed Blistering Cliffsides quest.',
    type: 'token',
    rarity: 3,
    region: 'Blistering Cliffsides'
  },
  token_summit: {
    id: 'token_summit',
    name: 'Summit Token',
    description: 'Instantly collect rewards from a completed Summit quest.',
    type: 'token',
    rarity: 3,
    region: 'The Summit'
  },
  token_gate_to_aquaria: {
    id: 'token_gate_to_aquaria',
    name: 'Gate to Aquaria Token',
    description: 'Instantly collect rewards from a completed Gate to Aquaria quest.',
    type: 'token',
    rarity: 3,
    region: 'Gate to Aquaria'
  },
  token_janxier_floodplain: {
    id: 'token_janxier_floodplain',
    name: 'Janxier Floodplain Token',
    description: 'Instantly collect rewards from a completed Janxier Floodplain quest.',
    type: 'token',
    rarity: 3,
    region: 'Janxier Floodplain'
  },

  // Equipment upgrade materials - Weapon stones
  common_weapon_stone: {
    id: 'common_weapon_stone',
    name: 'Common Weapon Stone',
    description: 'A rough whetstone used to sharpen basic weapons.',
    type: 'equipment_material',
    rarity: 1,
    materialSlot: 'weapon',
    materialTier: 1
  },
  uncommon_weapon_stone: {
    id: 'uncommon_weapon_stone',
    name: 'Uncommon Weapon Stone',
    description: 'A quality sharpening stone that brings out a weapon\'s edge.',
    type: 'equipment_material',
    rarity: 2,
    materialSlot: 'weapon',
    materialTier: 2
  },
  rare_weapon_stone: {
    id: 'rare_weapon_stone',
    name: 'Rare Weapon Stone',
    description: 'A fine-grained stone infused with strengthening minerals.',
    type: 'equipment_material',
    rarity: 3,
    materialSlot: 'weapon',
    materialTier: 3
  },
  epic_weapon_stone: {
    id: 'epic_weapon_stone',
    name: 'Epic Weapon Stone',
    description: 'A legendary whetstone that can transform ordinary steel into masterwork.',
    type: 'equipment_material',
    rarity: 4,
    materialSlot: 'weapon',
    materialTier: 4
  },

  // Equipment upgrade materials - Armor plates
  common_armor_plate: {
    id: 'common_armor_plate',
    name: 'Common Armor Plate',
    description: 'A basic metal plate for reinforcing armor.',
    type: 'equipment_material',
    rarity: 1,
    materialSlot: 'armor',
    materialTier: 1
  },
  uncommon_armor_plate: {
    id: 'uncommon_armor_plate',
    name: 'Uncommon Armor Plate',
    description: 'A sturdy plate of tempered steel for armor enhancement.',
    type: 'equipment_material',
    rarity: 2,
    materialSlot: 'armor',
    materialTier: 2
  },
  rare_armor_plate: {
    id: 'rare_armor_plate',
    name: 'Rare Armor Plate',
    description: 'A reinforced plate forged with protective enchantments.',
    type: 'equipment_material',
    rarity: 3,
    materialSlot: 'armor',
    materialTier: 3
  },
  epic_armor_plate: {
    id: 'epic_armor_plate',
    name: 'Epic Armor Plate',
    description: 'A legendary plate that can make armor nearly impenetrable.',
    type: 'equipment_material',
    rarity: 4,
    materialSlot: 'armor',
    materialTier: 4
  },

  // Equipment upgrade materials - Gem shards (trinkets)
  common_gem_shard: {
    id: 'common_gem_shard',
    name: 'Common Gem Shard',
    description: 'A fragment of a magical gem with faint power.',
    type: 'equipment_material',
    rarity: 1,
    materialSlot: 'trinket',
    materialTier: 1
  },
  uncommon_gem_shard: {
    id: 'uncommon_gem_shard',
    name: 'Uncommon Gem Shard',
    description: 'A glowing gem fragment that pulses with energy.',
    type: 'equipment_material',
    rarity: 2,
    materialSlot: 'trinket',
    materialTier: 2
  },
  rare_gem_shard: {
    id: 'rare_gem_shard',
    name: 'Rare Gem Shard',
    description: 'A brilliant shard radiating concentrated magical essence.',
    type: 'equipment_material',
    rarity: 3,
    materialSlot: 'trinket',
    materialTier: 3
  },
  epic_gem_shard: {
    id: 'epic_gem_shard',
    name: 'Epic Gem Shard',
    description: 'A legendary gem fragment with reality-bending properties.',
    type: 'equipment_material',
    rarity: 4,
    materialSlot: 'trinket',
    materialTier: 4
  },

  // Equipment upgrade materials - Class tokens
  common_class_token: {
    id: 'common_class_token',
    name: 'Common Class Token',
    description: 'A basic emblem used to enhance class-specific gear.',
    type: 'equipment_material',
    rarity: 1,
    materialSlot: 'class',
    materialTier: 1
  },
  uncommon_class_token: {
    id: 'uncommon_class_token',
    name: 'Uncommon Class Token',
    description: 'A polished token inscribed with profession secrets.',
    type: 'equipment_material',
    rarity: 2,
    materialSlot: 'class',
    materialTier: 2
  },
  rare_class_token: {
    id: 'rare_class_token',
    name: 'Rare Class Token',
    description: 'A masterwork token blessed by guild artisans.',
    type: 'equipment_material',
    rarity: 3,
    materialSlot: 'class',
    materialTier: 3
  },
  epic_class_token: {
    id: 'epic_class_token',
    name: 'Epic Class Token',
    description: 'A legendary token that channels the essence of mastery.',
    type: 'equipment_material',
    rarity: 4,
    materialSlot: 'class',
    materialTier: 4
  }
}

export function getTokenForRegion(regionName) {
  return Object.values(items).find(item =>
    item.type === 'token' && item.region === regionName
  )
}

export function getItem(itemId) {
  return items[itemId] || null
}

export function getAllItems() {
  return Object.values(items)
}

export function getItemsByType(type) {
  return Object.values(items).filter(item => item.type === type)
}

// Lookup table for upgrade materials by slot category and tier
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
