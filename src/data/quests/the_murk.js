export const regionMeta = {
  id: 'the_murk',
  name: 'The Murk',
  superRegion: 'aquarias',
  startNode: 'murk_01',
  width: 800,
  height: 500,
  backgroundColor: '#0a1a25'
}

export const nodes = {
  murk_01: {
    id: 'murk_01',
    name: 'Dimlight Passage',
    region: 'The Murk',
    x: 100,
    y: 250,
    battles: [
      { enemies: ['blind_angler', 'murk_stalker'] },
      { enemies: ['outcast_thug', 'shadow_eel'] },
      { enemies: ['blind_angler', 'blind_angler', 'murk_stalker'] }
    ],
    connections: ['murk_02'],
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
  murk_02: {
    id: 'murk_02',
    name: 'Outcast Hollow',
    region: 'The Murk',
    x: 250,
    y: 180,
    battles: [
      { enemies: ['outcast_thug', 'outcast_thug'] },
      { enemies: ['murk_stalker', 'blind_angler', 'shadow_eel'] },
      { enemies: ['outcast_thug', 'murk_stalker', 'blind_angler'] },
      { enemies: ['shadow_eel', 'shadow_eel', 'outcast_thug'] }
    ],
    connections: ['murk_03'],
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
  murk_03: {
    id: 'murk_03',
    name: 'The Silt Beds',
    region: 'The Murk',
    x: 400,
    y: 300,
    battles: [
      { enemies: ['murk_stalker', 'murk_stalker', 'blind_angler'] },
      { enemies: ['shadow_eel', 'shadow_eel', 'outcast_thug'] },
      { enemies: ['blind_angler', 'blind_angler', 'murk_stalker', 'murk_stalker'] },
      { enemies: ['outcast_thug', 'outcast_thug', 'shadow_eel'] }
    ],
    connections: ['murk_04'],
    rewards: { gems: 100, gold: 2650, exp: 2650 },
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
  murk_04: {
    id: 'murk_04',
    name: 'Faded Lantern Row',
    region: 'The Murk',
    x: 550,
    y: 200,
    battles: [
      { enemies: ['shadow_eel', 'shadow_eel', 'shadow_eel'] },
      { enemies: ['outcast_thug', 'outcast_thug', 'blind_angler', 'murk_stalker'] },
      { enemies: ['murk_stalker', 'murk_stalker', 'murk_stalker', 'blind_angler'] },
      { enemies: ['blind_angler', 'blind_angler', 'shadow_eel', 'shadow_eel'] },
      { enemies: ['outcast_thug', 'murk_stalker', 'shadow_eel', 'blind_angler'] }
    ],
    connections: ['murk_05'],
    rewards: { gems: 100, gold: 2700, exp: 2700 },
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
  murk_05: {
    id: 'murk_05',
    name: 'The Drop-Off',
    region: 'The Murk',
    x: 700,
    y: 280,
    battles: [
      { enemies: ['murk_stalker', 'murk_stalker', 'shadow_eel', 'shadow_eel'] },
      { enemies: ['outcast_thug', 'outcast_thug', 'outcast_thug', 'blind_angler'] },
      { enemies: ['blind_angler', 'blind_angler', 'murk_stalker', 'murk_stalker', 'shadow_eel'] },
      { enemies: ['shadow_eel', 'shadow_eel', 'shadow_eel', 'outcast_thug'] },
      { enemies: ['outcast_thug', 'outcast_thug', 'murk_stalker', 'murk_stalker', 'blind_angler'] }
    ],
    connections: ['beggar_01'],
    rewards: { gems: 100, gold: 2750, exp: 2750 },
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
