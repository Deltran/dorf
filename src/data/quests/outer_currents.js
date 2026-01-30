export const regionMeta = {
  id: 'outer_currents',
  name: 'Outer Currents',
  superRegion: 'aquarias',
  startNode: 'currents_01',
  width: 800,
  height: 500,
  backgroundColor: '#0a2540'
}

export const nodes = {
  currents_01: {
    id: 'currents_01',
    name: 'Patrol Crossing',
    region: 'Outer Currents',
    x: 80,
    y: 250,
    battles: [
      { enemies: ['aquarian_enforcer', 'current_mage'] },
      { enemies: ['patrol_shark', 'aquarian_enforcer'] },
      { enemies: ['checkpoint_warden', 'aquarian_enforcer', 'current_mage'] }
    ],
    connections: ['currents_02'],
    rewards: { gems: 100, gold: 2200, exp: 2200 },
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
  currents_02: {
    id: 'currents_02',
    name: 'Propaganda Plaza',
    region: 'Outer Currents',
    x: 323,
    y: 65,
    battles: [
      { enemies: ['current_mage', 'current_mage', 'aquarian_enforcer'] },
      { enemies: ['checkpoint_warden', 'patrol_shark'] },
      { enemies: ['aquarian_enforcer', 'aquarian_enforcer', 'current_mage'] },
      { enemies: ['patrol_shark', 'current_mage', 'checkpoint_warden'] }
    ],
    connections: ['currents_03'],
    rewards: { gems: 100, gold: 2250, exp: 2250 },
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
  currents_03: {
    id: 'currents_03',
    name: 'Checkpoint Wreckage',
    region: 'Outer Currents',
    x: 122,
    y: 408,
    battles: [
      { enemies: ['patrol_shark', 'patrol_shark'] },
      { enemies: ['aquarian_enforcer', 'aquarian_enforcer', 'checkpoint_warden'] },
      { enemies: ['current_mage', 'current_mage', 'patrol_shark'] },
      { enemies: ['checkpoint_warden', 'aquarian_enforcer', 'current_mage', 'patrol_shark'] }
    ],
    connections: ['currents_04'],
    rewards: { gems: 100, gold: 2300, exp: 2300 },
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
  currents_04: {
    id: 'currents_04',
    name: 'The Whisper Tunnels',
    region: 'Outer Currents',
    x: 472,
    y: 48,
    battles: [
      { enemies: ['aquarian_enforcer', 'aquarian_enforcer', 'aquarian_enforcer'] },
      { enemies: ['patrol_shark', 'patrol_shark', 'current_mage'] },
      { enemies: ['checkpoint_warden', 'checkpoint_warden', 'aquarian_enforcer'] },
      { enemies: ['current_mage', 'patrol_shark', 'aquarian_enforcer', 'aquarian_enforcer'] },
      { enemies: ['patrol_shark', 'patrol_shark', 'checkpoint_warden', 'current_mage'] }
    ],
    connections: ['currents_05'],
    rewards: { gems: 100, gold: 2350, exp: 2350 },
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
  currents_05: {
    id: 'currents_05',
    name: 'Barracks Perimeter',
    region: 'Outer Currents',
    x: 263,
    y: 448,
    battles: [
      { enemies: ['checkpoint_warden', 'aquarian_enforcer', 'aquarian_enforcer'] },
      { enemies: ['patrol_shark', 'patrol_shark', 'patrol_shark'] },
      { enemies: ['current_mage', 'current_mage', 'checkpoint_warden', 'aquarian_enforcer'] },
      { enemies: ['aquarian_enforcer', 'aquarian_enforcer', 'patrol_shark', 'current_mage'] },
      { enemies: ['checkpoint_warden', 'checkpoint_warden', 'patrol_shark', 'current_mage'] }
    ],
    connections: ['currents_06'],
    rewards: { gems: 100, gold: 2400, exp: 2400 },
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
  currents_06: {
    id: 'currents_06',
    name: 'Shipyard Junction',
    region: 'Outer Currents',
    x: 596,
    y: 33,
    regionLinkPosition: { x: 749, y: 300 },
    battles: [
      { enemies: ['patrol_shark', 'patrol_shark', 'checkpoint_warden', 'current_mage'] },
      { enemies: ['aquarian_enforcer', 'aquarian_enforcer', 'aquarian_enforcer', 'patrol_shark'] },
      { enemies: ['checkpoint_warden', 'checkpoint_warden', 'current_mage', 'current_mage'] },
      { enemies: ['patrol_shark', 'patrol_shark', 'aquarian_enforcer', 'aquarian_enforcer', 'current_mage'] },
      { enemies: ['commander_tideclaw'] }
    ],
    connections: ['murk_01', 'shipyard_01'],
    rewards: { gems: 100, gold: 2500, exp: 2500 },
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
