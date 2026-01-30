export const regionMeta = {
  id: 'the_abyssal_maw',
  name: 'The Abyssal Maw',
  superRegion: 'aquarias',
  startNode: 'abyss_01',
  width: 800,
  height: 500,
  backgroundColor: '#0a0a15'
}

export const nodes = {
  abyss_01: {
    id: 'abyss_01',
    name: 'The Sunless Depths',
    region: 'The Abyssal Maw',
    x: 80,
    y: 250,
    battles: [
      { enemies: ['abyssal_lurker_deep', 'mind_leech'] },
      { enemies: ['spawn_of_the_maw', 'spawn_of_the_maw'] },
      { enemies: ['void_angler', 'mind_leech'] }
    ],
    connections: ['abyss_02'],
    rewards: { gems: 100, gold: 4300, exp: 4300 },
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
  abyss_02: {
    id: 'abyss_02',
    name: 'Boneyard Trench',
    region: 'The Abyssal Maw',
    x: 200,
    y: 150,
    battles: [
      { enemies: ['abyssal_lurker_deep', 'abyssal_lurker_deep'] },
      { enemies: ['spawn_of_the_maw', 'spawn_of_the_maw', 'mind_leech'] },
      { enemies: ['void_angler', 'abyssal_lurker_deep'] },
      { enemies: ['mind_leech', 'mind_leech', 'spawn_of_the_maw', 'spawn_of_the_maw'] }
    ],
    connections: ['abyss_03'],
    rewards: { gems: 100, gold: 4350, exp: 4350 },
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
  abyss_03: {
    id: 'abyss_03',
    name: 'The Whispering Dark',
    region: 'The Abyssal Maw',
    x: 350,
    y: 280,
    battles: [
      { enemies: ['mind_leech', 'mind_leech', 'mind_leech'] },
      { enemies: ['abyssal_lurker_deep', 'spawn_of_the_maw', 'spawn_of_the_maw'] },
      { enemies: ['void_angler', 'mind_leech', 'abyssal_lurker_deep'] },
      { enemies: ['spawn_of_the_maw', 'spawn_of_the_maw', 'spawn_of_the_maw', 'mind_leech'] }
    ],
    connections: ['abyss_04'],
    rewards: { gems: 100, gold: 4400, exp: 4400 },
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
  abyss_04: {
    id: 'abyss_04',
    name: 'Idol of the Deep',
    region: 'The Abyssal Maw',
    x: 480,
    y: 180,
    battles: [
      { enemies: ['void_angler', 'void_angler'] },
      { enemies: ['abyssal_lurker_deep', 'abyssal_lurker_deep', 'mind_leech'] },
      { enemies: ['spawn_of_the_maw', 'spawn_of_the_maw', 'spawn_of_the_maw', 'spawn_of_the_maw'] },
      { enemies: ['void_angler', 'abyssal_lurker_deep', 'mind_leech', 'spawn_of_the_maw'] },
      { enemies: ['mind_leech', 'mind_leech', 'abyssal_lurker_deep', 'abyssal_lurker_deep'] }
    ],
    connections: ['abyss_05'],
    rewards: { gems: 100, gold: 4450, exp: 4450 },
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
  abyss_05: {
    id: 'abyss_05',
    name: "The Mind's Eye",
    region: 'The Abyssal Maw',
    x: 600,
    y: 300,
    type: 'genusLoci',
    genusLociId: 'thalassion',
    battles: [
      { enemies: ['void_angler', 'abyssal_lurker_deep', 'mind_leech', 'spawn_of_the_maw'] },
      { enemies: ['spawn_of_the_maw', 'spawn_of_the_maw', 'spawn_of_the_maw', 'void_angler'] },
      { enemies: ['abyssal_lurker_deep', 'abyssal_lurker_deep', 'abyssal_lurker_deep', 'mind_leech'] },
      { enemies: ['mind_leech', 'mind_leech', 'void_angler', 'spawn_of_the_maw', 'spawn_of_the_maw'] },
      { enemies: ['thalassion'], isGenusLoci: true }
    ],
    connections: ['abyss_06'],
    rewards: { gems: 200, gold: 5000, exp: 5000 },
    firstClearBonus: { gems: 150 },
    itemDrops: [
      { itemId: 'tome_large', min: 2, max: 4, chance: 1.0 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.1 },
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
    shardDropChance: 0.5
  },
  abyss_06: {
    id: 'abyss_06',
    name: 'The Rift Beyond',
    region: 'The Abyssal Maw',
    x: 720,
    y: 220,
    battles: [
      { enemies: ['spawn_of_the_maw', 'spawn_of_the_maw', 'spawn_of_the_maw', 'spawn_of_the_maw'] },
      { enemies: ['void_angler', 'void_angler', 'mind_leech'] },
      { enemies: ['abyssal_lurker_deep', 'abyssal_lurker_deep', 'spawn_of_the_maw', 'spawn_of_the_maw'] },
      { enemies: ['mind_leech', 'mind_leech', 'mind_leech', 'void_angler'] },
      { enemies: ['void_angler', 'void_angler', 'abyssal_lurker_deep', 'abyssal_lurker_deep', 'mind_leech'] }
    ],
    connections: [],
    rewards: { gems: 100, gold: 4500, exp: 4500 },
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
