// src/data/maw/shop.js

const shopItems = [
  {
    id: 'dregs_tome_small',
    name: 'Faded Tome',
    description: 'A worn book of teachings.',
    type: 'xp_tome',
    cost: 15,
    maxStock: 10,
    reward: { itemId: 'tome_small', count: 1 }
  },
  {
    id: 'dregs_tome_medium',
    name: 'Knowledge Tome',
    description: 'A well-preserved collection.',
    type: 'xp_tome',
    cost: 40,
    maxStock: 5,
    reward: { itemId: 'tome_medium', count: 1 }
  },
  {
    id: 'dregs_tome_large',
    name: 'Ancient Codex',
    description: 'A thick volume of forgotten lore.',
    type: 'xp_tome',
    cost: 100,
    maxStock: 3,
    reward: { itemId: 'tome_large', count: 1 }
  },
  {
    id: 'dregs_gold_pack',
    name: 'Bag of Gold',
    description: '500 gold pieces from the depths.',
    type: 'currency',
    cost: 20,
    reward: { gold: 500 }
  },
  {
    id: 'dregs_gem_pack',
    name: 'Cursed Gems',
    description: '50 gems salvaged from the Maw.',
    type: 'currency',
    cost: 60,
    maxStock: 5,
    reward: { gems: 50 }
  }
]

export function getMawShopItems() {
  return shopItems
}

export function getMawShopItem(id) {
  return shopItems.find(i => i.id === id) || null
}
