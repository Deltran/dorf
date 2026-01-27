// src/data/shops.js

export const shops = {
  gold_shop: {
    id: 'gold_shop',
    name: 'Gold Shop',
    description: 'Basic supplies for adventurers',
    currency: 'gold',
    confirmThreshold: 5000,
    inventory: [
      {
        itemId: 'tome_small',
        price: 100,
        maxStock: 5
      },
      {
        itemId: 'tome_medium',
        price: 400,
        maxStock: 3
      },
      {
        itemId: 'tome_large',
        price: 1000,
        maxStock: 1
      },
      {
        itemId: 'token_whispering_woods',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_whisper_lake',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_echoing_caverns',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_stormwind_peaks',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_blistering_cliffs',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_summit',
        price: 800,
        maxStock: 2
      }
    ]
  },

  crest_shop: {
    id: 'crest_shop',
    name: 'Crest Shop',
    description: 'Trade trophies from fallen giants',
    currency: 'crest',
    confirmThreshold: 10,
    sections: [
      {
        id: 'valinar',
        name: "Valinar's Offerings",
        crestId: 'valinar_crest',
        unlockCondition: { completedNode: 'lake_genus_loci' }
      },
      {
        id: 'great_troll',
        name: "Great Troll's Hoard",
        crestId: 'great_troll_crest',
        unlockCondition: { completedNode: 'hibernation_den' }
      },
      {
        id: 'pyroclast',
        name: "Pyroclast's Forge",
        crestId: 'pyroclast_crest',
        unlockCondition: { completedNode: 'eruption_vent_gl' }
      }
    ],
    inventory: [
      // Valinar's Offerings
      { itemId: 'tome_large', name: "Guardian's Tome", price: 2, sectionId: 'valinar' },
      { itemId: 'token_whisper_lake', name: 'Whisper Lake Token', price: 3, sectionId: 'valinar' },
      { itemId: 'shard_dragon_heart', name: 'Shard of Dragon Heart', price: 5, sectionId: 'valinar' },
      { itemId: 'dragon_heart', name: 'Dragon Heart', price: 20, sectionId: 'valinar' },
      { itemId: 'shards_sir_gallan', heroId: 'sir_gallan', shardCount: 10, price: 8, maxStock: 1, stockType: 'weekly', sectionId: 'valinar', requiresShardsUnlocked: true },
      { itemId: 'shards_kensin_squire', heroId: 'kensin_squire', shardCount: 10, price: 5, maxStock: 1, stockType: 'weekly', sectionId: 'valinar', requiresShardsUnlocked: true },

      // Great Troll's Hoard
      { itemId: 'tome_large', name: 'Primal Tome', price: 2, sectionId: 'great_troll' },
      { itemId: 'token_echoing_caverns', name: 'Echoing Caverns Token', price: 3, sectionId: 'great_troll' },
      { itemId: 'shard_dragon_heart', name: 'Shard of Dragon Heart', price: 5, sectionId: 'great_troll' },
      { itemId: 'dragon_heart', name: 'Dragon Heart', price: 20, sectionId: 'great_troll' },
      { itemId: 'shards_darl', heroId: 'darl', shardCount: 10, price: 5, maxStock: 1, stockType: 'weekly', sectionId: 'great_troll', requiresShardsUnlocked: true },
      { itemId: 'shards_shadow_king', heroId: 'shadow_king', shardCount: 10, price: 12, maxStock: 1, stockType: 'weekly', sectionId: 'great_troll', requiresShardsUnlocked: true },

      // Pyroclast's Forge
      { itemId: 'tome_large', name: "Volcanic Tome", price: 2, sectionId: 'pyroclast' },
      { itemId: 'token_blistering_cliffs', name: 'Blistering Cliffs Token', price: 3, sectionId: 'pyroclast' },
      { itemId: 'shard_dragon_heart', name: 'Shard of Dragon Heart', price: 5, sectionId: 'pyroclast' },
      { itemId: 'dragon_heart', name: 'Dragon Heart', price: 20, sectionId: 'pyroclast' },
      { itemId: 'shards_ember_witch', heroId: 'ember_witch', shardCount: 10, price: 8, maxStock: 1, stockType: 'weekly', sectionId: 'pyroclast', requiresShardsUnlocked: true },
      { itemId: 'shards_hedge_wizard', heroId: 'hedge_wizard', shardCount: 10, price: 5, maxStock: 1, stockType: 'weekly', sectionId: 'pyroclast', requiresShardsUnlocked: true }
    ]
  }
}

export function getShop(shopId) {
  return shops[shopId] || null
}

export function getAllShops() {
  return Object.values(shops)
}
