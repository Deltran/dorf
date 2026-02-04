export const regionMeta = {
  id: 'forbidden_archives',
  name: 'Forbidden Archives',
  description: 'A drowned library sealed away by Aquaria\'s rulers, containing knowledge too dangerous to destroy. Ink specters drift between waterlogged shelves, and archive constructs enforce silence with lethal force upon any who trespass.',
  superRegion: 'aquarias',
  startNode: 'archives_01',
  width: 600,
  height: 1000,
  backgroundColor: '#1a1a2a'
}

export const nodes = {
  archives_01: {
    id: 'archives_01',
    name: 'The Sealed Stacks',
    region: 'Forbidden Archives',
    x: 100,
    y: 250,
    battles: [
      { enemies: ['archive_construct', 'ink_specter'] },
      { enemies: ['tome_mimic', 'knowledge_warden'] },
      { enemies: ['archive_construct', 'archive_construct', 'ink_specter'] }
    ],
    connections: ['archives_02'],
    rewards: { gems: 100, gold: 3600, exp: 3600 },
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
  archives_02: {
    id: 'archives_02',
    name: 'Hall of Heresy',
    region: 'Forbidden Archives',
    x: 250,
    y: 180,
    battles: [
      { enemies: ['ink_specter', 'ink_specter', 'archive_construct'] },
      { enemies: ['knowledge_warden', 'tome_mimic'] },
      { enemies: ['archive_construct', 'ink_specter', 'tome_mimic'] },
      { enemies: ['knowledge_warden', 'archive_construct', 'ink_specter'] }
    ],
    connections: ['archives_03'],
    rewards: { gems: 100, gold: 3650, exp: 3650 },
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
  archives_03: {
    id: 'archives_03',
    name: 'Drowned Scriptorium',
    region: 'Forbidden Archives',
    x: 400,
    y: 300,
    battles: [
      { enemies: ['tome_mimic', 'tome_mimic', 'ink_specter'] },
      { enemies: ['archive_construct', 'archive_construct', 'knowledge_warden'] },
      { enemies: ['ink_specter', 'ink_specter', 'tome_mimic', 'archive_construct'] },
      { enemies: ['knowledge_warden', 'knowledge_warden', 'ink_specter'] }
    ],
    connections: ['archives_04'],
    rewards: { gems: 100, gold: 3700, exp: 3700 },
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
  archives_04: {
    id: 'archives_04',
    name: 'Vault of Minds',
    region: 'Forbidden Archives',
    x: 550,
    y: 200,
    battles: [
      { enemies: ['knowledge_warden', 'knowledge_warden', 'tome_mimic'] },
      { enemies: ['archive_construct', 'archive_construct', 'ink_specter', 'ink_specter'] },
      { enemies: ['tome_mimic', 'tome_mimic', 'tome_mimic'] },
      { enemies: ['ink_specter', 'ink_specter', 'knowledge_warden', 'archive_construct'] },
      { enemies: ['archive_construct', 'tome_mimic', 'ink_specter', 'knowledge_warden'] }
    ],
    connections: ['archives_05'],
    rewards: { gems: 100, gold: 3750, exp: 3750 },
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
  archives_05: {
    id: 'archives_05',
    name: 'The Index',
    region: 'Forbidden Archives',
    x: 700,
    y: 280,
    battles: [
      { enemies: ['archive_construct', 'archive_construct', 'knowledge_warden', 'knowledge_warden'] },
      { enemies: ['tome_mimic', 'tome_mimic', 'ink_specter', 'ink_specter'] },
      { enemies: ['knowledge_warden', 'knowledge_warden', 'knowledge_warden'] },
      { enemies: ['ink_specter', 'ink_specter', 'tome_mimic', 'tome_mimic', 'archive_construct'] },
      { enemies: ['archive_construct', 'archive_construct', 'archive_construct', 'knowledge_warden', 'ink_specter'] }
    ],
    connections: [],
    rewards: { gems: 100, gold: 3800, exp: 3800 },
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
