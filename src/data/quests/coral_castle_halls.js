export const regionMeta = {
  id: 'coral_castle_halls',
  name: 'Coral Castle Halls',
  superRegion: 'aquarias',
  startNode: 'castle_01',
  width: 800,
  height: 500,
  backgroundColor: '#1a2a45'
}

export const nodes = {
  castle_01: {
    id: 'castle_01',
    name: 'Grand Foyer',
    region: 'Coral Castle Halls',
    x: 80,
    y: 250,
    battles: [
      { enemies: ['coralsworn_knight', 'kings_hound'] },
      { enemies: ['castle_sentinel', 'royal_caster'] },
      { enemies: ['coralsworn_knight', 'coralsworn_knight', 'kings_hound'] }
    ],
    connections: ['castle_02'],
    rewards: { gems: 100, gold: 3400, exp: 3400 },
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
  castle_02: {
    id: 'castle_02',
    name: 'Gallery of Tides',
    region: 'Coral Castle Halls',
    x: 200,
    y: 150,
    battles: [
      { enemies: ['royal_caster', 'coralsworn_knight', 'kings_hound'] },
      { enemies: ['castle_sentinel', 'castle_sentinel'] },
      { enemies: ['kings_hound', 'kings_hound', 'coralsworn_knight'] },
      { enemies: ['royal_caster', 'royal_caster', 'castle_sentinel'] }
    ],
    connections: ['castle_03'],
    rewards: { gems: 100, gold: 3450, exp: 3450 },
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
  castle_03: {
    id: 'castle_03',
    name: 'Abandoned Banquet',
    region: 'Coral Castle Halls',
    x: 350,
    y: 280,
    battles: [
      { enemies: ['coralsworn_knight', 'coralsworn_knight', 'royal_caster'] },
      { enemies: ['kings_hound', 'kings_hound', 'castle_sentinel'] },
      { enemies: ['castle_sentinel', 'coralsworn_knight', 'kings_hound', 'royal_caster'] },
      { enemies: ['royal_caster', 'royal_caster', 'coralsworn_knight', 'coralsworn_knight'] }
    ],
    connections: ['castle_04'],
    rewards: { gems: 100, gold: 3500, exp: 3500 },
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
  castle_04: {
    id: 'castle_04',
    name: 'Elite Barracks',
    region: 'Coral Castle Halls',
    x: 480,
    y: 180,
    battles: [
      { enemies: ['coralsworn_knight', 'coralsworn_knight', 'coralsworn_knight'] },
      { enemies: ['kings_hound', 'kings_hound', 'kings_hound'] },
      { enemies: ['castle_sentinel', 'castle_sentinel', 'royal_caster'] },
      { enemies: ['coralsworn_knight', 'kings_hound', 'castle_sentinel', 'royal_caster'] },
      { enemies: ['royal_caster', 'royal_caster', 'coralsworn_knight', 'kings_hound'] }
    ],
    connections: ['castle_05'],
    rewards: { gems: 100, gold: 3550, exp: 3550 },
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
  castle_05: {
    id: 'castle_05',
    name: 'Archive Wing',
    region: 'Coral Castle Halls',
    x: 600,
    y: 300,
    battles: [
      { enemies: ['castle_sentinel', 'castle_sentinel', 'coralsworn_knight', 'royal_caster'] },
      { enemies: ['kings_hound', 'kings_hound', 'coralsworn_knight', 'coralsworn_knight'] },
      { enemies: ['royal_caster', 'royal_caster', 'royal_caster', 'castle_sentinel'] },
      { enemies: ['coralsworn_knight', 'coralsworn_knight', 'kings_hound', 'kings_hound', 'royal_caster'] },
      { enemies: ['castle_sentinel', 'castle_sentinel', 'castle_sentinel'] }
    ],
    connections: ['castle_06', 'archives_01'],
    rewards: { gems: 100, gold: 3600, exp: 3600 },
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
  castle_06: {
    id: 'castle_06',
    name: 'Inner Sanctum Gate',
    region: 'Coral Castle Halls',
    x: 720,
    y: 220,
    battles: [
      { enemies: ['coralsworn_knight', 'coralsworn_knight', 'castle_sentinel', 'royal_caster'] },
      { enemies: ['kings_hound', 'kings_hound', 'kings_hound', 'coralsworn_knight'] },
      { enemies: ['castle_sentinel', 'castle_sentinel', 'royal_caster', 'royal_caster'] },
      { enemies: ['coralsworn_knight', 'coralsworn_knight', 'coralsworn_knight', 'kings_hound', 'royal_caster'] },
      { enemies: ['lord_coralhart'] }
    ],
    connections: ['throne_01'],
    rewards: { gems: 100, gold: 3700, exp: 3700 },
    firstClearBonus: { gems: 100 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 3, chance: 0.8 },
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
