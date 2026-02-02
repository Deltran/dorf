export const regionMeta = {
  id: 'scalding_traverse',
  name: 'Scalding Traverse',
  superRegion: 'aquarias',
  startNode: 'scalding_01',
  width: 600,
  height: 1000,
  backgroundColor: '#2a1a15'
}

export const nodes = {
  scalding_01: {
    id: 'scalding_01',
    name: 'Boiling Gates',
    region: 'Scalding Traverse',
    x: 100,
    y: 250,
    battles: [
      { enemies: ['vent_crawler', 'magma_eel'] },
      { enemies: ['volcanic_polyp', 'thermal_elemental'] },
      { enemies: ['vent_crawler', 'vent_crawler', 'magma_eel'] }
    ],
    connections: ['scalding_02'],
    rewards: { gems: 100, gold: 4050, exp: 4050 },
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
  scalding_02: {
    id: 'scalding_02',
    name: 'Vent Field Crossing',
    region: 'Scalding Traverse',
    x: 250,
    y: 180,
    battles: [
      { enemies: ['magma_eel', 'magma_eel', 'vent_crawler'] },
      { enemies: ['thermal_elemental', 'volcanic_polyp', 'magma_eel'] },
      { enemies: ['vent_crawler', 'vent_crawler', 'thermal_elemental'] },
      { enemies: ['volcanic_polyp', 'volcanic_polyp', 'magma_eel', 'magma_eel'] }
    ],
    connections: ['scalding_03'],
    rewards: { gems: 100, gold: 4100, exp: 4100 },
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
  scalding_03: {
    id: 'scalding_03',
    name: 'Obsidian Labyrinth',
    region: 'Scalding Traverse',
    x: 400,
    y: 300,
    battles: [
      { enemies: ['vent_crawler', 'vent_crawler', 'vent_crawler'] },
      { enemies: ['thermal_elemental', 'thermal_elemental', 'volcanic_polyp'] },
      { enemies: ['magma_eel', 'magma_eel', 'magma_eel', 'vent_crawler'] },
      { enemies: ['volcanic_polyp', 'thermal_elemental', 'vent_crawler', 'magma_eel'] }
    ],
    connections: ['scalding_04'],
    rewards: { gems: 100, gold: 4150, exp: 4150 },
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
  scalding_04: {
    id: 'scalding_04',
    name: 'The Scorched Beds',
    region: 'Scalding Traverse',
    x: 550,
    y: 200,
    battles: [
      { enemies: ['thermal_elemental', 'thermal_elemental', 'magma_eel', 'magma_eel'] },
      { enemies: ['vent_crawler', 'vent_crawler', 'volcanic_polyp', 'volcanic_polyp'] },
      { enemies: ['magma_eel', 'magma_eel', 'magma_eel', 'thermal_elemental'] },
      { enemies: ['volcanic_polyp', 'volcanic_polyp', 'vent_crawler', 'vent_crawler', 'magma_eel'] },
      { enemies: ['thermal_elemental', 'thermal_elemental', 'thermal_elemental'] }
    ],
    connections: ['scalding_05', 'nursery_01'],
    rewards: { gems: 100, gold: 4200, exp: 4200 },
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
  scalding_05: {
    id: 'scalding_05',
    name: 'Abyssal Threshold',
    region: 'Scalding Traverse',
    x: 700,
    y: 280,
    battles: [
      { enemies: ['vent_crawler', 'vent_crawler', 'thermal_elemental', 'thermal_elemental'] },
      { enemies: ['magma_eel', 'magma_eel', 'magma_eel', 'volcanic_polyp'] },
      { enemies: ['volcanic_polyp', 'volcanic_polyp', 'thermal_elemental', 'vent_crawler'] },
      { enemies: ['thermal_elemental', 'thermal_elemental', 'magma_eel', 'magma_eel', 'volcanic_polyp'] },
      { enemies: ['vent_crawler', 'vent_crawler', 'vent_crawler', 'thermal_elemental', 'magma_eel'] }
    ],
    connections: ['abyss_01'],
    rewards: { gems: 100, gold: 4250, exp: 4250 },
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
