export const regionMeta = {
  id: 'tidewall_ruins',
  name: 'Tidewall Ruins',
  superRegion: 'aquarias',
  startNode: 'tidewall_01',
  width: 600,
  height: 1000,
  backgroundColor: '#0d2a35'
}

export const nodes = {
  tidewall_01: {
    id: 'tidewall_01',
    name: 'The Breach',
    region: 'Tidewall Ruins',
    x: 154,
    y: 420,
    battles: [
      { enemies: ['ruin_scavenger', 'decay_jelly'] },
      { enemies: ['corroded_sentinel', 'tide_lurker'] },
      { enemies: ['ruin_scavenger', 'ruin_scavenger', 'decay_jelly'] }
    ],
    connections: ['tidewall_02'],
    rewards: { gems: 100, gold: 1950, exp: 1950 },
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
  tidewall_02: {
    id: 'tidewall_02',
    name: 'Abandoned Watchtower',
    region: 'Tidewall Ruins',
    x: 146,
    y: 185,
    battles: [
      { enemies: ['corroded_sentinel', 'decay_jelly', 'decay_jelly'] },
      { enemies: ['tide_lurker', 'tide_lurker', 'ruin_scavenger'] },
      { enemies: ['corroded_sentinel', 'ruin_scavenger', 'decay_jelly'] },
      { enemies: ['tide_lurker', 'corroded_sentinel', 'decay_jelly', 'decay_jelly'] }
    ],
    connections: ['tidewall_03'],
    rewards: { gems: 100, gold: 2000, exp: 2000 },
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
  tidewall_03: {
    id: 'tidewall_03',
    name: 'Algae-Choked Avenue',
    region: 'Tidewall Ruins',
    x: 368,
    y: 403,
    battles: [
      { enemies: ['ruin_scavenger', 'ruin_scavenger', 'tide_lurker'] },
      { enemies: ['decay_jelly', 'decay_jelly', 'corroded_sentinel'] },
      { enemies: ['tide_lurker', 'ruin_scavenger', 'decay_jelly', 'decay_jelly'] },
      { enemies: ['corroded_sentinel', 'corroded_sentinel', 'ruin_scavenger'] }
    ],
    connections: ['tidewall_04'],
    rewards: { gems: 100, gold: 2050, exp: 2050 },
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
  tidewall_04: {
    id: 'tidewall_04',
    name: 'Silent Marketplace',
    region: 'Tidewall Ruins',
    x: 419,
    y: 266,
    battles: [
      { enemies: ['tide_lurker', 'tide_lurker', 'tide_lurker'] },
      { enemies: ['corroded_sentinel', 'decay_jelly', 'ruin_scavenger', 'ruin_scavenger'] },
      { enemies: ['ruin_scavenger', 'ruin_scavenger', 'corroded_sentinel', 'decay_jelly'] },
      { enemies: ['tide_lurker', 'tide_lurker', 'corroded_sentinel', 'decay_jelly'] },
      { enemies: ['corroded_sentinel', 'corroded_sentinel', 'ruin_scavenger', 'ruin_scavenger'] }
    ],
    connections: ['tidewall_05'],
    rewards: { gems: 100, gold: 2100, exp: 2100 },
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
  tidewall_05: {
    id: 'tidewall_05',
    name: 'The Sealed Gate',
    region: 'Tidewall Ruins',
    x: 405,
    y: 127,
    regionLinkPosition: { x: 469, y: 24 },
    battles: [
      { enemies: ['corroded_sentinel', 'corroded_sentinel', 'decay_jelly', 'decay_jelly'] },
      { enemies: ['tide_lurker', 'tide_lurker', 'ruin_scavenger', 'ruin_scavenger'] },
      { enemies: ['corroded_sentinel', 'tide_lurker', 'decay_jelly', 'ruin_scavenger'] },
      { enemies: ['ruin_scavenger', 'ruin_scavenger', 'ruin_scavenger', 'corroded_sentinel'] },
      { enemies: ['corroded_sentinel', 'corroded_sentinel', 'tide_lurker', 'tide_lurker', 'decay_jelly'] }
    ],
    connections: ['currents_01'],
    rewards: { gems: 100, gold: 2150, exp: 2150 },
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
