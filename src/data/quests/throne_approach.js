export const regionMeta = {
  id: 'throne_approach',
  name: 'Throne Approach',
  description: 'The final passage leading to the Coral Throne itself, thick with fanatical zealots and mind-touched advisors. Corruption seeps from the throne room ahead, twisting the guardians into something no longer entirely mortal.',
  superRegion: 'aquarias',
  startNode: 'throne_01',
  width: 600,
  height: 1000,
  backgroundColor: '#1a2550'
}

export const nodes = {
  throne_01: {
    id: 'throne_01',
    name: 'Royal Antechamber',
    region: 'Throne Approach',
    x: 80,
    y: 250,
    battles: [
      { enemies: ['throne_guardian', 'mind_touched_advisor'] },
      { enemies: ['fanatical_zealot', 'fanatical_zealot'] },
      { enemies: ['the_corrupted', 'throne_guardian'] }
    ],
    connections: ['throne_02'],
    rewards: { gems: 100, gold: 3750, exp: 3750 },
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
  throne_02: {
    id: 'throne_02',
    name: "King's Guard Hall",
    region: 'Throne Approach',
    x: 200,
    y: 150,
    battles: [
      { enemies: ['fanatical_zealot', 'fanatical_zealot', 'mind_touched_advisor'] },
      { enemies: ['throne_guardian', 'the_corrupted'] },
      { enemies: ['mind_touched_advisor', 'mind_touched_advisor', 'fanatical_zealot'] },
      { enemies: ['the_corrupted', 'the_corrupted', 'throne_guardian'] }
    ],
    connections: ['throne_03'],
    rewards: { gems: 100, gold: 3800, exp: 3800 },
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
  throne_03: {
    id: 'throne_03',
    name: 'Chapel of Tides',
    region: 'Throne Approach',
    x: 350,
    y: 280,
    battles: [
      { enemies: ['the_corrupted', 'the_corrupted', 'the_corrupted'] },
      { enemies: ['mind_touched_advisor', 'fanatical_zealot', 'throne_guardian'] },
      { enemies: ['fanatical_zealot', 'fanatical_zealot', 'the_corrupted', 'the_corrupted'] },
      { enemies: ['throne_guardian', 'throne_guardian', 'mind_touched_advisor'] }
    ],
    connections: ['throne_04'],
    rewards: { gems: 100, gold: 3850, exp: 3850 },
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
  throne_04: {
    id: 'throne_04',
    name: 'Privy Council Chamber',
    region: 'Throne Approach',
    x: 480,
    y: 180,
    battles: [
      { enemies: ['mind_touched_advisor', 'mind_touched_advisor', 'mind_touched_advisor'] },
      { enemies: ['throne_guardian', 'fanatical_zealot', 'fanatical_zealot'] },
      { enemies: ['the_corrupted', 'the_corrupted', 'mind_touched_advisor', 'fanatical_zealot'] },
      { enemies: ['throne_guardian', 'throne_guardian', 'the_corrupted'] },
      { enemies: ['fanatical_zealot', 'fanatical_zealot', 'fanatical_zealot', 'mind_touched_advisor'] }
    ],
    connections: ['throne_05'],
    rewards: { gems: 100, gold: 3900, exp: 3900 },
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
  throne_05: {
    id: 'throne_05',
    name: 'Throne Room Vestibule',
    region: 'Throne Approach',
    x: 600,
    y: 300,
    battles: [
      { enemies: ['throne_guardian', 'throne_guardian', 'fanatical_zealot', 'mind_touched_advisor'] },
      { enemies: ['the_corrupted', 'the_corrupted', 'the_corrupted', 'fanatical_zealot'] },
      { enemies: ['fanatical_zealot', 'fanatical_zealot', 'throne_guardian', 'throne_guardian'] },
      { enemies: ['mind_touched_advisor', 'mind_touched_advisor', 'the_corrupted', 'the_corrupted', 'fanatical_zealot'] },
      { enemies: ['throne_guardian', 'throne_guardian', 'throne_guardian'] }
    ],
    connections: ['throne_06'],
    rewards: { gems: 100, gold: 3950, exp: 3950 },
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
  throne_06: {
    id: 'throne_06',
    name: 'The Coral Throne',
    region: 'Throne Approach',
    x: 720,
    y: 220,
    battles: [
      { enemies: ['throne_guardian', 'throne_guardian', 'mind_touched_advisor', 'fanatical_zealot'] },
      { enemies: ['fanatical_zealot', 'fanatical_zealot', 'fanatical_zealot', 'the_corrupted'] },
      { enemies: ['the_corrupted', 'the_corrupted', 'throne_guardian', 'throne_guardian', 'mind_touched_advisor'] },
      { enemies: ['mind_touched_advisor', 'mind_touched_advisor', 'fanatical_zealot', 'fanatical_zealot', 'the_corrupted'] },
      { enemies: ['king_meridius'] }
    ],
    connections: ['scalding_01'],
    rewards: { gems: 100, gold: 4000, exp: 4000 },
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
