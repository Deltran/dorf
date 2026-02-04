export const regionMeta = {
  id: 'sunken_shipyard',
  name: 'Sunken Shipyard',
  description: 'A graveyard of capsized vessels resting on the ocean floor, their hulls encrusted with barnacles and haunted by drowned sailors. Shipwreck sirens sing from the wreckage, luring the living to join the dead among the rotting timbers.',
  superRegion: 'aquarias',
  startNode: 'shipyard_01',
  width: 600,
  height: 1000,
  backgroundColor: '#1a2530'
}

export const nodes = {
  shipyard_01: {
    id: 'shipyard_01',
    name: 'Hull Graveyard',
    region: 'Sunken Shipyard',
    x: 100,
    y: 250,
    battles: [
      { enemies: ['wreck_scavenger', 'drowned_sailor'] },
      { enemies: ['barnacle_titan', 'shipwreck_siren'] },
      { enemies: ['wreck_scavenger', 'wreck_scavenger', 'drowned_sailor'] }
    ],
    connections: ['shipyard_02'],
    rewards: { gems: 100, gold: 2500, exp: 2500 },
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
  shipyard_02: {
    id: 'shipyard_02',
    name: "Scavenger's Claim",
    region: 'Sunken Shipyard',
    x: 250,
    y: 180,
    battles: [
      { enemies: ['wreck_scavenger', 'wreck_scavenger', 'wreck_scavenger'] },
      { enemies: ['drowned_sailor', 'drowned_sailor', 'barnacle_titan'] },
      { enemies: ['shipwreck_siren', 'wreck_scavenger', 'drowned_sailor'] },
      { enemies: ['barnacle_titan', 'barnacle_titan', 'shipwreck_siren'] }
    ],
    connections: ['shipyard_03'],
    rewards: { gems: 100, gold: 2550, exp: 2550 },
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
  shipyard_03: {
    id: 'shipyard_03',
    name: 'The Dry Dock',
    region: 'Sunken Shipyard',
    x: 400,
    y: 300,
    battles: [
      { enemies: ['barnacle_titan', 'drowned_sailor', 'drowned_sailor'] },
      { enemies: ['wreck_scavenger', 'wreck_scavenger', 'shipwreck_siren'] },
      { enemies: ['drowned_sailor', 'drowned_sailor', 'drowned_sailor', 'barnacle_titan'] },
      { enemies: ['shipwreck_siren', 'shipwreck_siren', 'wreck_scavenger', 'drowned_sailor'] }
    ],
    connections: ['shipyard_04'],
    rewards: { gems: 100, gold: 2600, exp: 2600 },
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
  shipyard_04: {
    id: 'shipyard_04',
    name: 'Cargo Hold Maze',
    region: 'Sunken Shipyard',
    x: 550,
    y: 200,
    battles: [
      { enemies: ['wreck_scavenger', 'wreck_scavenger', 'barnacle_titan', 'shipwreck_siren'] },
      { enemies: ['drowned_sailor', 'drowned_sailor', 'drowned_sailor', 'wreck_scavenger'] },
      { enemies: ['barnacle_titan', 'barnacle_titan', 'shipwreck_siren'] },
      { enemies: ['shipwreck_siren', 'shipwreck_siren', 'drowned_sailor', 'drowned_sailor'] },
      { enemies: ['wreck_scavenger', 'drowned_sailor', 'barnacle_titan', 'shipwreck_siren'] }
    ],
    connections: ['shipyard_05'],
    rewards: { gems: 100, gold: 2650, exp: 2650 },
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
  shipyard_05: {
    id: 'shipyard_05',
    name: 'The Flagship Wreck',
    region: 'Sunken Shipyard',
    x: 700,
    y: 280,
    battles: [
      { enemies: ['barnacle_titan', 'barnacle_titan', 'drowned_sailor', 'drowned_sailor'] },
      { enemies: ['wreck_scavenger', 'wreck_scavenger', 'wreck_scavenger', 'shipwreck_siren'] },
      { enemies: ['shipwreck_siren', 'shipwreck_siren', 'barnacle_titan', 'wreck_scavenger'] },
      { enemies: ['drowned_sailor', 'drowned_sailor', 'drowned_sailor', 'drowned_sailor', 'barnacle_titan'] },
      { enemies: ['barnacle_titan', 'barnacle_titan', 'shipwreck_siren', 'shipwreck_siren', 'wreck_scavenger'] }
    ],
    connections: [],
    rewards: { gems: 100, gold: 2700, exp: 2700 },
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
