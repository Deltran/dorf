export const regionMeta = {
  id: 'pearlgate_plaza',
  name: 'Pearlgate Plaza',
  superRegion: 'aquarias',
  startNode: 'pearlgate_01',
  width: 800,
  height: 500,
  backgroundColor: '#1a3040'
}

export const nodes = {
  pearlgate_01: {
    id: 'pearlgate_01',
    name: 'Pearlgate Approach',
    region: 'Pearlgate Plaza',
    x: 100,
    y: 250,
    battles: [
      { enemies: ['pearl_guard', 'nobles_bodyguard'] },
      { enemies: ['court_mage', 'pearl_guard'] },
      { enemies: ['gilded_construct', 'pearl_guard'] }
    ],
    connections: ['pearlgate_02'],
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
  pearlgate_02: {
    id: 'pearlgate_02',
    name: 'Credential Check',
    region: 'Pearlgate Plaza',
    x: 250,
    y: 180,
    battles: [
      { enemies: ['pearl_guard', 'pearl_guard', 'nobles_bodyguard'] },
      { enemies: ['court_mage', 'court_mage', 'pearl_guard'] },
      { enemies: ['gilded_construct', 'nobles_bodyguard'] },
      { enemies: ['pearl_guard', 'pearl_guard', 'court_mage', 'nobles_bodyguard'] }
    ],
    connections: ['pearlgate_03'],
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
  pearlgate_03: {
    id: 'pearlgate_03',
    name: "Noble's Promenade",
    region: 'Pearlgate Plaza',
    x: 400,
    y: 300,
    battles: [
      { enemies: ['nobles_bodyguard', 'nobles_bodyguard', 'court_mage'] },
      { enemies: ['pearl_guard', 'pearl_guard', 'pearl_guard'] },
      { enemies: ['gilded_construct', 'court_mage', 'nobles_bodyguard'] },
      { enemies: ['pearl_guard', 'nobles_bodyguard', 'court_mage', 'court_mage'] }
    ],
    connections: ['pearlgate_04'],
    rewards: { gems: 100, gold: 3250, exp: 3250 },
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
  pearlgate_04: {
    id: 'pearlgate_04',
    name: "Servant's Corridor",
    region: 'Pearlgate Plaza',
    x: 550,
    y: 200,
    battles: [
      { enemies: ['court_mage', 'court_mage', 'court_mage'] },
      { enemies: ['gilded_construct', 'gilded_construct'] },
      { enemies: ['pearl_guard', 'pearl_guard', 'nobles_bodyguard', 'nobles_bodyguard'] },
      { enemies: ['court_mage', 'nobles_bodyguard', 'pearl_guard', 'pearl_guard'] },
      { enemies: ['gilded_construct', 'court_mage', 'court_mage'] }
    ],
    connections: ['pearlgate_05'],
    rewards: { gems: 100, gold: 3300, exp: 3300 },
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
  pearlgate_05: {
    id: 'pearlgate_05',
    name: 'Castle Forecourt',
    region: 'Pearlgate Plaza',
    x: 700,
    y: 280,
    battles: [
      { enemies: ['gilded_construct', 'gilded_construct', 'court_mage'] },
      { enemies: ['pearl_guard', 'pearl_guard', 'pearl_guard', 'nobles_bodyguard'] },
      { enemies: ['nobles_bodyguard', 'nobles_bodyguard', 'court_mage', 'court_mage'] },
      { enemies: ['gilded_construct', 'pearl_guard', 'pearl_guard', 'court_mage'] },
      { enemies: ['pearl_guard', 'pearl_guard', 'nobles_bodyguard', 'nobles_bodyguard', 'court_mage'] }
    ],
    connections: ['castle_01'],
    rewards: { gems: 100, gold: 3350, exp: 3350 },
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
