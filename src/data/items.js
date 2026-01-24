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
  }
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
