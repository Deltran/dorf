export const regionMeta = {
  id: 'blackfin_den',
  name: 'Blackfin Den',
  superRegion: 'aquarias',
  startNode: 'blackfin_01',
  width: 800,
  height: 500,
  backgroundColor: '#15151f'
}

export const nodes = {
  blackfin_01: {
    id: 'blackfin_01',
    name: 'The Blind Eye',
    region: 'Blackfin Den',
    x: 100,
    y: 250,
    battles: [
      { enemies: ['blackfin_cutthroat', 'blackfin_fence'] },
      { enemies: ['pit_fighter', 'guild_poisoner'] },
      { enemies: ['blackfin_cutthroat', 'blackfin_cutthroat', 'blackfin_fence'] }
    ],
    connections: ['blackfin_02'],
    rewards: { gems: 100, gold: 3100, exp: 3100 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      // 1-star equipment (4% each)
      { itemId: 'rusty_shiv', chance: 0.04 },
      { itemId: 'scrap_leather', chance: 0.04 },
      { itemId: 'cracked_ring', chance: 0.04 },
      { itemId: 'tattered_shroud', chance: 0.04 },
      { itemId: 'dented_buckler', chance: 0.04 },
      { itemId: 'cracked_skull', chance: 0.04 },
      { itemId: 'bent_shortbow', chance: 0.04 },
      { itemId: 'gnarled_branch', chance: 0.04 },
      { itemId: 'tarnished_pendant', chance: 0.04 },
      { itemId: 'faded_prayer_beads', chance: 0.04 },
      { itemId: 'chipped_antler', chance: 0.04 },
      { itemId: 'cracked_whistle', chance: 0.04 },
      // 1-star upgrade materials (2.5% each)
      { itemId: 'common_weapon_stone', chance: 0.025 },
      { itemId: 'common_armor_plate', chance: 0.025 },
      { itemId: 'common_gem_shard', chance: 0.025 },
      { itemId: 'common_class_token', chance: 0.025 }
    ],
    shardDropChance: 0.25
  },
  blackfin_02: {
    id: 'blackfin_02',
    name: 'Contraband Corridor',
    region: 'Blackfin Den',
    x: 250,
    y: 180,
    battles: [
      { enemies: ['guild_poisoner', 'guild_poisoner', 'blackfin_cutthroat'] },
      { enemies: ['pit_fighter', 'pit_fighter'] },
      { enemies: ['blackfin_fence', 'blackfin_cutthroat', 'guild_poisoner'] },
      { enemies: ['blackfin_cutthroat', 'blackfin_cutthroat', 'pit_fighter'] }
    ],
    connections: ['blackfin_03'],
    rewards: { gems: 100, gold: 3150, exp: 3150 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      // 1-star equipment (4% each)
      { itemId: 'rusty_shiv', chance: 0.04 },
      { itemId: 'scrap_leather', chance: 0.04 },
      { itemId: 'cracked_ring', chance: 0.04 },
      { itemId: 'tattered_shroud', chance: 0.04 },
      { itemId: 'dented_buckler', chance: 0.04 },
      { itemId: 'cracked_skull', chance: 0.04 },
      { itemId: 'bent_shortbow', chance: 0.04 },
      { itemId: 'gnarled_branch', chance: 0.04 },
      { itemId: 'tarnished_pendant', chance: 0.04 },
      { itemId: 'faded_prayer_beads', chance: 0.04 },
      { itemId: 'chipped_antler', chance: 0.04 },
      { itemId: 'cracked_whistle', chance: 0.04 },
      // 1-star upgrade materials (2.5% each)
      { itemId: 'common_weapon_stone', chance: 0.025 },
      { itemId: 'common_armor_plate', chance: 0.025 },
      { itemId: 'common_gem_shard', chance: 0.025 },
      { itemId: 'common_class_token', chance: 0.025 }
    ],
    shardDropChance: 0.25
  },
  blackfin_03: {
    id: 'blackfin_03',
    name: 'The Betting Pits',
    region: 'Blackfin Den',
    x: 400,
    y: 300,
    battles: [
      { enemies: ['pit_fighter', 'pit_fighter', 'pit_fighter'] },
      { enemies: ['blackfin_cutthroat', 'blackfin_cutthroat', 'blackfin_fence'] },
      { enemies: ['guild_poisoner', 'guild_poisoner', 'pit_fighter', 'blackfin_fence'] },
      { enemies: ['pit_fighter', 'pit_fighter', 'blackfin_cutthroat', 'guild_poisoner'] }
    ],
    connections: ['blackfin_04'],
    rewards: { gems: 100, gold: 3200, exp: 3200 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      // 1-star equipment (4% each)
      { itemId: 'rusty_shiv', chance: 0.04 },
      { itemId: 'scrap_leather', chance: 0.04 },
      { itemId: 'cracked_ring', chance: 0.04 },
      { itemId: 'tattered_shroud', chance: 0.04 },
      { itemId: 'dented_buckler', chance: 0.04 },
      { itemId: 'cracked_skull', chance: 0.04 },
      { itemId: 'bent_shortbow', chance: 0.04 },
      { itemId: 'gnarled_branch', chance: 0.04 },
      { itemId: 'tarnished_pendant', chance: 0.04 },
      { itemId: 'faded_prayer_beads', chance: 0.04 },
      { itemId: 'chipped_antler', chance: 0.04 },
      { itemId: 'cracked_whistle', chance: 0.04 },
      // 1-star upgrade materials (2.5% each)
      { itemId: 'common_weapon_stone', chance: 0.025 },
      { itemId: 'common_armor_plate', chance: 0.025 },
      { itemId: 'common_gem_shard', chance: 0.025 },
      { itemId: 'common_class_token', chance: 0.025 }
    ],
    shardDropChance: 0.25
  },
  blackfin_04: {
    id: 'blackfin_04',
    name: "Fence's Vault",
    region: 'Blackfin Den',
    x: 550,
    y: 200,
    battles: [
      { enemies: ['blackfin_fence', 'blackfin_fence', 'blackfin_cutthroat', 'blackfin_cutthroat'] },
      { enemies: ['guild_poisoner', 'guild_poisoner', 'guild_poisoner'] },
      { enemies: ['pit_fighter', 'pit_fighter', 'blackfin_fence', 'guild_poisoner'] },
      { enemies: ['blackfin_cutthroat', 'blackfin_cutthroat', 'blackfin_cutthroat', 'pit_fighter'] },
      { enemies: ['blackfin_fence', 'guild_poisoner', 'pit_fighter', 'blackfin_cutthroat'] }
    ],
    connections: ['blackfin_05'],
    rewards: { gems: 100, gold: 3250, exp: 3250 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      // 1-star equipment (4% each)
      { itemId: 'rusty_shiv', chance: 0.04 },
      { itemId: 'scrap_leather', chance: 0.04 },
      { itemId: 'cracked_ring', chance: 0.04 },
      { itemId: 'tattered_shroud', chance: 0.04 },
      { itemId: 'dented_buckler', chance: 0.04 },
      { itemId: 'cracked_skull', chance: 0.04 },
      { itemId: 'bent_shortbow', chance: 0.04 },
      { itemId: 'gnarled_branch', chance: 0.04 },
      { itemId: 'tarnished_pendant', chance: 0.04 },
      { itemId: 'faded_prayer_beads', chance: 0.04 },
      { itemId: 'chipped_antler', chance: 0.04 },
      { itemId: 'cracked_whistle', chance: 0.04 },
      // 1-star upgrade materials (2.5% each)
      { itemId: 'common_weapon_stone', chance: 0.025 },
      { itemId: 'common_armor_plate', chance: 0.025 },
      { itemId: 'common_gem_shard', chance: 0.025 },
      { itemId: 'common_class_token', chance: 0.025 }
    ],
    shardDropChance: 0.25
  },
  blackfin_05: {
    id: 'blackfin_05',
    name: "Guildmaster's Throne",
    region: 'Blackfin Den',
    x: 700,
    y: 280,
    battles: [
      { enemies: ['pit_fighter', 'pit_fighter', 'blackfin_cutthroat', 'blackfin_cutthroat'] },
      { enemies: ['blackfin_fence', 'blackfin_fence', 'guild_poisoner', 'guild_poisoner'] },
      { enemies: ['blackfin_cutthroat', 'blackfin_cutthroat', 'blackfin_cutthroat', 'blackfin_fence'] },
      { enemies: ['guild_poisoner', 'guild_poisoner', 'pit_fighter', 'pit_fighter', 'blackfin_fence'] },
      { enemies: ['pit_fighter', 'pit_fighter', 'pit_fighter', 'blackfin_cutthroat', 'guild_poisoner'] }
    ],
    connections: [],
    rewards: { gems: 100, gold: 3300, exp: 3300 },
    firstClearBonus: { gems: 100 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      // 1-star equipment (4% each)
      { itemId: 'rusty_shiv', chance: 0.04 },
      { itemId: 'scrap_leather', chance: 0.04 },
      { itemId: 'cracked_ring', chance: 0.04 },
      { itemId: 'tattered_shroud', chance: 0.04 },
      { itemId: 'dented_buckler', chance: 0.04 },
      { itemId: 'cracked_skull', chance: 0.04 },
      { itemId: 'bent_shortbow', chance: 0.04 },
      { itemId: 'gnarled_branch', chance: 0.04 },
      { itemId: 'tarnished_pendant', chance: 0.04 },
      { itemId: 'faded_prayer_beads', chance: 0.04 },
      { itemId: 'chipped_antler', chance: 0.04 },
      { itemId: 'cracked_whistle', chance: 0.04 },
      // 1-star upgrade materials (2.5% each)
      { itemId: 'common_weapon_stone', chance: 0.025 },
      { itemId: 'common_armor_plate', chance: 0.025 },
      { itemId: 'common_gem_shard', chance: 0.025 },
      { itemId: 'common_class_token', chance: 0.025 }
    ],
    shardDropChance: 0.25
  }
}
