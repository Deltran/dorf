export const regionMeta = {
  id: 'primordial_nursery',
  name: 'Primordial Nursery',
  superRegion: 'aquarias',
  startNode: 'nursery_01',
  width: 800,
  height: 500,
  backgroundColor: '#2a1510'
}

export const nodes = {
  nursery_01: {
    id: 'nursery_01',
    name: 'The Spawn Pools',
    region: 'Primordial Nursery',
    x: 100,
    y: 250,
    battles: [
      { enemies: ['juvenile_horror', 'juvenile_horror', 'brood_tender'] },
      { enemies: ['egg_cluster', 'juvenile_horror', 'juvenile_horror'] },
      { enemies: ['brood_tender', 'juvenile_horror', 'juvenile_horror', 'juvenile_horror'] }
    ],
    connections: ['nursery_02'],
    rewards: { gems: 100, gold: 4200, exp: 4200 },
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
  nursery_02: {
    id: 'nursery_02',
    name: 'Incubation Vents',
    region: 'Primordial Nursery',
    x: 250,
    y: 180,
    battles: [
      { enemies: ['egg_cluster', 'egg_cluster'] },
      { enemies: ['juvenile_horror', 'juvenile_horror', 'juvenile_horror', 'brood_tender'] },
      { enemies: ['brood_tender', 'brood_tender', 'juvenile_horror'] },
      { enemies: ['egg_cluster', 'juvenile_horror', 'juvenile_horror', 'brood_tender'] }
    ],
    connections: ['nursery_03'],
    rewards: { gems: 100, gold: 4250, exp: 4250 },
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
  nursery_03: {
    id: 'nursery_03',
    name: 'Juvenile Feeding Grounds',
    region: 'Primordial Nursery',
    x: 400,
    y: 300,
    battles: [
      { enemies: ['juvenile_horror', 'juvenile_horror', 'juvenile_horror', 'juvenile_horror'] },
      { enemies: ['brood_tender', 'egg_cluster', 'juvenile_horror', 'juvenile_horror'] },
      { enemies: ['juvenile_horror', 'juvenile_horror', 'brood_tender', 'brood_tender'] },
      { enemies: ['egg_cluster', 'egg_cluster', 'brood_tender'] }
    ],
    connections: ['nursery_04'],
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
  nursery_04: {
    id: 'nursery_04',
    name: "The Matriarch's Hollow",
    region: 'Primordial Nursery',
    x: 550,
    y: 200,
    battles: [
      { enemies: ['the_matriarch', 'juvenile_horror', 'juvenile_horror'] },
      { enemies: ['brood_tender', 'brood_tender', 'egg_cluster', 'egg_cluster'] },
      { enemies: ['juvenile_horror', 'juvenile_horror', 'juvenile_horror', 'brood_tender', 'brood_tender'] },
      { enemies: ['the_matriarch', 'brood_tender', 'juvenile_horror', 'juvenile_horror'] },
      { enemies: ['egg_cluster', 'egg_cluster', 'brood_tender', 'juvenile_horror', 'juvenile_horror'] }
    ],
    connections: ['nursery_05'],
    rewards: { gems: 100, gold: 4350, exp: 4350 },
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
  nursery_05: {
    id: 'nursery_05',
    name: 'Genesis Core',
    region: 'Primordial Nursery',
    x: 700,
    y: 280,
    battles: [
      { enemies: ['the_matriarch', 'the_matriarch'] },
      { enemies: ['egg_cluster', 'egg_cluster', 'brood_tender', 'brood_tender'] },
      { enemies: ['juvenile_horror', 'juvenile_horror', 'juvenile_horror', 'juvenile_horror', 'brood_tender'] },
      { enemies: ['brood_tender', 'brood_tender', 'brood_tender', 'egg_cluster'] },
      { enemies: ['the_matriarch', 'brood_tender', 'brood_tender', 'juvenile_horror', 'juvenile_horror'] }
    ],
    connections: [],
    rewards: { gems: 100, gold: 4400, exp: 4400 },
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
