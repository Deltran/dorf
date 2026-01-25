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
