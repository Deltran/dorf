export const regionMeta = {
  id: 'drowned_prison',
  name: 'Drowned Prison',
  superRegion: 'aquarias',
  startNode: 'prison_01',
  width: 600,
  height: 1000,
  backgroundColor: '#151a20'
}

export const nodes = {
  prison_01: {
    id: 'prison_01',
    name: 'Prisoner Intake',
    region: 'Drowned Prison',
    x: 100,
    y: 250,
    battles: [
      { enemies: ['prison_warden', 'chain_golem'] },
      { enemies: ['drowner', 'taskmaster'] },
      { enemies: ['prison_warden', 'drowner', 'taskmaster'] }
    ],
    connections: ['prison_02'],
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
  prison_02: {
    id: 'prison_02',
    name: 'Chain Gang Tunnels',
    region: 'Drowned Prison',
    x: 250,
    y: 180,
    battles: [
      { enemies: ['chain_golem', 'chain_golem'] },
      { enemies: ['taskmaster', 'taskmaster', 'drowner'] },
      { enemies: ['prison_warden', 'chain_golem', 'drowner'] },
      { enemies: ['drowner', 'drowner', 'taskmaster', 'prison_warden'] }
    ],
    connections: ['prison_03'],
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
  prison_03: {
    id: 'prison_03',
    name: 'The Flooded Cells',
    region: 'Drowned Prison',
    x: 400,
    y: 300,
    battles: [
      { enemies: ['drowner', 'drowner', 'drowner'] },
      { enemies: ['prison_warden', 'prison_warden', 'chain_golem'] },
      { enemies: ['taskmaster', 'drowner', 'drowner', 'prison_warden'] },
      { enemies: ['chain_golem', 'chain_golem', 'taskmaster', 'drowner'] }
    ],
    connections: ['prison_04'],
    rewards: { gems: 100, gold: 2100, exp: 2100 },
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
  prison_04: {
    id: 'prison_04',
    name: 'The Oubliette',
    region: 'Drowned Prison',
    x: 550,
    y: 200,
    battles: [
      { enemies: ['prison_warden', 'prison_warden', 'taskmaster', 'taskmaster'] },
      { enemies: ['chain_golem', 'drowner', 'drowner', 'drowner'] },
      { enemies: ['taskmaster', 'taskmaster', 'prison_warden', 'chain_golem'] },
      { enemies: ['drowner', 'drowner', 'drowner', 'prison_warden', 'taskmaster'] },
      { enemies: ['chain_golem', 'chain_golem', 'prison_warden', 'prison_warden'] }
    ],
    connections: ['prison_05'],
    rewards: { gems: 100, gold: 2150, exp: 2150 },
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
  prison_05: {
    id: 'prison_05',
    name: "Warden's Sanctum",
    region: 'Drowned Prison',
    x: 700,
    y: 280,
    battles: [
      { enemies: ['chain_golem', 'chain_golem', 'prison_warden', 'taskmaster'] },
      { enemies: ['drowner', 'drowner', 'drowner', 'drowner'] },
      { enemies: ['prison_warden', 'prison_warden', 'prison_warden', 'chain_golem'] },
      { enemies: ['taskmaster', 'taskmaster', 'drowner', 'drowner', 'prison_warden'] },
      { enemies: ['chain_golem', 'chain_golem', 'chain_golem', 'taskmaster', 'drowner'] }
    ],
    connections: [],
    rewards: { gems: 100, gold: 2200, exp: 2200 },
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
