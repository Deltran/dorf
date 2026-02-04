// src/data/colosseum.js — Colosseum bout definitions and shop items

// 1-star heroes: farm_hand (berserker), street_urchin (ranger), beggar_monk (cleric), street_busker (bard)
// 2-star heroes: militia_soldier (knight), apprentice_mage (mage), herb_gatherer (druid), fennick (ranger)
// 3-star heroes: town_guard (knight), hedge_wizard (mage), village_healer (cleric), wandering_bard (bard),
//                vashek_the_unrelenting (knight), matsuda (berserker), bones_mccready (druid),
//                the_grateful_dead (knight), torga_bloodbeat (berserker)
// 4-star heroes: sir_gallan (knight), ember_witch (mage), lady_moonwhisper (cleric), swift_arrow (ranger),
//                chroma (bard), zina_the_desperate (alchemist), shinobi_jin (ranger), copper_jack (berserker),
//                philemon_the_ardent (knight), penny_dreadful (alchemist), vraxx_thunderskin (bard)
// 5-star heroes: aurora_the_dawn (paladin), shadow_king (berserker), yggra_world_root (druid), cacophon (bard),
//                rosara_the_unmoved (knight), onibaba (druid), fortuna_inversus (bard), mara_thornheart (berserker),
//                grandmother_rot (druid), korrath_hollow_ear (ranger)

function h(templateId, level, stars, shardTier = 0) {
  return { templateId, level, stars, shardTier }
}

// firstClearReward scales linearly from 10 (bout 1) to 50 (bout 50)
function fcr(bout) {
  return Math.round(10 + (40 * (bout - 1)) / 49)
}

// dailyCoins: 1-10 = 2, 11-25 = 3, 26-40 = 4, 41-50 = 5
function dc(bout) {
  if (bout <= 10) return 2
  if (bout <= 25) return 3
  if (bout <= 40) return 4
  return 5
}

// Level roughly linear from ~5 (bout 1) to ~250 (bout 50)
// Each bout range has a base + per-bout increment
function lvl(bout, offset = 0) {
  const base = 5 + ((250 - 5) * (bout - 1)) / 49
  return Math.round(base + offset)
}

export const colosseumBouts = [
  // --- Bouts 1-8: 1-star heroes ---
  {
    bout: 1, name: 'Fresh Recruits',
    heroes: [h('farm_hand', 5, 1), h('street_urchin', 5, 1), h('beggar_monk', 8, 1), h('street_busker', 6, 1)],
    leader: null, firstClearReward: fcr(1), dailyCoins: dc(1)
  },
  {
    bout: 2, name: 'Ragtag Band',
    heroes: [h('street_urchin', 10, 1), h('farm_hand', 10, 1), h('street_busker', 9, 1), h('beggar_monk', 10, 1)],
    leader: null, firstClearReward: fcr(2), dailyCoins: dc(2)
  },
  {
    bout: 3, name: 'Desperate Strays',
    heroes: [h('beggar_monk', 15, 1), h('farm_hand', 15, 1), h('street_urchin', 14, 1), h('street_busker', 15, 1)],
    leader: null, firstClearReward: fcr(3), dailyCoins: dc(3)
  },
  {
    bout: 4, name: 'Gutterborn',
    heroes: [h('street_busker', 20, 1), h('street_urchin', 20, 1), h('beggar_monk', 19, 1), h('farm_hand', 20, 1)],
    leader: null, firstClearReward: fcr(4), dailyCoins: dc(4)
  },
  {
    bout: 5, name: 'Scrappy Survivors',
    heroes: [h('farm_hand', 25, 1), h('beggar_monk', 24, 1), h('street_urchin', 25, 1), h('street_busker', 25, 1)],
    leader: null, firstClearReward: fcr(5), dailyCoins: dc(5)
  },
  {
    bout: 6, name: 'Street Brawlers',
    heroes: [h('farm_hand', 30, 1), h('farm_hand', 28, 1), h('street_urchin', 30, 1), h('beggar_monk', 29, 1)],
    leader: null, firstClearReward: fcr(6), dailyCoins: dc(6)
  },
  {
    bout: 7, name: 'Hardened Drifters',
    heroes: [h('street_urchin', 35, 1), h('street_busker', 34, 1), h('farm_hand', 35, 1), h('beggar_monk', 34, 1)],
    leader: null, firstClearReward: fcr(7), dailyCoins: dc(7)
  },
  {
    bout: 8, name: 'Last of the Lowborn',
    heroes: [h('farm_hand', 40, 1), h('street_urchin', 40, 1), h('beggar_monk', 39, 1), h('street_busker', 40, 1)],
    leader: null, firstClearReward: fcr(8), dailyCoins: dc(8)
  },

  // --- Bouts 9-16: 2-star heroes ---
  {
    bout: 9, name: 'Town Militia',
    heroes: [h('militia_soldier', 45, 2), h('apprentice_mage', 45, 2), h('herb_gatherer', 44, 2), h('fennick', 45, 2)],
    leader: null, firstClearReward: fcr(9), dailyCoins: dc(9)
  },
  {
    bout: 10, name: 'Border Patrol',
    heroes: [h('fennick', 50, 2), h('militia_soldier', 50, 2), h('apprentice_mage', 49, 2), h('herb_gatherer', 50, 2)],
    leader: null, firstClearReward: fcr(10), dailyCoins: dc(10)
  },
  {
    bout: 11, name: 'Garrison Regulars',
    heroes: [h('militia_soldier', 55, 2), h('fennick', 55, 2), h('herb_gatherer', 54, 2), h('apprentice_mage', 55, 2)],
    leader: null, firstClearReward: fcr(11), dailyCoins: dc(11)
  },
  {
    bout: 12, name: 'Watchpost Crew',
    heroes: [h('apprentice_mage', 60, 2), h('militia_soldier', 60, 2), h('fennick', 59, 2), h('herb_gatherer', 60, 2)],
    leader: null, firstClearReward: fcr(12), dailyCoins: dc(12)
  },
  {
    bout: 13, name: 'March Wardens',
    heroes: [h('militia_soldier', 65, 2), h('herb_gatherer', 64, 2), h('fennick', 65, 2), h('apprentice_mage', 65, 2)],
    leader: null, firstClearReward: fcr(13), dailyCoins: dc(13)
  },
  {
    bout: 14, name: 'Shield Brothers',
    heroes: [h('militia_soldier', 70, 2), h('militia_soldier', 69, 2), h('fennick', 70, 2), h('apprentice_mage', 70, 2)],
    leader: null, firstClearReward: fcr(14), dailyCoins: dc(14)
  },
  {
    bout: 15, name: 'Frontier Scouts',
    heroes: [h('fennick', 75, 2), h('fennick', 74, 2), h('militia_soldier', 75, 2), h('herb_gatherer', 75, 2)],
    leader: null, firstClearReward: fcr(15), dailyCoins: dc(15)
  },
  {
    bout: 16, name: 'Seasoned Regulars',
    heroes: [h('militia_soldier', 80, 2), h('apprentice_mage', 80, 2), h('herb_gatherer', 79, 2), h('fennick', 80, 2)],
    leader: null, firstClearReward: fcr(16), dailyCoins: dc(16)
  },

  // --- Bouts 17-28: 3-star heroes ---
  {
    bout: 17, name: 'Sellsword Company',
    heroes: [h('town_guard', 85, 3), h('hedge_wizard', 85, 3), h('village_healer', 84, 3), h('wandering_bard', 85, 3)],
    leader: null, firstClearReward: fcr(17), dailyCoins: dc(17)
  },
  {
    bout: 18, name: 'Freeblade Trio',
    heroes: [h('matsuda', 90, 3), h('town_guard', 90, 3), h('village_healer', 89, 3), h('wandering_bard', 90, 3)],
    leader: null, firstClearReward: fcr(18), dailyCoins: dc(18)
  },
  {
    bout: 19, name: 'Hedge Knights',
    heroes: [h('vashek_the_unrelenting', 95, 3), h('hedge_wizard', 95, 3), h('village_healer', 94, 3), h('bones_mccready', 95, 3)],
    leader: null, firstClearReward: fcr(19), dailyCoins: dc(19)
  },
  {
    bout: 20, name: 'Wayward Company',
    heroes: [h('the_grateful_dead', 100, 3), h('matsuda', 100, 3), h('wandering_bard', 99, 3), h('village_healer', 100, 3)],
    leader: null, firstClearReward: fcr(20), dailyCoins: dc(20)
  },
  {
    bout: 21, name: 'Iron Resolve',
    heroes: [h('town_guard', 105, 3), h('torga_bloodbeat', 105, 3), h('village_healer', 104, 3), h('hedge_wizard', 105, 3)],
    leader: null, firstClearReward: fcr(21), dailyCoins: dc(21)
  },
  {
    bout: 22, name: 'Blood Oath Brothers',
    heroes: [h('matsuda', 110, 3), h('torga_bloodbeat', 110, 3), h('bones_mccready', 109, 3), h('wandering_bard', 110, 3)],
    leader: null, firstClearReward: fcr(22), dailyCoins: dc(22)
  },
  {
    bout: 23, name: 'Sworn Shields',
    heroes: [h('vashek_the_unrelenting', 115, 3), h('the_grateful_dead', 115, 3), h('village_healer', 114, 3), h('hedge_wizard', 115, 3)],
    leader: null, firstClearReward: fcr(23), dailyCoins: dc(23)
  },
  {
    bout: 24, name: 'Wandering Warband',
    heroes: [h('town_guard', 120, 3), h('matsuda', 120, 3), h('wandering_bard', 119, 3), h('bones_mccready', 120, 3)],
    leader: null, firstClearReward: fcr(24), dailyCoins: dc(24)
  },
  {
    bout: 25, name: 'Veteran Blades',
    heroes: [h('torga_bloodbeat', 125, 3), h('vashek_the_unrelenting', 125, 3), h('village_healer', 124, 3), h('hedge_wizard', 125, 3)],
    leader: null, firstClearReward: fcr(25), dailyCoins: dc(25)
  },
  {
    bout: 26, name: 'The Unbroken',
    heroes: [h('the_grateful_dead', 130, 3), h('matsuda', 130, 3), h('bones_mccready', 129, 3), h('wandering_bard', 130, 3)],
    leader: null, firstClearReward: fcr(26), dailyCoins: dc(26)
  },
  {
    bout: 27, name: 'Steel Covenant',
    heroes: [h('vashek_the_unrelenting', 135, 3), h('torga_bloodbeat', 135, 3), h('village_healer', 134, 3), h('hedge_wizard', 135, 3)],
    leader: null, firstClearReward: fcr(27), dailyCoins: dc(27)
  },
  {
    bout: 28, name: 'Old Guard',
    heroes: [h('town_guard', 140, 3), h('the_grateful_dead', 140, 3), h('bones_mccready', 139, 3), h('wandering_bard', 140, 3)],
    leader: null, firstClearReward: fcr(28), dailyCoins: dc(28)
  },

  // --- Bouts 29-40: 4-star heroes ---
  // Shard tiers: 29-33 = 0, 34-38 = 1, 39-40 = 2
  {
    bout: 29, name: 'Named Champions',
    heroes: [h('sir_gallan', 145, 4), h('ember_witch', 145, 4), h('lady_moonwhisper', 144, 4), h('swift_arrow', 145, 4)],
    leader: null, firstClearReward: fcr(29), dailyCoins: dc(29)
  },
  {
    bout: 30, name: 'Gilded Swords',
    heroes: [h('copper_jack', 150, 4), h('philemon_the_ardent', 150, 4), h('lady_moonwhisper', 149, 4), h('chroma', 150, 4)],
    leader: null, firstClearReward: fcr(30), dailyCoins: dc(30)
  },
  {
    bout: 31, name: 'Arcane Vanguard',
    heroes: [h('penny_dreadful', 155, 4), h('ember_witch', 155, 4), h('lady_moonwhisper', 154, 4), h('shinobi_jin', 155, 4)],
    leader: null, firstClearReward: fcr(31), dailyCoins: dc(31)
  },
  {
    bout: 32, name: 'Shadow Council',
    heroes: [h('shinobi_jin', 160, 4), h('zina_the_desperate', 160, 4), h('chroma', 159, 4), h('sir_gallan', 160, 4)],
    leader: null, firstClearReward: fcr(32), dailyCoins: dc(32)
  },
  {
    bout: 33, name: 'The Four Winds',
    heroes: [h('swift_arrow', 165, 4), h('copper_jack', 165, 4), h('vraxx_thunderskin', 164, 4), h('lady_moonwhisper', 165, 4)],
    leader: null, firstClearReward: fcr(33), dailyCoins: dc(33)
  },
  // Shard tier 1 starts
  {
    bout: 34, name: 'Tempered Steel',
    heroes: [h('philemon_the_ardent', 170, 4, 1), h('ember_witch', 170, 4, 1), h('lady_moonwhisper', 169, 4, 1), h('vraxx_thunderskin', 170, 4, 1)],
    leader: null, firstClearReward: fcr(34), dailyCoins: dc(34)
  },
  {
    bout: 35, name: 'Bloodforged',
    heroes: [h('copper_jack', 175, 4, 1), h('zina_the_desperate', 175, 4, 1), h('chroma', 174, 4, 1), h('sir_gallan', 175, 4, 1)],
    leader: null, firstClearReward: fcr(35), dailyCoins: dc(35)
  },
  {
    bout: 36, name: 'Ascended Blades',
    heroes: [h('shinobi_jin', 180, 4, 1), h('swift_arrow', 180, 4, 1), h('lady_moonwhisper', 179, 4, 1), h('penny_dreadful', 180, 4, 1)],
    leader: null, firstClearReward: fcr(36), dailyCoins: dc(36)
  },
  {
    bout: 37, name: 'Warborn Elite',
    heroes: [h('sir_gallan', 185, 4, 1), h('copper_jack', 185, 4, 1), h('vraxx_thunderskin', 184, 4, 1), h('ember_witch', 185, 4, 1)],
    leader: null, firstClearReward: fcr(37), dailyCoins: dc(37)
  },
  {
    bout: 38, name: 'Gilded Thorns',
    heroes: [h('penny_dreadful', 190, 4, 1), h('philemon_the_ardent', 190, 4, 1), h('chroma', 189, 4, 1), h('zina_the_desperate', 190, 4, 1)],
    leader: null, firstClearReward: fcr(38), dailyCoins: dc(38)
  },
  // Shard tier 2 starts
  {
    bout: 39, name: 'The Exalted',
    heroes: [h('sir_gallan', 195, 4, 2), h('ember_witch', 195, 4, 2), h('lady_moonwhisper', 194, 4, 2), h('swift_arrow', 195, 4, 2)],
    leader: null, firstClearReward: fcr(39), dailyCoins: dc(39)
  },
  {
    bout: 40, name: 'Last Stand',
    heroes: [h('copper_jack', 200, 4, 2), h('shinobi_jin', 200, 4, 2), h('vraxx_thunderskin', 199, 4, 2), h('philemon_the_ardent', 200, 4, 2)],
    leader: null, firstClearReward: fcr(40), dailyCoins: dc(40)
  },

  // --- Bouts 41-50: 5-star heroes (with leaders) ---
  // Shard tier 2 for bouts 41-43, tier 3 for 44-50
  {
    bout: 41, name: 'Dawn Heralds',
    heroes: [h('aurora_the_dawn', 205, 5, 2), h('rosara_the_unmoved', 205, 5, 2), h('cacophon', 204, 5, 2), h('yggra_world_root', 205, 5, 2)],
    leader: 'aurora_the_dawn', firstClearReward: fcr(41), dailyCoins: dc(41)
  },
  {
    bout: 42, name: 'Shadow Syndicate',
    heroes: [h('shadow_king', 210, 5, 2), h('mara_thornheart', 210, 5, 2), h('fortuna_inversus', 209, 5, 2), h('korrath_hollow_ear', 210, 5, 2)],
    leader: 'shadow_king', firstClearReward: fcr(42), dailyCoins: dc(42)
  },
  {
    bout: 43, name: 'Nature\'s Wrath',
    heroes: [h('yggra_world_root', 215, 5, 2), h('grandmother_rot', 215, 5, 2), h('onibaba', 214, 5, 2), h('cacophon', 215, 5, 2)],
    leader: 'yggra_world_root', firstClearReward: fcr(43), dailyCoins: dc(43)
  },
  // Shard tier 3 starts
  {
    bout: 44, name: 'The Unbroken Circle',
    heroes: [h('rosara_the_unmoved', 220, 5, 3), h('aurora_the_dawn', 220, 5, 3), h('fortuna_inversus', 219, 5, 3), h('korrath_hollow_ear', 220, 5, 3)],
    leader: 'rosara_the_unmoved', firstClearReward: fcr(44), dailyCoins: dc(44)
  },
  {
    bout: 45, name: 'The Unbreakable',
    heroes: [h('rosara_the_unmoved', 225, 5, 3), h('aurora_the_dawn', 225, 5, 3), h('cacophon', 224, 5, 3), h('ember_witch', 225, 5, 3)],
    leader: 'rosara_the_unmoved', firstClearReward: fcr(45), dailyCoins: dc(45)
  },
  {
    bout: 46, name: 'Thornwall Legion',
    heroes: [h('mara_thornheart', 230, 5, 3), h('grandmother_rot', 230, 5, 3), h('onibaba', 229, 5, 3), h('fortuna_inversus', 230, 5, 3)],
    leader: 'mara_thornheart', firstClearReward: fcr(46), dailyCoins: dc(46)
  },
  {
    bout: 47, name: 'Echoes of Ruin',
    heroes: [h('shadow_king', 235, 5, 3), h('korrath_hollow_ear', 235, 5, 3), h('cacophon', 234, 5, 3), h('yggra_world_root', 235, 5, 3)],
    leader: 'shadow_king', firstClearReward: fcr(47), dailyCoins: dc(47)
  },
  {
    bout: 48, name: 'Twilight Sovereigns',
    heroes: [h('aurora_the_dawn', 240, 5, 3), h('onibaba', 240, 5, 3), h('fortuna_inversus', 239, 5, 3), h('mara_thornheart', 240, 5, 3)],
    leader: 'aurora_the_dawn', firstClearReward: fcr(48), dailyCoins: dc(48)
  },
  {
    bout: 49, name: 'Apex Predators',
    heroes: [h('shadow_king', 245, 5, 3), h('rosara_the_unmoved', 245, 5, 3), h('cacophon', 244, 5, 3), h('grandmother_rot', 245, 5, 3)],
    leader: 'shadow_king', firstClearReward: fcr(49), dailyCoins: dc(49)
  },
  {
    bout: 50, name: 'The Colosseum Kings',
    heroes: [h('shadow_king', 250, 5, 3), h('aurora_the_dawn', 250, 5, 3), h('rosara_the_unmoved', 249, 5, 3), h('yggra_world_root', 250, 5, 3)],
    leader: 'shadow_king', firstClearReward: fcr(50), dailyCoins: dc(50)
  }
]

export function getColosseumBout(boutNumber) {
  return colosseumBouts.find(b => b.bout === boutNumber)
}

// Colosseum shop items
export const colosseumShopItems = [
  // Exclusive heroes (placeholders)
  {
    id: 'colosseum_hero_3star',
    name: 'Colosseum Champion',
    type: 'exclusive_hero',
    rarity: 3,
    cost: 2000,
    maxStock: 1,
    stockType: 'permanent',
    placeholder: true
  },
  {
    id: 'colosseum_hero_4star',
    name: 'Colosseum Gladiator',
    type: 'exclusive_hero',
    rarity: 4,
    cost: 5000,
    maxStock: 1,
    stockType: 'permanent',
    placeholder: true
  },
  {
    id: 'colosseum_hero_5star',
    name: 'Colosseum Imperator',
    type: 'exclusive_hero',
    rarity: 5,
    cost: 12000,
    maxStock: 1,
    stockType: 'permanent',
    placeholder: true
  },
  // Consumables
  {
    id: 'dragon_heart',
    name: 'Dragon Heart',
    type: 'item',
    cost: 3000,
    maxStock: 1,
    stockType: 'monthly'
  },
  {
    id: 'dragon_heart_shard',
    name: 'Dragon Heart Shard',
    type: 'item',
    cost: 800,
    maxStock: 2,
    stockType: 'weekly'
  },
  {
    id: 'tome_large',
    name: 'Knowledge Tome (Large)',
    type: 'item',
    cost: 150,
    maxStock: 5,
    stockType: 'weekly'
  },
  {
    id: 'gold_5000',
    name: 'Gold (5,000)',
    type: 'currency',
    cost: 100,
    maxStock: 3,
    stockType: 'weekly'
  },
  {
    id: 'gems_100',
    name: 'Gems (100)',
    type: 'currency',
    cost: 200,
    maxStock: 2,
    stockType: 'weekly'
  }
]

export function getColosseumShopItems() {
  return colosseumShopItems
}
