// Note: No background image defined in original questNodes.js for this region

export const regionMeta = {
  id: 'coral_depths',
  name: 'Coral Depths',
  description: 'Twisting coral tunnels plunge into the ocean floor, their vibrant colors masking lethal dangers. Moray eels strike from hidden crevices, and barnacle clusters cling to every surface, ready to shred the unwary.',
  superRegion: 'aquarias',
  startNode: 'coral_01',
  width: 600,
  height: 1000,
  backgroundColor: '#0a2a3a'
}

export const nodes = {
  coral_01: {
    id: 'coral_01',
    name: 'Coral Tunnels',
    region: 'Coral Depths',
    x: 557,
    y: 899,
    battles: [
      { enemies: ['cave_crab', 'moray_eel', 'moray_eel'] },
      { enemies: ['barnacle_cluster', 'cave_crab', 'reef_warden'] },
      { enemies: ['moray_eel', 'moray_eel', 'barnacle_cluster', 'cave_crab'] }
    ],
    connections: ['coral_02'],
    rewards: { gems: 100, gold: 1600, exp: 1600 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      { itemId: 'token_gate_to_aquaria', min: 1, max: 1, chance: 0.1 },
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
  coral_02: {
    id: 'coral_02',
    name: 'Barnacle Narrows',
    region: 'Coral Depths',
    x: 474,
    y: 750,
    battles: [
      { enemies: ['barnacle_cluster', 'barnacle_cluster', 'cave_crab'] },
      { enemies: ['moray_eel', 'moray_eel', 'reef_warden'] },
      { enemies: ['cave_crab', 'cave_crab', 'barnacle_cluster'] },
      { enemies: ['reef_warden', 'moray_eel', 'barnacle_cluster', 'cave_crab'] }
    ],
    connections: ['coral_03'],
    rewards: { gems: 100, gold: 1650, exp: 1650 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      { itemId: 'token_gate_to_aquaria', min: 1, max: 1, chance: 0.1 },
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
  coral_03: {
    id: 'coral_03',
    name: 'Eel Hollows',
    region: 'Coral Depths',
    x: 166,
    y: 705,
    regionLinkPosition: { x: 67, y: 479 },
    battles: [
      { enemies: ['moray_eel', 'moray_eel', 'moray_eel'] },
      { enemies: ['cave_crab', 'moray_eel', 'reef_warden'] },
      { enemies: ['moray_eel', 'moray_eel', 'barnacle_cluster', 'barnacle_cluster'] },
      { enemies: ['moray_eel', 'moray_eel', 'cave_crab', 'reef_warden'] }
    ],
    connections: ['coral_04', 'prison_01'],
    rewards: { gems: 100, gold: 1700, exp: 1700 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      { itemId: 'token_gate_to_aquaria', min: 1, max: 1, chance: 0.1 },
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
  coral_04: {
    id: 'coral_04',
    name: 'Collapsed Grotto',
    region: 'Coral Depths',
    x: 404,
    y: 576,
    battles: [
      { enemies: ['cave_crab', 'cave_crab', 'reef_warden'] },
      { enemies: ['barnacle_cluster', 'moray_eel', 'moray_eel', 'cave_crab'] },
      { enemies: ['reef_warden', 'reef_warden', 'cave_crab'] },
      { enemies: ['moray_eel', 'barnacle_cluster', 'cave_crab', 'cave_crab'] },
      { enemies: ['cave_crab', 'cave_crab', 'reef_warden', 'moray_eel', 'moray_eel'] }
    ],
    connections: ['coral_05'],
    rewards: { gems: 100, gold: 1750, exp: 1750 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      { itemId: 'token_gate_to_aquaria', min: 1, max: 1, chance: 0.1 },
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
  coral_05: {
    id: 'coral_05',
    name: 'Reef Labyrinth',
    region: 'Coral Depths',
    x: 265,
    y: 420,
    battles: [
      { enemies: ['barnacle_cluster', 'barnacle_cluster', 'reef_warden', 'cave_crab'] },
      { enemies: ['moray_eel', 'moray_eel', 'moray_eel', 'barnacle_cluster'] },
      { enemies: ['reef_warden', 'cave_crab', 'cave_crab', 'moray_eel'] },
      { enemies: ['barnacle_cluster', 'reef_warden', 'moray_eel', 'moray_eel'] },
      { enemies: ['cave_crab', 'cave_crab', 'reef_warden', 'barnacle_cluster', 'moray_eel'] }
    ],
    connections: ['coral_06'],
    rewards: { gems: 100, gold: 1800, exp: 1800 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      { itemId: 'token_gate_to_aquaria', min: 1, max: 1, chance: 0.1 },
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
  coral_06: {
    id: 'coral_06',
    name: 'The Back Gate',
    region: 'Coral Depths',
    x: 284,
    y: 270,
    regionLinkPosition: { x: 286, y: 161 },
    battles: [
      { enemies: ['cave_crab', 'cave_crab', 'barnacle_cluster', 'reef_warden'] },
      { enemies: ['moray_eel', 'moray_eel', 'moray_eel', 'moray_eel'] },
      { enemies: ['reef_warden', 'reef_warden', 'cave_crab', 'cave_crab'] },
      { enemies: ['barnacle_cluster', 'barnacle_cluster', 'moray_eel', 'cave_crab', 'reef_warden'] },
      { enemies: ['cave_crab', 'cave_crab', 'cave_crab', 'reef_warden', 'reef_warden'] },
      { enemies: ['moray_eel', 'moray_eel', 'cave_crab', 'cave_crab', 'reef_warden', 'barnacle_cluster'] }
    ],
    connections: ['tidewall_01'],
    rewards: { gems: 100, gold: 1900, exp: 1900 },
    firstClearBonus: { gems: 100 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      { itemId: 'token_gate_to_aquaria', min: 1, max: 1, chance: 0.1 },
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
